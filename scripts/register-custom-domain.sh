#!/bin/bash
curl -sLv -X POST \
    -H 'Content-Type: application/json' \
    https://ic0.app/registrations \
    --data @- <<EOF
{
    "name": "site.metamob.app"
}
EOF