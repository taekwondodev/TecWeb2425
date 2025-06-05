<div align="center">
   
# Meme Museum

This is a university project for the course of TecWeb2425

</div>

## Technologies

**Frontend**: Angular

**Backend**: Go

**Database**: PostgreSQL

**Migrations**: Flyway

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

## Testing

To run the test e2e locally:

```bash
docker compose up                   # To run the server

cd app/frontend
npm install
npm run e2e
```

## ScreenShots

<p align="center">
   <img src="https://github.com/user-attachments/assets/49306887-4771-4d3e-9c23-751b9d181691" width="30%" style="margin: 5px;"/>
   <img src="https://github.com/user-attachments/assets/927e596e-0239-46ca-9f51-8a7530313b34" width="30%" style="margin: 5px;">
   <img src="https://github.com/user-attachments/assets/1cdfa494-a844-4fa1-86da-d0400a3d29a1" width="30%" style="margin: 5px;"/>
</p>
<p align="center"> 
   <img src="https://github.com/user-attachments/assets/4dc4c49c-9656-4954-b26a-dc6306f51b27" width="30%" style="margin: 5px;"/> 
   <img src="https://github.com/user-attachments/assets/47628166-8168-4113-9f82-8e5332d8822b" width="30%" style="margin: 5px;"/>
   <img src="https://github.com/user-attachments/assets/174fd297-0631-4c33-bdb7-1065c2410153" width="30%" style="margin: 5px;"/>
</p>
