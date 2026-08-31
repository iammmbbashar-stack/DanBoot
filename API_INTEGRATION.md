# API Integration Guide

## InfoRadar.live Endpoints

Your DanBoot bot integrates with these InfoRadar.live API endpoints:

### 1. Live Games (Sport-Agnostic)
```
GET /api/v1/live_games?sport_id=1&page=1&per_page=100
```

**Parameters:**
- `sport_id=1` → Football/Soccer
- `page` → Pagination
- `per_page` → Results per page

**Expected Response:**
```json
[
  {
    "event_id": 12205297,
    "home_team": "Deportivo Capiata",
    "away_team": "Guairena FC",
    "league": "Paraguay Division Intermedia",
    "score": "0-0",
    "minute": 45,
    "status": "live"
  }
]
```

### 2. Finished Games (Sport-Agnostic)
```
GET /api/v1/finished_games?sport_id=1&page=1&per_page=50
```

**Returns:** Completed matches with final scores

### 3. Match Detail + Events
```
GET /api/v1/soccer/game/view?event_id=12205297
```

**Returns:**
- Match details
- Live events (goals, cards, etc.)
- Current score
- Match status

### 4. Odds History (6 Markets)
```
GET /api/v1/soccer/game/odds?event_id=12205297&odds_market=8,5,6,1,2,3
```

**Market IDs:**
- `1` → 1X2 (Win/Draw/Loss)
- `2` → Asian Handicap
- `3` → Total Goals (Over/Under) ← **Bot uses this**
- `5` → Half-time/Full-time
- `6` → Both teams to score
- `8` → Correct score

**Expected Response:**
```json
[
  {
    "game_time": 45,
    "score": "0-0",
    "over": 2.05,
    "under": 1.75,
    "total": 2.5,
    "timestamp": "2026-08-31T23:13:00Z"
  }
]
```

---

## Bot Implementation

### What the Bot Does

1. **Every 5 minutes:**
   - Calls `/live_games` to fetch active matches
   - For each match, calls `/soccer/game/odds` with `odds_market=3` (Total Goals)

2. **Analyzes Over/Under:**
   - Trend direction (rising/falling odds)
   - Volatility (confidence in prediction)
   - Bookmaker bias (which side favors Over/Under)
   - Match progression (minute played)

3. **Scores predictions:**
   - 0-100 confidence scale
   - Filters for 50%+ confidence
   - Returns top 5 best predictions

4. **Sends to Telegram:**
   - Formatted message with match, prediction, odds, reasoning

### API Response Parsing

**File:** `src/api/inforadar.ts`

The bot parses:
- `home_team` → Team name
- `away_team` → Team name
- `score` → Current score
- `minute` → Match time
- `game_time` → Minute in odds history
- `over`/`under` → Odds values
- `timestamp` → When odds were captured

---

## Testing

### Mock Data

When API is unavailable, bot uses mock data from `src/api/mockData.ts`:

```typescript
{
  eventId: 12205297,
  homeTeam: 'Deportivo Capiata',
  awayTeam: 'Guairena FC',
  league: 'Paraguay Division Intermedia',
  currentScore: '0-0',
  minute: 45,
  oddsHistory: [
    { gameTime: 0, score: '0-0', over: 1.8, under: 1.95, ... },
    { gameTime: 45, score: '0-0', over: 2.05, under: 1.75, ... }
  ]
}
```

### Test Locally

```bash
npm run dev
```

Bot will automatically use mock data if API fails, allowing you to see predictions without network access.

---

## Troubleshooting

### API Not Responding

**Symptoms:**
- No predictions generated
- "No live matches found" in logs

**Solutions:**
1. Check if inforadar.live is online
2. Verify API URL in `.env`: `INFORADAR_BASE_URL=https://inforadar.live/api/v1`
3. Check firewall/proxy (Railway might have network restrictions)
4. Bot automatically falls back to mock data for testing

### Odds History Too Short

**Symptoms:**
- Low number of predictions despite live matches

**Fix:**
- Need 3+ odds snapshots per match
- Early in match = fewer datapoints
- Bot requires enough history for trend analysis

### Rate Limiting

**Symptoms:**
- 429 errors in logs
- Predictions delayed

**Already Handled:**
- Bottleneck queues calls (3 concurrent max)
- 100ms minimum spacing between calls
- Exponential backoff on failure

---

## API Endpoint Status

| Endpoint | Status | Used By |
|----------|--------|---------|
| `/live_games` | ✅ Implemented | Fetch active matches |
| `/finished_games` | ✅ Implemented | Optional: past results |
| `/soccer/game/view` | ✅ Implemented | Optional: detailed events |
| `/soccer/game/odds` | ✅ Implemented | Core: Over/Under analysis |

---

## Next Steps

1. **Verify API Access:**
   ```bash
   curl https://inforadar.live/api/v1/live_games?sport_id=1&page=1&per_page=5
   ```

2. **Update Response Parsing:**
   - If API returns different field names, update `parseMatches()` in `src/api/inforadar.ts`
   - If odds format differs, update `parseOdds()`

3. **Adjust Confidence Thresholds:**
   - Edit `src/predictor/analyzer.ts` → `filterBestPredictions()`
   - Change `confidence >= 50` to desired threshold

4. **Deploy with Real API:**
   - Once verified, Railway will use live predictions
   - Remove `.env` from git (already done)
   - Use environment variables in Railway dashboard

---

**Your bot is running and ready to accept live predictions once API responds.** 🚀
