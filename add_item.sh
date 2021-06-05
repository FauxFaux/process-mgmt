#!/bin/bash

set -euo pipefail

FILE="$1"
FILE_TMP_BASE=".1.$(basename "$FILE")"
FILE_TMP_ADD=".2.$(basename "$FILE")"

cp "$FILE" "$FILE_TMP_BASE"

while true; do
    id=""
    name=""
    echo "Name"
    read name
    echo "id"
    read id

    if [ -z "$id" -o -z "$name" ]; then
        echo "exiting"
        mv "$FILE_TMP_BASE" "$FILE"
        exit
    fi

    jq -r \
        '.items += [{ "id": "'"$id"'", "i18n": { "en": "'"$name"'"  } }]'\
        "$FILE_TMP_BASE" > "$FILE_TMP_ADD"

    mv "$FILE_TMP_ADD" "$FILE_TMP_BASE"
done
