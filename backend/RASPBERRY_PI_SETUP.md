# Raspberry Pi Backend Server Deployment Guide

Deploy the Hack and Roll Snap backend on Raspberry Pi 5 to serve as a network-accessible API server for your mobile frontend.

## Architecture Overview

```
[Your Phone] ←→ [Phone Hotspot] ←→ [Raspberry Pi Backend]
    ↓                                      ↓
[Deployed Frontend]              [Backend on :8000]
(Vercel/Netlify)                 (Ollama on :11434)
    ↓                                      ↑
    └──────── HTTP Requests ───────────────┘
    (http://192.168.43.100:8000)
```

---

## Prerequisites

On your Raspberry Pi, ensure you have:
- Raspberry Pi OS (Lite or Desktop)
- Rust toolchain
- Ollama

### Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install build essentials
sudo apt install -y build-essential curl git
```

### Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Verify installation
rustc --version
cargo --version
```

### Install Ollama

```bash
curl -fsSL https://ollama.ai/install.sh | sh

# Verify installation
ollama --version
```

---

## Step 1: Transfer Backend to Raspberry Pi

### Using rsync (Recommended)

From your development machine:
```bash
rsync -avz \
  --exclude 'target' \
  --exclude '.git' \
  "/Users/sibato/Documents/hackathons/hack and roll/project/backend/" \
  pi@raspberrypi.local:~/hack-and-roll-snap/backend/
```

Replace `pi@raspberrypi.local` with your Pi's username and hostname.

---

## Step 2: Configure Backend for Network Access

SSH into your Raspberry Pi:
```bash
ssh pi@raspberrypi.local
```

### Modify main.rs to Listen on All Network Interfaces

Edit `backend/src/main.rs`:

```bash
nano ~/hack-and-roll-snap/backend/src/main.rs
```

Change the bind address from `127.0.0.1:8000` to `0.0.0.0:8000`:

```rust
// Change this line:
let addr = "127.0.0.1:8000";

// To this:
let addr = "0.0.0.0:8000";
```

**Why this matters:**
- `127.0.0.1` = localhost only (not accessible from network)
- `0.0.0.0` = all network interfaces (accessible from your phone)

---

## Step 3: Build the Backend

```bash
cd ~/hack-and-roll-snap/backend
cargo build --release
```

This will take some time on the Raspberry Pi. The compiled binary will be at:
```
target/release/poem-backend
```

---

## Step 4: Set Up Ollama Service

### Create Ollama systemd Service

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
Environment=OLLAMA_KEEP_ALIVE=24h

[Install]
WantedBy=multi-user.target
```

### Enable and Start Ollama

```bash
sudo systemctl daemon-reload
sudo systemctl enable ollama.service
sudo systemctl start ollama.service
sudo systemctl status ollama.service
```

### Pull Required Model

```bash
# This will take a while (several GB download)
ollama pull gemma3:4b

# Verify model is available
ollama list
```

---

## Step 5: Create Backend systemd Service

```bash
sudo nano /etc/systemd/system/hack-and-roll-backend.service
```

Add this content (adjust `User` and paths if needed):

```ini
[Unit]
Description=Hack and Roll Snap Backend API
After=network.target ollama.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/hack-and-roll-snap/backend
ExecStart=/home/pi/hack-and-roll-snap/backend/target/release/poem-backend
Restart=always
Environment=RUST_LOG=info
Environment=OLLAMA_BASE_URL=http://localhost:11434

[Install]
WantedBy=multi-user.target
```

### Enable and Start Backend

```bash
sudo systemctl daemon-reload
sudo systemctl enable hack-and-roll-backend.service
sudo systemctl start hack-and-roll-backend.service
sudo systemctl status hack-and-roll-backend.service
```

**Verify it's running:**
```bash
curl http://localhost:8000/health
```

You should see a successful health check response.

---

## Step 6: Configure Firewall (if enabled)

```bash
# Check if firewall is active
sudo ufw status

# If active, allow port 8000
sudo ufw allow 8000/tcp
sudo ufw reload
```

---

## Step 7: Find Your Raspberry Pi's IP Address

```bash
hostname -I
```

This will show your Pi's IP address on the network, for example:
```
192.168.43.100
```

**Note:** This IP will be used by your frontend to connect to the backend.

---

## Step 8: Test Backend from Your Phone

### Connect Phone to Same Network

1. Enable your phone's mobile hotspot
2. Connect your Raspberry Pi to the hotspot's WiFi
3. Note the Pi's new IP address: `hostname -I`

### Test from Phone Browser

Open your phone's browser and navigate to:
```
http://192.168.43.100:8000/health
```

Replace `192.168.43.100` with your Pi's actual IP address.

You should see the health check response.

---

## Step 9: Configure Your Frontend

### For Deployed Frontend (Vercel/Netlify)

Set the environment variable:
```
NEXT_PUBLIC_API_URL=http://192.168.43.100:8000
```

Replace `192.168.43.100` with your Pi's IP address.

### For Local Development

Create `.env.local` in your frontend directory:
```bash
NEXT_PUBLIC_API_URL=http://192.168.43.100:8000
```

---

## Step 10: Optional Performance Optimizations

### Warm Up Model on Boot

Add a warm-up step to pre-load the model into memory:

```bash
nano ~/warm-up-ollama.sh
```

Add this content:
```bash
#!/bin/bash

