CREATE TABLE meme_votes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meme_id INTEGER NOT NULL REFERENCES memes(id) ON DELETE CASCADE,
    vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, meme_id)
);

CREATE INDEX idx_meme_votes_meme_id ON meme_votes(meme_id);
CREATE INDEX idx_meme_votes_user_id ON meme_votes(user_id);

CREATE TRIGGER trigger_meme_votes_updated_at
BEFORE UPDATE ON meme_votes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();