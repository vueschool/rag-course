# RAG Scripts Usage Guide

This directory contains scripts for building and querying your Retrieval-Augmented Generation (RAG) system.

## Prerequisites

1. **Environment Variables**: Copy `.env.example` to `.env.local` and fill in your API keys:

   ```bash
   cp .env.example .env.local
   ```

2. **API Keys Required**:

   - `VOYAGE_API_KEY`: Get from [Voyage AI](https://www.voyageai.com/)
   - `OPENAI_API_KEY`: Get from [OpenAI](https://platform.openai.com/)

3. **Database**: Make sure PostgreSQL with pgvector extension is running:

   ```bash
   npm run db:up
   npm run db:migrate
   ```

4. **Seed Database**: Process and store your documents:
   ```bash
   npm run db:seed
   ```

## Available Scripts

### 1. Semantic Search (`semantic-search.ts`)

Search for relevant documents without generating answers.

```bash
# Interactive mode
npm run semantic-search

# Direct query
npm run semantic-search "How does authentication work?"

# With options
npm run semantic-search "user permissions" --limit=10 --threshold=0.7
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
npm run rag-query "deployment process" --limit=8 --threshold=0.6 --model=gpt-4
```

**Options:**

- `--limit=N`: Number of documents to retrieve (default: 5)
- `--threshold=N`: Similarity threshold 0-1 (default: 0.5)
- `--model=MODEL`: OpenAI model to use (default: gpt-4o-mini)

**Available Models:**

- `gpt-4o-mini` (default, fastest and cheapest)
- `gpt-4o` (most capable)
- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo`

## Examples

### Basic Usage

```bash
# Ask about React hooks
npm run rag-query "How do I use useState hook?"

# Get more sources with higher similarity
npm run rag-query "database migrations" --limit=10 --threshold=0.7

# Use a more powerful model
npm run rag-query "complex authentication flow" --model=gpt-4
```

### Interactive Mode

```bash
npm run rag-query
# Then type your question when prompted
```

## Output

The RAG query script provides:

- **AI Answer**: Comprehensive response based on your documents
- **Token Usage**: Number of tokens consumed
- **Sources**: List of relevant documents used
- **Similarity Scores**: How relevant each source is to your query

## Tips for Better Results

1. **Use specific questions** rather than broad topics
2. **Adjust similarity threshold** based on your document quality
3. **Increase limit** for complex topics that might span multiple documents
4. **Use gpt-4o-mini** for cost-effective queries, upgrade to gpt-4 for complex reasoning

## Troubleshooting

- **No results**: Lower the similarity threshold or check if documents are indexed
- **Irrelevant answers**: Increase similarity threshold or improve your question specificity
- **API errors**: Verify your API keys are set correctly in `.env.local`
