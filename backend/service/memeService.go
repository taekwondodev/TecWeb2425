package service

import (
	"backend/config"
	customerrors "backend/customErrors"
	"backend/dto"
	"backend/repository"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

type MemeService interface {
	GetImage(filename string) (string, error)
	UploadMeme(file multipart.File, header *multipart.FileHeader, tag string, username string) (*dto.MemeUploadResponse, error)
}

type MemeServiceImpl struct {
	repo repository.MemeRepository
}

func NewMemeService(repo repository.MemeRepository) MemeService {
	return &MemeServiceImpl{repo: repo}
}

func (s *MemeServiceImpl) GetImage(filename string) (string, error) {
	filePath := filepath.Join(config.UploadDir, filepath.Base(filename))
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return "", customerrors.ErrImageNotFound
	}

	return filePath, nil
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
