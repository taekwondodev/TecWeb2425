CREATE TABLE memes (
    id SERIAL PRIMARY KEY,
    tag TEXT NOT NULL,
    image_path TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
    downvotes INTEGER DEFAULT 0 CHECK (downvotes >= 0),
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    meme_id INTEGER NOT NULL,
    content TEXT NOT NULL CHECK (LENGTH(content) > 0),
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_memes_created_at ON memes(created_at DESC);
CREATE INDEX idx_memes_upvotes ON memes(upvotes DESC);
CREATE INDEX idx_memes_downvotes ON memes(downvotes DESC);
CREATE INDEX idx_comments_meme_id ON comments(meme_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

CREATE TRIGGER trigger_meme_updated_at
BEFORE UPDATE ON memes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_comment_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();