#!/bin/bash

set -euo pipefail

for j in $1/*.json; do
    f=$(echo "$j" | sed 's/\.json//');
    echo "=============== $f ================";
    node src/index.js factory-rate --config $f.json\
	    | tee $f.gv;
    dot -Tpng -O $f.gv;
done
