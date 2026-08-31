import { logger } from './logger';

export class BotError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = 'BotError';
  }
}

export function handleError(error: unknown, context: string): BotError {
  if (error instanceof BotError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  logger.error({ error, context }, `Error in ${context}`);

  // Classify error
  if (
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT') ||
    message.includes('429')
  ) {
    return new BotError(message, 'NETWORK_ERROR', true);
  }

  if (message.includes('401') || message.includes('403')) {
    return new BotError(message, 'AUTH_ERROR', false);
  }

  return new BotError(message, 'UNKNOWN_ERROR', true);
}

export async function withErrorHandler<T>(
  fn: () => Promise<T>,
  context: string,
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const botError = handleError(error, context);
    logger.error(
      { code: botError.code, retryable: botError.retryable },
      `Handled error in ${context}`,
    );
    return null;
  }
}
