import { Match, OddsSnapshot } from '../types';

/**
 * Mock data for testing when inforadar.live API is unavailable
 * Replace this with actual API calls when endpoint is accessible
 */

export const MOCK_MATCHES: Match[] = [
  {
    eventId: 12205297,
    homeTeam: 'Deportivo Capiata',
    awayTeam: 'Guairena FC',
    league: 'Paraguay Division Intermedia',
    currentScore: '0-0',
    minute: 45,
    oddsHistory: [
      { gameTime: 0, score: '0-0', over: 1.8, under: 1.95, total: 2.5, timestamp: '2026-08-31T22:50:00Z' },
      { gameTime: 5, score: '0-0', over: 1.85, under: 1.95, total: 2.5, timestamp: '2026-08-31T22:55:00Z' },
      { gameTime: 10, score: '0-0', over: 1.9, under: 1.9, total: 2.5, timestamp: '2026-08-31T23:00:00Z' },
      { gameTime: 15, score: '0-0', over: 1.95, under: 1.85, total: 2.5, timestamp: '2026-08-31T23:05:00Z' },
      { gameTime: 20, score: '0-0', over: 2.0, under: 1.8, total: 2.5, timestamp: '2026-08-31T23:10:00Z' },
      { gameTime: 45, score: '0-0', over: 2.05, under: 1.75, total: 2.5, timestamp: '2026-08-31T23:13:00Z' },
    ],
  },
  {
    eventId: 12205298,
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    currentScore: '1-0',
    minute: 35,
    oddsHistory: [
      { gameTime: 0, score: '0-0', over: 2.1, under: 1.7, total: 2.5, timestamp: '2026-08-31T22:45:00Z' },
      { gameTime: 10, score: '0-0', over: 2.05, under: 1.75, total: 2.5, timestamp: '2026-08-31T22:55:00Z' },
      { gameTime: 20, score: '1-0', over: 1.95, under: 1.85, total: 2.5, timestamp: '2026-08-31T23:05:00Z' },
      { gameTime: 35, score: '1-0', over: 2.2, under: 1.6, total: 2.5, timestamp: '2026-08-31T23:13:00Z' },
    ],
  },
  {
    eventId: 12205299,
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    league: 'Premier League',
    currentScore: '2-1',
    minute: 62,
    oddsHistory: [
      { gameTime: 0, score: '0-0', over: 2.3, under: 1.55, total: 2.75, timestamp: '2026-08-31T22:40:00Z' },
      { gameTime: 20, score: '1-0', over: 2.15, under: 1.7, total: 2.75, timestamp: '2026-08-31T23:00:00Z' },
      { gameTime: 40, score: '1-1', over: 2.0, under: 1.8, total: 2.75, timestamp: '2026-08-31T23:10:00Z' },
      { gameTime: 62, score: '2-1', over: 1.85, under: 1.95, total: 2.75, timestamp: '2026-08-31T23:13:00Z' },
    ],
  },
];

export function getMockMatches(): Match[] {
  return MOCK_MATCHES;
}

export function getMockOdds(eventId: number): OddsSnapshot[] {
  const match = MOCK_MATCHES.find((m) => m.eventId === eventId);
  return match ? match.oddsHistory : [];
}
