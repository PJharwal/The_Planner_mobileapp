/**
 * Logger Service - Production Error Tracking
 * 
 * Integrates with Sentry in production, console in development
 * Provides structured logging with user context and breadcrumbs
 */

interface LogContext {
    userId?: string;
    email?: string;
    screen?: string;
    action?: string;
    technical?: Record<string, unknown>;
}

interface Logger {
    /**
     * Log an error with full context
     */
    error(error: unknown, context?: LogContext): void;

    /**
     * Log a warning message
     */
    warning(message: string, context?: LogContext): void;

    /**
     * Log an info message
     */
    info(message: string, context?: LogContext): void;

    /**
     * Add a breadcrumb for debugging flow
     */
    breadcrumb(message: string, category: string, data?: Record<string, unknown>): void;

    /**
     * Set the current user for error tracking
     */
    setUser(userId: string, email?: string, metadata?: Record<string, unknown>): void;

    /**
     * Clear user context (on logout)
     */
    clearUser(): void;
}

/**
 * Development Logger - Console-based
 */
class DevLogger implements Logger {
    private user: { id?: string; email?: string } = {};

    error(error: unknown, context?: LogContext): void {
        console.group('🔴 [ERROR]');
        console.error('Error:', error);
        if (context) {
            console.log('Context:', context);
        }
        if (this.user.id) {
            console.log('User:', this.user);
        }
        console.trace('Stack trace');
        console.groupEnd();
    }

    warning(message: string, context?: LogContext): void {
        console.group('⚠️ [WARNING]');
        console.warn('Message:', message);
        if (context) {
            console.log('Context:', context);
        }
        console.groupEnd();
    }

    info(message: string, context?: LogContext): void {
        console.log('ℹ️ [INFO]:', message, context || '');
    }

    breadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
        if (__DEV__) {
            console.log(`🍞 [${category}]:`, message, data || '');
        }
    }

    setUser(userId: string, email?: string): void {
        this.user = { id: userId, email };
        console.log('👤 User set:', this.user);
    }

    clearUser(): void {
        this.user = {};
        console.log('👤 User cleared');
    }
}

/**
 * Production Logger - Sentry Integration
 * 
 * Note: Install Sentry with:
 * npm install @sentry/react-native
 * npx @sentry/wizard -i reactNative
 */
class ProductionLogger implements Logger {
    private initialized = false;

    constructor() {
        this.initSentry();
    }

    private initSentry(): void {
        // TODO: Uncomment when Sentry is installed
        /*
        if (!__DEV__) {
            Sentry.init({
                dsn: process.env.SENTRY_DSN || '',
                enableAutoSessionTracking: true,
                tracesSampleRate: 1.0,
                environment: process.env.NODE_ENV || 'production',
                beforeSend(event) {
                    // Filter out sensitive data
                    if (event.request?.headers) {
                        delete event.request.headers['Authorization'];
                    }
                    return event;
                }
            });
            this.initialized = true;
        }
        */
    }

    error(error: unknown, context?: LogContext): void {
        if (!this.initialized) {
            // Fallback to console if Sentry not initialized
            console.error('[Sentry N/A]', error, context);
            return;
        }

        // TODO: Uncomment when Sentry is installed
        /*
        Sentry.captureException(error, {
            level: 'error',
            tags: {
                screen: context?.screen,
                action: context?.action,
            },
            extra: {
                ...context?.technical,
                userId: context?.userId,
            },
        });
        */
    }

    warning(message: string, context?: LogContext): void {
        if (!this.initialized) return;

        // TODO: Uncomment when Sentry is installed
        /*
        Sentry.captureMessage(message, {
            level: 'warning',
            tags: {
                screen: context?.screen,
            },
            extra: context?.technical,
        });
        */
    }

    info(message: string, context?: LogContext): void {
        if (!this.initialized) return;

        // TODO: Uncomment when Sentry is installed
        /*
        Sentry.captureMessage(message, {
            level: 'info',
            tags: { screen: context?.screen },
        });
        */
    }

    breadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
        if (!this.initialized) return;

        // TODO: Uncomment when Sentry is installed
        /*
        Sentry.addBreadcrumb({
            message,
            category,
            level: 'info',
            data,
        });
        */
    }

    setUser(userId: string, email?: string, metadata?: Record<string, unknown>): void {
        if (!this.initialized) return;

        // TODO: Uncomment when Sentry is installed
        /*
        Sentry.setUser({
            id: userId,
            email,
            ...metadata,
        });
        */
    }

    clearUser(): void {
        if (!this.initialized) return;

        // TODO: Uncomment when Sentry is installed
        /*
        Sentry.setUser(null);
        */
    }
}

/**
 * Export the appropriate logger based on environment
 */
export const logger: Logger = __DEV__
    ? new DevLogger()
    : new ProductionLogger();

/**
 * Convenience methods for common logging patterns
 */
export const log = {
    /**
     * Log screen navigation
     */
    navigate: (screen: string) => {
        logger.breadcrumb(`Navigated to ${screen}`, 'navigation');
    },

    /**
     * Log user action
     */
    action: (action: string, data?: Record<string, unknown>) => {
        logger.breadcrumb(action, 'user_action', data);
    },

    /**
     * Log API call
     */
    apiCall: (endpoint: string, method: string) => {
        logger.breadcrumb(`${method} ${endpoint}`, 'api');
    },

    /**
     * Log state change
     */
    stateChange: (stateName: string, newValue: unknown) => {
        logger.breadcrumb(`${stateName} changed`, 'state', { value: newValue });
    },
};
