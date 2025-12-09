# Store Generator

Generate custom Svelte stores for specific facet kinds.

## Overview

The store generator allows you to create domain-specific stores that make your Svelte components more readable and maintainable.

## createFacetStore

Generate a custom store for a specific facet kind.

### API

```js
createFacetStore(kind: string): () => Readable
```

### Parameters

- **`kind`** (string, required): Facet kind identifier

### Returns

- **Store Function**: A function that returns a readable store containing the facet

### Example

```js
import { createFacetStore } from 'mycelia-kernel-plugin/svelte';

// Create custom stores
export const useDatabase = createFacetStore('database');
export const useCache = createFacetStore('cache');
export const useAuth = createFacetStore('auth');

// Use in components
<script>
  import { useDatabase, useCache } from './stores/data.js';
  
  const dbStore = useDatabase();
  const cacheStore = useCache();
  $: db = $dbStore;
  $: cache = $cacheStore;
</script>
```

### Domain-Specific Stores

Create stores organized by domain:

```js
// stores/data.js
import { createFacetStore } from 'mycelia-kernel-plugin/svelte';

export const useDatabase = createFacetStore('database');
export const useCache = createFacetStore('cache');
export const useStorage = createFacetStore('storage');

// stores/auth.js
export const useAuth = createFacetStore('auth');
export const usePermissions = createFacetStore('permissions');

// stores/communication.js
export const useListeners = createFacetStore('listeners');
export const useQueue = createFacetStore('queue');
```

### Best Practices

1. **Organize by Domain** - Group related stores together:
   ```js
   // stores/data.js
   export const useDatabase = createFacetStore('database');
   export const useCache = createFacetStore('cache');
   
   // stores/auth.js
   export const useAuth = createFacetStore('auth');
   ```

2. **Export from Index** - Create a central export:
   ```js
   // stores/index.js
   export { useDatabase, useCache } from './data.js';
   export { useAuth } from './auth.js';
   ```

3. **Use Descriptive Names** - Match store names to facet kinds:
   ```js
   // ✅ Good
   export const useTodoStore = createFacetStore('todoStore');
   
   // ❌ Bad - unclear
   export const useStore = createFacetStore('todoStore');
   ```

4. **Store Subscription** - Use `$store` syntax in templates:
   ```svelte
   <script>
     const dbStore = useDatabase();
   </script>
   
   {#if $dbStore}
     <div>Database available</div>
   {/if}
   ```

## Complete Example

```js
// stores/todos.js
import { createFacetStore } from 'mycelia-kernel-plugin/svelte';

export const useTodos = createFacetStore('todos');
export const useTodoCache = createFacetStore('todoCache');
export const useTodoQueue = createFacetStore('todoQueue');
```

```svelte
<!-- TodoList.svelte -->
<script>
  import { onMount } from 'svelte';
  import { useTodos, useTodoCache } from '../stores/todos.js';
  
  const todosStore = useTodos();
  const cacheStore = useTodoCache();
  let todos = [];
  
  $: {
    const todosFacet = $todosStore;
    if (todosFacet) {
      todos = todosFacet.getAll();
    }
  }
</script>

{#if $todosStore}
  <ul>
    {#each todos as todo (todo.id)}
      <li>{todo.text}</li>
    {/each}
  </ul>
{:else}
  <div>Todo store not available</div>
{/if}
```

## Benefits

1. **Readability** - `useDatabase()` is clearer than `useFacet('database')`
2. **Maintainability** - Change facet kind in one place
3. **Type Safety** - Can add TypeScript types for better IDE support
4. **Consistency** - Standardized store naming across codebase
5. **Discoverability** - Easier to find available facets via autocomplete

## Comparison

**Without Generator:**
```svelte
<script>
  import { useFacet } from 'mycelia-kernel-plugin/svelte';
  
  const dbStore = useFacet('database');
  const cacheStore = useFacet('cache');
  const authStore = useFacet('auth');
</script>
```

**With Generator:**
```svelte
<script>
  import { useDatabase, useCache, useAuth } from './stores';
  
  const dbStore = useDatabase();
  const cacheStore = useCache();
  const authStore = useAuth();
</script>
```

The generator version is more readable and maintainable.

## See Also

- [Core Bindings](./CORE-BINDINGS.md#usefacet) - Base `useFacet` store
- [Builder Helpers](./BUILDER-HELPERS.md) - System builder utilities
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation




