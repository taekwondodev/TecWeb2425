package service

import (
	"backend/config"
	customerrors "backend/customErrors"
	"backend/dto"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

type ImageService interface {
	GetImage(filename string) (string, error)
	UploadImage(file multipart.File, header *multipart.FileHeader) (*dto.ImageUploadResponse, error)
}

type ImageServiceImpl struct{}

func NewImageService() ImageService {
	return &ImageServiceImpl{}
}

func (s *ImageServiceImpl) GetImage(filename string) (string, error) {
	filePath := filepath.Join(config.UploadDir, filepath.Base(filename))
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return "", customerrors.ErrImageNotFound
	}

	return filePath, nil
}

func (s *ImageServiceImpl) UploadImage(file multipart.File, header *multipart.FileHeader) (*dto.ImageUploadResponse, error) {
	if err := s.validateFileType(file); err != nil {
		return nil, err
	}

	// generate a unique file name
	ext := filepath.Ext(header.Filename)
	fileName := strconv.FormatInt(time.Now().UnixNano(), 10) + ext
	filepath := filepath.Join(config.UploadDir, fileName)

	if err := s.saveFile(file, filepath); err != nil {
		return nil, err
	}

	return &dto.ImageUploadResponse{
		Message: "Image uploaded successfully",
	}, nil
}

func (s *ImageServiceImpl) validateFileType(file multipart.File) error {
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

func (s *ImageServiceImpl) saveFile(src multipart.File, dstPath string) error {
	out, err := os.Create(dstPath)
	if err != nil {
		return customerrors.ErrInternalServer
	}
	defer out.Close()

	if _, err = io.Copy(out, src); err != nil {
		return customerrors.ErrInternalServer
	}

	return nil
}
