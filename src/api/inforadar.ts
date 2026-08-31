import axios, { AxiosInstance } from 'axios';
import { limiter, retryWithBackoff } from '../utils/rateLimiter';
import { logger } from '../utils/logger';
import { Match, OddsSnapshot } from '../types';

export class InforadarClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'User-Agent': 'TelegramPredictionBot/1.0',
      },
    });
  }

  async getLiveGames(sportId: number = 1): Promise<Match[]> {
    return retryWithBackoff(async () => {
      return limiter.schedule(async () => {
        try {
          logger.debug({ sportId }, 'Fetching live games');

          const response = await this.client.get('/live_games', {
            params: {
              sport_id: sportId,
              page: 1,
              per_page: 100,
            },
          });

          // Parse matches from response
          const matches = this.parseMatches(response.data);
          logger.info({ count: matches.length }, 'Fetched live games');
          return matches;
        } catch (error) {
          logger.error({ error, sportId }, 'Error fetching live games');
          throw error;
        }
      });
    });
  }

  async getMatchOdds(eventId: number): Promise<OddsSnapshot[]> {
    return retryWithBackoff(async () => {
      return limiter.schedule(async () => {
        try {
          logger.debug({ eventId }, 'Fetching match odds');

          const response = await this.client.get('/soccer/game/odds', {
            params: {
              event_id: eventId,
              odds_market: '8,5,6,1,2,3', // 6 markets
            },
          });

          const oddsSnapshots = this.parseOdds(response.data);
          logger.info({ eventId, count: oddsSnapshots.length }, 'Fetched odds');
          return oddsSnapshots;
        } catch (error) {
          logger.error({ error, eventId }, 'Error fetching odds');
          throw error;
        }
      });
    });
  }

  async getMatchDetail(eventId: number) {
    return retryWithBackoff(async () => {
      return limiter.schedule(async () => {
        try {
          logger.debug({ eventId }, 'Fetching match detail');
          const response = await this.client.get('/soccer/game/view', {
            params: {
              event_id: eventId,
            },
          });
          logger.info({ eventId }, 'Fetched match detail');
          return response.data;
        } catch (error) {
          logger.error({ error, eventId }, 'Error fetching match detail');
          throw error;
        }
      });
    });
  }

  private parseMatches(data: unknown): Match[] {
    // TODO: Implement parsing based on actual API response structure
    // This is a placeholder that expects an array of matches
    if (!Array.isArray(data)) {
      logger.warn('Unexpected matches response format');
      return [];
    }

    return data.map((item: any) => ({
      eventId: item.event_id || item.eventId,
      homeTeam: item.home_team || item.homeTeam,
      awayTeam: item.away_team || item.awayTeam,
      league: item.league || 'Unknown',
      currentScore: item.score || '0-0',
      minute: item.minute || 0,
      oddsHistory: [],
    }));
  }

  private parseOdds(data: unknown): OddsSnapshot[] {
    // TODO: Implement parsing based on actual API response structure
    if (!Array.isArray(data)) {
      logger.warn('Unexpected odds response format');
      return [];
    }

    return data.map((item: any) => ({
      gameTime: item.game_time || item.gameTime || 0,
      score: item.score || '0-0',
      over: item.over,
      under: item.under,
      total: item.total,
      timestamp: item.timestamp || new Date().toISOString(),
    }));
  }
}

export const inforadarClient = new InforadarClient(
  process.env.INFORADAR_BASE_URL || 'https://inforadar.live/api/v1',
);
