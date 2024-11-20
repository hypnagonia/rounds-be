curl "http://localhost:3009/rounds?page=2&limit=5"

curl -X POST http://localhost:3009/rounds \
-H "Content-Type: application/json" \
-d '{
  "amount": "1000",
  "address": "0x1234abcd5678ef90",
  "channel": "example-channel",
  "roundInterval": "10m"
}'