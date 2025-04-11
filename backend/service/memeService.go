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
	"strconv"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"
)

type MemeService interface {
	GetMemes(ctx context.Context, page int, pageSize int, sortBy string) (*dto.GetMemeResponse, error)
	GetDailyMeme() (*models.Meme, error)
	UploadMeme(file multipart.File, header *multipart.FileHeader, tag string, id int) (*dto.MemeUploadResponse, error)
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

func (s *MemeServiceImpl) GetMemes(ctx context.Context, page int, pageSize int, sortBy string) (*dto.GetMemeResponse, error) {
	g, ctx := errgroup.WithContext(ctx)

	var total int
	var memes []models.Meme

	g.Go(func() error {
		var err error
		total, err = s.repo.CountsMeme(ctx)
		return err
	})

	g.Go(func() error {
		var err error
		memes, err = s.repo.GetMemes(ctx, page, pageSize, sortBy)
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

func (s *MemeServiceImpl) UploadMeme(file multipart.File, header *multipart.FileHeader, tag string, id int) (*dto.MemeUploadResponse, error) {
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

	if err := s.repo.SaveMeme(filePath, tag, id); err != nil {
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

	switch {
	case actualVote == req.Vote:
		return nil, nil // No change
	case actualVote == -req.Vote:
		err = tx.UpdateVote(ctx, id, req.MemeID, req.Vote) // Switch from upvote to downvote or vice versa
	default:
		err = tx.CreateVote(ctx, id, req.MemeID, req.Vote) // New vote
	}

	if err != nil {
		return nil, err
	}

	err = tx.UpdateMemeVoteCount(ctx, req.MemeID, req.Vote, actualVote)
	if err != nil {
		return nil, err
	}

	return &dto.MemeUploadResponse{
		Message: "Vote recorded successfully!",
	}, tx.Commit()
}

func (s *MemeServiceImpl) validateFileType(file multipart.File) error {
	buff := make([]byte, 512)
	if _, err := file.Read(buff); err != nil {
		return customerrors.ErrInternalServer
	}

	filetype := http.DetectContentType(buff)
	valid := false
	for _, t := range config.AllowedTypes {
		if filetype == t {
			valid = true
			break
		}
	}

	if !valid {
		return customerrors.ErrMediaTypeNotAllowed
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return customerrors.ErrInternalServer
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
