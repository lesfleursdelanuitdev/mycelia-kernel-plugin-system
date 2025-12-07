# Core Bindings

Core Vue bindings for the Mycelia Plugin System: Plugin and basic composables.

## MyceliaPlugin

Vue plugin that provides Mycelia system to the app with automatic lifecycle management.

### API

```js
app.use(MyceliaPlugin, {
  build: () => Promise<System>
});
```

### Parameters

- **`build`** (Function, required): Async function that returns a built system instance

### Behavior

- **On Install:** Calls `build()` function and stores system via provide/inject
- **On App Unmount:** Manual cleanup required (see cleanup section below)
- **Error Handling:** Throws errors during build (can be caught by Vue error handlers)
- **Loading State:** System is available via `useMyceliaContext()` with loading/error refs

### Cleanup

Vue 3 doesn't provide a plugin unmount hook. Use the `useMyceliaCleanup` composable for automatic cleanup:

```vue
<script setup>
import { useMyceliaCleanup } from 'mycelia-kernel-plugin/vue';

// Automatic cleanup on component unmount
useMyceliaCleanup();
</script>
```

Or get the cleanup function for manual use:

```vue
<script setup>
import { useMyceliaCleanup } from 'mycelia-kernel-plugin/vue';

const dispose = useMyceliaCleanup({ auto: false });

const handleLogout = async () => {
  await dispose();
  // Continue with logout logic
};
</script>
```

For app-level cleanup (e.g., in `main.js`):

```js
// Before unmounting
const dispose = app.config.globalProperties.$myceliaDispose;
if (dispose) {
  await dispose();
}
app.unmount();
```

### Example

```js
import { createApp } from 'vue';
import { MyceliaPlugin } from 'mycelia-kernel-plugin/vue';
import { useBase, useDatabase, useListeners } from 'mycelia-kernel-plugin';

const buildSystem = () =>
  useBase('my-app')
    .use(useDatabase)
    .use(useListeners)
    .build();

const app = createApp(App);
app.use(MyceliaPlugin, { build: buildSystem });
app.mount('#app');
```

### Best Practices

1. **Create builder outside app** - Avoid recreating on every render:
   ```js
   // ✅ Good
   const buildSystem = () => useBase('app').use(useDatabase).build();
   app.use(MyceliaPlugin, { build: buildSystem });
   
   // ❌ Bad - recreates on every render
   app.use(MyceliaPlugin, { 
     build: () => useBase('app').use(useDatabase).build() 
   });
   ```

2. **Use error handlers** - Catch build errors:
   ```js
   app.config.errorHandler = (err) => {
     if (err.message.includes('Mycelia')) {
       console.error('Mycelia build error:', err);
     }
   };
   ```

3. **Handle loading states** - Use `useMyceliaContext()` for loading/error:
   ```vue
   <template>
     <div v-if="loading">Loading system...</div>
     <div v-else-if="error">Error: {{ error.message }}</div>
     <App v-else />
   </template>
   
   <script setup>
   import { useMyceliaContext } from 'mycelia-kernel-plugin/vue';
   const { loading, error } = useMyceliaContext();
   </script>
   ```

## useMycelia

Get the Mycelia system instance from inject.

### API

```js
const system = useMycelia();
```

### Returns

- **`system`** (StandalonePluginSystem): The system instance

### Throws

- **Error:** If used before `MyceliaPlugin` is installed

### Example

```vue
<template>
  <div>System: {{ system.name }}</div>
</template>

<script setup>
import { useMycelia } from 'mycelia-kernel-plugin/vue';

const system = useMycelia();

// Access system methods
const db = system.find('database');
const capabilities = system.capabilities;

// Use system directly
system.listeners.enableListeners();
</script>
```

### Use Cases

- Access system-level methods (`find()`, `reload()`, `dispose()`)
- Get system metadata (`name`, `capabilities`)
- Access facets not attached to system
- Direct system manipulation

## useMyceliaContext

Get the full Mycelia context including system, loading, and error refs.

### API

```js
const { system, loading, error } = useMyceliaContext();
```

### Returns

- **`system`** (Ref<System | null>): Reactive ref to the system instance
- **`loading`** (Ref<boolean>): Reactive ref indicating if system is building
- **`error`** (Ref<Error | null>): Reactive ref to any build error

### Example

```vue
<template>
  <div v-if="loading.value">Loading...</div>
  <div v-else-if="error.value">Error: {{ error.value.message }}</div>
  <div v-else>System ready: {{ system.value.name }}</div>
</template>

<script setup>
import { useMyceliaContext } from 'mycelia-kernel-plugin/vue';

const { system, loading, error } = useMyceliaContext();
</script>
```

## useFacet

Get a facet by kind from the system with reactivity.

### API

```js
const facet = useFacet(kind);
```

### Parameters

- **`kind`** (string, required): Facet kind identifier (e.g., 'database', 'cache')

### Returns

- **`facet`** (Ref<Object | null>): Reactive ref to the facet instance, or `null` if not found

### Behavior

- **Initial Value:** Gets facet immediately on setup
- **Updates:** Re-checks facet when system changes (e.g., after reload)
- **Null Handling:** Returns `ref(null)` if facet doesn't exist
- **Template Unwrapping:** Vue automatically unwraps refs in templates

