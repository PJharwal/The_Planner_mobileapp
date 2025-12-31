import { offlineQueue } from '../utils/offlineQueue';
import { useNotificationStore } from '../store/notificationStore';
import { logger, log } from '../services/logger';

export enum ErrorSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical'
}

export enum ErrorCategory {
    NETWORK = 'network',
    VALIDATION = 'validation',
    AUTHENTICATION = 'authentication',
    DATABASE = 'database',
    PERMISSION = 'permission',
    UNKNOWN = 'unknown'
}

export interface ErrorContext {
    /** Technical context for logging */
    technical?: Record<string, unknown>;
    /** User-facing message */
    userMessage?: string;
    /** Should show toast to user */
    notify?: boolean;
    /** Severity level */
    severity?: ErrorSeverity;
    /** Error category */
    category?: ErrorCategory;
    /** Screen where error occurred */
    screen?: string;
    /** Action being performed */
    action?: string;
    /** Retry configuration */
    retry?: {
        enabled: boolean;
        maxAttempts?: number;
        retryFn?: () => Promise<unknown>;
    };
    /** Offline queue configuration */
    offlineQueue?: {
        enabled: boolean;
        data?: unknown;
    };
}

class ErrorHandler {
    /**
     * Handle any error with context-aware response
     */
    async handle(
        error: unknown,
        context: ErrorContext = {}
    ): Promise<void> {
        const {
            technical,
            userMessage,
            notify = true,
            severity = ErrorSeverity.ERROR,
            category = ErrorCategory.UNKNOWN,
            retry,
            offlineQueue: queueConfig
        } = context;

        // 1. Log to development console
        this.logToDev(error, { technical, category, severity });

        // 2. Send to production error tracking (if enabled)
        if (!__DEV__) {
            this.logToProduction(error, { technical, category, severity });
        }

        // 3. Categorize and handle appropriately
        const errorType = this.categorizeError(error, category);

        switch (errorType) {
            case ErrorCategory.NETWORK:
                await this.handleNetworkError(error, queueConfig, userMessage);
                break;

            case ErrorCategory.VALIDATION:
                this.handleValidationError(error, userMessage, notify);
                break;

            case ErrorCategory.AUTHENTICATION:
                this.handleAuthError(error, userMessage);
                break;

            default:
                this.handleGenericError(error, userMessage, notify, severity);
        }

        // 4. Retry if configured
        if (retry?.enabled) {
            await this.attemptRetry(retry);
        }
    }

    /**
     * Handle network-specific errors with offline queue
     */
    private async handleNetworkError(
        error: unknown,
        queueConfig?: { enabled: boolean; data?: unknown },
        userMessage?: string
    ): Promise<void> {
        if (queueConfig?.enabled && queueConfig.data) {
            await offlineQueue.add(queueConfig.data);
            useNotificationStore.getState().show({
                type: 'info',
                message: userMessage || 'Saved locally. Will sync when online.',
                duration: 3000
            });
        } else {
            useNotificationStore.getState().show({
                type: 'warning',
                message: userMessage || 'Network error. Please check your connection.',
                duration: 4000
            });
        }
    }

    /**
     * Handle validation errors with immediate user feedback
     */
    private handleValidationError(
        error: unknown,
        userMessage?: string,
        notify?: boolean
    ): void {
        if (notify === false) return;

        const message = userMessage || this.extractValidationMessage(error);
        useNotificationStore.getState().show({
            type: 'error',
            message,
            duration: 4000
        });
    }

    /**
     * Handle authentication errors with redirect
     */
    private handleAuthError(
        error: unknown,
        userMessage?: string
    ): void {
        useNotificationStore.getState().show({
            type: 'error',
            message: userMessage || 'Session expired. Please log in again.',
            duration: 5000
        });
        // Note: Router redirect handled by authStore
    }

    /**
     * Generic error handler
     */
    private handleGenericError(
        error: unknown,
        userMessage?: string,
        notify?: boolean,
        severity?: ErrorSeverity
    ): void {
        if (notify === false) return;

        const message = userMessage || this.getDefaultMessage(severity!);
        const type = severity === ErrorSeverity.CRITICAL ? 'error' : 'warning';

        useNotificationStore.getState().show({
            type,
            message,
            duration: 4000
        });
    }

