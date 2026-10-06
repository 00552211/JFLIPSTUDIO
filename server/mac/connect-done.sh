#!/bin/bash
# CONNECTSTUDIO - mark project folders as finished (creates an empty _DONE file in each).
# The next sync sends _DONE to the server; the server archives the project overnight.
#   connect-done.sh ~/Music/CONNECTSTUDIO/Recording/TI_xxx/260924_1 [more folders...]
# To reopen a project later: delete its _DONE file and keep working.
for d in "$@"; do
    if [ -d "$d" ]; then
        touch "$d/_DONE" && echo "marked done: $d"
    else
        echo "not a folder: $d" >&2
    fi
done
