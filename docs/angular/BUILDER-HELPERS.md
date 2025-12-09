# Builder Helpers

Utilities for creating reusable system builders in Angular applications.

## Overview

Builder helpers make it easy to create and reuse system builders, keeping Angular code clean and avoiding direct `useBase` calls in services.

## createAngularSystemBuilder

Create a reusable system builder function.

### API

```ts
createAngularSystemBuilder(
  name: string,
  configure: (builder: UseBaseBuilder) => UseBaseBuilder
): () => Promise<StandalonePluginSystem>
```

### Parameters

- **`name`** (string, required): System name
- **`configure`** (Function, required): Configuration function that receives builder and returns configured builder

### Returns

- **`build`** (Function): Async function that builds and returns the system

### Example

```ts
import { createAngularSystemBuilder } from 'mycelia-kernel-plugin/angular';
import { useDatabase, useListeners, useQueue } from 'mycelia-kernel-plugin';

const buildTodoSystem = createAngularSystemBuilder(
  'todo-app',
  (b) =>
    b
      .config('database', { host: 'localhost' })
      .config('queue', { capacity: 100 })
      .use(useDatabase)
      .use(useListeners)
      .use(useQueue)
);

// Use in service
@Injectable({ providedIn: 'root' })
export class MyceliaService {
  private service = createMyceliaService(buildTodoSystem);
  // ...
}
```

### With Environment Configuration

```ts
const buildSystem = createAngularSystemBuilder(
  'my-app',
  (b) => {
    const config = {
      database: {
        host: environment.dbHost || 'localhost',
        port: environment.dbPort || 5432
      },
      queue: {
        capacity: environment.queueCapacity || 1000
      }
    };
    
    return b
      .config('database', config.database)
      .config('queue', config.queue)
      .use(useDatabase)
      .use(useQueue);
  }
);
```

## Complete Example

```ts
// systems/todo-system.ts
import { createAngularSystemBuilder } from 'mycelia-kernel-plugin/angular';
import { useDatabase, useListeners, useQueue } from 'mycelia-kernel-plugin';

export const buildTodoSystem = createAngularSystemBuilder(
  'todo-app',
  (b) =>
    b
      .config('database', {
        host: environment.dbHost || 'localhost',
        port: 5432
      })
      .config('listeners', {
        registrationPolicy: 'multiple'
      })
      .config('queue', {
        capacity: 1000,
        policy: 'drop-oldest'
      })
      .use(useDatabase)
      .use(useListeners)
      .use(useQueue)
      .onInit(async (api, ctx) => {
        console.log(`Todo system ${api.name} initialized`);
      })
);

// services/mycelia.service.ts
import { Injectable } from '@angular/core';
import { createMyceliaService } from 'mycelia-kernel-plugin/angular';
import { buildTodoSystem } from '../systems/todo-system';

@Injectable({ providedIn: 'root' })
export class MyceliaService {
  private service = createMyceliaService(buildTodoSystem);

  get system$() {
    return this.service.system$;
  }

  useFacet(kind: string) {
    return this.service.useFacet(kind);
  }
}
```

## See Also

- [useBase](../standalone/STANDALONE-PLUGIN-SYSTEM.md#usebase) - Core builder API
- [Core Bindings](./CORE-BINDINGS.md) - Service factory and basic utilities
- [Service Generator](./SERVICE-GENERATOR.md) - Custom service generation


