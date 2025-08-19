export interface ChunkMetadata {
  source: string;
  documentSlug?: string;
  documentTitle?: string;
  documentPageType?: string; // guide, reference, tutorial, etc.
  documentSidebar?: string;
  chunkIndex: number;
  totalChunks: number;
  startLineNumber: number;
  endLineNumber: number;
}

export interface DocumentChunk {
  content: string;
  metadata: ChunkMetadata;
}

export enum OperationType {
  EMBEDDING = "embedding",
  CHAT = "chat",
  COMPLETION = "completion",
  SEARCH = "search",
  SUMMARIZATION = "summarization",
}

export enum Model {
  VOYAGE_CODE_3 = "voyage-code-3",
  VOYAGE_3 = "voyage-3",
  GPT_4 = "gpt-4",
  GPT_4_TURBO = "gpt-4-turbo",
  GPT_3_5_TURBO = "gpt-3.5-turbo",
  CLAUDE_3_SONNET = "claude-3-sonnet",
  CLAUDE_3_HAIKU = "claude-3-haiku",
}

export interface TokenUsageData {
  operationType: OperationType;
  model: Model;
  promptTokens: number;
  totalTokens: number;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingResult {
  embeddings: number[][];
  tokenUsage: TokenUsageData;
}
