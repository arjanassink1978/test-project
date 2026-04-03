-- Liquibase formatted sql
-- changeset liquibase:V004__add_role_and_thread_closed

ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS is_closed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS parent_reply_id BIGINT REFERENCES forum_replies(id);
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS depth INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_forum_replies_parent_reply_id ON forum_replies(parent_reply_id);
