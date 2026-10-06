#!/bin/bash
# JFLIPSTUDIO - install the Mac side (run once from this folder:  bash install-mac.sh)
#   - copies the scripts to ~/JFLIPSTUDIO/bin
#   - creates ~/Music/JFLIPSTUDIO/Recording
#   - registers a launchd job that runs the sync every 15 minutes
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
BIN="$HOME/JFLIPSTUDIO/bin"
PLIST="$HOME/Library/LaunchAgents/com.jflipstudio.recsync.plist"
LABEL="com.jflipstudio.recsync"

mkdir -p "$BIN" "$HOME/JFLIPSTUDIO/logs" "$HOME/Music/JFLIPSTUDIO/Recording" "$HOME/Library/LaunchAgents"
cp "$HERE/jflip-recsync.sh" "$HERE/jflip-done.sh" "$BIN/"
# server IP written by the server's "jf.ps1 mac-kit"
if [ -f "$HERE/recsync.conf" ] && [ ! -f "$HOME/JFLIPSTUDIO/recsync.conf" ]; then
    cp "$HERE/recsync.conf" "$HOME/JFLIPSTUDIO/recsync.conf"
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
        <string>$BIN/jflip-recsync.sh</string>
    </array>
    <key>StartInterval</key><integer>900</integer>
    <key>RunAtLoad</key><true/>
    <key>LowPriorityIO</key><true/>
    <key>Nice</key><integer>15</integer>
    <key>StandardOutPath</key><string>$HOME/JFLIPSTUDIO/logs/launchd.log</string>
    <key>StandardErrorPath</key><string>$HOME/JFLIPSTUDIO/logs/launchd.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Installed. Log: ~/JFLIPSTUDIO/logs/recsync.log"
echo "Stop:  launchctl bootout gui/\$(id -u)/$LABEL"
echo "Run now:  launchctl kickstart gui/\$(id -u)/$LABEL"
