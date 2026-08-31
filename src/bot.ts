import { Telegraf } from 'telegraf';
import { logger } from './utils/logger';
import { inforadarClient } from './api/inforadar';
import { analyzer } from './predictor/analyzer';
import { Prediction, PredictionResult } from './types';

class TelegramBot {
  private bot: Telegraf;
  private chatId: string;
  private scanInterval: NodeJS.Timeout | null = null;

  constructor(token: string, chatId: string) {
    this.bot = new Telegraf(token);
    this.chatId = chatId;
    this.setupCommands();
  }

  private setupCommands() {
    this.bot.start((ctx) => {
      ctx.reply(
        '🤖 Prediction Bot Started\n\n' +
          'Commands:\n' +
          '/scan - Scan matches now\n' +
          '/stop - Stop scanning\n' +
          '/status - Bot status',
      );
    });

    this.bot.command('scan', async (ctx) => {
      ctx.reply('🔍 Scanning matches...');
      await this.scanAndPredict();
    });

    this.bot.command('stop', async (ctx) => {
      this.stopScanning();
      ctx.reply('⏹️ Scanning stopped');
    });

    this.bot.command('status', async (ctx) => {
      const isRunning = this.scanInterval !== null;
      ctx.reply(`Status: ${isRunning ? '🟢 Running' : '🔴 Stopped'}`);
    });

    this.bot.on('message', (ctx) => {
      logger.debug({ text: ctx.message.text }, 'Received message');
    });
  }

  async start() {
    try {
      this.bot.launch();
      logger.info('Bot launched');

      // Start periodic scanning
      this.startScanning();

      // Handle graceful shutdown
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    } catch (error) {
      logger.error({ error }, 'Failed to start bot');
      throw error;
    }
  }

  private startScanning() {
    const interval = parseInt(
      process.env.PREDICTION_INTERVAL || '300000',
      10,
    );
    logger.info({ intervalMs: interval }, 'Starting periodic scanning');

    this.scanInterval = setInterval(async () => {
      try {
        await this.scanAndPredict();
      } catch (error) {
        logger.error({ error }, 'Error in scan interval');
      }
    }, interval);
  }

  private stopScanning() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
      logger.info('Scanning stopped');
    }
  }

  private async scanAndPredict() {
    try {
      logger.info('Starting match scan and prediction');

      // Fetch live games
      const matches = await inforadarClient.getLiveGames(1); // 1 = soccer
      if (matches.length === 0) {
        logger.info('No live matches found');
        return;
      }

      logger.info({ count: matches.length }, 'Fetched live matches');

      // Get odds for each match
      const matchesWithOdds = await Promise.all(
        matches.map(async (match) => {
          try {
            const odds = await inforadarClient.getMatchOdds(match.eventId);
            return { ...match, oddsHistory: odds };
          } catch (error) {
            logger.warn(
              { eventId: match.eventId, error },
              'Failed to get odds for match',
            );
            return match;
          }
        }),
      );

      // Analyze predictions
      const predictions = matchesWithOdds
        .map((match) => analyzer.analyzeTotalGoals(match))
        .filter((p): p is Prediction => p !== null);

      if (predictions.length === 0) {
        logger.info('No predictions generated');
        return;
      }

      // Filter best predictions
      const bestPredictions = analyzer.filterBestPredictions(predictions);

      if (bestPredictions.length > 0) {
        const result: PredictionResult = {
          predictions: bestPredictions,
          scanTime: new Date().toISOString(),
          matchesScanned: matches.length,
          recommendedCount: bestPredictions.length,
        };

        await this.sendPredictions(result);
      }
    } catch (error) {
      logger.error({ error }, 'Error in scanAndPredict');
    }
  }

  private async sendPredictions(result: PredictionResult) {
    try {
      const message = this.formatPredictionsMessage(result);

      await this.bot.telegram.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
      });

      logger.info(
        { count: result.predictions.length },
        'Sent predictions to Telegram',
      );
    } catch (error) {
      logger.error({ error }, 'Failed to send predictions');
    }
  }

  private formatPredictionsMessage(result: PredictionResult): string {
    let message = `<b>📊 Prediction Scan Results</b>\n`;
    message += `<i>${new Date(result.scanTime).toLocaleString()}</i>\n\n`;
    message += `Scanned: ${result.matchesScanned} matches\n`;
    message += `Recommended: ${result.recommendedCount}\n\n`;

    result.predictions.forEach((pred, idx) => {
      message += `<b>${idx + 1}. ${pred.match}</b>\n`;
      message += `Prediction: <b>${pred.prediction}</b> (${pred.confidence.toFixed(0)}% confidence)\n`;

      if (pred.odds.over && pred.odds.under) {
        message += `Odds: Over ${pred.odds.over} / Under ${pred.odds.under}\n`;
      }

      message += `<i>${pred.reasoning}</i>\n\n`;
    });

    return message;
  }
}

// Main execution
async function main() {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.CHAT_ID;

  if (!token || !chatId) {
    logger.error('Missing TELEGRAM_TOKEN or CHAT_ID in environment');
    process.exit(1);
  }

  const bot = new TelegramBot(token, chatId);
  await bot.start();
}

main().catch((error) => {
  logger.error({ error }, 'Fatal error');
  process.exit(1);
});
