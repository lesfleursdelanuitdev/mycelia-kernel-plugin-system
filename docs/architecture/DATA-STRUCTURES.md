# Data Structures

## Overview

This document describes the internal data structures used by the Mycelia Plugin System builder. Understanding these structures is helpful for debugging, extending the system, and optimizing performance.

## Plan Structure

The build plan is the result of the verification phase and the input to the execution phase.

### Structure

```javascript
{
  resolvedCtx: {
    ms: null | MessageSystem,        // Message system (null for standalone)
    config: {                         // Configuration keyed by facet kind
      [facetKind: string]: any
    },
    debug: boolean,                   // Debug flag
    graphCache?: DependencyGraphCache // Optional graph cache
  },
  orderedKinds: string[],            // Topologically sorted facet kinds
  facetsByKind: {                     // Map of kind → Facet instance
    [kind: string]: Facet
  },
  graphCache?: DependencyGraphCache   // Updated cache (if provided)
}
```

### Properties

#### `resolvedCtx` (Object, required)

The resolved context object containing system-level configuration and services.

**Structure:**
- `ms` - Message system instance (optional, `null` for standalone systems)
- `config` - Configuration object keyed by facet kind
- `debug` - Debug flag (`true` or `false`)
- `graphCache` - Optional dependency graph cache (added during verification)

**Example:**
```javascript
{
  ms: null,
  config: {
    database: { host: 'localhost', port: 5432 },
    cache: { maxSize: 1000 }
  },
  debug: false,
  graphCache: DependencyGraphCache
}
```

#### `orderedKinds` (Array<string>, required)

Array of facet kinds in topological sort order (dependency order).

**Ordering:**
- Facets with no dependencies come first
- Dependencies come before dependents
- Facets at the same dependency level can be in any order

**Example:**
```javascript
['database', 'logger', 'cache', 'processor']
// database and logger have no deps
// cache depends on database
// processor depends on cache
```

#### `facetsByKind` (Object, required)

Map of facet kind to Facet instance.

**Structure:**
```javascript
{
  'database': Facet,
  'cache': Facet,
  'logger': Facet
}
```

**Important:**
- Only one facet per kind (overwrite hooks replace previous facets)
- Facets are created but not initialized
- Facets are not attached to subsystem

#### `graphCache` (DependencyGraphCache, optional)

Updated dependency graph cache (if provided during verification).