# Wait for Ollama to be ready
until curl -s http://localhost:11434/api/tags > /dev/null; do
    sleep 2
done

# Warm up the model
echo "Warming up Ollama model..."
curl -s http://localhost:11434/api/generate \
  -d '{"model":"gemma3:4b","prompt":"hi","stream":false}' > /dev/null
echo "Model warm-up complete"
```

Make it executable:
```bash
chmod +x ~/warm-up-ollama.sh
```

Create a systemd service:
```bash
sudo nano /etc/systemd/system/ollama-warmup.service
```

Add:
```ini
[Unit]
Description=Ollama Model Warm-up
After=ollama.service hack-and-roll-backend.service

[Service]
Type=oneshot
User=pi
ExecStart=/home/pi/warm-up-ollama.sh

[Install]
WantedBy=multi-user.target
```

Enable it:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ollama-warmup.service
```

### Increase Swap (if needed for 4GB Pi)

```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
```

Set:
```
CONF_SWAPSIZE=2048
```

Apply:
```bash
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

---

## Useful Commands

### Service Management

```bash
# Check all services
sudo systemctl status ollama.service
sudo systemctl status hack-and-roll-backend.service

# Restart backend
sudo systemctl restart hack-and-roll-backend.service

# View backend logs
sudo journalctl -u hack-and-roll-backend.service -f

# View Ollama logs
sudo journalctl -u ollama.service -f
```

### Network Debugging

```bash
# Check if backend is listening on all interfaces
sudo netstat -tuln | grep 8000
# Should show: 0.0.0.0:8000

# Check current IP address
hostname -I

# Test local connection
curl http://localhost:8000/health

# Test network connection (from another device)
curl http://192.168.43.100:8000/health
```

### Update Backend

From your development machine:

```bash
# Sync changes
rsync -avz --exclude 'target' \
  "/path/to/your/project/backend/" \
  pi@raspberrypi.local:~/hack-and-roll-snap/backend/

# SSH and rebuild
ssh pi@raspberrypi.local
cd ~/hack-and-roll-snap/backend
cargo build --release

# Restart service
sudo systemctl restart hack-and-roll-backend.service
```

### Monitor System Resources

```bash
# Check memory usage
free -h

# Check if swapping
vmstat 1 5

# Check CPU usage
htop

# Check disk space
df -h
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check service status
sudo systemctl status hack-and-roll-backend.service

# View detailed logs
sudo journalctl -u hack-and-roll-backend.service -xe

# Try running manually to see errors
cd ~/hack-and-roll-snap/backend
./target/release/poem-backend
```

### Ollama Not Responding

```bash
# Check Ollama service
sudo systemctl status ollama.service

# Check if model is loaded
curl http://localhost:11434/api/tags

# Restart Ollama
sudo systemctl restart ollama.service

# Re-pull model if corrupted
ollama pull gemma3:4b
```

### Cannot Connect from Phone

**Check if backend is listening on correct interface:**
```bash
sudo netstat -tuln | grep 8000
```

Should show `0.0.0.0:8000`, not `127.0.0.1:8000`

**Check firewall:**
```bash
sudo ufw status
sudo ufw allow 8000/tcp
```

**Verify IP address:**
```bash
hostname -I
# Make sure you're using the correct IP in your frontend
```

**Test from Pi itself:**
```bash
# This should work
curl http://localhost:8000/health

# This should also work
curl http://$(hostname -I | awk '{print $1}'):8000/health
```

### CORS Errors

Your backend already has CORS configured with `allow_origin(Any)`. If you still see CORS errors:

```bash
# Check backend logs
sudo journalctl -u hack-and-roll-backend.service -f

# Ensure your frontend is using http:// not https://
# Example: http://192.168.43.100:8000 not https://...
```

### Slow Response Times

**First request is always slow** because Ollama loads the model into RAM. Use the warm-up script from Step 10.

**Check system resources:**
```bash
# Memory
free -h

# If using a lot of swap, performance will be slow
vmstat 1 5

# CPU
htop
```

**Performance tips:**
- Use Raspberry Pi 5 with 8GB RAM (4GB is tight)
- Consider using a smaller model like `gemma3:1b`
- Increase swap size
- Keep model loaded with `OLLAMA_KEEP_ALIVE=24h`

### IP Address Keeps Changing

**Set static IP on your phone's hotspot:**
1. Find Pi's MAC address: `ip link show`
2. In phone hotspot settings, reserve/assign static IP for this MAC address

**Alternative: Use mDNS**
```bash
# Install Avahi (usually pre-installed)
sudo apt install avahi-daemon

