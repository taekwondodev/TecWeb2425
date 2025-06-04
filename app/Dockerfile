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
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Test E2E
FROM node:23.11.0-alpine AS e2e-test
WORKDIR /e2e
COPY --from=frontend-builder /app/dist ./static/browser
COPY --from=go-builder /app/main .
COPY frontend/package.json frontend/playwright.config.ts ./
COPY frontend/tests ./tests
RUN apk add --no-cache \
    ca-certificates \
    chromium \
    freetype \
    freetype-dev \
    harfbuzz \
    nss \
    ttf-freefont
RUN npm install @playwright/test
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_BROWSERS_PATH=0
CMD [ "sh", "-c", "./main & sleep 5 && npx playwright test" ]

# Runtime
FROM alpine:3.19 AS runtime
WORKDIR /app
COPY --from=go-builder /app/main .
COPY --from=go-builder /app/static /app/static
EXPOSE 80
CMD ["./main"]