# Signal Generator

Generate custom Qwik signals for specific facet kinds.

## Overview

The signal generator allows you to create domain-specific signals that make your Qwik components more readable and maintainable.

## createFacetSignal

Generate a custom signal hook for a specific facet kind.

### API

```tsx
createFacetSignal(kind: string): () => Signal<Facet | null>
```

### Parameters

- **`kind`** (string, required): Facet kind identifier

### Returns

- **Hook Function**: A custom Qwik hook that returns a signal containing the facet

### Example

```tsx
import { createFacetSignal } from 'mycelia-kernel-plugin/qwik';

// Create custom signals
export const useDatabase = createFacetSignal('database');
export const useCache = createFacetSignal('cache');
export const useAuth = createFacetSignal('auth');

// Use in components
export const UserList = component$(() => {
  const db = useDatabase();
  const cache = useCache();
  
  if (!db.value) return <div>Database not available</div>;
  
  // Use db methods
  useTask$(({ track }) => {
    const dbValue = track(() => db.value);
    if (!dbValue) return;
    
    dbValue.query('SELECT * FROM users').then(users => {
      // Handle users
    });
  });
  
  return <div>User list</div>;
});
```

### Domain-Specific Signals

Create signals organized by domain:

```tsx
// signals/data-signals.ts
import { createFacetSignal } from 'mycelia-kernel-plugin/qwik';

export const useDatabase = createFacetSignal('database');
export const useCache = createFacetSignal('cache');
export const useStorage = createFacetSignal('storage');

// signals/auth-signals.ts
export const useAuth = createFacetSignal('auth');
export const usePermissions = createFacetSignal('permissions');
```

### With TypeScript

```tsx
// types/facets.ts
interface DatabaseFacet {
  query(sql: string): Promise<any[]>;
  close(): Promise<void>;
}

interface CacheFacet {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
}

// signals/data-signals.ts
import { createFacetSignal } from 'mycelia-kernel-plugin/qwik';
import type { Signal } from '@builder.io/qwik';

export const useDatabase = createFacetSignal('database') as 
  () => Signal<DatabaseFacet | null>;

export const useCache = createFacetSignal('cache') as 
  () => Signal<CacheFacet | null>;

// Use with type safety
export const MyComponent = component$(() => {
  const db = useDatabase(); // Type: Signal<DatabaseFacet | null>
  
  if (db.value) {
    db.value.query('SELECT * FROM users'); // TypeScript knows about query method
  }
});
```

## Complete Example

```tsx
// signals/todo-signals.ts
import { createFacetSignal } from 'mycelia-kernel-plugin/qwik';

export const useTodoStore = createFacetSignal('todoStore');
export const useTodoCache = createFacetSignal('todoCache');
export const useTodoQueue = createFacetSignal('todoQueue');

// components/TodoList.tsx
import { component$, useSignal, useTask$ } from '@builder.io/qwik';
import { useTodoStore, useTodoCache } from '../signals/todo-signals';

export const TodoList = component$(() => {
  const store = useTodoStore();
  const cache = useTodoCache();
  const todos = useSignal<any[]>([]);
  
  useTask$(({ track }) => {
    const storeValue = track(() => store.value);
    if (!storeValue) return;
    
    // Try cache first
    const cacheValue = track(() => cache.value);
    if (cacheValue) {
      cacheValue.get('todos').then(cached => {
        if (cached) {
          todos.value = cached;
        } else {
          // Fetch from store
          storeValue.getAll().then(todosList => {
            todos.value = todosList;
            cacheValue.set('todos', todosList);
          });
        }
      });
    }
  });
  
  if (!store.value) {
    return <div>Todo store not available</div>;
  }
  
  return (
    <ul>
      {todos.value.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
});
```

## See Also

- [Core Bindings](./CORE-BINDINGS.md#usefacet) - Base `useFacet` hook
- [Builder Helpers](./BUILDER-HELPERS.md) - System builder utilities
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation


