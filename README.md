# hack-and-roll-snap

A Raspberry Pi kiosk application that uses a camera to capture images and generates poems or comedic roasts about them using AI.

## Project Structure

```
hack-and-roll-snap/
├── backend/          # Rust API server (Axum + Ollama)
├── frontend/         # Next.js kiosk web app
└── README.md         # This file
```

## Features

- Camera-based image capture
- AI-powered poem generation from images
- AI-powered comedic roasts from images
- Fullscreen kiosk mode for Raspberry Pi
- Dark theme optimized for display

---

## Local Development

### Prerequisites

- **Rust** (1.70+): https://rustup.rs/
- **Node.js** (18+): https://nodejs.org/
- **pnpm**: `npm install -g pnpm`
- **Ollama**: https://ollama.ai/

### 1. Start Ollama with the Required Model

```bash
# Install Ollama (macOS)
brew install ollama

# Start Ollama service
ollama serve

# Pull the required model (in a new terminal)
ollama pull gemma3:4b
```

### 2. Start the Backend

```bash
cd backend
cargo run
```

The backend runs on `http://localhost:8000`

### 3. Start the Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend runs on `http://localhost:3000`

### 4. Test the App

1. Open `http://localhost:3000` in your browser
2. Click **Start** → **Poem**
3. Allow camera access
4. Take a photo
5. View the generated poem

---

## Raspberry Pi Deployment

### Hardware Requirements

- Raspberry Pi 5 (recommended) or Pi 4
- Camera module or USB webcam
- Display (touchscreen recommended for kiosk)
- MicroSD card (32GB+)

### Software Requirements

- Raspberry Pi OS (with desktop)
- Node.js 18+
- Rust toolchain
- Ollama

---

## Step 1: Initial Pi Setup

### Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install build essentials
sudo apt install -y build-essential curl git

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install unclutter (for hiding cursor in kiosk mode)
sudo apt install -y unclutter
```

### Install Ollama on Raspberry Pi

```bash
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve &

# Pull the model (this may take a while)
ollama pull gemma3:4b
```

---

## Step 2: Transfer Project to Raspberry Pi

From your development machine:

```bash
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'target' \
  --exclude '.git' \
  "/Users/sibato/Documents/hackathons/hack and roll/project/" \
  sibato@sibato.local:~/hack-and-roll-snap/

```

---

## Step 3: Deploy the Backend

### Build the Backend

```bash
ssh pi@raspberrypi.local
cd ~/hack-and-roll-snap/backend
cargo build --release
```

### Create Backend Systemd Service

```bash
sudo nano /etc/systemd/system/hack-and-roll-backend.service
```

Add this content:

```ini
[Unit]
Description=Hack and Roll Snap Backend
After=network.target ollama.service

[Service]
Type=simple
User=sibato
WorkingDirectory=/home/sibato/hack-and-roll-snap/backend
ExecStart=/home/sibato/hack-and-roll-snap/backend/target/release/poem-backend
Restart=always
Environment=RUST_LOG=info
Environment=OLLAMA_BASE_URL=http://localhost:11434

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable hack-and-roll-backend.service
sudo systemctl start hack-and-roll-backend.service

# Verify it's running
sudo systemctl status hack-and-roll-backend.service
curl http://localhost:8000/health
```

---

## Step 4: Deploy the Frontend

### Build the Frontend

```bash
cd ~/hack-and-roll-snap/frontend
pnpm install
pnpm build
```

### Create Frontend Systemd Service

Find pnpm path first:

```bash
which pnpm
```

Create the service:

```bash
sudo nano /etc/systemd/system/hack-and-roll-frontend.service
```

Add this content (adjust pnpm path if needed):

```ini
[Unit]
Description=Hack and Roll Snap Frontend
After=network.target hack-and-roll-backend.service

[Service]
Type=simple
User=sibato
WorkingDirectory=/home/sibato/hack-and-roll-snap/frontend
ExecStart=/home/sibato/.local/share/pnpm/pnpm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable hack-and-roll-frontend.service
sudo systemctl start hack-and-roll-frontend.service

# Verify it's running
sudo systemctl status hack-and-roll-frontend.service
curl http://localhost:3000
```

---

## Step 5: Create Ollama Systemd Service

```bash
sudo nano /etc/systemd/system/ollama.service
```

Add this content:

```ini
[Unit]
Description=Ollama LLM Service
After=network.target

