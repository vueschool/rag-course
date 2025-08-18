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
