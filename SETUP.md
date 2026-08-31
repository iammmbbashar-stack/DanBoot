# Setup & Run Guide

## Installation

```bash
cd telegram-prediction-bot
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Add your credentials:
```bash
TELEGRAM_TOKEN=8726410439:AAFWAcfZj0lBegpirUWU1RduCbWOLn5EIGQ
CHAT_ID=7200809630
```

## Development

```bash
npm run dev
```

This runs with hot-reload via `ts-node`. Logs will show:
- API calls with rate limiting
- Match scanning progress
- Predictions generated

## Production

```bash
npm run build
npm start
```

Or use PM2/Docker for deployment.

## How It Works

1. **Scan** – Every 5 minutes (configurable), fetches live soccer matches
2. **Analyze** – Calculates Over/Under odds trends for each match
3. **Score** – Ranks predictions by confidence (0-100)
4. **Filter** – Only sends top 5 predictions with 50%+ confidence
5. **Send** – Posts formatted message to Telegram chat

### Prediction Scoring

Each prediction scores on:
- **Odds values** – Lower odds = more likely
- **Trend direction** – Rising/falling odds indicate market shifts
- **Volatility** – Stable odds = more confident prediction
- **Match timing** – More data available as match progresses

### Confidence Threshold

Predictions below 50% confidence are filtered out. Adjust in `filterBestPredictions()`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TELEGRAM_TOKEN` | - | Bot token from BotFather |
| `CHAT_ID` | - | Telegram chat/user ID |
| `INFORADAR_BASE_URL` | `https://inforadar.live/api/v1` | API endpoint |
| `PREDICTION_INTERVAL` | `300000` | Scan interval (ms) |
| `LOG_LEVEL` | `info` | Logging level |
| `NODE_ENV` | `development` | Environment |

## Telegram Commands

Once bot is running:
- `/scan` – Force scan now
- `/stop` – Stop periodic scanning
- `/status` – Show bot status

## Error Handling

- ✅ Rate limiting – Auto-queues API calls
- ✅ Retries – Exponential backoff on failures
- ✅ Network errors – Auto-retry with delays
- ✅ Auth errors – Logged, not retried
- ✅ Timeouts – 10s timeout per API call

## Troubleshooting

**Bot not sending messages:**
- Check TELEGRAM_TOKEN is correct
- Verify CHAT_ID is your actual ID (not group name)
- Ensure bot has permission to send messages

**No predictions generated:**
- Check API response parsing matches actual inforadar format
- Verify odds history has 3+ snapshots
- Check confidence threshold isn't too high

**Rate limit errors:**
- Already handled automatically
- Check logs for retry attempts
- API calls are queued with 100ms minimum spacing

## Next Steps

1. Test with `/scan` command manually
2. Adjust prediction scoring weights in `analyzer.ts`
3. Configure confidence thresholds
4. Deploy to production server
