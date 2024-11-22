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



