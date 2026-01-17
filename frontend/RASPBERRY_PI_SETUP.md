# Raspberry Pi Deployment Guide (Pi 5 with labwc Kiosk)

## Prerequisites

On your Raspberry Pi, ensure you have:
- Raspberry Pi OS (with desktop environment)
- Node.js 18+ installed
- pnpm installed

### Install Node.js on Raspberry Pi
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install pnpm
```bash
npm install -g pnpm
```

### Install unclutter (for hiding mouse cursor)
```bash
sudo apt-get install -y unclutter
```

---

## Step 1: Transfer Project to Raspberry Pi

### Using rsync (Recommended)

From your Mac, run:
```bash
rsync -avz --exclude 'node_modules' --exclude '.next' \
  "/Users/sibato/Documents/hackathons/hack and roll/project/frontend/" \
  sibato@sibato.local:~/hack-and-roll-snap/
```

---

## Step 2: Build the Project on Raspberry Pi

SSH into the Raspberry Pi:
```bash
ssh sibato@sibato.local
cd ~/hack-and-roll-snap
pnpm install
pnpm build
```

---

## Step 3: Create systemd Service for Next.js

First, find where pnpm is installed:
```bash
which pnpm
```

Create a systemd service:
```bash
sudo nano /etc/systemd/system/nextjs-app.service
```

Add this content (adjust ExecStart path based on `which pnpm` output):
```ini
[Unit]
Description=Next.js Application
After=network.target

[Service]
Type=simple
User=sibato
WorkingDirectory=/home/sibato/hack-and-roll-snap
ExecStart=/home/sibato/.local/share/pnpm/pnpm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=PATH=/home/sibato/.local/share/pnpm:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable nextjs-app.service
sudo systemctl start nextjs-app.service
sudo systemctl status nextjs-app.service
```

**Verify it's working:**
```bash
curl http://localhost:3000
```

---

## Step 4: Configure Kiosk with labwc

### Why labwc?
labwc is the default Wayland compositor on Raspberry Pi OS. It works reliably with the Pi's GPU and provides a stable kiosk environment.

### Fix Keyring Password Prompt

Remove the keyring to prevent password prompts:
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

# Log file
LOG="/home/sibato/kiosk.log"
echo "$(date): Kiosk script started" > "$LOG"

# Wait for Next.js to be ready
echo "$(date): Waiting for Next.js..." >> "$LOG"
until curl -s http://localhost:3000 > /dev/null; do
    echo "$(date): Next.js not ready, waiting..." >> "$LOG"
    sleep 2
done
echo "$(date): Next.js is ready!" >> "$LOG"

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide cursor
unclutter -idle 0.1 -root &

# Remove Chromium crash warning
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences 2>/dev/null
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences 2>/dev/null

# Launch Chromium
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
  http://localhost:3000 >> "$LOG" 2>&1

echo "$(date): Chromium exited" >> "$LOG"
```

Make it executable:
```bash
chmod +x ~/start-kiosk.sh
```

### Configure labwc Autostart
```bash
mkdir -p ~/.config/labwc
nano ~/.config/labwc/autostart
```

Add this line:
```bash
# Launch kiosk
/home/sibato/start-kiosk.sh &
```

---

## Step 5: Configure Desktop Autologin
```bash
sudo raspi-config
```

Navigate to:
- **System Options** → **Boot / Auto Login** → **Desktop Autologin**

This ensures the system boots to the desktop environment (labwc), which then launches the kiosk script.

---

## Step 6: Hide Desktop Elements (Optional)

To minimize desktop visibility behind the kiosk:
```bash
sudo nano /etc/xdg/labwc/autostart
```

Comment out the panel and desktop manager:
```bash
#/usr/bin/lwrespawn /usr/bin/wf-panel-pi &
#/usr/bin/lwrespawn /usr/bin/pcmanfm --desktop --profile LXDE-pi &
/usr/bin/kanshi &
```

---

## Step 7: Disable Screen Blanking
```bash
sudo raspi-config
```

Navigate to:
- **Display Options** → **Screen Blanking** → **No**

---

## Step 8: Reboot and Test
```bash
sudo reboot
```

After reboot, the system should:
1. Auto-login to desktop
2. labwc starts
3. Kiosk script waits for Next.js server
4. Launch Chromium in fullscreen kiosk mode

---

## Useful Commands

### Check if Next.js is running
```bash
sudo systemctl status nextjs-app.service
curl http://localhost:3000
```

### View Kiosk Logs
```bash
cat ~/kiosk.log
```

### View Next.js Logs
```bash
sudo journalctl -u nextjs-app.service -f
```

### Restart Next.js server
```bash
sudo systemctl restart nextjs-app.service
```

### Manually restart kiosk (from SSH)
```bash
pkill chromium
DISPLAY=:0 ~/start-kiosk.sh &
```

### Update the App

From your Mac:
```bash
# Sync changes
rsync -avz --exclude 'node_modules' --exclude '.next' \
  "/Users/sibato/Documents/hackathons/hack and roll/project/frontend/" \
  sibato@sibato.local:~/hack-and-roll-snap/

