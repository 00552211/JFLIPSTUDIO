#!/bin/bash
# CONNECTSTUDIO - install the Mac side (run once from this folder:  bash install-mac.sh)
#   - copies the scripts to ~/CONNECTSTUDIO/bin
#   - creates ~/Music/CONNECTSTUDIO/Recording
#   - registers a launchd job that runs the sync every 15 minutes
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
BIN="$HOME/CONNECTSTUDIO/bin"
PLIST="$HOME/Library/LaunchAgents/com.connectstudio.sync.plist"
LABEL="com.connectstudio.sync"

# ---- earlier install under the old studio name (JFLIPSTUDIO): stop it and move the folders over
if pgrep -f "Studio One|Fender Studio" >/dev/null 2>&1 && [ -d "$HOME/Music/JFLIPSTUDIO" ]; then
    echo "Studio One is open. Close it first (your recordings are moved to the new folder), then run this again."; exit 1
fi
launchctl bootout "gui/$(id -u)/com.jflipstudio.recsync" 2>/dev/null || true
rm -f "$HOME/Library/LaunchAgents/com.jflipstudio.recsync.plist"
if [ -d "$HOME/Music/JFLIPSTUDIO" ] && [ ! -e "$HOME/Music/CONNECTSTUDIO" ]; then
    mv "$HOME/Music/JFLIPSTUDIO" "$HOME/Music/CONNECTSTUDIO"
    echo "Moved ~/Music/JFLIPSTUDIO -> ~/Music/CONNECTSTUDIO (change Studio One's song location to the new folder)"
elif [ -d "$HOME/Music/JFLIPSTUDIO" ]; then
    echo "!! Both ~/Music/JFLIPSTUDIO and ~/Music/CONNECTSTUDIO exist. Nothing was moved."
    echo "!! Recordings in the old folder are NOT sent until you move them into ~/Music/CONNECTSTUDIO/Recording (ask the owner)."
fi
if [ -d "$HOME/JFLIPSTUDIO" ] && [ ! -e "$HOME/CONNECTSTUDIO" ]; then
    mv "$HOME/JFLIPSTUDIO" "$HOME/CONNECTSTUDIO"
    rm -f "$HOME/CONNECTSTUDIO/bin/jflip-recsync.sh" "$HOME/CONNECTSTUDIO/bin/jflip-done.sh" "$HOME/CONNECTSTUDIO/recsync.conf"
fi

mkdir -p "$BIN" "$HOME/CONNECTSTUDIO/logs" "$HOME/Music/CONNECTSTUDIO/Recording" "$HOME/Library/LaunchAgents"
cp "$HERE/connect-sync.sh" "$HERE/connect-done.sh" "$BIN/"
# server IP written by the server's "cs.ps1 mac-kit"
if [ -f "$HERE/recsync.conf" ] && [ ! -f "$HOME/CONNECTSTUDIO/recsync.conf" ]; then
    cp "$HERE/recsync.conf" "$HOME/CONNECTSTUDIO/recsync.conf"
fi
chmod +x "$BIN/"*.sh

[ -x /opt/homebrew/bin/rsync ] || [ -x /usr/local/bin/rsync ] || \
    echo "!! Homebrew rsync not found. Install it first:  brew install rsync"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>$LABEL</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$BIN/connect-sync.sh</string>
    </array>
    <key>StartInterval</key><integer>900</integer>
    <key>RunAtLoad</key><true/>
    <key>LowPriorityIO</key><true/>
    <key>Nice</key><integer>15</integer>
    <key>StandardOutPath</key><string>$HOME/CONNECTSTUDIO/logs/launchd.log</string>
    <key>StandardErrorPath</key><string>$HOME/CONNECTSTUDIO/logs/launchd.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Installed. Log: ~/CONNECTSTUDIO/logs/recsync.log"
echo "Stop:  launchctl bootout gui/\$(id -u)/$LABEL"
echo "Run now:  launchctl kickstart gui/\$(id -u)/$LABEL"
