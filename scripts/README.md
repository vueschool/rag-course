# RAG Scripts Usage Guide

This directory contains scripts for building and querying your Retrieval-Augmented Generation (RAG) system.

It also exports functions from the different script files for use in the main application.

## Available Scripts

### 1. Semantic Search (`semantic-search.ts`)

Search for relevant documents without generating answers.

```bash
# Interactive mode
npm run semantic-search

# Direct query
npm run semantic-search "How does authentication work?"

# With options
npm run semantic-search "user permissions" -- --limit=10 --threshold=0.7
```

**Options:**

- `--limit=N`: Number of results to return (default: 5)
- `--threshold=N`: Similarity threshold 0-1 (default: 0.5)

### 2. RAG Query (`rag-query.ts`)

Get AI-powered answers using retrieved documents as context.

```bash
# Interactive mode
npm run rag-query

# Direct query
npm run rag-query "What are the main security considerations?"

# With options
npm run rag-query "deployment process" -- --limit=8 --threshold=0.6 --model=gpt-4
```

**Options:**

- `--limit=N`: Number of documents to retrieve (default: 5)
- `--threshold=N`: Similarity threshold 0-1 (default: 0.5)
- `--model=MODEL`: OpenAI model to use (default: gpt-4o-mini)

## Output

The RAG query script provides:

- **AI Answer**: Comprehensive response based on your documents
- **Token Usage**: Number of tokens consumed
- **Sources**: List of relevant documents used
- **Similarity Scores**: How relevant each source is to your query

## Exposed functions

The following functions are exposed for use in the main application:

- `performSemanticSearch`: Search for relevant documents without generating answers
- `performRAGQuery`: Get AI-powered answers using retrieved documents as context
- `formatContextFromChunks`: Format context from retrieved chunks
- `createRAGPrompt`: Create a prompt that combines the user's question with retrieved context
- `queryLLM`: Query the LLM with the augmented prompt
- `displayRAGResponse`: Display the RAG response

```ts
import { performSemanticSearch, performRAGQuery /* ... */ } from "./index";
```
