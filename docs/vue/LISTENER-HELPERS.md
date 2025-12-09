# Listener Helpers

Vue utilities for working with the `useListeners` hook in Vue components.

## Overview

The listener helpers provide Vue-friendly ways to register event listeners and subscribe to event streams, with automatic cleanup and reactive state management.

## useListener

Register an event listener with automatic cleanup.

### API

```js
useListener(
  eventName: string,
  handler: (message: any) => void
): void
```

### Parameters

- **`eventName`** (string, required): Event name/path to listen for
- **`handler`** (Function, required): Handler function that receives the message

### Behavior

- **Registration:** Registers listener when component is mounted
- **Cleanup:** Automatically unregisters listener on unmount
- **Handler Updates:** Handler is called directly (Vue's reactivity handles updates)

### Example

```vue
<template>
  <ul>
    <li v-for="(event, i) in events" :key="i">
      {{ event.name }} created
    </li>
  </ul>
</template>

<script setup>
import { ref } from 'vue';
import { useListener } from 'mycelia-kernel-plugin/vue';

const events = ref([]);

useListener('user:created', (msg) => {
  events.value = [...events.value, msg.body];
});
</script>
```

### With Reactive Values

```vue
<template>
  <div>Listening for user {{ userId }} updates</div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useListener } from 'mycelia-kernel-plugin/vue';

const userId = ref(123);

useListener('user:updated', (msg) => {
  if (msg.body.id === userId.value) {
    console.log('User updated:', msg.body);
  }
});
</script>
```

### Best Practices

1. **Use Reactive State** - Use `ref` or `reactive` for state updates:
   ```vue
   <script setup>
   import { ref } from 'vue';
   const events = ref([]);
   
   useListener('event', (msg) => {
     events.value = [...events.value, msg.body]; // ✅ Reactive update
   });
   </script>
   ```

2. **Access Reactive Values** - Access reactive values directly in handler:
   ```vue
   <script setup>
   import { ref } from 'vue';
   const count = ref(0);
   
   useListener('event', (msg) => {
     console.log(count.value); // ✅ Access via .value
   });
   </script>
   ```

3. **Template Unwrapping** - Vue automatically unwraps refs in templates:
   ```vue
   <template>
     <!-- Vue automatically unwraps refs -->
     <div>{{ events.length }}</div>
   </template>
   ```

## useEventStream

Subscribe to events and keep them in reactive state automatically.

### API

```js
useEventStream(
  eventName: string,
  options?: {
    accumulate?: boolean
  }
): Ref<any | any[] | null>
```

### Parameters

- **`eventName`** (string, required): Event name/path to listen for
- **`options`** (Object, optional): Options object
  - **`accumulate`** (boolean, optional): If `true`, accumulate events in array. Default: `false`

### Returns

- **Latest Event Mode** (`accumulate: false`): Returns a ref to the latest event value, or `null` if no events
- **Accumulate Mode** (`accumulate: true`): Returns a ref to an array of all events received

### Behavior

- **Latest Event:** Returns most recent event body, replaces previous value
- **Accumulate:** Appends each event to array, never clears
- **Initial State:** Returns `ref(null)` or `ref([])` until first event
- **Reactive:** Returns a Vue ref, automatically updates templates

### Example: Latest Event

```vue
<template>
  <div v-if="latestTodo">
    Latest: {{ latestTodo.text }}
  </div>
  <div v-else>No todos yet</div>
</template>

<script setup>
import { useEventStream } from 'mycelia-kernel-plugin/vue';

const latestTodo = useEventStream('todo:created');
</script>
```

### Example: Accumulated Events

```vue
<template>
  <ul>
    <li v-for="(todo, i) in todos" :key="i">
      {{ todo.text }}
    </li>
  </ul>
</template>

<script setup>
import { useEventStream } from 'mycelia-kernel-plugin/vue';

const todos = useEventStream('todo:created', { accumulate: true });
</script>
```

### Example: With Computed Properties

```vue
<template>
  <div>
    <div>Total events: {{ totalEvents }}</div>
    <div>Latest: {{ latestEventText }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useEventStream } from 'mycelia-kernel-plugin/vue';

const events = useEventStream('todo:created', { accumulate: true });

const totalEvents = computed(() => events.value.length);
const latestEventText = computed(() => 
  events.value.length > 0 
    ? events.value[events.value.length - 1].text 
    : 'None'
);
</script>
```

### Best Practices

1. **Use in Templates** - Vue automatically unwraps refs:
   ```vue
   <template>
     <div>{{ latestTodo.text }}</div>
   </template>
   ```

2. **Use in Script** - Remember to use `.value`:
   ```js
   const latestTodo = useEventStream('todo:created');
   if (latestTodo.value) {
     console.log(latestTodo.value.text);
   }
   ```

3. **Combine with Computed** - Create derived state:
   ```js
   const todos = useEventStream('todo:created', { accumulate: true });
   const completedCount = computed(() => 
     todos.value.filter(t => t.completed).length
   );
   ```

## Complete Example

```vue
<template>
  <div>
    <h2>Event Stream Demo</h2>
    <div>
      <button @click="emitEvent">Emit Event</button>
    </div>
    <div>
      <h3>Latest Event</h3>
      <div v-if="latestEvent">
        {{ latestEvent.timestamp }}: {{ latestEvent.message }}
      </div>
      <div v-else>No events yet</div>
    </div>
    <div>
      <h3>All Events ({{ allEvents.length }})</h3>
      <ul>
        <li v-for="(event, i) in allEvents" :key="i">
          {{ event.timestamp }}: {{ event.message }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { useEventStream, useMycelia } from 'mycelia-kernel-plugin/vue';

const system = useMycelia();
const latestEvent = useEventStream('demo:event');
const allEvents = useEventStream('demo:event', { accumulate: true });

const emitEvent = () => {
  system.listeners.emit('demo:event', {
    timestamp: new Date().toISOString(),
    message: 'Hello from Vue!'
  });
};
</script>
```

## See Also

- [Core Bindings](./CORE-BINDINGS.md) - Plugin and basic composables
- [useListeners Hook](../hooks/USE-LISTENERS.md) - Event system documentation
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation




