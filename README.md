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

```bash
curl -X POST http://localhost:3009/rounds \
-H "Content-Type: application/json" \
-d '{
  "amount": "1",
  "assetAddress": "0x0000000000000000000000000000000000000000",
  "channel": "music",
  "roundInterval": "10m",
  "topUserCount": 10
}'
```

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



