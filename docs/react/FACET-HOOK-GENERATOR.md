# Facet Hook Generator

Generate custom React hooks for specific facet kinds.

## Overview

The facet hook generator allows you to create domain-specific hooks that make your React components more readable and maintainable.

## createFacetHook

Generate a custom hook for a specific facet kind.

### API

```tsx
createFacetHook(kind: string): () => Facet | null
```

### Parameters

- **`kind`** (string, required): Facet kind identifier

### Returns

- **Hook Function**: A custom React hook that returns the facet

### Example

```tsx
import { createFacetHook } from 'mycelia-kernel-plugin/react';

// Create custom hooks
export const useDatabase = createFacetHook('database');
export const useCache = createFacetHook('cache');
export const useAuth = createFacetHook('auth');

// Use in components
function UserList() {
  const db = useDatabase();
  const cache = useCache();
  
  if (!db) return <div>Database not available</div>;
  
  // Use db methods
  useEffect(() => {
    db.query('SELECT * FROM users').then(users => {
      // Handle users
    });
  }, [db]);
  
  return <div>User list</div>;
}
```

### Domain-Specific Hooks

Create hooks organized by domain:

```tsx
// hooks/data-hooks.ts
import { createFacetHook } from 'mycelia-kernel-plugin/react';

export const useDatabase = createFacetHook('database');
export const useCache = createFacetHook('cache');
export const useStorage = createFacetHook('storage');

// hooks/auth-hooks.ts
export const useAuth = createFacetHook('auth');
export const usePermissions = createFacetHook('permissions');

// hooks/communication-hooks.ts
export const useListeners = createFacetHook('listeners');
export const useQueue = createFacetHook('queue');
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

// hooks/data-hooks.ts
import { createFacetHook } from 'mycelia-kernel-plugin/react';

export const useDatabase = createFacetHook('database') as () => DatabaseFacet | null;
export const useCache = createFacetHook('cache') as () => CacheFacet | null;

// Use with type safety
function MyComponent() {
  const db = useDatabase(); // Type: DatabaseFacet | null
  
  if (db) {
    db.query('SELECT * FROM users'); // TypeScript knows about query method
  }
}
```

### Best Practices

1. **Organize by Domain** - Group related hooks together:
   ```tsx
   // hooks/data.ts
   export const useDatabase = createFacetHook('database');
   export const useCache = createFacetHook('cache');
   
   // hooks/auth.ts
   export const useAuth = createFacetHook('auth');
   ```

2. **Export from Index** - Create a central export:
   ```tsx
   // hooks/index.ts
   export { useDatabase, useCache } from './data';
   export { useAuth } from './auth';
   ```

3. **Use Descriptive Names** - Match hook names to facet kinds:
   ```tsx
   // ✅ Good
   export const useTodoStore = createFacetHook('todoStore');
   
   // ❌ Bad - unclear
   export const useStore = createFacetHook('todoStore');
   ```

4. **Null Checks** - Always check for null:
   ```tsx
   const db = useDatabase();
   if (!db) return <div>Not available</div>;
   ```

## Complete Example

```tsx
// hooks/todo-hooks.ts
import { createFacetHook } from 'mycelia-kernel-plugin/react';

export const useTodoStore = createFacetHook('todoStore');
export const useTodoCache = createFacetHook('todoCache');
export const useTodoQueue = createFacetHook('todoQueue');

// components/TodoList.tsx
import { useTodoStore, useTodoCache } from '../hooks/todo-hooks';

function TodoList() {
  const store = useTodoStore();
  const cache = useTodoCache();
  
  const [todos, setTodos] = useState([]);
  
  useEffect(() => {
    if (!store) return;
    
    // Try cache first
    cache?.get('todos').then(cached => {
      if (cached) {
        setTodos(cached);
      } else {
        // Fetch from store
        store.getAll().then(todos => {
          setTodos(todos);
          cache?.set('todos', todos);
        });
      }
    });
  }, [store, cache]);
  
  if (!store) {
    return <div>Todo store not available</div>;
  }
  
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

## Benefits

1. **Readability** - `useDatabase()` is clearer than `useFacet('database')`
2. **Maintainability** - Change facet kind in one place
3. **Type Safety** - Can add TypeScript types for better IDE support
4. **Consistency** - Standardized hook naming across codebase
5. **Discoverability** - Easier to find available facets via autocomplete

## Comparison

**Without Generator:**
```tsx
function MyComponent() {
  const db = useFacet('database');
  const cache = useFacet('cache');
  const auth = useFacet('auth');
  // ...
}
```

**With Generator:**
```tsx
function MyComponent() {
  const db = useDatabase();
  const cache = useCache();
  const auth = useAuth();
  // ...
}
```

The generator version is more readable and maintainable.

## See Also

- [Core Bindings](./CORE-BINDINGS.md#usefacet) - Base `useFacet` hook
- [Builder Helpers](./BUILDER-HELPERS.md) - System builder utilities
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation

