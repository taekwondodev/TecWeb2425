#Build del frontend
FROM node:23.11.0-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
RUN npm run build -- --output-path=dist

# Build del backend
FROM golang:1.24.2-alpine AS go-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend-builder /app/dist ./static

# Create the user not root (UID/GID 1000)
RUN echo "nonroot:x:1000:1000:nonroot:/:" > /etc/passwd && \
    echo "nonroot:x:1000:" > /etc/group && \
    chmod 644 /etc/passwd /etc/group

RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Runtime
FROM alpine:3.19 AS runtime

WORKDIR /app

COPY --from=go-builder /app/main .
COPY --from=go-builder /etc/passwd /etc/passwd
COPY --from=go-builder /etc/group /etc/group
COPY --from=go-builder /app/static /app/static

USER nonroot:nonroot

EXPOSE 80

CMD ["./main"]