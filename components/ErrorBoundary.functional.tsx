import React, { ReactNode, useState } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

export function ErrorBoundary({ children, fallback, onError }: Props) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error caught by functional boundary:', event.error);
      setError(event.error);
      setHasError(true);
      
      if (onError) {
        onError(event.error);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      const error = new Error(String(event.reason));
      setError(error);
      setHasError(true);
      
      if (onError) {
        onError(error);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  const handleRetry = () => {
    setHasError(false);
    setError(null);
  };

  if (hasError) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🐝💥</div>
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              Game Error!
            </h1>
            <p className="text-gray-600 mb-6">
              Something went wrong in the backyard battle. The game encountered an unexpected error.
            </p>
            
            {import.meta.env.DEV && error && (
              <details className="text-left bg-gray-100 p-4 rounded mb-6">
                <summary className="cursor-pointer font-semibold text-gray-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto">
                  {error.toString()}
                  {error.stack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded transition-colors"
              >
                🔄 Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded transition-colors"
              >
                🔄 Reload Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

// Game-specific error boundary
export function GameErrorBoundary({ children }: { children: ReactNode }) {
  const handleGameError = (error: Error) => {
    // Log game-specific errors
    console.error('Game Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Could send to analytics service here
    // sendErrorToAnalytics(error);
  };

  return (
    <ErrorBoundary 
      onError={handleGameError}
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-700 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-2xl w-full border-2 border-red-500">
            <div className="text-center">
              <div className="text-8xl mb-4 animate-bounce">🐜💥</div>
              <h1 className="text-4xl font-bold text-white mb-4 comic-font">
                The Battle Crashed!
              </h1>
              <p className="text-red-100 mb-6 text-lg">
                The ants have sabotaged the game! Something went wrong during the backyard brawl.
              </p>
              
              <div className="bg-black/20 rounded-lg p-4 mb-6">
                <p className="text-yellow-300 font-mono text-sm">
                  Error Code: BATTLE_CRASH_{Date.now().toString(36)}
                </p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  🎮 Restart Battle
                </button>
              </div>
              
              <p className="text-red-200 text-sm mt-4">
                Tip: Your progress is saved locally. Try refreshing the page!
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error('Error captured by useErrorHandler:', error);
    setError(error);
  }, []);

  // Throw error to be caught by ErrorBoundary
  if (error) {
    throw error;
  }

  return { captureError, resetError };
}

export default ErrorBoundary;
