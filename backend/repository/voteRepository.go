package repository

import (
	"context"
	"database/sql"
	"fmt"
)

type VoteRepository interface {
	GetVote(ctx context.Context, userID, memeID int) (int, error)
	CreateVote(ctx context.Context, userID, memeID, vote int) error
	UpdateVote(ctx context.Context, userID, memeID, vote int) error
	DeleteVote(ctx context.Context, userID int, memeID int) error
	UpdateMemeVoteCount(ctx context.Context, memeID, newVote, oldVote int) error
	UpdateMemeVoteCountOnRemove(ctx context.Context, memeID int, vote int) error
	Commit() error
	Rollback() error
}

type voteRepository struct {
	tx *sql.Tx
}

func (v *voteRepository) GetVote(ctx context.Context, userID int, memeID int) (int, error) {
	var vote int
	err := v.tx.QueryRowContext(ctx,
		"SELECT vote FROM meme_votes WHERE user_id = $1 AND meme_id = $2",
		userID, memeID,
	).Scan(&vote)

	return vote, err
}

func (v *voteRepository) CreateVote(ctx context.Context, userID int, memeID int, vote int) error {
	_, err := v.tx.ExecContext(ctx,
		"INSERT INTO meme_votes (user_id, meme_id, vote) VALUES ($1, $2, $3)",
		userID, memeID, vote,
	)

	return err
}

func (v *voteRepository) UpdateVote(ctx context.Context, userID int, memeID int, vote int) error {
	_, err := v.tx.ExecContext(ctx,
		"UPDATE meme_votes SET vote = $1, updated_at = NOW() WHERE user_id = $2 AND meme_id = $3",
		vote, userID, memeID,
	)

	return err
}

func (v *voteRepository) DeleteVote(ctx context.Context, userID int, memeID int) error {
	_, err := v.tx.ExecContext(ctx,
		"DELETE FROM meme_votes WHERE user_id = $1 AND meme_id = $2",
		userID, memeID,
	)
	return err
}

func (v *voteRepository) UpdateMemeVoteCount(ctx context.Context, memeID int, newVote int, oldVote int) error {
	var column string
	if newVote == 1 {
		column = "upvotes = upvotes + 1"
		if oldVote == -1 {
			column = "upvotes = upvotes + 1, downvotes = downvotes - 1"
		}
	} else {
		column = "downvotes = downvotes + 1"
		if oldVote == 1 {
			column = "downvotes = downvotes + 1, upvotes = upvotes - 1"
		}
	}

	_, err := v.tx.ExecContext(ctx,
		fmt.Sprintf("UPDATE memes SET %s WHERE id = $1", column),
		memeID,
	)
	return err
}

func (v *voteRepository) UpdateMemeVoteCountOnRemove(ctx context.Context, memeID int, vote int) error {
	var column string
	if vote == 1 {
		column = "upvotes = upvotes - 1"
	} else {
		column = "downvotes = downvotes - 1"
	}

	_, err := v.tx.ExecContext(ctx,
		fmt.Sprintf("UPDATE memes SET %s WHERE id = $1", column),
		memeID,
	)
	return err
}

func (v *voteRepository) Commit() error {
	return v.tx.Commit()
}

func (v *voteRepository) Rollback() error {
	return v.tx.Rollback()
}
