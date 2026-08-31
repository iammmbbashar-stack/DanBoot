import axios, { AxiosInstance } from 'axios';
import { limiter, retryWithBackoff } from '../utils/rateLimiter';
import { logger } from '../utils/logger';
import { Match, OddsSnapshot } from '../types';

export class InforadarClient {
  private client: AxiosInstance;

  constructor(baseUrl: string) {
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
    // Handle different response formats
    if (!data) {
      logger.warn('Empty matches response');
      return [];
    }

    // If it's an array, process it
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        eventId: item.event_id || item.eventId || item.id || 0,
        homeTeam: item.home_team || item.homeTeam || 'Unknown',
        awayTeam: item.away_team || item.awayTeam || 'Unknown',
        league: item.league || item.competition || 'Unknown',
        currentScore: item.score || item.current_score || '0-0',
        minute: item.minute || item.match_time || 0,
        oddsHistory: [],
      }));
    }

    // If it's an object with matches property
    if (typeof data === 'object' && !Array.isArray(data)) {
      const obj = data as any;

      // Try common property names for array of matches
      const matches = obj.matches || obj.data || obj.games || obj.events;
      if (Array.isArray(matches)) {
        return matches.map((item: any) => ({
          eventId: item.event_id || item.eventId || item.id || 0,
          homeTeam: item.home_team || item.homeTeam || 'Unknown',
          awayTeam: item.away_team || item.awayTeam || 'Unknown',
          league: item.league || item.competition || 'Unknown',
          currentScore: item.score || item.current_score || '0-0',
          minute: item.minute || item.match_time || 0,
          oddsHistory: [],
        }));
      }
    }

    logger.warn('Could not parse matches from response structure', { dataType: typeof data });
    return [];
  }

  private parseOdds(data: unknown): OddsSnapshot[] {
    // Handle different response formats
    if (!data) {
      logger.warn('Empty odds response');
      return [];
    }

    // If it's an array, process it
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        gameTime: item.game_time || item.gameTime || item.minute || 0,
        score: item.score || item.current_score || '0-0',
        over: item.over || item.over_odds || undefined,
        under: item.under || item.under_odds || undefined,
        total: item.total || item.total_goals || undefined,
        timestamp: item.timestamp || item.time || new Date().toISOString(),
      }));
    }

    // If it's an object with odds property
    if (typeof data === 'object' && !Array.isArray(data)) {
      const obj = data as any;

      // Try common property names for array of odds
      const odds = obj.odds || obj.data || obj.history || obj.snapshots;
      if (Array.isArray(odds)) {
        return odds.map((item: any) => ({
          gameTime: item.game_time || item.gameTime || item.minute || 0,
          score: item.score || item.current_score || '0-0',
          over: item.over || item.over_odds || undefined,
          under: item.under || item.under_odds || undefined,
          total: item.total || item.total_goals || undefined,
          timestamp: item.timestamp || item.time || new Date().toISOString(),
        }));
      }
    }

    logger.warn('Could not parse odds from response structure', { dataType: typeof data });
    return [];
  }
}

export const inforadarClient = new InforadarClient(
  process.env.INFORADAR_BASE_URL || 'https://inforadar.live/api/v1',
);
