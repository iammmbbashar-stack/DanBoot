import { Match, OddsSnapshot, Prediction } from '../types';
import { logger } from '../utils/logger';

interface OddsAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  average: number;
  volatility: number;
  recent: number;
}

export class PredictionAnalyzer {
  /**
   * Analyze Over/Under odds and make prediction
   */
  analyzeTotalGoals(match: Match): Prediction | null {
    if (match.oddsHistory.length < 3) {
      logger.debug(
        { eventId: match.eventId },
        'Not enough odds history for prediction',
      );
      return null;
    }

    // Filter valid odds snapshots (must have Over and Under)
    const validOdds = match.oddsHistory.filter((o) => o.over && o.under);
    if (validOdds.length < 3) {
      return null;
    }

    // Analyze Over odds
    const overAnalysis = this.analyzeOddsTrend(validOdds.map((o) => o.over || 0));
    const underAnalysis = this.analyzeOddsTrend(validOdds.map((o) => o.under || 0));

    // Generate prediction
    const prediction = this.generatePrediction(
      match,
      overAnalysis,
      underAnalysis,
      validOdds,
    );

    return prediction;
  }

  private analyzeOddsTrend(odds: number[]): OddsAnalysis {
    const average = odds.reduce((a, b) => a + b, 0) / odds.length;
    const recent = odds[odds.length - 1];
    const previous = odds[odds.length - 2] || recent;

    // Calculate volatility (standard deviation)
    const variance =
      odds.reduce((sum, o) => sum + Math.pow(o - average, 2), 0) / odds.length;
    const volatility = Math.sqrt(variance);

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable';
    const change = ((recent - previous) / previous) * 100;
    if (Math.abs(change) < 2) {
      trend = 'stable';
    } else if (change > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return { trend, average, volatility, recent };
  }

  private generatePrediction(
    match: Match,
    overAnalysis: OddsAnalysis,
    underAnalysis: OddsAnalysis,
    validOdds: OddsSnapshot[],
  ): Prediction | null {
    // Score based on multiple factors
    let overScore = 0;
    let underScore = 0;

    // Factor 1: Odds values (lower odds = more likely)
    // Normalize by average odds
    const avgOdds = (overAnalysis.average + underAnalysis.average) / 2;
    overScore +=
      ((avgOdds - overAnalysis.recent) / avgOdds) * 20 +
      (underAnalysis.recent - overAnalysis.recent) * 5;
    underScore +=
      ((avgOdds - underAnalysis.recent) / avgOdds) * 20 +
      (overAnalysis.recent - underAnalysis.recent) * 5;

    // Factor 2: Trend strength
    if (overAnalysis.trend === 'decreasing') overScore += 15; // Over odds dropping = over more likely
    if (underAnalysis.trend === 'decreasing') underScore += 15;

    // Factor 3: Volatility (lower volatility = more confident)
    const volatilityBonus = 20 * (1 - overAnalysis.volatility / 2); // Cap volatility at 2
    overScore += volatilityBonus;
    underScore += volatilityBonus;

    // Factor 4: Match minute (earlier match = less predictable)
    const minuteBonus = Math.min(match.minute * 0.5, 15);
    overScore += minuteBonus;
    underScore += minuteBonus;

    // Determine prediction
    const prediction = overScore > underScore ? 'Over' : 'Under';
    const confidence = Math.abs(overScore - underScore);

    // Only return if confidence > 30
    if (confidence < 30) {
      logger.debug(
        { eventId: match.eventId, confidence },
        'Low confidence prediction',
      );
      return null;
    }

    const reasoning = this.generateReasoning(
      prediction,
      confidence,
      overAnalysis,
      underAnalysis,
      match.minute,
    );

    return {
      eventId: match.eventId,
      match: `${match.homeTeam} vs ${match.awayTeam}`,
      prediction,
      confidence: Math.min(confidence, 100),
      reasoning,
      odds: {
        over: validOdds[validOdds.length - 1].over,
        under: validOdds[validOdds.length - 1].under,
      },
      analyzedAt: new Date().toISOString(),
    };
  }

  private generateReasoning(
    prediction: 'Over' | 'Under',
    confidence: number,
    overAnalysis: OddsAnalysis,
    underAnalysis: OddsAnalysis,
    minute: number,
  ): string {
    const reasons: string[] = [];

    if (prediction === 'Over') {
      reasons.push(`Over odds ${overAnalysis.trend}`);
      if (overAnalysis.recent < underAnalysis.recent) {
        reasons.push('Bookmakers favoring Over');
      }
    } else {
      reasons.push(`Under odds ${underAnalysis.trend}`);
      if (underAnalysis.recent < overAnalysis.recent) {
        reasons.push('Bookmakers favoring Under');
      }
    }

    if (minute < 15) {
      reasons.push('Early in match');
    } else if (minute > 70) {
      reasons.push('Late in match');
    }

    return reasons.join('. ');
  }

  /**
   * Filter predictions: only return high-quality ones
   */
  filterBestPredictions(predictions: Prediction[]): Prediction[] {
    return predictions
      .filter((p) => p.confidence >= 50) // Confidence threshold
      .sort((a, b) => b.confidence - a.confidence) // Sort by confidence
      .slice(0, 5); // Top 5
  }
}

export const analyzer = new PredictionAnalyzer();
