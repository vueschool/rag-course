import "dotenv/config";
import { readdir, readFile, stat } from "fs/promises";
import { join, extname } from "path";
import { documents } from "../src/db/schema";
import { db } from "../src/db/index";

/**
 * Recursively reads markdown files from a directory
 * @param {string} dirPath - The directory path to read
 * @param {string} basePath - The base path for relative paths
 * @returns {Promise<Array<{path: string, content: string, title: string}>>}
 */
async function readMarkdownFiles(
  dirPath: string,
  basePath: string = ""
): Promise<{ path: string; content: string; title: string }[]> {
  const files: { path: string; content: string; title: string }[] = [];

  try {
    const items = await readdir(dirPath);

    for (const item of items) {
      const fullPath = join(dirPath, item);
      const relativePath = join(basePath, item);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        // Recursively read subdirectories
        const subFiles = await readMarkdownFiles(fullPath, relativePath);
        files.push(...subFiles);
      } else if (stats.isFile() && extname(item).toLowerCase() === ".md") {
        // Read markdown file
        const content = await readFile(fullPath, "utf-8");

        // Extract title from frontmatter or filename
        let title = item.replace(".md", "");

        // Try to extract title from frontmatter
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
          if (titleMatch) {
            title = titleMatch[1].trim();
          }
        }

        // If no title found in frontmatter, use filename
        if (!title || title === item.replace(".md", "")) {
          title = item.replace(".md", "").replace(/_/g, " ").replace(/-/g, " ");
          title = title.charAt(0).toUpperCase() + title.slice(1);
        }

        files.push({
          path: relativePath,
          content: content,
          title: title,
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return files;
}

/**
 * Seeds the database with documents from the docs directory
 */
async function seedDocuments() {
  try {
    console.log("Starting document seeding...");

    // Read all markdown files from docs directory
    const docsPath = join(process.cwd(), "docs");
    const markdownFiles = await readMarkdownFiles(docsPath);

    console.log(`Found ${markdownFiles.length} markdown files`);

    // Clear existing documents
    await db.delete(documents);
    console.log("Cleared existing documents");

    // Insert new documents
    const insertedDocs = [];
    for (const file of markdownFiles) {
      try {
        const [doc] = await db
          .insert(documents)
          .values({
            id: file.path,
            title: file.title,
            content: file.content,
          })
          .returning();

        insertedDocs.push(doc);
        console.log(`✓ Inserted: ${file.title} (${file.path})`);
      } catch (error) {
        console.error(`✗ Failed to insert ${file.title}:`, error.message);
      }
    }

    console.log(`\nSeeding completed!`);
    console.log(`Successfully inserted ${insertedDocs.length} documents`);

    // Display summary
    console.log("\nInserted documents:");
    insertedDocs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} (ID: ${doc.id})`);
    });
  } catch (error) {
    console.error("Error during seeding:", error);
  }
}

// Run the seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDocuments().catch(console.error);
}

export { seedDocuments };