    /**
     * Categorize error based on error object properties
     */
    private categorizeError(error: unknown, hint: ErrorCategory): ErrorCategory {
        if (hint !== ErrorCategory.UNKNOWN) return hint;

        const errorStr = String(error).toLowerCase();

        if (errorStr.includes('network') || errorStr.includes('fetch')) {
            return ErrorCategory.NETWORK;
        }
        if (errorStr.includes('validation') || errorStr.includes('invalid')) {
            return ErrorCategory.VALIDATION;
        }
        if (errorStr.includes('auth') || errorStr.includes('unauthorized')) {
            return ErrorCategory.AUTHENTICATION;
        }

        return ErrorCategory.UNKNOWN;
    }

    /**
     * Development-only logging
     */
    private logToDev(
        error: unknown,
        meta: { technical?: unknown; category: ErrorCategory; severity: ErrorSeverity }
    ): void {
        if (!__DEV__) return;

        const prefix = `[${meta.category.toUpperCase()}:${meta.severity.toUpperCase()}]`;
        console.group(prefix);
        console.error('Error:', error);
        if (meta.technical) {
            console.log('Context:', meta.technical);
        }
        console.trace('Stack trace');
        console.groupEnd();
    }

    /**
     * Production error tracking with logger service (Sentry integration)
     */
    private logToProduction(
        error: unknown,
        meta: { technical?: unknown; category: ErrorCategory; severity: ErrorSeverity }
    ): void {
        // Send to logger service (Sentry in production)
        logger.error(error, {
            technical: meta.technical as Record<string, unknown>,
            screen: (meta.technical as any)?.screen,
            action: (meta.technical as any)?.action,
        });
    }

    /**
     * Retry logic with exponential backoff
     */
    private async attemptRetry(config: {
        maxAttempts?: number;
        retryFn?: () => Promise<unknown>;
    }): Promise<void> {
        const maxAttempts = config.maxAttempts || 3;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (config.retryFn) {
                    await config.retryFn();
                    return; // Success
                }
            } catch (error) {
                if (attempt === maxAttempts) {
                    // Final attempt failed
                    useNotificationStore.getState().show({
                        type: 'error',
                        message: 'Operation failed after multiple attempts',
                        duration: 4000
                    });
                } else {
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
    }

    /**
     * Extract validation message from Zod error
     */
    private extractValidationMessage(error: unknown): string {
        // Check if it's a Zod error
        if (error && typeof error === 'object' && 'issues' in error) {
            const issues = (error as { issues?: Array<{ message: string }> }).issues;
            if (Array.isArray(issues) && issues.length > 0) {
                return issues[0].message;
            }
        }
        return 'Invalid input. Please check your data.';
    }

    /**
     * Get default user-friendly message by severity
     */
    private getDefaultMessage(severity: ErrorSeverity): string {
        switch (severity) {
            case ErrorSeverity.CRITICAL:
                return 'Something went wrong. Please restart the app.';
            case ErrorSeverity.ERROR:
                return 'An error occurred. Please try again.';
            case ErrorSeverity.WARNING:
                return 'Something unexpected happened.';
            case ErrorSeverity.INFO:
                return 'Action could not be completed.';
            default:
                return 'An error occurred.';
        }
    }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Convenience wrapper for common error handling patterns
 */
export const handleError = {
    /**
     * Network error with offline queue fallback
     */
    network: (error: unknown, data?: unknown, message?: string) => {
        return errorHandler.handle(error, {
            category: ErrorCategory.NETWORK,
            userMessage: message,
            offlineQueue: { enabled: true, data }
        });
    },

    /**
     * Validation error from form input
     */
    validation: (error: unknown, message?: string) => {
        return errorHandler.handle(error, {
            category: ErrorCategory.VALIDATION,
            severity: ErrorSeverity.WARNING,
            userMessage: message
        });
    },

    /**
     * Silent error (log only, no user notification)
     */
    silent: (error: unknown, context?: Record<string, unknown>) => {
        return errorHandler.handle(error, {
            notify: false,
            technical: context
        });
    },

    /**
     * Critical error (show to user, log)
     */
    critical: (error: unknown, message?: string) => {
        return errorHandler.handle(error, {
            severity: ErrorSeverity.CRITICAL,
            userMessage: message
        });
    }
};
