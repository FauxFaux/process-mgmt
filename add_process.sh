#!/bin/bash

set -euo pipefail

FILE="$1"
FILE_TMP_BASE=".1.$FILE"
FILE_TMP_ADD=".2.$FILE"

cp "$FILE" "$FILE_TMP_BASE"

function read_var() {
    local var_name="$1"
    v=""
    echo "$var_name" >&2
    read v
    echo "$v"
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
        i_q="$(read_var "-- quantity --")"
        if [ -n "$io" ]; then io="$io,"; fi
        io="$io \"$i_id\": $i_q"
    done
}

while true; do
    id="$(read_var "process id")"

    if [ -z "$id" ]; then
        echo "exiting"
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
