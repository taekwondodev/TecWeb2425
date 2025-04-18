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
	UploadMeme(file multipart.File, header *multipart.FileHeader, tag string, username string) (*dto.MemeUploadResponse, error)
	VoteMeme(ctx context.Context, id int, req dto.VoteRequest) (*dto.MemeUploadResponse, error)
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
	meme, err := s.repo.GetMemeById(id)
	if err != nil {
		return nil, err
	}

	if meme == nil {
		return nil, customerrors.ErrMemeNotFound
	}

	return meme, nil
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

	if err := s.repo.SaveMeme(filePath, tag, username); err != nil {
		os.Remove(filePath)
		return nil, customerrors.ErrInternalServer
	}

	return &dto.MemeUploadResponse{
		Message: "Meme uploaded successfully",
	}, nil
}

func (s *MemeServiceImpl) VoteMeme(ctx context.Context, id int, req dto.VoteRequest) (*dto.MemeUploadResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, customerrors.ErrBadRequest
	}

	// For consistency
	tx, err := s.repo.BeginTransaction(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	actualVote, err := tx.GetVote(ctx, id, req.MemeID)
	if err != nil {
		return nil, err
	}

	var removed bool
	switch {
	case actualVote == req.Vote:
		err = removeVote(ctx, tx, id, req)
		removed = true
	case actualVote == -req.Vote:
		err = switchVoteUpdate(ctx, tx, id, req, actualVote)
	default:
		err = newVote(ctx, tx, id, req)
	}

	if err != nil {
		return nil, err
	}

	return &dto.MemeUploadResponse{
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

func removeVote(ctx context.Context, tx repository.VoteRepository, id int, req dto.VoteRequest) error {
	err := tx.DeleteVote(ctx, id, req.MemeID)
	if err != nil {
		return err
	}
	return tx.UpdateMemeVoteCountOnRemove(ctx, req.MemeID, req.Vote)
}

func switchVoteUpdate(ctx context.Context, tx repository.VoteRepository, id int, req dto.VoteRequest, actualVote int) error {
	err := tx.UpdateVote(ctx, id, req.MemeID, req.Vote)
	if err != nil {
		return err
	}
	return tx.UpdateMemeVoteCount(ctx, req.MemeID, req.Vote, actualVote)
}

func newVote(ctx context.Context, tx repository.VoteRepository, id int, req dto.VoteRequest) error {
	err := tx.CreateVote(ctx, id, req.MemeID, req.Vote)
	if err != nil {
		return err
	}
	return tx.UpdateMemeVoteCount(ctx, req.MemeID, req.Vote, 0)
}
