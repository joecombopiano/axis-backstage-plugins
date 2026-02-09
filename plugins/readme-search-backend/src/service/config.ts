import { Config } from '@backstage/config';
import {
  SchedulerServiceTaskScheduleDefinition,
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
} from '@backstage/backend-plugin-api';

export const getSearchSchedule = (
  config: Config,
): SchedulerServiceTaskScheduleDefinition => {
  const readmeConfig = config.getOptionalConfig('readme');
  const searchConfig = readmeConfig?.getOptionalConfig('search');
  const scheduleConfig = searchConfig?.getOptionalConfig('schedule');

  if (!scheduleConfig) {
    // Default to running every hour
    return {
      frequency: { hours: 1 },
      timeout: { hours: 1 },
      initialDelay: { seconds: 3 },
    };
  }

  // Use the official Backstage helper to parse the schedule config
  return readSchedulerServiceTaskScheduleDefinitionFromConfig(scheduleConfig);
};
