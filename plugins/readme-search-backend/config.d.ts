import { SchedulerServiceTaskScheduleDefinitionConfig } from '@backstage/backend-plugin-api';

export interface Config {
  /**
   * Configuration options for the README search backend plugin
   */
  readme?: {
    /**
     * Search indexing configuration
     */
    search?: {
      /**
       * Schedule configuration for search indexing.
       * Defaults to running every hour with a 1 hour timeout.
       *
       * @example
       * ```yaml
       * readme:
       *   search:
       *     schedule:
       *       frequency: { hours: 1 }
       *       timeout: { hours: 1 }
       *       initialDelay: { seconds: 3 }
       * ```
       *
       * @example Using string format
       * ```yaml
       * readme:
       *   search:
       *     schedule:
       *       frequency: '30m'
       *       timeout: '30m'
       * ```
       *
       * @example Using cron syntax
       * ```yaml
       * readme:
       *   search:
       *     schedule:
       *       frequency:
       *         cron: '0 * * * *'  # Every hour
       * ```
       */
      schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
    };
  };
}