# Use hostname instead of IP
http://raspberrypi.local:8000
```

Note: mDNS may not work on all mobile hotspots.

---

## Deployment Checklist

- [ ] Rust installed and working
- [ ] Ollama installed
- [ ] `gemma3:4b` model pulled
- [ ] Backend code transferred to Pi
- [ ] `main.rs` modified to use `0.0.0.0:8000`
- [ ] Backend built: `cargo build --release`
- [ ] Ollama service created and enabled
- [ ] Ollama service running: `sudo systemctl status ollama.service`
- [ ] Backend service created and enabled
- [ ] Backend service running: `sudo systemctl status hack-and-roll-backend.service`
- [ ] Health check works locally: `curl localhost:8000/health`
- [ ] Pi's IP address noted: `hostname -I`
- [ ] Health check works from phone: `http://[PI_IP]:8000/health`
- [ ] Frontend environment variable set to `http://[PI_IP]:8000`
- [ ] Full API request tested from phone

---

## API Endpoints Reference

Test these endpoints from your phone to verify everything works:

### Health Check
```bash
curl http://192.168.43.100:8000/health
```

### Generate Roast from Image
```bash
curl -X POST http://192.168.43.100:8000/roast/image \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "YOUR_BASE64_IMAGE_HERE"}'
```

### Generate Poem from Image
```bash
curl -X POST http://192.168.43.100:8000/poem/image \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "YOUR_BASE64_IMAGE_HERE"}'
```

### Match Image to Hamster
```bash
curl -X POST http://192.168.43.100:8000/image/match \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "YOUR_BASE64_IMAGE_HERE"}'
```

---

## Performance Notes

### Expected Performance on Raspberry Pi 5

- **First request:** 10-30 seconds (model loading)
- **Subsequent requests:** 3-10 seconds (depending on complexity)
- **Memory usage:** ~4-6GB with model loaded

### Optimization Recommendations

1. **Keep model loaded:** Set `OLLAMA_KEEP_ALIVE=24h` in Ollama service
2. **Warm up on boot:** Use the warm-up script from Step 10
3. **Use Pi 5 with 8GB RAM:** 4GB works but may swap
4. **Consider smaller model:** `gemma3:1b` for faster responses
5. **Monitor resources:** Use `htop` and `free -h` regularly

---

## Security Considerations

### For Production Use

This setup is designed for local network use (phone hotspot). For production:

1. **Add authentication:** Implement API key or JWT authentication
2. **Use HTTPS:** Set up reverse proxy with SSL certificate
3. **Restrict CORS:** Change from `Any` to specific origin
4. **Firewall rules:** Limit access to specific IP ranges
5. **Rate limiting:** Add rate limiting to prevent abuse

### For Hackathon/Demo Use

The current setup is fine for:
- Local development
- Demo presentations
- Hackathon projects
- Personal projects on trusted networks

---

## Advanced Configuration

### Custom Ollama Parameters

Edit the Ollama service to customize performance:

```bash
sudo nano /etc/systemd/system/ollama.service
```

Add environment variables:
```ini
[Service]
Environment=OLLAMA_KEEP_ALIVE=24h
Environment=OLLAMA_NUM_PARALLEL=2
Environment=OLLAMA_MAX_LOADED_MODELS=1
```

Restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama.service
```

### Enable Debug Logging

```bash
sudo nano /etc/systemd/system/hack-and-roll-backend.service
```

Change:
```ini
Environment=RUST_LOG=debug
```

Restart and view logs:
```bash
sudo systemctl restart hack-and-roll-backend.service
sudo journalctl -u hack-and-roll-backend.service -f
```

---

## Quick Reference

### Service Commands
```bash
# Check status
sudo systemctl status ollama.service
sudo systemctl status hack-and-roll-backend.service

# Restart
sudo systemctl restart ollama.service
sudo systemctl restart hack-and-roll-backend.service

# Stop
sudo systemctl stop hack-and-roll-backend.service

# View logs
sudo journalctl -u hack-and-roll-backend.service -f
```

### Network Commands
```bash
# Get IP
hostname -I

# Test local
curl http://localhost:8000/health

# Test network
curl http://$(hostname -I | awk '{print $1}'):8000/health

# Check ports
sudo netstat -tuln | grep 8000
```

### Update Workflow
```bash
# 1. Sync from dev machine
rsync -avz --exclude 'target' backend/ pi@raspberrypi.local:~/hack-and-roll-snap/backend/

# 2. Build on Pi
ssh pi@raspberrypi.local
cd ~/hack-and-roll-snap/backend
cargo build --release

# 3. Restart service
sudo systemctl restart hack-and-roll-backend.service

# 4. Verify
curl http://localhost:8000/health
```