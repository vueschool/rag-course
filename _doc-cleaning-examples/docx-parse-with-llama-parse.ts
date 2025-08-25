import {
  LlamaParseReader,
  // we'll add more here later
} from "llama-cloud-services";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // save the file linked above as sf_budget.pdf, or change this to match
  const inputPath = path.join(__dirname, "docx", "it-policy.docx");

  // set up the llamaparse reader
  const reader = new LlamaParseReader({ resultType: "markdown" });

  // parse the document
  const documents = await reader.loadData(inputPath);

  // save the parsed document to a file
  const outputPath = path.join(
    __dirname,
    "docx-output",
    "parsed_document.json"
  );

  // for each document, write the text to a file
  documents.forEach((document) => {
    const text = document.text;
    const outputPath = path.join(
      __dirname,
      "docx-output/llama",
      `${document.id_}.md`
    );
    fs.writeFileSync(outputPath, text);
  });

  fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2));

  // print the parsed document
  console.log(documents);
}

main().catch(console.error);
