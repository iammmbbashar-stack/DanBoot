export interface OddsSnapshot {
  gameTime: number;
  score: string;
  over?: number;
  under?: number;
  total?: number;
  timestamp: string;
}

export interface Match {
  eventId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  currentScore: string;
  minute: number;
  oddsHistory: OddsSnapshot[];
}

export interface Prediction {
  eventId: number;
  match: string;
  prediction: 'Over' | 'Under';
  confidence: number; // 0-100
  reasoning: string;
  odds: {
    over?: number;
    under?: number;
  };
  analyzedAt: string;
}

export interface PredictionResult {
  predictions: Prediction[];
  scanTime: string;
  matchesScanned: number;
  recommendedCount: number;
}
