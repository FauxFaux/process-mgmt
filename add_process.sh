#!/bin/bash

set -euo pipefail

SCRIPT_DIR=$(dirname "$0")

FILE="$1"
FILE_TMP_BASE=".1.$(basename "$FILE")"
FILE_TMP_ADD=".2.$(basename "$FILE")"

cp "$FILE" "$FILE_TMP_BASE"

function read_var() {
    local var_name="$1"
    v=""
    echo "$var_name" >&2
    read v
    echo "$v"
}

function test_item_exists() {
    local item="$1"
    jq -r '.items | map(select(.id == "'$item'"))[0].id' "$FILE_TMP_BASE"
}

function read_io() {
    local name="$1"
    io=""
    echo "== $name ==" >&2
    while true; do
        i_id="$(read_var "-- id --")"
        if [ -z "$i_id" ]; then
            echo "$io";
            return 0
        fi
        if [ "$i_id" != "$(test_item_exists "$i_id")" ]; then
            echo "Adding missing item: $i_id" >&2
            $SCRIPT_DIR/add_item.sh "$FILE_TMP_BASE" "$i_id"
        fi
        i_q="$(read_var "-- quantity --")"
        if [ -n "$io" ]; then io="$io,"; fi
        io="$io \"$i_id\": $i_q"
    done
}

while true; do
    id="$(read_var "process id")"

    if [ -z "$id" ]; then
        echo "exiting"
        jq '.items |= sort_by(.id)' $FILE_TMP_BASE > $FILE_TMP_ADD
        mv $FILE_TMP_ADD $FILE_TMP_BASE
        jq '.processes |= sort_by(.name)' $FILE_TMP_BASE > $FILE_TMP_ADD
        mv $FILE_TMP_ADD $FILE_TMP_BASE
        mv "$FILE_TMP_BASE" "$FILE"
        exit
    fi

    duration="$(read_var "process duration")"
    factory_group="$(read_var "process factory_group")"

    inputs="$(read_io "inputs")"
    outputs="$(read_io "outputs")"

    echo "$inputs"
    echo "$outputs"

    proc=""
    proc="$proc \"name\": \"$id\","
    proc="$proc \"duration\": \"$duration\","
    proc="$proc \"factory_group\": \"$factory_group\","
    proc="$proc \"inputs\": {$inputs},"
    proc="$proc \"outputs\": {$outputs}"
    echo "$proc"

    jq -r \
        '.processes += [{ '"$proc"' }]'\
        "$FILE_TMP_BASE" > "$FILE_TMP_ADD"

    mv "$FILE_TMP_ADD" "$FILE_TMP_BASE"
done