[Service]
Type=simple
User=pi
ExecStart=/usr/local/bin/ollama serve
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ollama.service
sudo systemctl start ollama.service
```

---

## Step 6: Configure Kiosk Mode

### Fix Keyring Password Prompt

```bash
rm -rf ~/.local/share/keyrings/*
mkdir -p ~/.local/share/keyrings
echo "Default" > ~/.local/share/keyrings/default
```

### Create Kiosk Startup Script

```bash
nano ~/start-kiosk.sh
```

Add this content:

```bash
#!/bin/bash

LOG="/home/sibato/kiosk.log"
echo "$(date): Kiosk script started" > "$LOG"

# Wait for BOTH backend and frontend to be ready
echo "$(date): Waiting for services..." >> "$LOG"
until curl -s http://localhost:8000/health > /dev/null && curl -s http://localhost:3000 > /dev/null; do
    echo "$(date): Services not ready, waiting..." >> "$LOG"
    sleep 2
done
echo "$(date): All services ready!" >> "$LOG"

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide cursor
unclutter -idle 0.1 -root &

# Remove Chromium crash warnings
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences 2>/dev/null
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences 2>/dev/null

# Launch Chromium in kiosk mode
echo "$(date): Launching Chromium..." >> "$LOG"
chromium-browser \
  --start-maximized \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --incognito \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-gpu \
  --password-store=basic \
  --use-gl=swiftshader \
  --use-fake-ui-for-media-stream \
  http://localhost:3000 >> "$LOG" 2>&1

echo "$(date): Chromium exited" >> "$LOG"
```

Make executable:

```bash
chmod +x ~/start-kiosk.sh
```

### Configure labwc Autostart

```bash
mkdir -p ~/.config/labwc
nano ~/.config/labwc/autostart
```

Add:

```bash
/home/sibato/start-kiosk.sh &
```

### Hide Desktop Elements (Optional)

```bash
sudo nano /etc/xdg/labwc/autostart
```

Comment out panel and desktop manager:

```bash
#/usr/bin/lwrespawn /usr/bin/wf-panel-pi &
#/usr/bin/lwrespawn /usr/bin/pcmanfm --desktop --profile LXDE-pi &
/usr/bin/kanshi &
```

---

## Step 7: Configure Auto-Login and Display

### Enable Desktop Auto-Login

```bash
sudo raspi-config
```

Navigate to: **System Options** → **Boot / Auto Login** → **Desktop Autologin**

### Disable Screen Blanking

```bash
sudo raspi-config
```

Navigate to: **Display Options** → **Screen Blanking** → **No**

---

## Step 8: Reboot and Test

```bash
sudo reboot
```

After reboot, the system should:
1. Auto-login to desktop
2. Start Ollama, backend, and frontend services
3. Launch Chromium in fullscreen kiosk mode
4. Display the hack-and-roll-snap app

---

## Useful Commands

### Service Management

```bash
# Check all services
sudo systemctl status ollama.service
sudo systemctl status hack-and-roll-backend.service
sudo systemctl status hack-and-roll-frontend.service

# Restart services
sudo systemctl restart hack-and-roll-backend.service
sudo systemctl restart hack-and-roll-frontend.service

# View logs
sudo journalctl -u hack-and-roll-backend.service -f
sudo journalctl -u hack-and-roll-frontend.service -f
```

### Kiosk Management

```bash
# View kiosk log
cat ~/kiosk.log

# Kill kiosk (from SSH)
pkill chromium

# Restart kiosk
DISPLAY=:0 ~/start-kiosk.sh &
```

### Update Application

From your development machine:

```bash
# Sync changes
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude 'target' \
  "/path/to/project/" \
  pi@raspberrypi.local:~/hack-and-roll-snap/

# SSH and rebuild
ssh pi@raspberrypi.local
cd ~/hack-and-roll-snap/backend && cargo build --release
cd ~/hack-and-roll-snap/frontend && pnpm install && pnpm build

# Restart services
sudo systemctl restart hack-and-roll-backend.service
sudo systemctl restart hack-and-roll-frontend.service
```

---

## API Reference

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/health` | GET | Health check |
| `/poem/text` | POST | Generate poem from text |
| `/poem/image` | POST | Generate poem from image |
| `/roast/image` | POST | Generate comedic roast from image |

### Generate Poem from Image

```bash
curl -X POST http://localhost:8000/poem/image \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "<base64-encoded-image>"}'
```

Response:

```json
{
  "success": true,
  "poem": "The generated poem...",
  "error": null
}
```

### Generate Roast from Image

```bash
curl -X POST http://localhost:8000/roast/image \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "<base64-encoded-image>"}'
```

Response:

```json
{
  "success": true,
  "roast": "The generated roast...",
  "error": null
}
```

---

## Troubleshooting

### Camera Not Working

```bash
# Check camera permissions in Chromium
# The --use-fake-ui-for-media-stream flag auto-accepts camera permission

# Verify camera is detected
ls /dev/video*
```

### Backend Connection Failed

```bash
# Check if backend is running
curl http://localhost:8000/health

# Check Ollama is running
curl http://localhost:11434/api/tags

# View backend logs
sudo journalctl -u hack-and-roll-backend.service -n 50
```

### Sync frontend only
```bash
# Sync only the frontend directory
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.next' \
  "/Users/sibato/Documents/hackathons/hack and roll/project/frontend/" \
  sibato@sibato.local:~/hack-and-roll-snap/frontend/
```

### Kiosk Not Starting

```bash
# Check kiosk log
cat ~/kiosk.log

# Verify autostart config
cat ~/.config/labwc/autostart

# Manually start kiosk
DISPLAY=:0 ~/start-kiosk.sh
```

### Model Not Loaded

```bash
# Pull the model again
ollama pull gemma3:4b

# List available models
ollama list
```

---

## Deployment Checklist

- [ ] Raspberry Pi OS installed with desktop
- [ ] Node.js, pnpm, Rust, Ollama installed
- [ ] `gemma3:4b` model pulled
- [ ] Project transferred to Pi
- [ ] Backend built: `cargo build --release`
- [ ] Frontend built: `pnpm build`
- [ ] Ollama service created and enabled
- [ ] Backend service created and enabled
- [ ] Frontend service created and enabled
- [ ] All services running: `curl localhost:8000/health && curl localhost:3000`
- [ ] Keyring disabled
- [ ] Kiosk script created and executable
- [ ] labwc autostart configured
- [ ] Desktop autologin enabled
- [ ] Screen blanking disabled
- [ ] Rebooted and kiosk displays correctly
- [ ] Camera works in the app
