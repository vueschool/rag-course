ALTER TABLE "chunks" ADD COLUMN "search_vector" "tsvector";

-- Create GIN index for fast full-text search
CREATE INDEX chunks_search_vector_idx ON chunks USING GIN(search_vector);

-- Populate existing rows with search vectors
UPDATE chunks SET search_vector = to_tsvector('english', content);

-- Create trigger function to auto-update search_vector
CREATE OR REPLACE FUNCTION update_chunks_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search_vector on INSERT/UPDATE
CREATE TRIGGER chunks_search_vector_trigger
    BEFORE INSERT OR UPDATE ON chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_chunks_search_vector();