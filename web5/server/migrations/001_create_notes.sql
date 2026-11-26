CREATE TABLE notes (
  id uuid PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  content_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notes_created_at_idx ON notes (created_at DESC);
CREATE INDEX notes_search_idx ON notes
  USING gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content_text, '')));
