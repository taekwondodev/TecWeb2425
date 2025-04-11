ALTER TABLE comments
ADD CONSTRAINT fk_comments_meme
FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE;

ALTER TABLE memes
ADD CONSTRAINT fk_memes_created_by
FOREIGN KEY (created_by) REFERENCES users(username) ON DELETE RESTRICT;

ALTER TABLE comments
ADD CONSTRAINT fk_comments_created_by
FOREIGN KEY (created_by) REFERENCES users(username) ON DELETE RESTRICT;