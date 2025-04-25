import logger from './logger';

/**
 * Function to handle and log errors
 */
export const handleError = (error: Error, context: string = 'General', metadata: Record<string, any> = {}) => {
  // Log the error with context and additional metadata
  logger.error(`${context} Error: ${error.message}`, {
    ...metadata,
    stack: error.stack,
  });
};

/**
 * Wrapper function to catch errors in async functions
 */
export const asyncErrorHandler = <T>(
  fn: (...args: any[]) => Promise<T>,
  context: string = 'Async',
) => {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), context, { 
        arguments: args.map(arg => 
          // Don't stringifying complex objects or functions to avoid sensitive data in logs
          (typeof arg === 'object' || typeof arg === 'function') 
            ? '[Complex Object]' 
            : arg
        )
      });
      throw error; // Re-throw the error after logging
    }
  };
};

/**
 * Process-level uncaught exception and unhandled rejection handlers
 */
export const setupGlobalErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    handleError(error, 'Uncaught Exception');
    // In production, you might want to gracefully shut down
    if (process.env.NODE_ENV === 'production') {
      process.exit(1); // Exit with error
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error 
      ? reason 
      : new Error(`Unhandled Rejection at: ${JSON.stringify(promise)}`);
    
    handleError(error, 'Unhandled Rejection');
  });
};

export default {
  handleError,
  asyncErrorHandler,
  setupGlobalErrorHandlers,
}; 