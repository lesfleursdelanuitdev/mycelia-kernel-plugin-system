# Core Bindings

Core Svelte bindings for the Mycelia Plugin System: Context and basic stores.

## setMyceliaSystem

Provide Mycelia system to Svelte component tree using context.

### API

```js
setMyceliaSystem(system: StandalonePluginSystem): Context
```

### Parameters

- **`system`** (StandalonePluginSystem, required): The built system instance

### Returns

- **Context object** with `system`, `loading`, and `error` stores

### Behavior

- **Context Setup:** Sets up Svelte context for the component tree
- **Stores:** Creates writable stores for system, loading, and error states
- **Access:** Child components can access via `getMyceliaSystem()` or `useMycelia()`

### Example

```svelte
<!-- App.svelte -->
<script>
  import { onMount } from 'svelte';
  import { setMyceliaSystem } from 'mycelia-kernel-plugin/svelte';
  import { useBase, useDatabase, useListeners } from 'mycelia-kernel-plugin';

  let system;
  let loading = true;
  let error = null;
  
  onMount(async () => {
    try {
      system = await useBase('my-app')
        .use(useDatabase)
        .use(useListeners)
        .build();
      
      setMyceliaSystem(system);
      loading = false;
    } catch (err) {
      error = err;
      loading = false;
    }
  });
</script>

{#if loading}
  <div>Loading system...</div>
{:else if error}
  <div>Error: {error.message}</div>
{:else}
  <MyComponent />
{/if}
```

### Best Practices

1. **Build in onMount** - Build system when component mounts:
   ```svelte
   <script>
     import { onMount } from 'svelte';
     import { setMyceliaSystem } from 'mycelia-kernel-plugin/svelte';
     
     let system;
     onMount(async () => {
       system = await buildSystem();
       setMyceliaSystem(system);
     });
   </script>
   ```

2. **Handle errors** - Wrap build in try-catch:
   ```svelte
   <script>
     let error = null;
     onMount(async () => {
       try {
         system = await buildSystem();
         setMyceliaSystem(system);
       } catch (err) {
         error = err;
       }
     });
   </script>
   ```

3. **Cleanup on destroy** - Dispose system when component is destroyed:
   ```svelte
   <script>
     import { onDestroy } from 'svelte';
     
     onDestroy(async () => {
       if (system) {
         await system.dispose();
       }
     });
   </script>
   ```

## getMyceliaSystem

Get the Mycelia system store from context.

### API

```js
const systemStore = getMyceliaSystem();
```

### Returns

- **`systemStore`** (Writable): Writable store containing the system instance

### Throws

- **Error:** If used outside `setMyceliaSystem` context

### Example

```svelte
<script>
  import { getMyceliaSystem } from 'mycelia-kernel-plugin/svelte';
  
  const systemStore = getMyceliaSystem();
  $: system = $systemStore;
  
  // Access system methods
  $: db = system?.find('database');
  $: capabilities = system?.capabilities;
</script>

<div>System: {system?.name}</div>
```

### Use Cases

- Access system-level methods (`find()`, `reload()`, `dispose()`)
- Get system metadata (`name`, `capabilities`)
- Access facets not attached to system
- Direct system manipulation

## getMyceliaContext

Get the full Mycelia context including system, loading, and error stores.

### API

```js
const { system, loading, error } = getMyceliaContext();
```

### Returns

- **`system`** (Writable): Writable store containing the system instance
- **`loading`** (Writable): Writable store indicating if system is building
- **`error`** (Writable): Writable store containing any build error

### Example

```svelte
<script>
  import { getMyceliaContext } from 'mycelia-kernel-plugin/svelte';
  
  const { system, loading, error } = getMyceliaContext();
</script>

{#if $loading}
  <div>Loading...</div>
{:else if $error}
  <div>Error: {$error.message}</div>
{:else}
  <div>System ready: {$system.name}</div>
{/if}
```

## useMycelia

Get the Mycelia system store (convenience wrapper for `getMyceliaSystem`).

### API

```js
const systemStore = useMycelia();
```

### Returns

- **`systemStore`** (Writable): Writable store containing the system instance

### Example

```svelte
<script>
  import { useMycelia } from 'mycelia-kernel-plugin/svelte';
  
  const systemStore = useMycelia();
  $: system = $systemStore;
  
  // Use system directly
  $: if (system) {
    system.listeners.enableListeners();
  }
</script>
```

## useFacet

Get a facet by kind from the system with reactivity.

### API

```js
const facetStore = useFacet(kind);
```

### Parameters

- **`kind`** (string, required): Facet kind identifier (e.g., 'database', 'cache')

### Returns

- **`facetStore`** (Readable): Readable store containing the facet instance, or `null` if not found

### Behavior

- **Reactive:** Automatically updates when system changes (e.g., after reload)
- **Null Handling:** Returns store with `null` if facet doesn't exist
- **Store Subscription:** Use `$facetStore` in templates for automatic subscription

### Example

```svelte
<script>
  import { useFacet } from 'mycelia-kernel-plugin/svelte';
  
  const dbStore = useFacet('database');
  $: db = $dbStore;
</script>

{#if db}
  <div>Database ready</div>
{:else}
  <div>Database not available</div>
{/if}
```

### Use Cases

- Access facet methods and properties
- Conditional rendering based on facet availability
- React to facet changes (when system reloads)

### Best Practices

1. **Store Subscription** - Use `$store` syntax in templates:
   ```svelte
   <script>
     const dbStore = useFacet('database');
   </script>
   
   {#if $dbStore}
     <div>Database available</div>
   {/if}
   ```

2. **Reactive Statements** - Use `$:` for derived state:
   ```svelte
   <script>
     const dbStore = useFacet('database');
     $: db = $dbStore;
     
     $: if (db) {
       db.query('SELECT * FROM users').then(users => {
         // Handle users
       });
     }
   </script>
   ```

3. **Custom Stores** - Use `createFacetStore` for domain-specific stores:
   ```js
   const useDatabase = createFacetStore('database');
   // Then: const dbStore = useDatabase();
   ```

## Complete Example

```svelte
<!-- App.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { setMyceliaSystem, useFacet, useMycelia } from 'mycelia-kernel-plugin/svelte';
  import { useBase, useDatabase, useListeners } from 'mycelia-kernel-plugin';
  import TodoList from './TodoList.svelte';

  let system;
  let loading = true;
  
  onMount(async () => {
    try {
      system = await useBase('todo-app')
        .config('database', { host: 'localhost' })
        .use(useDatabase)
        .use(useListeners)
        .build();
      
      setMyceliaSystem(system);
      loading = false;
    } catch (error) {
      console.error('Failed to build system:', error);
      loading = false;
    }
  });
  
  onDestroy(async () => {
    if (system) {
      await system.dispose();
    }
  });
</script>

{#if loading}
  <div>Loading system...</div>
{:else if system}
  <TodoList />
{/if}
```

```svelte
<!-- TodoList.svelte -->
<script>
  import { useMycelia, useFacet } from 'mycelia-kernel-plugin/svelte';
  import { onMount } from 'svelte';
  
  const systemStore = useMycelia();
  const dbStore = useFacet('database');
  $: system = $systemStore;
  $: db = $dbStore;
  
  onMount(() => {
    if (system?.listeners) {
      system.listeners.enableListeners();
    }
    
    if (db) {
      db.query('SELECT * FROM todos').then(todos => {
        console.log('Todos:', todos);
      });
    }
  });
</script>

{#if db}
  <div>Todo list ready</div>
{:else}
  <div>Database loading...</div>
{/if}
```

## See Also

- [Listener Helpers](./LISTENER-HELPERS.md) - Event listener utilities
- [Queue Helpers](./QUEUE-HELPERS.md) - Queue management utilities
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation




