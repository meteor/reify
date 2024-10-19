#!/usr/bin/env bash

set -e
set -u

cd $(dirname "$0")
TEST_DIR=$(pwd)

# Make Node complain about deprecations more loudly.
export NODE_PENDING_DEPRECATION=1
export NODE_OPTIONS="--trace-warnings"

MOCHA_GREP=${MOCHA_GREP:-""}

cd "$TEST_DIR"
parsers=("babel" "acorn")
tlaModes=('false' 'true')

for parser in ${parsers[@]}; do
    for tla in ${tlaModes[@]}; do
        rm -rf .cache
        export REIFY_PARSER="$parser"
        export REIFY_TLA="$tla"

        mocha \
            --require "../node" \
            --reporter spec \
            --full-trace \
            --grep "$MOCHA_GREP" \
            run.js
    done
done

# Run tests again using test/.cache.
mocha \
    --require "../node" \
    --reporter spec \
    --full-trace \
    --grep "$MOCHA_GREP" \
    run.js
