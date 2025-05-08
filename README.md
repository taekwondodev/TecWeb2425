# Meme Museum

This is a university project for the course of TecWeb2425

## Technologies

Frontend: Angular

Backend: Go

Database: PostgreSQL

Migrations: Flyway

## Usage

1. Download the project:

```bash
git clone https://github.com/taekwondodev/TecWeb2425.git
```

2. Run the command to generate JWT_SECRET and copy it:

```bash
openssl rand -hex 32
```

3. Create a file ".env" in the main directory and insert the value of your instances:
   
```ini
# Authentication
JWT_SECRET=your_generated_hex_here  # Required for token signing

# Database Configuration
DB_HOST=postgres                    # Container name (don't change for compose)
DB_PORT=5432                        # Default PostgreSQL port
POSTGRES_USER=your_db_user          # Database username
POSTGRES_PASSWORD=your_db_password  # Database password
POSTGRES_DB=your_db_name            # Database name
POSTGRES_URL=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${POSTGRES_DB}?sslmode=disable

# Image Dir
UPLOAD_DIR=/data/uploads            # Directory for store images
```

4. Run the project with:

```bash
docker compose up
```

