/**
 * DevLogger
 *
 * Wrapper around console logging that only runs in development.
 * Uses Vite's `import.meta.env.DEV` flag
 *
 * Usage example in a component or service:
 *
 * import { DevLogger } from '../utils/dev-logger'
 *
 * DevLogger.log('User DTO', dto)
 * DevLogger.warn('Unexpected API response', response)
 * DevLogger.error('Login failed', error)
 * DevLogger.table(users)
 *
 * Optional structured debugging:
 *
 * DevLogger.group('Auth flow')
 * DevLogger.log('Request payload', payload)
 * DevLogger.log('Response', response)
 * DevLogger.groupEnd()
 *
 * Typical use cases:
 * - debugging API responses
 * - inspecting DTOs or signals
 * - verifying component lifecycle flow
 * - temporary development diagnostics
 *
 * These logs will not execute in production builds.
 */
export class DevLogger {

  /**
   * Standard debug logging.
   * Use for general inspection of variables, DTOs, or responses.
   */
  static log(...args: unknown[]): void {
    if (import.meta.env.DEV) {
      console.log(...args)
    }
  }

  /**
   * Warning logging.
   * Use when something unexpected occurs but the application can continue.
   */
  static warn(...args: unknown[]): void {
    if (import.meta.env.DEV) {
      console.warn(...args)
    }
  }

  /**
   * Error logging.
   * Use for development-time inspection of errors.
   * Does NOT replace proper error handling.
   */
  static error(...args: unknown[]): void {
    if (import.meta.env.DEV) {
      console.error(...args)
    }
  }

  /**
   * Table visualization.
   * Useful for arrays of objects (API lists, entities, etc.).
   */
  static table(data: unknown): void {
    if (import.meta.env.DEV) {
      console.table(data)
    }
  }

  /**
   * Start a console group.
   * Helps organize complex debug output.
   */
  static group(label: string): void {
    if (import.meta.env.DEV) {
      console.group(label)
    }
  }

  /**
   * End the previously opened console group.
   */
  static groupEnd(): void {
    if (import.meta.env.DEV) {
      console.groupEnd()
    }
  }

}