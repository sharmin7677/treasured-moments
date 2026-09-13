# The Friendship Vault - Backend API

Backend server for The Friendship Vault application.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration (optional for development):
```
PORT=5000
```

### Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

### Health Check

Verify the server is running:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "The Friendship Vault API is running",
  "timestamp": "2026-08-06T00:00:00.000Z"
}
```

## Project Structure

```
src/
├── index.js           # Server entry point
├── config/            # Configuration files
├── middleware/        # Express middleware
├── routes/            # API routes
├── controllers/       # Route controllers (future)
└── models/            # Database models (future)
```

## Features (Roadmap)

- [x] Express server setup
- [x] CORS configuration
- [x] Health check endpoint
- [ ] MongoDB integration
- [ ] Firebase admin SDK
- [ ] JWT authentication
- [ ] Cloudinary integration
- [ ] Secret Corner feature
