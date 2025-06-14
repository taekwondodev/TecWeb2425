package service

import (
	"backend/config"
	customerrors "backend/customErrors"
	"backend/dto"
	"backend/models"
	"backend/repository"
	"context"
	"io"
	"math"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"
)

type MemeService interface {
	GetMemes(ctx context.Context, page int, pageSize int, sortBy string, filterOptions dto.MemeFilterOptions) (*dto.GetMemeResponse, error)
	GetDailyMeme() (*models.Meme, error)
	GetMemeById(id int) (*models.Meme, error)
	GetVote(ctx context.Context, userId, memeId int) (*dto.VoteRequest, error)
	UploadMeme(file multipart.File, header *multipart.FileHeader, tag string, username string) (*dto.MemeUploadResponse, error)
	VoteMeme(ctx context.Context, id, memeId, vote int) (*dto.VoteResponse, error)
}

type MemeServiceImpl struct {
	repo       repository.MemeRepository
	cache      *models.Meme
	lastUpdate time.Time
	mu         sync.RWMutex
}

func NewMemeService(repo repository.MemeRepository) MemeService {
	return &MemeServiceImpl{repo: repo}
}

func (s *MemeServiceImpl) GetMemes(ctx context.Context, page int, pageSize int, sortBy string, filter dto.MemeFilterOptions) (*dto.GetMemeResponse, error) {
	g, ctx := errgroup.WithContext(ctx)

	var total int
	var memes []models.Meme

	g.Go(func() error {
		var err error
		total, err = s.repo.CountsMeme(ctx, filter.DateFrom, filter.DateTo, filter.Tags)
		return err
	})

	g.Go(func() error {
		var err error
		memes, err = s.repo.GetMemes(ctx, page, pageSize, sortBy, filter.DateFrom, filter.DateTo, filter.Tags)
		return err
	})

	// Wait for both goroutines to finish and check for errors
	if err := g.Wait(); err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))

	return &dto.GetMemeResponse{
		Memes:       memes,
		CurrentPage: page,
		TotalPages:  totalPages,
		TotalMemes:  total,
	}, nil
}

func (s *MemeServiceImpl) GetDailyMeme() (*models.Meme, error) {
	// read only
	s.mu.RLock()
	cached := s.cache
	lastUpdate := s.lastUpdate
	s.mu.RUnlock()

	if isCacheValid(cached, lastUpdate) {
		return cached, nil
	}

	// write lock
	s.mu.Lock()
	defer s.mu.Unlock()

	if isCacheValid(s.cache, s.lastUpdate) {
		return s.cache, nil
	}

	meme, err := s.repo.GetRandomMeme()
	if err != nil {
		return nil, err
	}

	s.cache = meme
	s.lastUpdate = time.Now()

	return meme, nil
}

func (s *MemeServiceImpl) GetMemeById(id int) (*models.Meme, error) {
	if id <= 0 {
		return nil, customerrors.ErrInvalidMemeID
	}

	meme, err := s.repo.GetMemeById(id)
	if err != nil {
		return nil, err
	}

	if meme == nil {
		return nil, customerrors.ErrMemeNotFound
	}

	return meme, nil
}

func (s *MemeServiceImpl) GetVote(ctx context.Context, userId, memeId int) (*dto.VoteRequest, error) {
	if userId == 0 {
		return &dto.VoteRequest{Vote: 0}, nil
	}

	tx, err := s.repo.BeginTransaction(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	vote, err := tx.GetVote(ctx, userId, memeId)
	if err != nil {
		return nil, err
	}

	return &dto.VoteRequest{Vote: vote}, nil
}

func (s *MemeServiceImpl) UploadMeme(file multipart.File, header *multipart.FileHeader, tag string, username string) (*dto.MemeUploadResponse, error) {
	if err := s.validateFileType(file); err != nil {
		return nil, err
	}

	// generate a unique file name
	ext := filepath.Ext(header.Filename)
	fileName := strconv.FormatInt(time.Now().UnixNano(), 10) + ext
	filePath := filepath.Join(config.UploadDir, fileName)

	if err := s.saveFile(file, filePath); err != nil {
		return nil, err
	}

	id, err := s.repo.SaveMeme(fileName, tag, username)
	if err != nil {
		os.Remove(filePath)
		return nil, customerrors.ErrInternalServer
	}

	return &dto.MemeUploadResponse{
		Message: "Meme uploaded successfully",
		MemeID:  id,
	}, nil
}

func (s *MemeServiceImpl) VoteMeme(ctx context.Context, id, memeId, vote int) (*dto.VoteResponse, error) {
	// For consistency
	tx, err := s.repo.BeginTransaction(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	actualVote, err := tx.GetVote(ctx, id, memeId)
	if err != nil {
		return nil, err
	}

	var removed bool
	switch {
	case actualVote == vote:
		err = removeVote(ctx, tx, id, memeId, vote)
		removed = true
	case actualVote == -vote:
		err = switchVoteUpdate(ctx, tx, id, memeId, vote, actualVote)
	default:
		err = newVote(ctx, tx, id, memeId, vote)
	}

	if err != nil {
		return nil, err
	}

	return &dto.VoteResponse{
		Message: "Vote operation completed successfully!",
		Removed: removed,
	}, tx.Commit()
}

func (s *MemeServiceImpl) validateFileType(file multipart.File) error {
	buff := make([]byte, 512)
	if _, err := file.Read(buff); err != nil {
		return customerrors.ErrInternalServer
	}
	defer file.Seek(0, io.SeekStart)

	if !slices.Contains(config.AllowedTypes, http.DetectContentType(buff)) {
		return customerrors.ErrMediaTypeNotAllowed
	}
	return nil
}

func (s *MemeServiceImpl) saveFile(src multipart.File, dstPath string) error {
	out, err := os.Create(dstPath)
	if err != nil {
		return customerrors.ErrInternalServer
	}
	defer out.Close()

	if _, err = io.Copy(out, src); err != nil {
		os.Remove(dstPath)
		return customerrors.ErrInternalServer
	}

	return nil
}

func isCacheValid(cache *models.Meme, lastUpdate time.Time) bool {
	return cache != nil && time.Since(lastUpdate) < 24*time.Hour
}

func removeVote(ctx context.Context, tx repository.VoteRepository, id, memeId, vote int) error {
	err := tx.DeleteVote(ctx, id, memeId)
	if err != nil {
		return err
	}
	return tx.UpdateMemeVoteCountOnRemove(ctx, memeId, vote)
}

func switchVoteUpdate(ctx context.Context, tx repository.VoteRepository, id, memeId, vote, actualVote int) error {
	err := tx.UpdateVote(ctx, id, memeId, vote)
	if err != nil {
		return err
	}
	return tx.UpdateMemeVoteCount(ctx, memeId, vote, actualVote)
}

func newVote(ctx context.Context, tx repository.VoteRepository, id, memeId, vote int) error {
	err := tx.CreateVote(ctx, id, memeId, vote)
	if err != nil {
		return err
	}
	return tx.UpdateMemeVoteCount(ctx, memeId, vote, 0)
}
