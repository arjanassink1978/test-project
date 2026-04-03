-- Liquibase formatted sql
-- changeset liquibase:V005__add_icon_to_forum_categories

ALTER TABLE forum_categories
ADD COLUMN icon VARCHAR(255);
