/**
 * A Backstage Readme backend plugin that serves the Readme frontend api
 *
 * @packageDocumentation
 */

export { readmePlugin as default } from './plugin';
export { isSymLink } from './lib';
export { getCacheTtl } from './service/config';
export { getReadmeTypes } from './service/constants';
