#!/usr/bin/env node

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract frontmatter and content from markdown
 */
function parseFrontmatter(content) {
  const parsed = matter(content);
  return {
    frontmatter: parsed.data,
    content: parsed.content,
  };
}

/**
 * Calculate line numbers for a chunk within the original file (including frontmatter)
 */
function calculateLineNumbers(rawContent, parsedContent, chunkContent) {
  // Find where the chunk starts in the parsed content (without frontmatter)
  const chunkStartInParsed = parsedContent.indexOf(chunkContent);

  if (chunkStartInParsed === -1) {
    return { startLineNumber: 1, endLineNumber: 1 };
  }

  // Find where the parsed content starts in the raw content
  const parsedContentStart = rawContent.indexOf(parsedContent);

  if (parsedContentStart === -1) {
    return { startLineNumber: 1, endLineNumber: 1 };
  }

  // Calculate the actual position in the raw file
  const chunkStartInRaw = parsedContentStart + chunkStartInParsed;

  // Count lines up to the chunk start in the raw content
  const contentBeforeChunk = rawContent.substring(0, chunkStartInRaw);
  const startLineNumber = contentBeforeChunk.split("\n").length;

  // Count lines within the chunk
  const chunkLines = chunkContent.split("\n").length;
  const endLineNumber = startLineNumber + chunkLines - 1;

  return { startLineNumber, endLineNumber };
}

/**
 * Recursively find all markdown files in a directory
 */
async function findMarkdownFiles(dir) {
  const files = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return files;
}

/**
 * Read and split a markdown file into chunks with essential metadata
 */
async function processMarkdownFile(filePath, textSplitter) {
  try {
    const rawContent = await fs.readFile(filePath, "utf-8");

    // Skip empty files
    if (!rawContent.trim()) {
      return [];
    }

    // Parse frontmatter and content
    const { frontmatter, content } = parseFrontmatter(rawContent);
    const relativePath = path.relative(path.join(__dirname, ".."), filePath);

    // Split content into chunks
    const chunks = await textSplitter.splitText(content);

    // Process each chunk with essential metadata
    return chunks.map((chunkContent, index) => {
      // Calculate line numbers for this chunk (accounting for frontmatter)
      const { startLineNumber, endLineNumber } = calculateLineNumbers(
        rawContent,
        content,
        chunkContent
      );

      return {
        content: chunkContent,
        metadata: {
          source: relativePath,
          documentSlug: frontmatter.slug,
          documentTitle: frontmatter.title,
          documentPageType: frontmatter["page-type"],
          documentSidebar: frontmatter.sidebar,
          chunkIndex: index,
          totalChunks: chunks.length,
          startLineNumber,
          endLineNumber,
        },
      };
    });
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Main function to process all markdown files and create chunks
 */
async function main() {
  try {
    console.log("🔍 Starting document chunking process...");

    // Configure the text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: [
        // Markdown headings (semantic boundaries)
        "\n# ",
        "\n## ",
        "\n### ",
        "\n#### ",
        "\n##### ",
        "\n###### ",
        // Other markdown elements
        "\n\n", // Paragraph breaks
        "\n", // Line breaks
        " ", // Word breaks
        "", // Character level
      ],
    });

    // Find all markdown files in the docs directory
    const docsDir = path.join(__dirname, "..", "docs");
    console.log(`📂 Searching for markdown files in: ${docsDir}`);

    const markdownFiles = await findMarkdownFiles(docsDir);
    console.log(`📄 Found ${markdownFiles.length} markdown files`);

    // Process each file and collect chunks
    const allChunks = [];
    let processedFiles = 0;

    for (const filePath of markdownFiles) {
      console.log(`⚙️  Processing: ${path.relative(docsDir, filePath)}`);
      const fileChunks = await processMarkdownFile(filePath, textSplitter);
      allChunks.push(...fileChunks);
      processedFiles++;

      if (processedFiles % 5 === 0) {
        console.log(
          `   Progress: ${processedFiles}/${markdownFiles.length} files processed`
        );
      }
    }

    console.log(
      `✅ Processed ${processedFiles} files, created ${allChunks.length} chunks`
    );

    // Write chunks to JSON file
    const outputPath = path.join(__dirname, "..", "chunks.json");
    await fs.writeFile(outputPath, JSON.stringify(allChunks, null, 2));

    console.log(`💾 Chunks saved to: ${outputPath}`);
    console.log("🎉 Document chunking completed successfully!");

    // Print simple summary statistics
    const avgChunkSize =
      allChunks.reduce((sum, chunk) => sum + chunk.content.length, 0) /
      allChunks.length;

    console.log(`\n📊 Summary:`);
    console.log(`   - Total files processed: ${processedFiles}`);
    console.log(`   - Total chunks created: ${allChunks.length}`);
    console.log(
      `   - Average chunk size: ${Math.round(avgChunkSize)} characters`
    );
  } catch (error) {
    console.error("❌ Error during chunking process:", error);
    process.exit(1);
  }
}

// Run the script
main();
