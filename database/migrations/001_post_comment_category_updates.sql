BEGIN;

ALTER TABLE categories DROP COLUMN IF EXISTS created_at;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_posts_published_at'
      AND conrelid = 'posts'::regclass
  ) THEN
    ALTER TABLE posts
      ADD CONSTRAINT chk_posts_published_at
      CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL);
  END IF;
END $$;

ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_parent_id_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_comments_id_post_id'
      AND conrelid = 'comments'::regclass
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT uq_comments_id_post_id UNIQUE (id, post_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_comments_parent_same_post'
      AND conrelid = 'comments'::regclass
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT fk_comments_parent_same_post
      FOREIGN KEY (parent_id, post_id)
      REFERENCES comments(id, post_id)
      ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;
