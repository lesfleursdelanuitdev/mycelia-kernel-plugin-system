# Queue Helpers

Vue utilities for working with the `useQueue` hook in Vue components.

## Overview

The queue helpers provide Vue-friendly ways to monitor queue status and process messages from queues in Vue components with reactive updates.

## useQueueStatus

Get queue status with reactive updates.

### API

```js
const status = useQueueStatus();
```

### Returns

A reactive ref containing:

```js
{
  size: number;        // Current queue size
  capacity: number;    // Maximum queue capacity
  utilization: number; // Utilization ratio (0-1)
  isFull: boolean;     // Whether queue is full
}
```

### Behavior

- **Initial Value:** Gets status immediately on mount
- **Updates:** Polls for status updates every 100ms
- **Null Handling:** Returns default values if queue not available
- **Reactive:** Returns a Vue ref, automatically updates templates

### Example

```vue
<template>
  <div>
    <div>Queue: {{ status.size }}/{{ status.capacity }}</div>
    <div>Utilization: {{ (status.utilization * 100).toFixed(1) }}%</div>
    <div v-if="status.isFull" class="warning">Queue is full!</div>
  </div>
</template>

<script setup>
import { useQueueStatus } from 'mycelia-kernel-plugin/vue';

const status = useQueueStatus();
</script>
```

### With Progress Bar

```vue
<template>
  <div>
    <div class="progress-bar">
      <div 
        class="progress-fill"
        :style="{ width: `${status.utilization * 100}%` }"
      />
    </div>
    <span>{{ status.size }} / {{ status.capacity }}</span>
  </div>
</template>

<script setup>
import { useQueueStatus } from 'mycelia-kernel-plugin/vue';

const status = useQueueStatus();
</script>
```

### Best Practices

1. **Null Checks** - Check if queue exists before using:
   ```vue
   <script setup>
   import { useFacet } from 'mycelia-kernel-plugin/vue';
   const queue = useFacet('queue');
   </script>
   <template>
     <div v-if="queue">Queue available</div>
   </template>
   ```

2. **Performance** - Status already polls every 100ms, which is usually sufficient

3. **Visual Feedback** - Use status for UI indicators:
   ```vue
   <template>
     <WarningIcon v-if="status.utilization > 0.8" />
   </template>
   ```

## useQueueDrain

Automatically drain queue on mount.

### API

```js
useQueueDrain(options?: {
  interval?: number;
  onMessage?: (msg: any, options: any) => void;
}): void
```

### Parameters

- **`options`** (Object, optional): Options object
  - **`interval`** (number, optional): Polling interval in milliseconds. Default: `100`
  - **`onMessage`** (Function, optional): Callback for each message processed

### Behavior

- **On Mount:** Starts polling queue for messages
- **Processing:** Calls `selectNextMessage()` at specified interval
- **On Unmount:** Stops polling automatically
- **Callback:** Calls `onMessage` for each message processed

### Example

```vue
<template>
  <div>Processing queue...</div>
</template>

<script setup>
import { useQueueDrain } from 'mycelia-kernel-plugin/vue';

useQueueDrain({
  interval: 50,
  onMessage: (msg, options) => {
    console.log('Processed:', msg);
    // Handle message
  }
});
</script>
```

### With State Updates

```vue
<template>
  <div>Processed {{ processed }} messages</div>
</template>

<script setup>
import { ref } from 'vue';
import { useQueueDrain } from 'mycelia-kernel-plugin/vue';

const processed = ref(0);

useQueueDrain({
  interval: 100,
  onMessage: (msg, options) => {
    // Process message
    handleMessage(msg);
    processed.value++;
  }
});
</script>
```

### Best Practices

1. **Error Handling** - Wrap message processing in try-catch:
   ```js
   useQueueDrain({
     onMessage: (msg, options) => {
       try {
         processMessage(msg);
       } catch (error) {
         console.error('Error processing message:', error);
       }
     }
   });
   ```

2. **Interval Tuning** - Adjust interval based on message frequency:
   ```js
   // Fast processing
   useQueueDrain({ interval: 10 });
   
   // Slow processing
   useQueueDrain({ interval: 1000 });
   ```

3. **Conditional Processing** - Check queue status before processing:
   ```vue
   <script setup>
   import { useQueueStatus, useQueueDrain } from 'mycelia-kernel-plugin/vue';
   
   const status = useQueueStatus();
   
   useQueueDrain({
     interval: 100,
     onMessage: (msg) => {
       if (status.value.isFull) {
         // Handle backpressure
       }
       processMessage(msg);
     }
   });
   </script>
   ```

## Complete Example

```vue
<template>
  <div>
    <h2>Queue Status</h2>
    <div>Size: {{ status.size }} / {{ status.capacity }}</div>
    <div>Utilization: {{ (status.utilization * 100).toFixed(1) }}%</div>
    <div v-if="status.isFull" class="warning">Queue Full!</div>
    
    <h2>Processing</h2>
    <div>Processed: {{ processed }} messages</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useQueueStatus, useQueueDrain } from 'mycelia-kernel-plugin/vue';

const status = useQueueStatus();
const processed = ref(0);

useQueueDrain({
  interval: 50,
  onMessage: (msg, options) => {
    console.log('Processing:', msg);
    processed.value++;
  }
});
</script>
```

```js
// main.js
import { createApp } from 'vue';
import { MyceliaPlugin } from 'mycelia-kernel-plugin/vue';
import { useBase, useQueue } from 'mycelia-kernel-plugin';
import App from './App.vue';

const buildSystem = () =>
  useBase('queue-app')
    .config('queue', { capacity: 100 })
    .use(useQueue)
    .build();

const app = createApp(App);
app.use(MyceliaPlugin, { build: buildSystem });
app.mount('#app');
```

## Integration with useQueue

These helpers work with the `useQueue` hook. The queue facet provides:

- **`getQueueStatus()`** - Get current queue status
- **`hasMessagesToProcess()`** - Check if queue has messages
- **`selectNextMessage()`** - Get and remove next message
- **`queue`** - Direct access to underlying queue

## See Also

- [useQueue Hook](../hooks/USE-QUEUE.md) - Core queue system documentation
- [Core Bindings](./CORE-BINDINGS.md) - Plugin and basic composables
- [Listener Helpers](./LISTENER-HELPERS.md) - Event listener utilities

