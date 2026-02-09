import { HumanDuration } from '@backstage/types';

export interface Config {
  /**
   * Configuration options for the Readme backend plugin
   */
  readme?: {
    /**
     * Optional list of file names to try. Specifies the file names to try
     * when looking for a README file and which order to use.
     *
     * @example
     * ```yaml
     * readme:
     *   fileNames:
     *     - README.md
     *     - README.rst
     *     - README.txt
     * ```
     */
    fileNames?: string[];
    /**
     * Optional cache TTL, defaults to 1 hour.
     * Can be specified as a string (e.g., '2h', '30m') or as an object.
     *
     * @example
     * ```yaml
     * readme:
     *   cacheTtl: '2h'
     * ```
     *
     * @example
     * ```yaml
     * readme:
     *   cacheTtl:
     *     hours: 2
     * ```
     */
    cacheTtl?: HumanDuration | string;
  };
}
