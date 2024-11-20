### Round contract sources
https://github.com/hypnagonia/rounds-contracts

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
  "amount": "1000",
  "address": "0x1234abcd5678ef90",
  "channel": "example-channel",
  "roundInterval": "10m"
}'
```

## TODO

* Set fee to 2%
* Add admin only to claim fn
* Reward distribution scheduler

