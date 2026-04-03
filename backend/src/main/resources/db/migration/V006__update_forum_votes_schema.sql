-- Liquibase formatted sql
-- changeset liquibase:V006__update_forum_votes_schema

-- Drop old constraint and index
ALTER TABLE forum_votes
DROP CONSTRAINT IF EXISTS ck_vote_target;

DROP INDEX IF EXISTS idx_forum_votes_thread_id;
DROP INDEX IF EXISTS idx_forum_votes_reply_id;

-- Drop old columns
ALTER TABLE forum_votes
DROP COLUMN IF EXISTS thread_id,
DROP COLUMN IF EXISTS reply_id,
DROP COLUMN IF EXISTS vote_type;

-- Rename column and add new ones
ALTER TABLE forum_votes
RENAME COLUMN user_id TO voter_id;

ALTER TABLE forum_votes
ADD COLUMN post_id BIGINT NOT NULL DEFAULT 0,
ADD COLUMN post_type VARCHAR(50) NOT NULL DEFAULT 'thread',
ADD COLUMN vote_value INT NOT NULL DEFAULT 1;

-- Add unique constraint for the new schema
ALTER TABLE forum_votes
ADD CONSTRAINT uq_forum_votes_voter_post UNIQUE(voter_id, post_id, post_type);

-- Create new indexes
CREATE INDEX idx_forum_votes_voter_id ON forum_votes(voter_id);
CREATE INDEX idx_forum_votes_post_id ON forum_votes(post_id);
