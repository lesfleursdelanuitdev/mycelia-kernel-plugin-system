# Troubleshooting

## Overview

This guide helps you diagnose and resolve common issues when building plugin systems. Each section covers a specific problem type with symptoms, causes, and solutions.

## Common Errors

### Dependency Cycle Errors

**Error Message:**
```
Error: Facet dependency cycle detected among: database, cache, processor
```

**Symptoms:**
- Build fails during verification phase
- Error lists facets involved in cycle

**Causes:**
- Circular dependencies between facets
- Hook `required` creates cycle
- Facet `getDependencies()` creates cycle

**How to Identify:**
1. Check error message for involved facets
2. Trace dependency chain:
   - `database` requires `cache`
   - `cache` requires `processor`
   - `processor` requires `database` ← Cycle!

**Solutions:**

1. **Remove circular dependency:**
   ```javascript
   // ❌ Problem: Circular dependency
   export const useDatabase = createHook({
     required: ['cache'], // Database requires cache
     // ...
   });
   
   export const useCache = createHook({
     required: ['database'], // Cache requires database
     // ...
   });
   
   // ✅ Solution: Remove one dependency
   export const useDatabase = createHook({
     // Remove 'cache' requirement
     // ...
   });
   ```

2. **Use optional dependencies:**
   ```javascript
   // Make dependency optional
   export const useDatabase = createHook({
     // Don't require 'cache'
     fn: (ctx, api, subsystem) => {
       // Check for cache at runtime
       const cache = subsystem.find('cache');
       // ...
     }
   });
   ```

3. **Introduce intermediate facet:**
   ```javascript
   // Add intermediate facet to break cycle
   export const useBase = createHook({
     // Base facet with no dependencies
   });
   
   export const useDatabase = createHook({
     required: ['base'], // Depends on base
   });
   
   export const useCache = createHook({
     required: ['base'], // Also depends on base
   });
   ```

**Debugging:**
```javascript
// Inspect dependency graph
const builder = system._builder;
builder.plan();
const plan = builder.getPlan();

// Check dependencies manually
for (const [kind, facet] of Object.entries(plan.facetsByKind)) {
  const deps = facet.getDependencies();
  console.log(`${kind} depends on:`, deps);
}
```

