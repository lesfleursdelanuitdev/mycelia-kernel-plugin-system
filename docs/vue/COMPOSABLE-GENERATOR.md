# Facet Composable Generator

Generate custom Vue composables for specific facet kinds.

## Overview

The facet composable generator allows you to create domain-specific composables that make your Vue components more readable and maintainable.

## createFacetComposable

Generate a custom composable for a specific facet kind.

### API

```js
createFacetComposable(kind: string): () => Ref<Facet | null>
```

### Parameters

- **`kind`** (string, required): Facet kind identifier

### Returns

- **Composable Function**: A custom Vue composable that returns a ref to the facet

### Example

```js
import { createFacetComposable } from 'mycelia-kernel-plugin/vue';

// Create custom composables
export const useDatabase = createFacetComposable('database');
export const useCache = createFacetComposable('cache');
export const useAuth = createFacetComposable('auth');

// Use in components
export default {
  setup() {
    const db = useDatabase();
    const cache = useCache();
    
    if (!db.value) return { db: null };
    
    // Use db methods
    watch(db, (newDb) => {
      if (newDb) {
        newDb.query('SELECT * FROM users').then(users => {
          // Handle users
        });
      }
    }, { immediate: true });
    
    return { db, cache };
  }
}
```

### With Composition API (script setup)

```vue
<template>
  <div v-if="db">Database available</div>
  <div v-else>Database not available</div>
</template>

<script setup>
import { watch } from 'vue';
import { useDatabase, useCache } from './composables/data';

const db = useDatabase();
const cache = useCache();

watch(db, (newDb) => {
  if (newDb) {
    newDb.query('SELECT * FROM users').then(users => {
      console.log('Users:', users);
    });
  }
}, { immediate: true });
</script>
```

### Domain-Specific Composables

Create composables organized by domain:

```js
// composables/data.js
import { createFacetComposable } from 'mycelia-kernel-plugin/vue';

export const useDatabase = createFacetComposable('database');
export const useCache = createFacetComposable('cache');
export const useStorage = createFacetComposable('storage');

// composables/auth.js
export const useAuth = createFacetComposable('auth');
export const usePermissions = createFacetComposable('permissions');

// composables/communication.js
export const useListeners = createFacetComposable('listeners');
export const useQueue = createFacetComposable('queue');
```

### With TypeScript

```ts
// types/facets.ts
interface DatabaseFacet {
  query(sql: string): Promise<any[]>;
  close(): Promise<void>;
}

interface CacheFacet {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
}

// composables/data.ts
import { createFacetComposable } from 'mycelia-kernel-plugin/vue';
import type { Ref } from 'vue';

export const useDatabase = createFacetComposable('database') as () => Ref<DatabaseFacet | null>;
export const useCache = createFacetComposable('cache') as () => Ref<CacheFacet | null>;

// Use with type safety
export default {
  setup() {
    const db = useDatabase(); // Type: Ref<DatabaseFacet | null>
    
    watch(db, (newDb) => {
      if (newDb) {
        newDb.query('SELECT * FROM users'); // TypeScript knows about query method
      }
    });
  }
}
```

### Best Practices

1. **Organize by Domain** - Group related composables together:
   ```js
   // composables/data.js
   export const useDatabase = createFacetComposable('database');
   export const useCache = createFacetComposable('cache');
   
   // composables/auth.js
   export const useAuth = createFacetComposable('auth');
   ```

2. **Export from Index** - Create a central export:
   ```js
   // composables/index.js
   export { useDatabase, useCache } from './data';
   export { useAuth } from './auth';
   ```

3. **Use Descriptive Names** - Match composable names to facet kinds:
   ```js
   // ✅ Good
   export const useTodoStore = createFacetComposable('todoStore');
   
   // ❌ Bad - unclear
   export const useStore = createFacetComposable('todoStore');
   ```

4. **Null Checks** - Always check for null:
   ```vue
   <template>
     <div v-if="db">Database available</div>
   </template>
   
   <script setup>
   const db = useDatabase();
   </script>
   ```

5. **Remember .value** - Use `.value` in script, but Vue unwraps in templates:
   ```vue
   <template>
     <!-- Vue automatically unwraps refs -->
     <div>{{ db.name }}</div>
   </template>
   
   <script setup>
   const db = useDatabase();
   // In script, use .value
   if (db.value) {
     db.value.query('...');
   }
   </script>
   ```

## Complete Example

```js
// composables/todo.js
import { createFacetComposable } from 'mycelia-kernel-plugin/vue';

export const useTodoStore = createFacetComposable('todoStore');
export const useTodoCache = createFacetComposable('todoCache');
export const useTodoQueue = createFacetComposable('todoQueue');
```

```vue
<!-- components/TodoList.vue -->
<template>
  <ul v-if="store">
    <li v-for="todo in todos" :key="todo.id">
      {{ todo.text }}
    </li>
  </ul>
  <div v-else>Todo store not available</div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useTodoStore, useTodoCache } from '../composables/todo';

const store = useTodoStore();
const cache = useTodoCache();
const todos = ref([]);

watch(store, (newStore) => {
  if (!newStore) return;
  
  // Try cache first
  cache.value?.get('todos').then(cached => {
    if (cached) {
      todos.value = cached;
    } else {
      // Fetch from store
      newStore.getAll().then(items => {
        todos.value = items;
        cache.value?.set('todos', items);
      });
    }
  });
}, { immediate: true });
</script>
```

## Benefits

1. **Readability** - `useDatabase()` is clearer than `useFacet('database')`
2. **Maintainability** - Change facet kind in one place
3. **Type Safety** - Can add TypeScript types for better IDE support
4. **Consistency** - Standardized composable naming across codebase
5. **Discoverability** - Easier to find available facets via autocomplete

## Comparison

**Without Generator:**
```vue
<script setup>
import { useFacet } from 'mycelia-kernel-plugin/vue';

const db = useFacet('database');
const cache = useFacet('cache');
const auth = useFacet('auth');
</script>
```

**With Generator:**
```vue
<script setup>
import { useDatabase, useCache, useAuth } from './composables';

const db = useDatabase();
const cache = useCache();
const auth = useAuth();
</script>
```

The generator version is more readable and maintainable.

## See Also

- [Core Bindings](./CORE-BINDINGS.md#usefacet) - Base `useFacet` composable
- [Builder Helpers](./BUILDER-HELPERS.md) - System builder utilities
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation

