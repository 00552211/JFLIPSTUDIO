#!/bin/bash
# JFLIPSTUDIO - Mac -> Windows REC sync (run by launchd every 15 min, or by hand).
#
# Safety rules (the Mac recording always comes first):
#   - copy only: this script never deletes or changes anything on the Mac
#   - while a DAW is running: only Mixdown/ folders are sent (no session/audio traffic during REC)
#   - files modified in the last $SETTLE_MIN minutes are skipped (still being written)
#   - runs at background I/O priority
#   - projects already archived on the server (_system/archived.txt) are not re-sent
#     as long as the Mac copy is identical to the archive; if anything changed, they are sent again
#   - archived + identical projects are listed in ~/Music/JFLIPSTUDIO/_SAFE_TO_DELETE.txt
#
# Settings: edit below, or put overrides in ~/JFLIPSTUDIO/recsync.conf

SERVER="192.168.1.50"          # Windows server IP (reserve it in the router)
SHARE="JFLIPSTUDIO"
ARCH_SHARE="JFLIP_ARCHIVE"
SMB_USER="jflipnas"
SRC="$HOME/Music/JFLIPSTUDIO/Recording"
DEST_SUBDIR="Work/Recording"
SETTLE_MIN=2
DAW_REGEX="Studio One|Fender Studio|Logic Pro|Pro Tools|Ableton Live|Cubase"
MIXDOWN_WHILE_DAW=1            # 1 = still send Mixdown/ while the DAW is open
STORE=""                       # "" = main store. Other stores (e.g. HN): project names must contain _HN<number>
STATE_DIR="$HOME/JFLIPSTUDIO"
[ -f "$STATE_DIR/recsync.conf" ] && . "$STATE_DIR/recsync.conf"

LOG="$STATE_DIR/logs/recsync.log"
REPORT="$HOME/Music/JFLIPSTUDIO/_SAFE_TO_DELETE.txt"
mkdir -p "$STATE_DIR/logs"
log() { echo "$(date '+%Y-%m-%d %H:%M:%S')  $*" >> "$LOG"; [ -t 1 ] && echo "$*"; }

# ---- single instance
LOCK="/tmp/jflip-recsync.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
    if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +360 2>/dev/null)" ]; then rm -rf "$LOCK"; mkdir "$LOCK" || exit 0
    else exit 0; fi
fi
TMP="$(mktemp -d /tmp/jflip-recsync.XXXXXX)"
trap 'rm -rf "$LOCK" "$TMP"' EXIT

[ -d "$SRC" ] || { log "source not found: $SRC"; exit 1; }

# ---- rsync binary (Homebrew rsync 3.x preferred)
RSYNC=/opt/homebrew/bin/rsync   # brew install rsync
[ -x "$RSYNC" ] || RSYNC=/usr/local/bin/rsync
[ -x "$RSYNC" ] || RSYNC=/usr/bin/rsync

MW=()
"$RSYNC" --version 2>/dev/null | grep -q 'version 3' && MW=(--modify-window=2)

# ---- mount shares if needed (password comes from the Keychain)
find_mount() { mount | sed -n "s#^//[^ ]*@$SERVER/$1 on \(.*\) (smbfs.*#\1#p" | head -n 1; }
mount_share() {
    local m; m="$(find_mount "$1")"
    if [ -z "$m" ]; then
        osascript -e "mount volume \"smb://$SMB_USER@$SERVER/$1\"" >/dev/null 2>&1
        m="$(find_mount "$1")"
    fi
    echo "$m"
}
if [ -z "$(find_mount "$SHARE")" ] && ! ping -c 1 -t 2 "$SERVER" >/dev/null 2>&1; then
    log "server $SERVER not reachable - skip"; exit 0
fi
MNT="$(mount_share "$SHARE")"
[ -n "$MNT" ] || { log "could not mount smb://$SERVER/$SHARE - skip"; exit 0; }
AMNT="$(mount_share "$ARCH_SHARE")"   # read-only archive, used to verify archived projects
DEST="$MNT/$DEST_SUBDIR"
mkdir -p "$DEST" || { log "cannot write to $DEST"; exit 1; }

# ---- exclude list
EXCL="$TMP/exclude.txt"
esc() { sed 's/[][*?\\]/\\&/g'; }   # make a literal path safe as an rsync pattern
nfc() { iconv -f UTF-8-MAC -t UTF-8 2>/dev/null; }   # Mac (NFD) names -> NFC for comparing

# files still being written
( cd "$SRC" && find . -type f -mmin "-$SETTLE_MIN" | sed 's#^\./#/#' | esc ) >> "$EXCL"

# other stores: projects without the store code in their name are held back, so a
# 260924_1 recorded here can never mix with 260924_1 from the main store on the server
NAMECHECK="$HOME/Music/JFLIPSTUDIO/_NAME_CHECK.txt"
if [ -n "$STORE" ]; then
    : > "$TMP/badnames.txt"
    for proj in "$SRC"/*/*/; do
        [ -d "$proj" ] || continue
        rel="${proj#$SRC/}"; rel="${rel%/}"
        case "$(basename "$rel")" in
            *_"$STORE"[0-9]*) ;;
            *) printf '/%s/\n' "$rel" | esc >> "$EXCL"; echo "$rel" >> "$TMP/badnames.txt" ;;
        esac
    done
    if [ -s "$TMP/badnames.txt" ]; then
        {
            echo "# These projects are NOT being sent to the server: the name must contain _${STORE} + number"
            echo "# (e.g. 260924_${STORE}1). Rename the project folder, then they are sent automatically."
            cat "$TMP/badnames.txt"
        } > "$NAMECHECK"
        log "NAME CHECK: $(wc -l < "$TMP/badnames.txt" | tr -d ' ') project(s) held back - see $NAMECHECK"
    else
        rm -f "$NAMECHECK"
    fi
fi

# archived projects: skip them only if this Mac copy is identical to the server archive
ARCHIVED="$MNT/_system/archived.txt"
: > "$TMP/safe.txt"
if [ -f "$ARCHIVED" ]; then
    cut -f1 "$ARCHIVED" | nfc | sort -u > "$TMP/archived.txt"
    for proj in "$SRC"/*/*/; do
        [ -d "$proj" ] || continue
        rel="${proj#$SRC/}"; rel="${rel%/}"
        relnfc="$(printf '%s' "$rel" | nfc)"
        grep -qxF "$relnfc" "$TMP/archived.txt" || continue
        if [ -n "$AMNT" ] && [ -d "$AMNT/Recording/$rel" ]; then
            # dry run: list files that differ from the archive (size/time); directories ignored
            if "$RSYNC" -rtn "${MW[@]}" --out-format='%n' --exclude='.*' \
                   "$proj" "$AMNT/Recording/$rel/" > "$TMP/diff.txt" 2>/dev/null \
               && [ -z "$(grep -v '/$' "$TMP/diff.txt" | head -n 1)" ]; then
                printf '/%s/\n' "$rel" | esc >> "$EXCL"
                echo "$proj" >> "$TMP/safe.txt"
            else
                log "NOTE $rel: archived, but this Mac has changes - sending it again (add _DONE again when finished)"
            fi
        elif [ -f "$proj/_DONE" ] && [ -z "$(find "$proj" -type f -newer "$proj/_DONE" ! -name '.DS_Store' | head -n 1)" ]; then
            printf '/%s/\n' "$rel" | esc >> "$EXCL"   # archive share not reachable: trust _DONE, but do not list as safe
        else
            log "NOTE $rel: archived, changed after _DONE - sending it again"
        fi
    done
fi
{
    echo "# Projects whose Mac copy is identical to the server archive (HDD + Dropbox verified)."
    echo "# Safe to delete from this Mac when you need space. Updated $(date '+%Y-%m-%d %H:%M')"
    cat "$TMP/safe.txt"
} > "$REPORT"

# ---- what to send
FILTER=()
if pgrep -f "$DAW_REGEX" >/dev/null 2>&1; then
    [ "$MIXDOWN_WHILE_DAW" = "1" ] || { log "DAW running - skip"; exit 0; }
    MODE="mixdown-only (DAW running)"
    FILTER=(--include='/*/' --include='/*/*/' --include='/*/*/Mixdown/***' --exclude='*' --prune-empty-dirs)
else
    MODE="full"
fi

OPTS=(-rt "${MW[@]}" --exclude='.*' --exclude-from="$EXCL")

log "sync start ($MODE) -> $DEST"
taskpolicy -b nice -n 15 "$RSYNC" "${OPTS[@]}" "${FILTER[@]}" "$SRC/" "$DEST/" >> "$LOG" 2>&1
rc=$?
if [ $rc -eq 0 ]; then
    log "sync OK ($MODE)"
    echo "$(date '+%Y-%m-%dT%H:%M:%S') $MODE $(scutil --get ComputerName 2>/dev/null)" > "$MNT/_system/mac-last-sync${STORE:+-$STORE}.txt" 2>/dev/null
    [ "$MODE" = "full" ] && date '+%Y-%m-%d %H:%M:%S' > "$STATE_DIR/last-full-sync.txt"
else
    log "sync FAILED rc=$rc ($MODE)"
fi
exit $rc
