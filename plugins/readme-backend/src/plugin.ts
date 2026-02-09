import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { createRouter } from './service/router';
import { createGetReadmeAction } from './actions/createGetReadmeAction';

/**
 * The Readme backend plugin.
 *
 * @public
 */
export const readmePlugin = createBackendPlugin({
  pluginId: 'readme',
  register(env) {
    env.registerInit({
      deps: {
        auth: coreServices.auth,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        reader: coreServices.urlReader,
        cache: coreServices.cache,
        actionsRegistry: actionsRegistryServiceRef,
      },
      async init({
        auth,
        logger,
        config,
        reader,
        discovery,
        httpRouter,
        cache,
        actionsRegistry,
      }) {
        // Register HTTP router for REST API endpoints
        httpRouter.use(
          await createRouter({
            auth,
            logger,
            config,
            reader,
            discovery,
            cache,
          }),
        );

        // Register MCP action for AI/LLM integration
        createGetReadmeAction({
          actionsRegistry,
          auth,
          cache,
          config,
          discovery,
          logger,
          reader,
        });

        logger.info('README plugin initialized with MCP action support');
      },
    });
  },
});
