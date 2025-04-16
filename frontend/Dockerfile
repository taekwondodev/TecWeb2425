FROM node:23.11.0-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --prod --output-path=dist

# Fase di output (i file verranno copiati dal backend)
FROM scratch AS export
COPY --from=builder /app/dist /dist