-- Liquibase formatted sql
-- changeset liquibase:V002__create_forum_tables

CREATE TABLE forum_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_forum_categories_name ON forum_categories(name);

CREATE TABLE forum_threads (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES app_users(id),
    title VARCHAR(200) NOT NULL,
    description VARCHAR(5000),
    category_id BIGINT REFERENCES forum_categories(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    score INTEGER DEFAULT 0
);

CREATE INDEX idx_forum_threads_author_id ON forum_threads(author_id);
CREATE INDEX idx_forum_threads_category_id ON forum_threads(category_id);
CREATE INDEX idx_forum_threads_created_at ON forum_threads(created_at);

CREATE TABLE forum_replies (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT NOT NULL REFERENCES forum_threads(id),
    author_id BIGINT NOT NULL REFERENCES app_users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    score INTEGER DEFAULT 0
);

CREATE INDEX idx_forum_replies_thread_id ON forum_replies(thread_id);
CREATE INDEX idx_forum_replies_author_id ON forum_replies(author_id);

CREATE TABLE forum_votes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_users(id),
    thread_id BIGINT REFERENCES forum_threads(id),
    reply_id BIGINT REFERENCES forum_replies(id),
    vote_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP,
    CONSTRAINT ck_vote_target CHECK ((thread_id IS NOT NULL) OR (reply_id IS NOT NULL)),
    UNIQUE(user_id, thread_id, reply_id)
);

CREATE INDEX idx_forum_votes_user_id ON forum_votes(user_id);
CREATE INDEX idx_forum_votes_thread_id ON forum_votes(thread_id);
CREATE INDEX idx_forum_votes_reply_id ON forum_votes(reply_id);
