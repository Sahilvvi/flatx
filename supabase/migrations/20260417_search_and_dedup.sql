-- Enable the pg_trgm extension for full-text and fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add a text search vector column to listings if you want standard tsvector
-- ALTER TABLE listings ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
--   setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
--   setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
--   setweight(to_tsvector('english', coalesce(area_name, '')), 'C')
-- ) STORED;

-- Create an index to speed up trigram matches on title and description
CREATE INDEX listings_title_trgm_idx ON listings USING GIN (title gin_trgm_ops);
CREATE INDEX listings_desc_trgm_idx ON listings USING GIN (description gin_trgm_ops);

-- RPC for Fuzzy Search using pg_trgm
CREATE OR REPLACE FUNCTION search_listings_trgm(search_query text)
RETURNS SETOF listings AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM listings
  WHERE title % search_query
     OR description % search_query
     OR area_name % search_query
  ORDER BY GREATEST(
      similarity(title, search_query),
      similarity(description, search_query),
      similarity(area_name, search_query)
  ) DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- RPC for Deduplication (Scam / Duplicate Flagging)
-- Flags listings that have the exact same contact OR highly similar title within same area
CREATE OR REPLACE FUNCTION flag_duplicate_listings()
RETURNS void AS $$
BEGIN
  -- We would insert into a `reports` or `duplicate_flags` table
  INSERT INTO reviews (listing_id, notes) 
  SELECT l1.id, 'Auto-flagged: Highly similar to listing ' || l2.id
  FROM listings l1
  JOIN listings l2 
    ON l1.id != l2.id
   AND l1.area_name = l2.area_name
   AND l1.contact_whatsapp = l2.contact_whatsapp
   AND similarity(l1.title, l2.title) > 0.8
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
