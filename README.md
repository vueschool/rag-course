This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Prerequisites

1. **Environment Variables**: Copy `.env.example` to `.env` and fill in your API keys:

   ```bash
   cp .env.example .env
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

5. **Chunk Docs**: Process and store your documents (optional - chunks.json saved to repo):

   ```bash
   npm run chunk-docs
   ```
