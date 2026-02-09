/**
 * A Backstage search backend plugin for indexing README content
 *
 * @packageDocumentation
 */

export { readmeSearchModule as default } from './collator/module';
export { ReadmeCollatorFactory } from './collator/ReadmeCollatorFactory';
export type {
  ReadmeDocument,
  ReadmeCollatorFactoryOptions,
} from './collator/ReadmeCollatorFactory';
