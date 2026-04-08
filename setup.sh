#!/bin/bash
curl -i -X POST http://localhost/api/v1/auth/setup \
-H 'Content-Type: application/json' \
-d @setup.json
