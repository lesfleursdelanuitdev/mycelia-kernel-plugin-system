# Multiple Facets Example

This example demonstrates how to register and use multiple facets of the same kind.

## Complete Example

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

// Create multiple logger implementations
export const useFileLogger = createHook({
  kind: 'logger',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('logger', {
      attach: true,
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      name: 'file-logger',
      log(message) {
        console.log(`[FILE] ${message}`);
      }
    })
    .onInit(async ({ ctx }) => {
      console.log('File logger initialized');
    });
  }
});

export const useConsoleLogger = createHook({
  kind: 'logger',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('logger', {
      attach: true,
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      name: 'console-logger',
      log(message) {
        console.log(`[CONSOLE] ${message}`);
      }
    })
    .onInit(async ({ ctx }) => {
      console.log('Console logger initialized');
    });
  }
});

export const useNetworkLogger = createHook({
  kind: 'logger',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('logger', {
      attach: true,
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      name: 'network-logger',
      log(message) {
        console.log(`[NETWORK] ${message}`);
      }
    })
    .onInit(async ({ ctx }) => {
      console.log('Network logger initialized');
    });
  }
});

// Create and use the system
async function main() {
  const system = new StandalonePluginSystem('my-app', {
    config: {}
  });

  // Register multiple facets of the same kind
  await system
    .use(useFileLogger)
    .use(useConsoleLogger)
    .use(useNetworkLogger)
    .build();

  // Access facets
  
  // 1. Get the latest facet (highest orderIndex)
  const latestLogger = system.find('logger');
  console.log('Latest logger:', latestLogger.name);
  latestLogger.log('This goes to the latest logger');
  
  // 2. Get all facets by kind
  const facetManager = system.api.__facets;
  const allLoggers = facetManager.getAll('logger');
  console.log(`\nTotal loggers: ${allLoggers.length}`);
  
  // 3. Access by insertion order (zero-based index)
  const firstLogger = facetManager.getByIndex('logger', 0);
  const secondLogger = facetManager.getByIndex('logger', 1);
  const thirdLogger = facetManager.getByIndex('logger', 2);
  
  console.log('\nLoggers by insertion order:');
  firstLogger.log('First logger (file)');
  secondLogger.log('Second logger (console)');
  thirdLogger.log('Third logger (network)');
  
  // 4. Access by topological sort order (orderIndex)
  const loggersByOrder = allLoggers.sort((a, b) => a.orderIndex - b.orderIndex);
  console.log('\nLoggers by topological order:');
  loggersByOrder.forEach(logger => {
    console.log(`  - ${logger.name} (orderIndex: ${logger.orderIndex})`);
  });
  
  // 5. Use all loggers
  console.log('\nBroadcasting to all loggers:');
  allLoggers.forEach(logger => {
    logger.log('Broadcast message');
  });
  
  // Cleanup
  await system.dispose();
}

main().catch(console.error);
```

## Explanation

### 1. Multiple Facets of Same Kind

You can register multiple facets with the same `kind`:

```javascript
system
  .use(useFileLogger)      // kind: 'logger'
  .use(useConsoleLogger)    // kind: 'logger'
  .use(useNetworkLogger)    // kind: 'logger'
  .build();
```

### 2. Accessing Facets

**Latest Facet (Recommended):**
```javascript
const logger = system.find('logger');  // Gets the latest facet
```

**All Facets:**
```javascript
const allLoggers = system.api.__facets.getAll('logger');
```

**By Insertion Order:**
```javascript
const first = facetManager.getByIndex('logger', 0);   // First registered
const second = facetManager.getByIndex('logger', 1);  // Second registered
```

**By Topological Order:**
```javascript
const logger = system.find('logger', orderIndex);  // By orderIndex
```

### 3. Use Cases

**Multiple Implementations:**
- Different backends (PostgreSQL, MySQL, SQLite)
- Different loggers (file, console, network)
- Different caches (memory, Redis, local storage)

**Broadcasting:**
- Log to multiple destinations
- Update multiple caches
- Notify multiple services

**Fallback Chain:**
- Try primary, fallback to secondary
- Load balance across implementations
- A/B testing different implementations

## Expected Output

```
File logger initialized
Console logger initialized
Network logger initialized
Latest logger: network-logger
[NETWORK] This goes to the latest logger

Total loggers: 3

Loggers by insertion order:
[FILE] First logger (file)
[CONSOLE] Second logger (console)
[NETWORK] Third logger (network)

Loggers by topological order:
  - file-logger (orderIndex: 0)
  - console-logger (orderIndex: 1)
  - network-logger (orderIndex: 2)

Broadcasting to all loggers:
[FILE] Broadcast message
[CONSOLE] Broadcast message
[NETWORK] Broadcast message
```

## Key Points

1. **Multiple facets** of the same kind are allowed
2. **`find(kind)`** returns the latest facet (highest orderIndex)
3. **`getAll(kind)`** returns all facets of that kind
4. **`getByIndex(kind, index)`** accesses by insertion order
5. **`find(kind, orderIndex)`** accesses by topological sort order

## Next Steps

- Implement a fallback chain pattern
- Create a broadcasting utility
- Build a load balancer across multiple implementations
- Use multiple facets for A/B testing