# SSH and rebuild
ssh sibato@sibato.local
cd ~/hack-and-roll-snap
pnpm install
pnpm build
sudo systemctl restart nextjs-app.service

# Kiosk will auto-reload when server restarts
```

---

## Troubleshooting

### App not loading
```bash
# Check if Next.js service is running
sudo systemctl status nextjs-app.service

# Check if server responds
curl http://localhost:3000

# View Next.js service logs
sudo journalctl -u nextjs-app.service -n 50

# Check if pnpm is in PATH
which pnpm
```

### Kiosk not starting
```bash
# Check kiosk log
cat ~/kiosk.log

# Check if chromium is running
ps aux | grep chromium

# Check labwc autostart config
cat ~/.config/labwc/autostart

# Verify script is executable
ls -la ~/start-kiosk.sh
```

### Keyring password prompt appearing
```bash
# Remove keyring
rm -rf ~/.local/share/keyrings/*
mkdir -p ~/.local/share/keyrings
echo "Default" > ~/.local/share/keyrings/default

# Reboot
sudo reboot
```

### Screen goes blank
```bash
# Disable screen blanking via raspi-config
sudo raspi-config
# Display Options > Screen Blanking > No

# Check if xset commands are working
cat ~/kiosk.log
```

### GL/GPU errors in logs
This is normal. The `--disable-gpu` and `--use-gl=swiftshader` flags handle this by using software rendering instead of GPU acceleration.

### Next.js service fails to start
```bash
# Check service logs
sudo journalctl -u nextjs-app.service -xe

# Verify pnpm path
which pnpm

# Try starting manually
cd ~/hack-and-roll-snap
pnpm start
```

### Need to access desktop temporarily
```bash
# From SSH, kill chromium
pkill chromium

# The desktop will be visible underneath
# To restart kiosk:
DISPLAY=:0 ~/start-kiosk.sh &
```

---

## Architecture Notes

### How It Works
1. **Desktop Autologin**: System boots to desktop environment (labwc) as user `sibato`
2. **labwc Compositor**: Provides the Wayland display environment
3. **Autostart Script**: labwc runs `~/start-kiosk.sh` on startup
4. **Kiosk Script**: Waits for Next.js, then launches Chromium in kiosk mode
5. **Software Rendering**: Uses SwiftShader for GL rendering to avoid GPU issues

### Why labwc instead of Cage?
- **GPU Compatibility**: labwc works with Pi 5's GPU out of the box
- **Pre-installed**: Comes with Raspberry Pi OS
- **Proven**: This is the method that worked in previous setups
- **Flexible**: Can still access desktop if needed

---

## Quick Deployment Checklist

- [ ] Node.js and pnpm installed
- [ ] unclutter installed
- [ ] Project transferred and built
- [ ] Next.js systemd service created and enabled
- [ ] Next.js service is running: `sudo systemctl status nextjs-app.service`
- [ ] Server responds: `curl http://localhost:3000`
- [ ] Keyring removed/disabled
- [ ] Kiosk script created and executable
- [ ] labwc autostart configured
- [ ] Desktop autologin configured
- [ ] Screen blanking disabled via raspi-config
- [ ] Rebooted and verified kiosk displays

---

## Advanced Configuration

### Custom Chromium Flags

Edit the kiosk script to add more Chromium flags:
```bash
nano ~/start-kiosk.sh
```

Add flags to the `chromium-browser` command, for example:
```bash
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
  --disable-features=TranslateUI \
  --overscroll-history-navigation=0 \
  http://localhost:3000
```

### Remote Access

You can always SSH in for management:
```bash
ssh sibato@sibato.local
```

All commands work normally via SSH. The kiosk runs on the physical display while you manage via SSH.