**See Also:** [Dependency Graph Cache Structure](#dependency-graph-cache-structure)

### Usage

```javascript
// Create plan
const builder = system._builder;
builder.plan();
const plan = builder.getPlan();

// Access plan properties
console.log('Context:', plan.resolvedCtx);
console.log('Order:', plan.orderedKinds);
console.log('Facets:', Object.keys(plan.facetsByKind));
```

---

## Dependency Graph Structure

The dependency graph represents relationships between facets.

### Structure

```javascript
{
  graph: Map<string, Set<string>>,  // dep → Set(dependents)
  indeg: Map<string, number>,       // kind → indegree
  kinds: string[]                   // All facet kinds
}
```

### Properties

#### `graph` (Map<string, Set<string>>, required)

Dependency graph mapping dependencies to their dependents.

**Structure:**
- **Key**: Dependency facet kind
- **Value**: Set of facet kinds that depend on this dependency

**Example:**
```javascript
Map {
  'database' => Set(['cache', 'processor']),
  'cache' => Set(['processor']),
  'logger' => Set([]),
  'processor' => Set([])
}
```

**Interpretation:**
- `database` is a dependency of `cache` and `processor`
- `cache` is a dependency of `processor`
- `logger` and `processor` have no dependents

#### `indeg` (Map<string, number>, required)

Indegree map tracking how many dependencies each facet has.

**Structure:**
- **Key**: Facet kind
- **Value**: Number of dependencies (indegree)

**Example:**
```javascript
Map {
  'database' => 0,   // No dependencies
  'cache' => 1,     // Depends on database
  'logger' => 0,    // No dependencies
  'processor' => 2  // Depends on cache and database
}
```

**Usage:**
- Used in topological sort (Kahn's algorithm)
- Nodes with indegree 0 can be processed first
- Cycle detection: if any node has indegree > 0 after sort, cycle exists

#### `kinds` (Array<string>, required)

Array of all facet kinds in the graph.

**Example:**
```javascript
['database', 'cache', 'logger', 'processor']
```

### Graph Building

The graph is built from two sources:

1. **Hook dependencies** (`hook.required`):
   ```javascript
   // Hook requires 'database'
   graph.get('database').add('cache');
   indeg.set('cache', (indeg.get('cache') || 0) + 1);
   ```

2. **Facet dependencies** (`facet.getDependencies()`):
   ```javascript
   // Facet depends on 'cache'
   graph.get('cache').add('processor');
   indeg.set('processor', (indeg.get('processor') || 0) + 1);
   ```

### Visualization

```
database ──┐
           ├──> cache ──> processor
logger ────┘
```

**Graph representation:**
- `database` → `cache` → `processor`
- `database` → `processor` (direct)
- `logger` (independent)

---

## Hook Metadata Structure

Hook metadata is extracted during verification and used for ordering and validation.

### Structure

```javascript
{
  [kind: string]: [
    {
      hook: Function,              // Hook function
      required: string[],         // Required dependencies
      source: string,             // Source file/URL
      overwrite: boolean,         // Whether hook allows overwrite
      version: string,            // Hook version
      index: number              // Position in array (0-based)
    },
    // ... more hooks of same kind (for overwrite hooks)
  ]
}
```

### Properties

#### `hook` (Function, required)

The hook function itself.

**Signature:**
```javascript
hook(ctx: Object, api: Object, subsystem: BaseSubsystem): Facet
```

#### `required` (Array<string>, required)

Array of facet kinds this hook requires.

**Example:**
```javascript
['database', 'logger']
```

#### `source` (string, required)

Source file or URL where the hook is defined.

**Example:**
```javascript
'file:///path/to/hook.js'
// or
import.meta.url
```

#### `overwrite` (boolean, required)

Whether the hook allows overwriting existing facets of the same kind.

**Rules:**
- `true`: Hook can replace previous hooks of the same kind
- `false`: Hook cannot overwrite (throws error if duplicate)

#### `version` (string, required)

Hook version (semantic version string).

**Example:**
```javascript
'1.0.0'
// or
'2.1.3'
```

#### `index` (number, required)

Zero-based index in the array of hooks of this kind.

**Usage:**
- Tracks registration order
- Used for overwrite hook dependencies (overwrite hook depends on previous hook)

**Example:**
```javascript
// First hook of kind 'cache'
{ hook: useCache, index: 0, ... }

// Second hook of kind 'cache' (overwrite)
{ hook: useCacheOverwrite, index: 1, ... }
```

### Example

```javascript
{
  'database': [
    {
      hook: useDatabase,
      required: [],
      source: 'file:///hooks/database.js',
      overwrite: false,
      version: '1.0.0',
      index: 0
    }
  ],
  'cache': [
    {
      hook: useCache,
      required: ['database'],
      source: 'file:///hooks/cache.js',
      overwrite: false,
      version: '1.0.0',
      index: 0
    },
    {
      hook: useCacheOverwrite,
      required: ['cache'],  // Depends on previous cache hook
      source: 'file:///hooks/cache-v2.js',
      overwrite: true,
      version: '2.0.0',
      index: 1
    }
  ]
}
```

---

## Cache Entry Structure

Cache entries store topological sort results for dependency graphs.

### Structure

```javascript
{
  valid: boolean,              // Whether result is valid
  orderedKinds?: string[],    // Topologically sorted kinds (if valid)
  error?: string               // Error message (if invalid)
}
```

### Properties

#### `valid` (boolean, required)

Whether the cached result is valid.

**Values:**
- `true`: Valid result, `orderedKinds` contains sorted array
- `false`: Invalid result (cycle detected), `error` contains message

#### `orderedKinds` (Array<string>, optional)

Topologically sorted array of facet kinds (only present if `valid === true`).

**Example:**
```javascript
['database', 'logger', 'cache', 'processor']
```

#### `error` (string, optional)

Error message for invalid results (only present if `valid === false`).

**Example:**
```javascript
'Facet dependency cycle detected among: database, cache, processor'
```

### Valid Entry Example

```javascript
{
  valid: true,
  orderedKinds: ['database', 'cache', 'processor']
}
```

### Invalid Entry Example

```javascript
{
  valid: false,
  error: 'Facet dependency cycle detected among: database, cache, processor'
}
```

### Cache Key

Cache keys are generated from sorted facet kinds:

```javascript
createCacheKey(['processor', 'database', 'cache']);
// Result: 'cache,database,processor'
```

**Note:** Keys are sorted for consistency regardless of input order.

---

## Context Structure

The context object provides system-level configuration and services.

### Structure

```javascript
{
  ms: null | MessageSystem,        // Message system (null for standalone)
  config: {                         // Configuration keyed by facet kind
    [facetKind: string]: {
      [configKey: string]: any
    }
  },
  debug: boolean,                   // Debug flag
  graphCache?: DependencyGraphCache  // Optional graph cache
}
```

### Properties

#### `ms` (null | MessageSystem, optional)

Message system instance. Always `null` for standalone plugin systems.

**Important:** Do not rely on `ms` in standalone systems.

#### `config` (Object, required)

Configuration object keyed by facet kind.

**Structure:**
```javascript
{
  'database': {
    host: 'localhost',
    port: 5432,
    database: 'mydb'
  },
  'cache': {
    maxSize: 1000,
    ttl: 3600
  }
}
```

**Access Pattern:**
```javascript
const dbConfig = ctx.config?.database || {};
const host = dbConfig.host || 'localhost';
```

#### `debug` (boolean, required)

Debug flag indicating whether debug logging should be enabled.

**Values:**
- `true`: Debug logging enabled
- `false`: Debug logging disabled

#### `graphCache` (DependencyGraphCache, optional)

Optional dependency graph cache for performance optimization.

**Usage:**
- Provided during build to cache topological sort results
- Reused across builds for better performance

### Context Resolution

Context is resolved by merging:
1. Base context from `subsystem.ctx`
2. Additional context from `builder.withCtx()`

**Merging Strategy:**
- **Shallow merge** for most properties
- **Deep merge** for `config` objects

**Example:**
```javascript
// Base context
subsystem.ctx = {
  config: { database: { host: 'localhost' } },
  debug: false
};

// Additional context
builder.withCtx({
  config: { database: { port: 5432 } },
  debug: true
});

// Resolved context
{
  config: { database: { host: 'localhost', port: 5432 } },
  debug: true
}
```

---

## Facet Structure

Facets are instances of the `Facet` class. This section documents the structure as used in the builder.

### Facet Instance

```javascript
Facet {
  kind: string,                    // Facet kind identifier
  source: string,                  // Source file/URL
  contract?: string,                // Contract name (optional)
  required?: string[],              // Required dependencies (optional)
  version?: string,                 // Facet version (optional)
  orderIndex?: number,             // Order index (set during build)
  
  // Methods
  getKind(): string,
  getSource(): string,
  getContract(): string | undefined,
  getDependencies(): string[],
  getVersion(): string,
  shouldAttach(): boolean,
  shouldOverwrite(): boolean,
  init(ctx, api, subsystem): Promise<void>,
  dispose(subsystem): Promise<void>,
  
  // Facet methods (added via .add())
  [methodName]: Function
}
```

### Key Properties

#### `kind` (string, required)

Facet kind identifier. Must match hook `kind`.

#### `source` (string, required)

Source file or URL where the facet is defined.

#### `contract` (string, optional)

Contract name for validation (optional).

#### `required` (Array<string>, optional)

Required dependencies (optional, can also come from `getDependencies()`).

#### `orderIndex` (number, optional)

Order index set during build (used for multiple facets of same kind).

### Facet Methods

Facets expose methods added via `.add()`:

```javascript
const facet = new Facet('database', { attach: true })
  .add({
    async query(sql) { /* ... */ },
    async execute(sql) { /* ... */ }
  });

// Methods available:
facet.query(sql);
facet.execute(sql);
```

---

## Data Flow

### Verification Phase Data Flow

```
Hooks Array
    ↓
extractHookMetadata()
    ↓
hooksByKind: { kind → [metadata] }
    ↓
orderHooksByDependencies()
    ↓
orderedHooks: [Function]
    ↓
executeHooksAndCreateFacets()
    ↓
facetsByKind: { kind → Facet }
    ↓
buildDepGraph()
    ↓
graph: { graph, indeg, kinds }
    ↓
topoSort()
    ↓
orderedKinds: [string]
    ↓
Plan: { resolvedCtx, orderedKinds, facetsByKind }
```

### Execution Phase Data Flow

```
Plan
    ↓
subsystem.ctx = resolvedCtx
    ↓
Separate facets (new vs overwrite)
    ↓
Remove overwritten facets
    ↓
FacetManager.addMany()
    ↓
Group by dependency level
    ↓
Initialize in parallel (per level)
    ↓
Attach facets
    ↓
Build children
```

---

## Memory Considerations

### Plan Caching

Plans are cached in `SubsystemBuilder`:
- **Memory**: One plan per builder instance
- **Invalidation**: On context change or manual `invalidate()`
- **Size**: Depends on number of facets and context size

### Dependency Graph Cache

Graph cache uses LRU eviction:
- **Memory**: `capacity` entries (default 100)
- **Entry size**: ~100-500 bytes per entry (depends on facet count)
- **Total**: ~10-50 KB for default capacity

### Facet Storage

Facets are stored in:
- `facetsByKind` (plan): Temporary during verification
- `FacetManager.#facets`: Permanent after installation
- **Memory**: Depends on facet implementation

### Optimization Tips

1. **Reuse graph cache** across builds to reduce memory
2. **Limit plan caching** if memory is constrained
3. **Clear unused caches** when done
4. **Monitor cache size** using `getStats()`

**See Also:** [Performance](./PERFORMANCE.md#memory-considerations) for optimization strategies.

---

## Type Definitions

### TypeScript-style Definitions

```typescript
interface BuildPlan {
  resolvedCtx: ResolvedContext;
  orderedKinds: string[];
  facetsByKind: Record<string, Facet>;
  graphCache?: DependencyGraphCache;
}

interface ResolvedContext {
  ms: null | MessageSystem;
  config: Record<string, any>;
  debug: boolean;
  graphCache?: DependencyGraphCache;
}

interface DependencyGraph {
  graph: Map<string, Set<string>>;
  indeg: Map<string, number>;
  kinds: string[];
}

interface HookMetadata {
  hook: Function;
  required: string[];
  source: string;
  overwrite: boolean;
  version: string;
  index: number;
}

interface CacheEntry {
  valid: boolean;
  orderedKinds?: string[];
  error?: string;
}
```

---

## See Also

- [Build Process](./BUILD-PROCESS.md) - How data structures are used in the build process
- [Builder Components](./BUILDER-COMPONENTS.md) - Components that create and use these structures
- [Performance](./PERFORMANCE.md) - Memory optimization strategies
- [Troubleshooting](./TROUBLESHOOTING.md) - Debugging with data structures

