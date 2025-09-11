-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to documents table (run this after enabling vector extension)
-- ALTER TABLE documents ADD COLUMN embedding vector(1536);
