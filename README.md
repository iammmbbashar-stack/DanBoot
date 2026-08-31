# DanBoot - Telegram Prediction Bot

Live soccer match prediction bot for Telegram. Scans matches and predicts Over/Under goals.

## Setup

```bash
npm install
```

## Environment

Create `.env`:
```
TELEGRAM_TOKEN=8726410439:AAFWAcfZj0lBegpirUWU1RduCbWOLn5EIGQ
CHAT_ID=7200809630
INFORADAR_BASE_URL=https://inforadar.live/api/v1
PREDICTION_INTERVAL=300000
LOG_LEVEL=info
```

## Run

```bash
npm run dev      # Development (ts-node)
npm run build    # Build
npm start        # Production
```

## Features

- ✅ Scans live matches every 5 minutes
- ✅ Analyzes Over/Under odds trends
- ✅ Rate-limited API calls
- ✅ Error handling & retry logic
- ✅ Telegram notifications
- ✅ Confidence scoring
