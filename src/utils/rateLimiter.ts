import Bottleneck from 'bottleneck';
import { logger } from './logger';

// Create rate limiter: max 3 concurrent, min 100ms between calls
const limiter = new Bottleneck({
  minTime: 100,
  maxConcurrent: 3,
});

limiter.on('debug', (info) => {
  if (typeof info === 'object' && info !== null && 'type' in info && info.type === 'error') {
    logger.error({ bottleneck: info }, 'Rate limiter error');
  }
});

export { limiter };

// Retry logic with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        logger.warn(
          { attempt: attempt + 1, delayMs, error: lastError.message },
          'Retry attempt',
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
