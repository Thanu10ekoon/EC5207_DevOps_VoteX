# VoteX – Online Polling Platform

VoteX is a full-stack online polling and voting platform where users can:
- Create **public** or **private** (password-protected) polls
- Vote on polls created by others
- View real-time poll results after voting
- Manage their own polls

## Features

### ✅ Implemented
- User registration and login (JWT authentication)
- Create public polls (anyone can vote)
- Create private polls (password-protected)
- Vote on polls (one vote per user per poll)
- Real-time results display after voting
- Poll management (view own polls)
- Fully Dockerized stack

### 🚧 Future Enhancements
- Poll expiration/scheduling
- Real-time vote updates (WebSocket)
- Share poll links
- Vote analytics and charts
- Email verification
- Password reset
- Admin dashboard

## Tech Stack

- **Frontend**: React (Create React App) + Plain CSS
- **Backend**: Node.js + Express (JWT auth, bcrypt password hashing)
- **Database**: MySQL 8
- **Orchestration**: Docker Compose (Nginx serves static build + proxies /api)

## Project Structure

```
VoteX/
├── client/              # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js       # Auth logic
│   │   ├── App.css      # Auth page styles
│   │   ├── Dashboard.js # Poll creation & voting
│   │   ├── Dashboard.css
│   │   └── index.js
│   ├── Dockerfile       # Multi-stage build (React → Nginx)
│   └── package.json
├── server/              # Node.js backend API
│   ├── src/
│   │   ├── index.js     # Express app + auth routes
│   │   ├── db.js        # MySQL connection pool
│   │   └── routes/
│   │       └── polls.js # Poll CRUD endpoints
│   ├── Dockerfile
│   └── package.json
├── db/
│   └── init.sql         # Database schema (users, polls, poll_options, votes)
└── docker-compose.yml   # Orchestrates db, server, client
```

## Quick Start

### Prerequisites
- Docker Desktop (with Docker Compose v2)
- Windows PowerShell or WSL

### Build and Run

```powershell
# Build all services
docker compose build

# Start in detached mode
docker compose up -d

# Check status
docker compose ps
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **Health Check**: http://localhost:4000/api/health

### Stop and Clean Up

```powershell
# Stop all containers
docker compose down

# Stop and remove volumes (full reset including DB data)
docker compose down -v
```

## API Endpoints

### Authentication
- `POST /api/register` - Create new user account
  ```json
  { "email": "user@example.com", "password": "password123" }
  ```
- `POST /api/login` - Login and receive JWT token
  ```json
  { "email": "user@example.com", "password": "password123" }
  → { "token": "jwt_token_here" }
  ```
- `GET /api/profile` - Get current user profile (requires auth)

### Polls (All require authentication)
- `GET /api/polls` - Get all public polls + user's own polls
- `GET /api/polls/:id` - Get poll details with options
- `POST /api/polls` - Create new poll
  ```json
  {
    "title": "Favorite Color?",
    "description": "Optional description",
    "isPublic": true,
    "pollPassword": "secret123", // only for private polls
    "options": ["Red", "Blue", "Green"]
  }
  ```
- `POST /api/polls/:id/verify` - Verify password for private poll
- `POST /api/polls/:id/vote` - Vote on a poll
  ```json
  {
    "optionId": 1,
    "password": "secret123" // only for private polls
  }
  ```
- `DELETE /api/polls/:id` - Delete poll (creator only)

## Database Schema

### users
- `id` (INT, PRIMARY KEY)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `created_at` (TIMESTAMP)

### polls
- `id` (INT, PRIMARY KEY)
- `title` (VARCHAR)
- `description` (TEXT)
- `is_public` (BOOLEAN)
- `poll_password` (VARCHAR, hashed)
- `created_by` (INT, FK → users.id)
- `created_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP, nullable)

### poll_options
- `id` (INT, PRIMARY KEY)
- `poll_id` (INT, FK → polls.id)
- `option_text` (VARCHAR)
- `vote_count` (INT, default 0)

### votes
- `id` (INT, PRIMARY KEY)
- `poll_id` (INT, FK → polls.id)
- `user_id` (INT, FK → users.id)
- `option_id` (INT, FK → poll_options.id)
- `voted_at` (TIMESTAMP)
- UNIQUE constraint on (poll_id, user_id)

## Development Commands

### View Logs
```powershell
# Follow all logs
docker compose logs -f

# Specific service
docker compose logs -f client
docker compose logs -f server
docker compose logs -f db
```

### Rebuild After Changes
```powershell
# Rebuild everything
docker compose build
docker compose up -d

# Rebuild only frontend
docker compose build client
docker compose up -d client

# Rebuild only backend
docker compose build server
docker compose up -d server
```

### Access MySQL Database
```powershell
# Interactive MySQL shell (password: rootpassword)
docker compose exec db mysql -u root -p

# Once inside:
USE votex;
SHOW TABLES;
SELECT * FROM polls;
SELECT * FROM poll_options WHERE poll_id = 1;
SELECT * FROM votes;
```

### Quick API Tests (PowerShell)
```powershell
# Health check
curl http://localhost:4000/api/health

# Register
$body = '{"email":"test@example.com","password":"test123"}'
curl -Method POST -Uri http://localhost:4000/api/register -ContentType "application/json" -Body $body

# Login (save token)
$response = curl -Method POST -Uri http://localhost:4000/api/login -ContentType "application/json" -Body $body
$token = ($response | ConvertFrom-Json).token

# Get polls
curl -Uri http://localhost:4000/api/polls -Headers @{Authorization="Bearer $token"}
```

## Security Notes

⚠️ **This is a development setup. For production:**
- Replace `JWT_SECRET` with a secure random value
- Use environment variables or secrets management
- Add rate limiting to prevent abuse
- Enable HTTPS (use reverse proxy like Traefik/Caddy)
- Add input validation and sanitization
- Implement CSRF protection
- Add password complexity requirements
- Consider refresh tokens for longer sessions

## Port Mapping

| Service | Internal Port | External Port |
|---------|--------------|---------------|
| client (Nginx) | 80 | 3000 |
| server (Node) | 4000 | 4000 |
| db (MySQL) | 3306 | (not exposed) |

## Environment Variables

Configure in `docker-compose.yml`:

### Server
- `PORT` - Server port (default: 4000)
- `DB_HOST` - MySQL host (default: db)
- `DB_USER` - MySQL user (default: root)
- `DB_PASSWORD` - MySQL password (default: rootpassword)
- `DB_NAME` - Database name (default: votex)
- `JWT_SECRET` - Secret for JWT signing (default: devsecret)

### Client (build-time)
- `REACT_APP_API_URL` - API base URL (default: /api)

## Troubleshooting

### Frontend shows blank page
- Check client logs: `docker compose logs client`
- Ensure build completed successfully
- Hard refresh browser (Ctrl+F5)

### Backend returns 500 errors
- Check server logs: `docker compose logs server`
- Verify database is healthy: `docker compose ps`
- Check database connection in server logs

### Database connection errors
- Wait for MySQL healthcheck to pass
- Verify credentials in docker-compose.yml
- Check init.sql was executed: `docker compose exec db mysql -u root -p votex -e "SHOW TABLES;"`

### Port already in use
- Stop other services using ports 3000 or 4000
- Or modify ports in docker-compose.yml

## License

MIT

## Contributors

Built as a DevOps Engineering course project.
