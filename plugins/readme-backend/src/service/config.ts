import { Config, readDurationFromConfig } from '@backstage/config';
import { durationToMilliseconds } from '@backstage/types';

export const getCacheTtl = (config: Config): number => {
  const readmeConfig = config.getOptionalConfig('readme');
  if (!readmeConfig) {
    return 3_600_000; // 1 hour default
  }

  if (!readmeConfig.has('cacheTtl')) {
    return 3_600_000; // 1 hour default
  }

  return durationToMilliseconds(
    readDurationFromConfig(readmeConfig, { key: 'cacheTtl' }),
  );
};