**See Also:** [Build Process](./BUILD-PROCESS.md#dependency-graph-building) for graph building details.

---

### Missing Dependency Errors

**Error Message:**
```
Error: Hook 'cache' (from file:///path/to/hook.js) requires missing facet 'database'.
```

**Symptoms:**
- Build fails during verification
- Error indicates which hook and missing dependency

**Causes:**
- Hook declares `required` dependency that doesn't exist
- Dependency hook not registered
- Dependency hook fails to create facet
- Dependency hook registered after dependent

**Solutions:**

1. **Register dependency hook:**
   ```javascript
   // ✅ Solution: Register dependency first
   system
     .use(useDatabase)  // Register dependency
     .use(useCache)      // Then dependent
     .build();
   ```

2. **Check hook registration order:**
   ```javascript
   // Hook order doesn't matter (topological sort handles it)
   // But dependency must be registered
   system
     .use(useCache)      // Requires 'database'
     .use(useDatabase)   // Provides 'database'
     .build(); // ✅ Works (topological sort orders correctly)
   ```

3. **Verify hook creates facet:**
   ```javascript
   // Check hook returns a facet
   export const useDatabase = createHook({
     kind: 'database',
     fn: (ctx, api, subsystem) => {
       return new Facet('database', { attach: true })
         .add({ /* methods */ }); // ✅ Returns facet
     }
   });
   ```

4. **Check hook kind matches:**
   ```javascript
   // Hook kind must match dependency name
   export const useDatabase = createHook({
     kind: 'database', // ✅ Matches 'database' requirement
     // ...
   });
   ```

**Debugging:**
```javascript
// Check which facets are created
const builder = system._builder;
builder.plan();
const plan = builder.getPlan();

console.log('Available facets:', Object.keys(plan.facetsByKind));
console.log('Required by cache:', useCache.required);
```

---

### Contract Validation Errors

**Error Message:**
```
Error: Facet 'database' (from file:///path/to/hook.js) failed contract validation for 'database': FacetContract 'database': facet is missing required methods: query
```

**Symptoms:**
- Build fails during verification
- Error indicates missing methods/properties

**Causes:**
- Facet doesn't implement all contract methods
- Facet missing required properties
- Custom validation fails

**Solutions:**

1. **Implement all required methods:**
   ```javascript
   // ❌ Problem: Missing method
   export const useDatabase = createHook({
     contract: 'database',
     fn: (ctx, api, subsystem) => {
       return new Facet('database', { contract: 'database' })
         .add({
           // Missing 'query' method
           execute() { /* ... */ }
         });
     }
   });
   
   // ✅ Solution: Implement all methods
   export const useDatabase = createHook({
     contract: 'database',
     fn: (ctx, api, subsystem) => {
       return new Facet('database', { contract: 'database' })
         .add({
           query() { /* ... */ },    // ✅ Required method
           execute() { /* ... */ }   // ✅ Required method
         });
     }
   });
   ```

2. **Add required properties:**
   ```javascript
   // ✅ Solution: Add required properties
   return new Facet('cache', { contract: 'cache' })
     .add({
       _store: new Map(),  // ✅ Required property
       maxSize: 1000       // ✅ Required property
     });
   ```

3. **Fix custom validation:**
   ```javascript
   // Check custom validation requirements
   const contract = defaultContractRegistry.get('database');
   // Review contract.validate() function
   ```

**Debugging:**
```javascript
// Check contract requirements
const contract = defaultContractRegistry.get('database');
console.log('Required methods:', contract.requiredMethods);
console.log('Required properties:', contract.requiredProperties);
```

**See Also:** [Facet Contracts](../facet-contracts/FACET-CONTRACTS-OVERVIEW.md) for contract details.

---

### Duplicate Facet Errors

**Error Message:**
```
Error: Duplicate facet kind 'database' from [file:///path1.js] and [file:///path2.js]. Neither hook nor facet allows overwrite.
```

**Symptoms:**
- Build fails during verification
- Error indicates duplicate facet kinds

**Causes:**
- Multiple hooks create same facet kind
- Neither hook allows overwrite
- Neither facet allows overwrite

**Solutions:**

1. **Allow overwrite:**
   ```javascript
   // ✅ Solution: Allow overwrite
   export const useDatabaseV2 = createHook({
     kind: 'database',
     overwrite: true, // ✅ Allow overwrite
     fn: (ctx, api, subsystem) => {
       return new Facet('database', { 
         overwrite: true // ✅ Also allow on facet
       })
       .add({ /* methods */ });
     }
   });
   ```

2. **Use different kind:**
   ```javascript
   // ✅ Solution: Use different kind
   export const useDatabaseV2 = createHook({
     kind: 'database-v2', // Different kind
     // ...
   });
   ```

3. **Remove duplicate hook:**
   ```javascript
   // ✅ Solution: Remove duplicate
   system
     .use(useDatabase)  // Keep one
     // .use(useDatabaseDuplicate) // Remove duplicate
     .build();
   ```

**Debugging:**
```javascript
// Check which hooks create same kind
const hooks = system.hooks;
for (const hook of hooks) {
  console.log(`Hook ${hook.source} creates kind: ${hook.kind}`);
}
```

---

### Invalid Plan Errors

**Error Message:**
```
Error: buildSubsystem: invalid plan
```

**Symptoms:**
- Build fails during execution
- Plan structure is invalid

**Causes:**
- Plan is `null` or `undefined`
- Plan structure is malformed
- `orderedKinds` and `facetsByKind` mismatch

**Solutions:**

1. **Ensure plan exists:**
   ```javascript
   // ✅ Solution: Create plan first
   builder.plan();
   const plan = builder.getPlan();
   if (!plan) {
     throw new Error('Failed to create plan');
   }
   await builder.build();
   ```

2. **Check plan structure:**
   ```javascript
   const plan = builder.getPlan();
   console.log('Plan structure:', {
     hasResolvedCtx: !!plan.resolvedCtx,
     hasOrderedKinds: Array.isArray(plan.orderedKinds),
     hasFacetsByKind: typeof plan.facetsByKind === 'object'
   });
   ```

3. **Validate consistency:**
   ```javascript
   // Check orderedKinds matches facetsByKind
   const plan = builder.getPlan();
   const kindsInOrder = new Set(plan.orderedKinds);
   const kindsInFacets = new Set(Object.keys(plan.facetsByKind));
   
   console.log('Kinds in order:', kindsInOrder);
   console.log('Kinds in facets:', kindsInFacets);
   ```

---

## Debugging Strategies

### Enable Debug Mode

Enable debug logging to see detailed build information:

```javascript
const system = new StandalonePluginSystem('app', {
  debug: true, // ✅ Enable debug
  config: { /* ... */ }
});
```

**Debug Output:**
- Hook execution
- Facet creation
- Dependency resolution
- Contract validation
- Build progress

### Inspect Build Plan

Inspect the build plan to understand what will be built:

```javascript
const builder = system._builder;
builder.plan();
const plan = builder.getPlan();

console.log('Build Plan:');
console.log('- Facets to install:', plan.orderedKinds);
console.log('- Facet count:', Object.keys(plan.facetsByKind).length);
console.log('- Context:', plan.resolvedCtx);
```

### Check Dependency Graph

Inspect the dependency graph to understand relationships:

```javascript
// Build plan includes dependency information
const builder = system._builder;
builder.plan();

// Check facet dependencies
const plan = builder.getPlan();
for (const [kind, facet] of Object.entries(plan.facetsByKind)) {
  const deps = facet.getDependencies();
  console.log(`${kind} depends on:`, deps);
}
```

### Trace Hook Execution

Trace hook execution to find where issues occur:

```javascript
// Add logging to hooks
export const useDatabase = createHook({
  kind: 'database',
  fn: (ctx, api, subsystem) => {
    console.log('Executing database hook');
    try {
      const facet = new Facet('database', { attach: true })
        .add({ /* methods */ });
      console.log('Database facet created');
      return facet;
    } catch (error) {
      console.error('Database hook failed:', error);
      throw error;
    }
  }
});
```

### Validate Hook Metadata

Check hook metadata to ensure it's correct:

```javascript
// Check hook properties
console.log('Hook kind:', useDatabase.kind);
console.log('Hook required:', useDatabase.required);
console.log('Hook source:', useDatabase.source);
console.log('Hook overwrite:', useDatabase.overwrite);
```

### Inspect Facet Structure

Inspect facet structure to verify it's correct:

```javascript
const builder = system._builder;
builder.plan();
const plan = builder.getPlan();

for (const [kind, facet] of Object.entries(plan.facetsByKind)) {
  console.log(`Facet ${kind}:`);
  console.log('- Kind:', facet.getKind());
  console.log('- Source:', facet.getSource());
  console.log('- Contract:', facet.getContract());
  console.log('- Dependencies:', facet.getDependencies());
  console.log('- Methods:', Object.getOwnPropertyNames(facet));
}
```

### Check Cache State

Inspect cache state to understand caching behavior:

```javascript
const cache = new DependencyGraphCache(100);
const stats = cache.getStats();

console.log('Cache stats:', {
  capacity: stats.capacity,
  size: stats.size,
  keys: stats.keys
});

// Check specific cache entry
const result = cache.get('database,cache,logger');
console.log('Cache result:', result);
```

## Performance Issues

### Slow Builds

**Symptoms:**
- Builds take > 1 second
- High CPU usage

**Debugging:**
```javascript
// Measure build time
const start = performance.now();
await system.build();
const end = performance.now();
console.log(`Build time: ${end - start}ms`);

// Profile individual phases
const builder = system._builder;
const verifyStart = performance.now();
builder.plan();
const verifyEnd = performance.now();
console.log(`Verification: ${verifyEnd - verifyStart}ms`);
```

**Solutions:**
1. Use graph cache
2. Optimize facet initialization
3. Flatten dependency graph
4. Profile slow hooks

**See Also:** [Performance](./PERFORMANCE.md#build-performance) for optimization strategies.

### High Memory Usage

**Symptoms:**
- Memory grows with each build
- Memory not released

**Debugging:**
```javascript
// Monitor memory
const before = process.memoryUsage().heapUsed;
await system.build();
const after = process.memoryUsage().heapUsed;
console.log(`Memory used: ${(after - before) / 1024} KB`);
```

**Solutions:**
1. Invalidate plans when done
2. Limit cache capacity
3. Dispose unused facets
4. Fix memory leaks

**See Also:** [Performance](./PERFORMANCE.md#memory-considerations) for memory optimization.

### Cache Not Working

**Symptoms:**
- Cache hit rate is low
- Builds always create new plans

**Debugging:**
```javascript
// Check plan cache
const builder = system._builder;
const ctxHash1 = builder._builder.#hashCtx(builder._builder.#ctx);
builder.plan();
const ctxHash2 = builder._builder.#hashCtx(builder._builder.#ctx);
console.log('Context changed:', ctxHash1 !== ctxHash2);

// Check graph cache
const cache = new DependencyGraphCache(100);
const stats = cache.getStats();
console.log('Cache size:', stats.size);
```

**Solutions:**
1. Minimize context changes
2. Reuse graph cache
3. Group similar builds

**See Also:** [Performance](./PERFORMANCE.md#caching-strategies) for caching strategies.

## Initialization Failures

### Facet Initialization Errors

**Symptoms:**
- Build fails during execution
- Error in `onInit` callback
- Transaction rollback occurs

**Debugging:**
```javascript
// Add error handling to onInit
.onInit(async ({ ctx, api, subsystem, facet }) => {
  try {
    console.log('Initializing facet...');
    // Initialization code
    console.log('Facet initialized');
  } catch (error) {
    console.error('Initialization failed:', error);
    throw error; // Re-throw to trigger rollback
  }
});
```

**Common Causes:**
- Missing configuration
- Network/file I/O failures
- Invalid dependencies
- Resource allocation failures

**Solutions:**
1. Validate configuration in `onInit`
2. Handle errors gracefully
3. Use try-catch for async operations
4. Provide fallback values

### Transaction Rollback

**Symptoms:**
- Build fails partway through
- Some facets installed, others not
- Error indicates rollback

**Understanding Rollback:**
- All facets in transaction are disposed
- All facets are removed from registry
- System returns to pre-build state

**Debugging:**
```javascript
// Check which facets were added before failure
// (Facets are removed during rollback, so check logs)
```

**Solutions:**
1. Fix initialization errors
2. Ensure dependencies are available
3. Validate configuration before initialization
4. Handle errors in `onInit` callbacks

**See Also:** [Facet Manager Transaction](../core-concepts/FACET-MANAGER-TRANSACTION.md) for rollback details.

## Diagnostic Tools

### Plan Inspector

Helper function to inspect build plans:

```javascript
function inspectPlan(system) {
  const builder = system._builder;
  builder.plan();
  const plan = builder.getPlan();
  
  if (!plan) {
    console.log('No plan available');
    return;
  }
  
  console.log('=== Build Plan ===');
  console.log('Facets to install:', plan.orderedKinds);
  console.log('Facet count:', Object.keys(plan.facetsByKind).length);
  console.log('\n=== Dependencies ===');
  
  for (const [kind, facet] of Object.entries(plan.facetsByKind)) {
    const deps = facet.getDependencies();
    if (deps.length > 0) {
      console.log(`${kind} depends on:`, deps);
    }
  }
  
  console.log('\n=== Context ===');
  console.log('Debug:', plan.resolvedCtx.debug);
  console.log('Config keys:', Object.keys(plan.resolvedCtx.config || {}));
}

inspectPlan(system);
```

### Dependency Graph Visualizer

Helper function to visualize dependency graph:

```javascript
function visualizeDependencies(system) {
  const builder = system._builder;
  builder.plan();
  const plan = builder.getPlan();
  
  // Build simple dependency map
  const deps = {};
  for (const [kind, facet] of Object.entries(plan.facetsByKind)) {
    deps[kind] = facet.getDependencies();
  }
  
  console.log('=== Dependency Graph ===');
  for (const [kind, dependencies] of Object.entries(deps)) {
    if (dependencies.length > 0) {
      console.log(`${kind} → [${dependencies.join(', ')}]`);
    } else {
      console.log(`${kind} (no dependencies)`);
    }
  }
}

visualizeDependencies(system);
```

### Cache Inspector

Helper function to inspect cache:

```javascript
function inspectCache(cache) {
  const stats = cache.getStats();
  console.log('=== Cache Stats ===');
  console.log(`Size: ${stats.size}/${stats.capacity}`);
  console.log('Keys:', stats.keys.slice(0, 10).join(', '));
  
  // Check a few entries
  for (const key of stats.keys.slice(0, 5)) {
    const entry = cache.get(key);
    console.log(`\n${key}:`, {
      valid: entry.valid,
      orderedKinds: entry.orderedKinds?.slice(0, 5),
      error: entry.error
    });
  }
}

inspectCache(graphCache);
```

## Step-by-Step Debugging Process

### 1. Reproduce the Issue

```javascript
// Create minimal reproduction
const system = new StandalonePluginSystem('test');
system
  .use(problematicHook)
  .build();
```

### 2. Enable Debug Mode

```javascript
const system = new StandalonePluginSystem('test', { debug: true });
```

### 3. Inspect the Plan

```javascript
const builder = system._builder;
builder.plan();
const plan = builder.getPlan();
console.log('Plan:', plan);
```

### 4. Check Dependencies

```javascript
// Verify all dependencies exist
for (const [kind, facet] of Object.entries(plan.facetsByKind)) {
  const deps = facet.getDependencies();
  for (const dep of deps) {
    if (!plan.facetsByKind[dep]) {
      console.error(`Missing dependency: ${kind} requires ${dep}`);
    }
  }
}
```

### 5. Validate Contracts

```javascript
// Check contract validation
for (const [kind, facet] of Object.entries(plan.facetsByKind)) {
  const contractName = facet.getContract();
  if (contractName) {
    const contract = defaultContractRegistry.get(contractName);
    if (!contract) {
      console.error(`Contract not found: ${contractName}`);
    }
  }
}
```

### 6. Test Initialization

```javascript
// Test facet initialization manually
const facet = plan.facetsByKind['database'];
try {
  await facet.init(plan.resolvedCtx, system.api, system);
  console.log('Initialization successful');
} catch (error) {
  console.error('Initialization failed:', error);
}
```

## Getting Help

If you're still stuck after trying these solutions:

1. **Check error messages** - They often contain helpful information
2. **Review documentation** - See related docs linked in error sections
3. **Inspect build plan** - Use diagnostic tools to understand state
4. **Create minimal reproduction** - Isolate the issue
5. **Check examples** - See if similar patterns work

## See Also

- [Build Process](./BUILD-PROCESS.md) - Understanding the build process
- [Builder Components](./BUILDER-COMPONENTS.md) - Component details
- [Performance](./PERFORMANCE.md) - Performance-related issues
- [Facet Manager](../core-concepts/FACET-MANAGER.md) - Facet installation details
- [Facet Contracts](../facet-contracts/FACET-CONTRACTS-OVERVIEW.md) - Contract validation

