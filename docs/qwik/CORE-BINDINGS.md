# Core Bindings

Core Qwik bindings for the Mycelia Plugin System: Provider and basic hooks.

## MyceliaProvider

Provides Mycelia system to Qwik tree with automatic lifecycle management.

### API

```tsx
<MyceliaProvider 
  build={() => Promise<System>}
  fallback?: QRL
>
  {children}
</MyceliaProvider>
```

### Parameters

- **`build`** (Function, required): Async function that returns a built system instance
- **`fallback`** (QRL, optional): Component to render while system is building
- **`children`** (QRL, required): Child components

### Behavior

- **On Mount:** Calls `build()` function and stores system in context
- **On Unmount:** Automatically calls `system.dispose()` to clean up
- **Error Handling:** Throws errors to Qwik error boundaries
- **Loading State:** Renders `fallback` (or default loading) while building

### Example

```tsx
import { MyceliaProvider } from 'mycelia-kernel-plugin/qwik';
import { useBase, useDatabase, useListeners } from 'mycelia-kernel-plugin';

const buildSystem = () =>
  useBase('my-app')
    .use(useDatabase)
    .use(useListeners)
    .build();

export default component$(() => {
  return (
    <MyceliaProvider 
      build={buildSystem}
      fallback={<div>Loading system...</div>}
    >
      <MyComponent />
    </MyceliaProvider>
  );
});
```

### Best Practices

1. **Create builder outside component** - Avoid recreating on every render:
   ```tsx
   // ✅ Good
   const buildSystem = () => useBase('app').use(useDatabase).build();
   
   // ❌ Bad - recreates on every render
   export default component$(() => {
     const buildSystem = () => useBase('app').use(useDatabase).build();
   });
   ```

2. **Use error boundaries** - Wrap provider to catch build errors:
   ```tsx
   <ErrorBoundary>
     <MyceliaProvider build={buildSystem}>
       <App />
     </MyceliaProvider>
   </ErrorBoundary>
   ```

3. **Provide fallback** - Show loading state during build:
   ```tsx
   <MyceliaProvider 
     build={buildSystem}
     fallback={<Spinner />}
   >
     <App />
   </MyceliaProvider>
   ```

## useMycelia

Get the Mycelia system instance from context.

### API

```tsx
const system = useMycelia();
```

### Returns

- **`system`** (StandalonePluginSystem): The system instance

### Throws

- **Error:** If used outside `MyceliaProvider`

### Example

```tsx
import { useMycelia } from 'mycelia-kernel-plugin/qwik';

export const MyComponent = component$(() => {
  const system = useMycelia();
  
  // Access system methods
  const db = system.find('database');
  const capabilities = system.capabilities;
  
  // Use system directly
  system.listeners.enableListeners();
  
  return <div>System: {system.name}</div>;
});
```

### Use Cases

- Access system-level methods (`find()`, `reload()`, `dispose()`)
- Get system metadata (`name`, `capabilities`)
- Access facets not attached to system
- Direct system manipulation

## useMyceliaContext

Get the full Mycelia context (system, loading, error signals).

### API

```tsx
const { system, loading, error } = useMyceliaContext();
```

### Returns

- **`system`** (Signal): Signal containing the system instance
- **`loading`** (Signal): Signal containing loading state (boolean)
- **`error`** (Signal): Signal containing error (Error | null)

### Example

```tsx
import { useMyceliaContext } from 'mycelia-kernel-plugin/qwik';

export const MyComponent = component$(() => {
  const { system, loading, error } = useMyceliaContext();
  
  if (loading.value) return <div>Loading...</div>;
  if (error.value) return <div>Error: {error.value.message}</div>;
  
  return <div>System: {system.value.name}</div>;
});
```

## useFacet

Get a facet by kind from the system with reactive updates.

### API

```tsx
const facet = useFacet(kind);
```

### Parameters

- **`kind`** (string, required): Facet kind identifier (e.g., 'database', 'cache')

### Returns

- **`facet`** (Signal): Signal containing the facet instance, or null if not found

### Behavior

- **Initial Value:** Gets facet immediately on mount
- **Updates:** Re-checks facet when system changes
- **Null Handling:** Returns signal with `null` if facet doesn't exist

### Example

```tsx
import { useFacet } from 'mycelia-kernel-plugin/qwik';

export const UserList = component$(() => {
  const db = useFacet('database');
  
  useTask$(({ track }) => {
    const dbValue = track(() => db.value);
    if (!dbValue) return;
    
    dbValue.query('SELECT * FROM users').then(users => {
      // Handle users
    });
  });
  
  if (!db.value) {
    return <div>Database not available</div>;
  }
  
  return <div>Database ready</div>;
});
```

### Use Cases

- Access facet methods and properties
- Conditional rendering based on facet availability
- React to facet changes (when system reloads)

### Best Practices

1. **Null Checks** - Always check if facet exists:
   ```tsx
   const db = useFacet('database');
   if (!db.value) return <div>Not available</div>;
   ```

2. **Track in useTask$** - Track facet signal in useTask$:
   ```tsx
   useTask$(({ track }) => {
     const db = track(() => facet.value);
     if (!db) return;
     // Use db
   });
   ```

3. **Custom Signals** - Use `createFacetSignal` for domain-specific signals:
   ```tsx
   const useDatabase = createFacetSignal('database');
   // Then: const db = useDatabase();
   ```

## Complete Example

```tsx
import { 
  MyceliaProvider, 
  useMycelia, 
  useFacet 
} from 'mycelia-kernel-plugin/qwik';
import { useBase, useDatabase, useListeners } from 'mycelia-kernel-plugin';

// System builder
const buildSystem = () =>
  useBase('todo-app')
    .config('database', { host: 'localhost' })
    .use(useDatabase)
    .use(useListeners)
    .build();

// App component
export default component$(() => {
  return (
    <MyceliaProvider build={buildSystem}>
      <TodoList />
    </MyceliaProvider>
  );
});

// Component using facets
export const TodoList = component$(() => {
  const system = useMycelia();
  const db = useFacet('database');
  
  useTask$(({ track }) => {
    const dbValue = track(() => db.value);
    if (!dbValue) return;
    
    // Enable listeners
    system.listeners.enableListeners();
    
    // Use database
    dbValue.query('SELECT * FROM todos').then(todos => {
      console.log('Todos:', todos);
    });
  });
  
  if (!db.value) {
    return <div>Database loading...</div>;
  }
  
  return <div>Todo list ready</div>;
});
```

## See Also

- [Listener Helpers](./LISTENER-HELPERS.md) - Event listener utilities
- [Queue Helpers](./QUEUE-HELPERS.md) - Queue management utilities
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation


