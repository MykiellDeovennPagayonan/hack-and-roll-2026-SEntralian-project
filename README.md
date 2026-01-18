# Snap

A camera-powered AI application that matches your photo to a hamster personality or roasts you comedy.

## Features

- **Hamster Analysis** - Take a photo and get matched to a hamster personality based on detected attributes
- **Roast Mode** - Get a short roast based on your photo
- **Thermal Printing** - Print your results via Bluetooth thermal printer
- **Kiosk Mode** - Fullscreen display optimized for Raspberry Pi
- **Retro CRT Aesthetic** - Terminal-style UI with scanlines and glowing green text

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Rust, Axum, Tokio |
| AI/ML | Ollama (gemma3:4b), FastEmbed (nomic-embed-text) |
| Hardware (Optional) | Raspberry Pi 5, USB Webcam, Bluetooth Thermal Printer |

## Project Structure
```
snap/
├── backend/           # Rust API server
│   └── src/
│       ├── handlers/  # API route handlers
│       ├── service/   # Ollama integration
│       └── models/    # Data structures
├── frontend/          # Next.js web app
│   ├── app/           # Pages (menu, hamster, roast)
│   ├── components/    # Reusable UI components
│   └── lib/           # Hooks, utils, services
└── README.md
```

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) (1.70+)
- [Node.js](https://nodejs.org/) (18+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Ollama](https://ollama.ai/)

### 1. Install Ollama

#### macOS
```bash
brew install ollama
```

#### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Windows
Download the installer from [ollama.com/download](https://ollama.com/download)

#### Raspberry Pi / ARM Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Start Ollama and Pull Model
```bash
# Start Ollama service
ollama serve

# In a new terminal, pull the required model
ollama pull gemma3:4b

# Verify installation
ollama list
```

### 3. Start Backend
```bash
cd backend
cargo run
```

Backend runs on `http://localhost:8000`

### 4. Start Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs on `http://localhost:3000`

### 5. Use the App

1. Open `http://localhost:3000`
2. Select **Hamster Analysis** or **Roast Mode**
3. Allow camera access
4. Capture a photo
5. View your result

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/poem/image` | POST | Generate poem from image |
| `/roast/image` | POST | Generate roast from image |
| `/hamster/match` | POST | Match image to hamster personality |

### Example Request
```bash
curl -X POST http://localhost:8000/roast/image \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "<base64-image>"}'
```

## Raspberry Pi Deployment

See [RASPBERRY_PI_SETUP.md](./RASPBERRY_PI_SETUP.md) for full kiosk deployment instructions.

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `RUST_LOG` | `info` | Logging level (debug, info, warn, error) |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL |

Create a `.env` file in the frontend directory:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

### Backend Development
```bash
cd backend

# Run with hot reload
cargo watch -x run

# Run tests
cargo test

# Build release
cargo build --release
```

### Frontend Development
```bash
cd frontend

# Development server
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

## Troubleshooting

### Ollama Connection Issues

Ensure Ollama is running:
```bash
ollama serve
```

Check model is installed:
```bash
ollama list
```

If Ollama isn't starting, check if another instance is already running:
```bash
# Linux/macOS
ps aux | grep ollama

# Windows
tasklist | findstr ollama
```

### Camera Access Denied

The app requires camera permissions. Check browser settings and ensure you're accessing via HTTPS or localhost.

### CORS Errors

The backend is configured to accept requests from `http://localhost:3000`. Update CORS settings in `backend/src/main.rs` if using a different frontend URL.

### Thermal Printer Not Working

Ensure Bluetooth is enabled and the printer is paired with your device. Check printer documentation for specific pairing instructions.

### Port Already in Use

If port 8000 or 3000 is already in use:

**Backend:**
```bash
# Change port in backend/src/main.rs or set environment variable
PORT=8001 cargo run
```

**Frontend:**
```bash
# Next.js will automatically try the next available port
pnpm dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with [Ollama](https://ollama.ai/) for local AI inference
- Hamster personality database inspired by various hamster care communities
- CRT aesthetic inspired by retro computing terminals