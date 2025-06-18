#Build del frontend
FROM node:23.11.0-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
RUN npm run build -- --output-path=dist

# Build del backend
FROM golang:1.24.2-alpine AS go-builder
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
COPY --from=frontend-builder /app/frontend/dist ./static
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Runtime
FROM alpine:3.19 AS runtime
WORKDIR /app
COPY --from=go-builder /app/main .
COPY --from=go-builder /app/static ./static
EXPOSE 80
CMD ["./main"]