### Example

```vue
<template>
  <div v-if="db">Database ready</div>
  <div v-else>Database not available</div>
</template>

<script setup>
import { useFacet } from 'mycelia-kernel-plugin/vue';
import { watch } from 'vue';

const db = useFacet('database');

watch(db, (newDb) => {
  if (newDb) {
    newDb.query('SELECT * FROM users').then(users => {
      // Handle users
    });
  }
}, { immediate: true });
</script>
```

### Use Cases

- Access facet methods and properties
- Conditional rendering based on facet availability
- React to facet changes (when system reloads)

### Best Practices

1. **Null Checks** - Always check if facet exists:
   ```vue
   <template>
     <div v-if="db">Database available</div>
   </template>
   
   <script setup>
   const db = useFacet('database');
   </script>
   ```

2. **Watch for Changes** - Use `watch` to react to facet changes:
   ```js
   watch(db, (newDb) => {
     if (newDb) {
       // Use newDb
     }
   }, { immediate: true });
   ```

3. **Custom Composables** - Use `createFacetComposable` for domain-specific composables:
   ```js
   const useDatabase = createFacetComposable('database');
   // Then: const db = useDatabase();
   ```

4. **Template vs Script** - Remember ref unwrapping:
   ```vue
   <template>
     <!-- Vue automatically unwraps refs -->
     <div>{{ db.name }}</div>
   </template>
   
   <script setup>
   const db = useFacet('database');
   // In script, use .value
   if (db.value) {
     db.value.query('...');
   }
   </script>
   ```

## useMyceliaCleanup

Automatically handle system cleanup on component unmount or get a cleanup function for manual use.

### API

```js
const dispose = useMyceliaCleanup(options?: {
  auto?: boolean
});
```

### Parameters

- **`options`** (Object, optional): Options object
  - **`auto`** (boolean, optional): If `true`, automatically cleanup on unmount. If `false`, only return cleanup function. Default: `true`

### Returns

- **`dispose`** (Function): Async cleanup function that can be called manually

### Behavior

- **Automatic Mode** (`auto: true`): Automatically calls cleanup when component unmounts
- **Manual Mode** (`auto: false`): Returns cleanup function for manual use
- **Error Handling**: Silently handles disposal errors

### Example: Automatic Cleanup

```vue
<template>
  <div>My Component</div>
</template>

<script setup>
import { useMyceliaCleanup } from 'mycelia-kernel-plugin/vue';

// Automatically cleanup when component unmounts
useMyceliaCleanup();
</script>
```

### Example: Manual Cleanup

```vue
<template>
  <div>
    <button @click="handleLogout">Logout</button>
  </div>
</template>

<script setup>
import { useMyceliaCleanup } from 'mycelia-kernel-plugin/vue';

const dispose = useMyceliaCleanup({ auto: false });

const handleLogout = async () => {
  // Cleanup Mycelia system before logout
  await dispose();
  
  // Continue with logout logic
  router.push('/login');
};
</script>
```

### Use Cases

- **Root Components**: Use automatic cleanup in root components that manage app lifecycle
- **Conditional Cleanup**: Use manual cleanup when you need to dispose the system conditionally (e.g., on logout)
- **Testing**: Use manual cleanup in test setup/teardown

### Best Practices

1. **Root Component Cleanup** - Use automatic cleanup in your root component:
   ```vue
   <!-- App.vue -->
   <script setup>
   import { useMyceliaCleanup } from 'mycelia-kernel-plugin/vue';
   useMyceliaCleanup();
   </script>
   ```

2. **Conditional Cleanup** - Use manual cleanup for conditional scenarios:
   ```vue
   <script setup>
   const dispose = useMyceliaCleanup({ auto: false });
   
   watch(isLoggedOut, async (loggedOut) => {
     if (loggedOut) {
       await dispose();
     }
   });
   </script>
   ```

## Complete Example

```vue
<template>
  <div>
    <div v-if="loading">Loading system...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <TodoList v-else />
  </div>
</template>

<script setup>
import { useMyceliaContext, useFacet, useMycelia } from 'mycelia-kernel-plugin/vue';
import { watch } from 'vue';

const { loading, error } = useMyceliaContext();
const system = useMycelia();
const db = useFacet('database');

watch(db, (newDb) => {
  if (newDb) {
    // Enable listeners
    system.listeners.enableListeners();
    
    // Use database
    newDb.query('SELECT * FROM todos').then(todos => {
      console.log('Todos:', todos);
    });
  }
}, { immediate: true });
</script>
```

```js
// main.js
import { createApp } from 'vue';
import { MyceliaPlugin } from 'mycelia-kernel-plugin/vue';
import { useBase, useDatabase, useListeners } from 'mycelia-kernel-plugin';
import App from './App.vue';

const buildSystem = () =>
  useBase('todo-app')
    .config('database', { host: 'localhost' })
    .use(useDatabase)
    .use(useListeners)
    .build();

const app = createApp(App);
app.use(MyceliaPlugin, { build: buildSystem });
app.mount('#app');
```

## See Also

- [Listener Helpers](./LISTENER-HELPERS.md) - Event listener utilities
- [Queue Helpers](./QUEUE-HELPERS.md) - Queue management utilities
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation

