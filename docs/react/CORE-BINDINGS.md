# Core Bindings

Core React bindings for the Mycelia Plugin System: Provider and basic hooks.

## MyceliaProvider

Provides Mycelia system to React tree with automatic lifecycle management.

### API

```tsx
<MyceliaProvider 
  build={() => Promise<System>}
  fallback?: React.ReactNode
>
  {children}
</MyceliaProvider>
```

### Parameters

- **`build`** (Function, required): Async function that returns a built system instance
- **`fallback`** (ReactNode, optional): Component to render while system is building
- **`children`** (ReactNode, required): Child components

### Behavior

- **On Mount:** Calls `build()` function and stores system in context
- **On Unmount:** Automatically calls `system.dispose()` to clean up
- **Error Handling:** Throws errors to React error boundaries
- **Loading State:** Renders `fallback` (or `null`) while building

### Example

```tsx
import { MyceliaProvider } from 'mycelia-kernel-plugin/react';
import { useBase, useDatabase, useListeners } from 'mycelia-kernel-plugin';

const buildSystem = () =>
  useBase('my-app')
    .use(useDatabase)
    .use(useListeners)
    .build();

function App() {
  return (
    <MyceliaProvider 
      build={buildSystem}
      fallback={<div>Loading system...</div>}
    >
      <MyComponent />
    </MyceliaProvider>
  );
}
```

### Best Practices

1. **Create builder outside component** - Avoid recreating on every render:
   ```tsx
   // ✅ Good
   const buildSystem = () => useBase('app').use(useDatabase).build();
   
   // ❌ Bad - recreates on every render
   function App() {
     const buildSystem = () => useBase('app').use(useDatabase).build();
   }
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
import { useMycelia } from 'mycelia-kernel-plugin/react';

function MyComponent() {
  const system = useMycelia();
  
  // Access system methods
  const db = system.find('database');
  const capabilities = system.capabilities;
  
  // Use system directly
  system.listeners.enableListeners();
  
  return <div>System: {system.name}</div>;
}
```

### Use Cases

- Access system-level methods (`find()`, `reload()`, `dispose()`)
- Get system metadata (`name`, `capabilities`)
- Access facets not attached to system
- Direct system manipulation

## useFacet

Get a facet by kind from the system with reactive updates.

### API

```tsx
const facet = useFacet(kind);
```

### Parameters

- **`kind`** (string, required): Facet kind identifier (e.g., 'database', 'cache')

### Returns

- **`facet`** (Object | null): The facet instance, or `null` if not found

### Behavior

- **Initial Value:** Gets facet immediately on mount
- **Updates:** Re-checks facet when system or kind changes
- **Null Handling:** Returns `null` if facet doesn't exist

### Example

```tsx
import { useFacet } from 'mycelia-kernel-plugin/react';

function UserList() {
  const db = useFacet('database');
  
  useEffect(() => {
    if (!db) return;
    
    db.query('SELECT * FROM users').then(users => {
      // Handle users
    });
  }, [db]);
  
  if (!db) {
    return <div>Database not available</div>;
  }
  
  return <div>Database ready</div>;
}
```

### Use Cases

- Access facet methods and properties
- Conditional rendering based on facet availability
- React to facet changes (when system reloads)

### Best Practices

1. **Null Checks** - Always check if facet exists:
   ```tsx
   const db = useFacet('database');
   if (!db) return <div>Not available</div>;
   ```

2. **Dependency Arrays** - Include facet in useEffect dependencies:
   ```tsx
   useEffect(() => {
     if (!db) return;
     // Use db
   }, [db]);
   ```

3. **Custom Hooks** - Use `createFacetHook` for domain-specific hooks:
   ```tsx
   const useDatabase = createFacetHook('database');
   // Then: const db = useDatabase();
   ```

## Complete Example

```tsx
import { 
  MyceliaProvider, 
  useMycelia, 
  useFacet 
} from 'mycelia-kernel-plugin/react';
import { useBase, useDatabase, useListeners } from 'mycelia-kernel-plugin';

// System builder
const buildSystem = () =>
  useBase('todo-app')
    .config('database', { host: 'localhost' })
    .use(useDatabase)
    .use(useListeners)
    .build();

// App component
function App() {
  return (
    <MyceliaProvider build={buildSystem}>
      <TodoList />
    </MyceliaProvider>
  );
}

// Component using facets
function TodoList() {
  const system = useMycelia();
  const db = useFacet('database');
  
  useEffect(() => {
    if (!db) return;
    
    // Enable listeners
    system.listeners.enableListeners();
    
    // Use database
    db.query('SELECT * FROM todos').then(todos => {
      console.log('Todos:', todos);
    });
  }, [system, db]);
  
  if (!db) {
    return <div>Database loading...</div>;
  }
  
  return <div>Todo list ready</div>;
}
```

## See Also

- [Listener Helpers](./LISTENER-HELPERS.md) - Event listener utilities
- [Queue Helpers](./QUEUE-HELPERS.md) - Queue management utilities
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation

