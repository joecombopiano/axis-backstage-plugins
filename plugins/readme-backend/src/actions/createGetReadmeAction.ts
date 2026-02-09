import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import {
  AuthService,
  CacheService,
  DiscoveryService,
  LoggerService,
  RootConfigService,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import { CatalogClient } from '@backstage/catalog-client';
import {
  getEntitySourceLocation,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { isError, NotFoundError } from '@backstage/errors';
import { ScmIntegrations } from '@backstage/integration';
import { isSymLink } from '../lib';
import { getCacheTtl } from '../service/config';
import { NOT_FOUND_PLACEHOLDER, getReadmeTypes } from '../service/constants';
import { ReadmeFile } from '../service/types';

export const createGetReadmeAction = ({
  actionsRegistry,
  auth,
  cache,
  config,
  discovery,
  logger,
  reader,
}: {
  actionsRegistry: ActionsRegistryService;
  auth: AuthService;
  cache: CacheService;
  config: RootConfigService;
  discovery: DiscoveryService;
  logger: LoggerService;
  reader: UrlReaderService;
}) => {
  const catalogClient = new CatalogClient({ discoveryApi: discovery });
  const integrations = ScmIntegrations.fromConfig(config);
  const cacheTtl = getCacheTtl(config);
  const readmeTypes = getReadmeTypes(config);

  actionsRegistry.register({
    name: 'get-readme-content',
    title: 'Get README Content',
    description:
      'Retrieves the README content for a Backstage catalog entity. Use this to get documentation, setup instructions, or general information about a component, API, system, or other entity. Returns the raw README content in its original format (markdown, plain text, or reStructuredText).',
    schema: {
      input: z =>
        z.object({
          entityRef: z
            .string()
            .describe(
              'Entity reference in format "kind:namespace/name" (e.g., "component:default/my-service", "api:default/user-api"). Can also be just "namespace/name" for components.',
            ),
          stripMarkdown: z
            .boolean()
            .optional()
            .default(false)
            .describe(
              'If true, removes markdown formatting and returns plain text. Useful for AI processing.',
            ),
        }),
      output: z =>
        z.object({
          entityRef: z.string().describe('The full entity reference'),
          content: z.string().describe('The README file content'),
          contentType: z
            .string()
            .describe(
              'MIME type of the content (e.g., "text/markdown", "text/plain")',
            ),
          fileName: z
            .string()
            .describe(
              'Name of the README file (e.g., "README.md", "README.rst")',
            ),
        }),
    },
    action: async ({ input }) => {
      const entityRef = input.entityRef;
      logger.debug(`Fetching README for entity: ${entityRef}`);

      // Check cache first
      const cacheDoc = (await cache.get(entityRef)) as ReadmeFile | undefined;

      if (cacheDoc && cacheDoc.name === NOT_FOUND_PLACEHOLDER) {
        throw new NotFoundError(
          `README not found for entity ${entityRef}. This entity does not have a README file.`,
        );
      }

      if (cacheDoc) {
        logger.debug(`Loading README for ${entityRef} from cache`);
        let content = cacheDoc.content;

        if (input.stripMarkdown && cacheDoc.type === 'text/markdown') {
          content = stripMarkdownFormatting(content);
        }

        return {
          output: {
            entityRef,
            content,
            contentType: cacheDoc.type,
            fileName: cacheDoc.name,
          },
        };
      }

      // Get auth token for catalog access
      const { token } = await auth.getPluginRequestToken({
        onBehalfOf: await auth.getOwnServiceCredentials(),
        targetPluginId: 'catalog',
      });

      // Fetch entity from catalog
      const entity = await catalogClient.getEntityByRef(entityRef, { token });
      if (!entity) {
        throw new NotFoundError(`Entity ${entityRef} not found in catalog`);
      }

      const normalizedEntityRef = stringifyEntityRef(entity);
      const source = getEntitySourceLocation(entity);

      if (!source || source.type !== 'url') {
        throw new NotFoundError(
          `Entity ${entityRef} does not have a valid source location`,
        );
      }

      const integration = integrations.byUrl(source.target);
      if (!integration) {
        throw new NotFoundError(
          `No SCM integration found for ${source.target}`,
        );
      }

      // Try to find README file
      for (const fileType of readmeTypes) {
        try {
          const url = integration.resolveUrl({
            url: fileType.name,
            base: source.target,
          });

          logger.debug(`Trying README location: ${url} for ${entityRef}`);

          const urlResponse = await reader.readUrl(url);
          let content = (await urlResponse.buffer()).toString('utf-8');

          // Handle symlinks
          if (isSymLink(content)) {
            const symLinkUrl = integration.resolveUrl({
              url: content,
              base: source.target,
            });
            const symLinkUrlResponse = await reader.readUrl(symLinkUrl);
            content = (await symLinkUrlResponse.buffer()).toString('utf-8');
          }

          // Cache the result
          cache.set(
            normalizedEntityRef,
            {
              name: fileType.name,
              type: fileType.type,
              content: content,
            },
            { ttl: cacheTtl },
          );

          logger.info(
            `Found README for ${entityRef}: ${url} type ${fileType.type}`,
          );

          // Strip markdown if requested
          if (input.stripMarkdown && fileType.type === 'text/markdown') {
            content = stripMarkdownFormatting(content);
          }

          return {
            output: {
              entityRef: normalizedEntityRef,
              content,
              contentType: fileType.type,
              fileName: fileType.name,
            },
          };
        } catch (error: unknown) {
          if (isError(error) && error.name === 'NotFoundError') {
            continue; // Try next file type
          }
          logger.error(
            `Error fetching README for ${entityRef}: ${error}`,
          );
          throw error;
        }
      }

      // No README found - cache the negative result
      logger.info(`README not found for ${entityRef}`);
      cache.set(
        normalizedEntityRef,
        {
          name: NOT_FOUND_PLACEHOLDER,
          type: '',
          content: '',
        },
        { ttl: cacheTtl },
      );

      throw new NotFoundError(
        `README not found for entity ${entityRef}. Tried files: ${readmeTypes.map(t => t.name).join(', ')}`,
      );
    },
  });
};

/**
 * Strip markdown formatting for better AI/LLM processing
 */
function stripMarkdownFormatting(content: string): string {
  return (
    content
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // Remove headers
      .replace(/^#+\s+/gm, '')
      // Remove bold/italic
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}
