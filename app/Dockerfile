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
COPY --from=frontend-builder /app/dist ./dist
COPY --from=go-builder /app/main .
COPY frontend/package.json .
COPY frontend/cypress.config.js .
COPY frontend/cypress ./cypress
RUN npm install && npm install cypress
CMD [ "sh", "-c", "./main & sleep 5 && npx cypress run" ]

# Runtime
FROM alpine:3.19 AS runtime
WORKDIR /app
COPY --from=go-builder /app/main .
COPY --from=go-builder /app/static /app/static
EXPOSE 80
CMD ["./main"]