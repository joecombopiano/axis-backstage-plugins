# README Search Backend

Backend search plugin for indexing README content in Backstage.

## Overview

This plugin provides a search collator that indexes README content from catalog entities, making them searchable through Backstage's search functionality.

## Installation

```bash
# From your Backstage root directory
yarn --cwd packages/backend add @internal/plugin-readme-search-backend
```

## Setup

Add the search module to your backend:

```typescript
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';
import readmeSearchModule from '@internal/plugin-readme-search-backend';

const backend = createBackend();
backend.add(import('@backstage/plugin-search-backend'));
backend.add(readmeSearchModule);
// ... other plugins
backend.start();
```

## Features

- Indexes README content from all catalog entities
- Strips markdown formatting for better search results
- Includes entity metadata (kind, namespace, name) in search documents
- Configurable refresh schedule (defaults to 1 hour)
- Caches README content to avoid redundant fetches

## Configuration

Configure the search indexing schedule in your `app-config.yaml`:

```yaml
readme:
  search:
    schedule:
      frequency: { hours: 1 }      # How often to index
      timeout: { hours: 1 }         # Maximum execution time
      initialDelay: { seconds: 3 }  # Delay before first run
```

The collator respects the same cache TTL configuration as the main readme plugin:

```yaml
readme:
  cacheTtl: '1h'  # Cache README content for 1 hour
```

## Dependencies

This plugin requires:
- `@internal/plugin-readme-backend` - For README fetching utilities
- `@backstage/plugin-search-backend` - For search indexing infrastructure

## Search Document Format

Each indexed README document includes:
- `title`: Entity name with " - README" suffix
- `text`: Markdown-stripped README content
- `location`: Link to entity catalog page
- `type`: Always set to "readme" for filtering
- `entityRef`: Full entity reference
- `kind`: Entity kind (Component, API, etc.)
- `namespace`: Entity namespace
- `name`: Entity name
