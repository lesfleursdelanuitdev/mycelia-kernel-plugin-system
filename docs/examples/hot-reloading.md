# Hot Reloading Example

This example demonstrates how to use the `reload()` method for hot reloading plugins in a development environment.

## Basic Hot Reload

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin';

// Create some hooks
const useDatabase = createHook({
  kind: 'database',
  attach: true,
  source: import.meta.url,
  fn: () => new Facet('database', { attach: true })
    .add({
      async query(sql) {
        console.log('Query:', sql);
        return { rows: [] };
      }
    })
});

const useCache = createHook({
  kind: 'cache',
  attach: true,
  source: import.meta.url,
  fn: () => new Facet('cache', { attach: true })
    .add({
      async get(key) {
        console.log('Cache get:', key);
        return null;
      }
    })
});

const useAuth = createHook({
  kind: 'auth',
  attach: true,
  source: import.meta.url,
  fn: () => new Facet('auth', { attach: true })
    .add({
      async login(username, password) {
        console.log('Login:', username);
        return { token: 'fake-token' };
      }
    })
});

// Create system
const system = new StandalonePluginSystem('my-app');

// Initial build
await system.use(useDatabase).build();
console.log('Initial build complete');
console.log('Available:', system.capabilities); // ['database']

// Hot reload - add cache
await system.reload();
await system.use(useCache).build();
console.log('After reload + cache:', system.capabilities); // ['database', 'cache']

// Hot reload - add auth
await system.reload();
await system.use(useAuth).build();
console.log('After reload + auth:', system.capabilities); // ['database', 'cache', 'auth']

// All plugins are active
const db = system.find('database');
const cache = system.find('cache');
const auth = system.find('auth');

await db.query('SELECT * FROM users');
await cache.get('user:123');
await auth.login('user', 'pass');
```

## Development Workflow

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin';

const system = new StandalonePluginSystem('dev-app');

// Helper function for hot reloading
async function hotReload(hook) {
  await system.reload();
  await system.use(hook).build();
  console.log('Hot reloaded:', hook.kind);
}

// Initial setup
const useDatabase = createHook({
  kind: 'database',
  attach: true,
  source: import.meta.url,
  fn: () => new Facet('database', { attach: true })
});

await system.use(useDatabase).build();

// During development, add features incrementally
const useCache = createHook({
  kind: 'cache',
  attach: true,
  source: import.meta.url,
  fn: () => new Facet('cache', { attach: true })
});

await hotReload(useCache);

const useAuth = createHook({
  kind: 'auth',
  attach: true,
  source: import.meta.url,
  fn: () => new Facet('auth', { attach: true })
});

await hotReload(useAuth);
```

## Hot Reload with Lifecycle

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin';

const lifecycle = [];

const useDatabase = createHook({
  kind: 'database',
  attach: true,
  source: import.meta.url,
  fn: () => new Facet('database', { attach: true })
    .onInit(async () => {
      lifecycle.push('database:init');
      console.log('Database initialized');
    })
    .onDispose(async () => {
      lifecycle.push('database:dispose');
      console.log('Database disposed');
    })
});

const system = new StandalonePluginSystem('app');

// Initial build
await system.use(useDatabase).build();
console.log(lifecycle); // ['database:init']

// Hot reload - dispose is called
await system.reload();
console.log(lifecycle); // ['database:init', 'database:dispose']

// Rebuild - init is called again
await system.build();
console.log(lifecycle); // ['database:init', 'database:dispose', 'database:init']
```

## Hot Reload with Configuration Updates

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin';

const useDatabase = createHook({
  kind: 'database',
  attach: true,
  source: import.meta.url,
  fn: (ctx) => {
    const config = ctx.config?.database || {};
    return new Facet('database', { attach: true })
      .add({
        host: config.host || 'localhost',
        port: config.port || 5432
      })
      .onInit(async ({ ctx }) => {
        const config = ctx.config?.database || {};
        console.log('Database connecting to:', config.host, config.port);
      });
  }
});

const system = new StandalonePluginSystem('app');

// Initial build with dev config
await system.use(useDatabase).build({
  config: { database: { host: 'localhost', port: 5432 } }
});

const db = system.find('database');
console.log(db.host); // 'localhost'

// Hot reload with production config
await system.reload();
await system.build({
  config: { database: { host: 'prod.example.com', port: 5432 } }
});

const db2 = system.find('database');
console.log(db2.host); // 'prod.example.com'
```

## Key Points

1. **Preserves Hooks**: Existing hooks are preserved after `reload()`
2. **Clean Slate**: All facets are disposed, providing a clean state
3. **Incremental Extension**: Add plugins incrementally during development
4. **Lifecycle Aware**: `onDispose` is called during reload, `onInit` on rebuild
5. **Configuration Updates**: Can update configuration during hot reload

