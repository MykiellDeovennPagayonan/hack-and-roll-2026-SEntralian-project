# Raspberry Pi Kiosk Deployment Guide (Pi 5 with labwc)

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

---

## Step 1: Transfer Project to Raspberry Pi

### Using rsync (Recommended)

From your Mac, run:
```bash
rsync -avz --exclude 'node_modules' --exclude '.next' \
  "/Users/sibato/Documents/hackathons/hack and roll/project/frontend/" \
  pi@raspberrypi.local:~/kiosk-app/
```

Replace `pi@raspberrypi.local` with your Raspberry Pi's username and hostname.

---

## Step 2: Build the Project on Raspberry Pi

SSH into the Raspberry Pi:
```bash
ssh pi@raspberrypi.local
cd ~/kiosk-app
pnpm install
pnpm build
```

---

## Step 3: Create systemd Service for Next.js

Create a systemd service to auto-start your Next.js app:
```bash
sudo nano /etc/systemd/system/kiosk-app.service
```

Add this content (adjust User and WorkingDirectory as needed):
```ini
[Unit]
Description=Kiosk Application
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/kiosk-app
ExecStart=/usr/bin/pnpm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable kiosk-app.service
sudo systemctl start kiosk-app.service
sudo systemctl status kiosk-app.service
```

---

## Step 4: Set Up Kiosk Mode for labwc (Pi 5)

### Install Chromium if not already installed
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

### Create Kiosk Script
```bash
nano ~/kiosk.sh
```

Add this content:
```bash
#!/bin/bash

# Log file for debugging
LOG="$HOME/kiosk.log"
echo "$(date): Kiosk script started" > "$LOG"

# Wait for Next.js server to be ready
echo "$(date): Waiting for Next.js server..." >> "$LOG"
until curl -s http://localhost:3000 > /dev/null; do
    echo "$(date): Server not ready, waiting..." >> "$LOG"
    sleep 2
done
echo "$(date): Server is ready!" >> "$LOG"

# Remove Chromium crash warning
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
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --incognito \
  http://localhost:3000 >> "$LOG" 2>&1

echo "$(date): Chromium exited" >> "$LOG"
```

Make it executable:
```bash
chmod +x ~/kiosk.sh
```

### Configure labwc Autostart (FOR PI 5)
```bash
mkdir -p ~/.config/labwc
nano ~/.config/labwc/autostart
```

Add this content:
```bash
# Launch kiosk
/home/pi/kiosk.sh &
```

### Optional: Hide Desktop Elements

To minimize desktop visibility before kiosk starts:
```bash
sudo nano /etc/xdg/labwc/autostart
```

Comment out these lines:
```bash
#/usr/bin/lwrespawn /usr/bin/wf-panel-pi &
#/usr/bin/lwrespawn /usr/bin/pcmanfm --desktop --profile LXDE-pi &
/usr/bin/kanshi &
```

---

## Step 5: Disable Screen Blanking (Optional)

To prevent the screen from going blank:
```bash
sudo nano /etc/xdg/labwc/environment
```

Add:
```
WAYLAND_DISPLAY=wayland-1
```

Or use raspi-config:
```bash
sudo raspi-config
# Navigate to: Display Options > Screen Blanking > Disable
```

---

## Step 6: Reboot and Test
```bash
sudo reboot
```

After reboot, check the log:
```bash
cat ~/kiosk.log
```

---

## Useful Commands

### Check if Next.js is running
```bash
sudo systemctl status kiosk-app.service
curl http://localhost:3000
```

### Stop Kiosk Mode (via SSH)
```bash
ssh pi@raspberrypi.local
pkill chromium
```

### Restart Next.js server
```bash
sudo systemctl restart kiosk-app.service
```

### View Next.js Logs
```bash
sudo journalctl -u kiosk-app.service -f
```

### View Kiosk Logs
```bash
cat ~/kiosk.log
```

### Update the App

From your Mac:
```bash
# Sync changes
rsync -avz --exclude 'node_modules' --exclude '.next' \
  "/Users/sibato/Documents/hackathons/hack and roll/project/frontend/" \
  pi@raspberrypi.local:~/kiosk-app/

# SSH and rebuild
ssh pi@raspberrypi.local
cd ~/kiosk-app
pnpm install
pnpm build
sudo systemctl restart kiosk-app.service
```

---

## Troubleshooting

### App not loading
```bash
# Check if service is running
sudo systemctl status kiosk-app.service

# Check if server responds
curl http://localhost:3000

# View service logs
sudo journalctl -u kiosk-app.service -n 50
```

### Kiosk not starting
```bash
# Check kiosk log
cat ~/kiosk.log

# Check labwc config
cat ~/.config/labwc/autostart

# Test script manually from desktop terminal
~/kiosk.sh
```

### Need to exit kiosk temporarily
- Press `Alt + F4` to close Chromium
- Or SSH in and run: `pkill chromium`

### Touch Screen Calibration
If using a touch screen:
```bash
sudo apt-get install xinput-calibrator
# Run calibration
xinput_calibrator
```
