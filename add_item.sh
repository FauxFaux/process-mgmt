#!/bin/bash

set -euo pipefail

FILE="$1"
FILE_TMP_BASE=".1.$(basename "$FILE")"
FILE_TMP_ADD=".2.$(basename "$FILE")"

cp "$FILE" "$FILE_TMP_BASE"

function generate_id_from_name() {
    echo "$1" | tr A-Z a-z | sed 's/[^a-z0-9]/_/g'
}

function generate_name_from_id() {
    echo "$1" | sed -e 's/_/ /g;s/\b\(.\)/\u\1/g'
}

function add_item_to_file() {
    local file="$1"
    local file_tmp="$2"
    local id="$3"
    local name="$4"

    jq -r \
        '.items += [{ "id": "'"$id"'", "i18n": { "en": "'"$name"'"  } }]'\
        "$file" > "$file_tmp"

    mv "$file_tmp" "$file"
}

id="${2:-}"
name="${3:-}"

if [ -n "$id" ]; then
    if [ -z "$name" ]; then
        name="$(generate_name_from_id "$id")"
    fi
    add_item_to_file "$FILE_TMP_BASE" "$FILE_TMP_ADD" "$id" "$name"
    mv "$FILE_TMP_BASE" "$FILE"
    exit
fi

while true; do
    id=""
    name=""
    echo "Name"
    read name
    echo "id"
    read id

    if [ -z "$id" ]; then
        id="$(generate_id_from_name "$name")"
    fi

    if [ -z "$name" ]; then
        echo "exiting"
        mv "$FILE_TMP_BASE" "$FILE"
        exit
    fi

    add_item_to_file "$FILE_TMP_BASE" "$FILE_TMP_ADD" "$id" "$name"
done
