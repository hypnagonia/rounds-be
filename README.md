### Round contract sources
https://github.com/hypnagonia/rounds-contracts

### Live
https://reward-backend.k3l.io/rounds?page=1&limit=5

### 
```bash
cp .env.example .env
yarn start
```

## API

```bash
curl "http://localhost:3009/rounds?page=1&limit=100"
```

channelId: "music"
dateRange: Object { from: "2024-12-22T18:30:00.000Z", to: "2024-12-26T18:30:00.000Z" }
distributionType: "recurring"
eligibleUsersCount: 21
frequencyDays: 2
recipientPercentage: 10
tokenAddress: "0x0000000000000000000000000000000000000000"
tokenAmount: 100


```bash
curl -X POST http://localhost:3009/rounds \
-H "Content-Type: application/json" \
-d '{
  "tokenAmount": "0.01",
  "tokenAddress": "0x0000000000000000000000000000000000000000",
  "channelId": "music",
  "frequencyDays": "10m",
  "eligibleUsersCount": 10
}'
```


curl -X POST https://reward-backend.k3l.io/rounds \
-H "Content-Type: application/json" \
-d '{
  "tokenAmount": "0.01",
  "tokenAddress": "0x0000000000000000000000000000000000000000",
  "channelId": "music",
  "frequencyDays": "10m",
  "eligibleUsersCount": 10
}'

curl -X POST http://localhost:3009/rounds \
-H "Content-Type: application/json" \
-d '{
  "tokenAmount": "0.0001",
  "tokenAddress": "0x0000000000000000000000000000000000000000",
  "channelId": "founders",
  "frequencyDays": "10m",
  "eligibleUsersCount": 4,
  "orderUsersBy": "total_points",
  "excludedUsersFID": [3]
}'

https://reward-backend.k3l.io/rounds?page=1&limit=5

```bash
curl -X 'POST' \
  'https://graph.cast.k3l.io/metadata/addresses/fids?verified_only=true' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '[
3115
]'
```

## TODO

* Set fee to 2%
* Add admin only to claim fn
* Reward distribution scheduler


get address by fid
https://docs.neynar.com/reference/fetch-bulk-users


curl -X POST http://localhost:3009/rounds \
-H "Content-Type: application/json" \
-d '{
  "tokenAmount": "0.0001",
  "tokenAddress": "0x0000000000000000000000000000000000000000",
  "stpContract": "0x1cff5c9fb2a5fba6951d148c5d46d1272a2763ee",
  "channelId": "memes",
  "frequencyDays": "10m",
  "eligibleUsersCount": 10,
  "orderUsersBy": "total_points",
  "excludedUsersFID": [3]
}'


curl -X POST http://localhost:3009/rounds \
-H "Content-Type: application/json" \
-d '
{"message":"{\"stpContract\":\"\",\"tokenAddress\":\"0x0000000000000000000000000000000000000000\",\"tokenAmount\":\"1\",\"recipientPercentage\":1,\"distributionType\":\"one-time\",\"frequencyDays\":\"0\",\"dateRange\":{\"from\":\"2024-12-18T18:50:53.791Z\",\"to\":\"2025-01-07T18:50:53.791Z\"},\"channelId\":\"cryptosapiens\",\"eligibleUsersCount\":1,\"excludedUsersFID\":[],\"orderUsersBy\":\"total_points\",\"signature\":\"\",\"timestamp\":1734547859516}","signature":"0xb8e4dcbada59940253a8ae52c04e4c1fe3a39a43b9af02464df33a8a41ee46d72be28c9a6cd88cae9fcbeeaf410428fa4011245c6ce8239f9d3b6f1f773430cc1c"}
'
