# Queue Helpers

Svelte utilities for working with the `useQueue` hook in Svelte components.

## Overview

The queue helpers provide Svelte-friendly ways to monitor queue status and process messages from queues in Svelte components with reactive updates via stores.

## useQueueStatus

Get queue status with reactive updates.

### API

```js
const status = useQueueStatus();
```

### Returns

A writable store containing:

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
- **Reactive:** Returns a Svelte store, automatically updates templates

### Example

```svelte
<script>
  import { useQueueStatus } from 'mycelia-kernel-plugin/svelte';
  
  const status = useQueueStatus();
</script>

<div>
  <div>Queue: {$status.size}/{$status.capacity}</div>
  <div>Utilization: {($status.utilization * 100).toFixed(1)}%</div>
  {#if $status.isFull}
    <div class="warning">Queue is full!</div>
  {/if}
</div>
```

### With Progress Bar

```svelte
<script>
  import { useQueueStatus } from 'mycelia-kernel-plugin/svelte';
  
  const status = useQueueStatus();
</script>

<div>
  <div class="progress-bar">
    <div 
      class="progress-fill"
      style="width: {$status.utilization * 100}%"
    />
  </div>
  <span>{$status.size} / {$status.capacity}</span>
</div>
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
- **On Destroy:** Stops polling automatically
- **Callback:** Calls `onMessage` for each message processed

### Example

```svelte
<script>
  import { useQueueDrain } from 'mycelia-kernel-plugin/svelte';
  
  let processed = 0;
  
  useQueueDrain({
    interval: 50,
    onMessage: (msg, options) => {
      console.log('Processed:', msg);
      processed++;
    }
  });
</script>

<div>Processed {processed} messages</div>
```

## Complete Example

```svelte
<script>
  import { useQueueStatus, useQueueDrain } from 'mycelia-kernel-plugin/svelte';
  
  const status = useQueueStatus();
  let processed = 0;
  
  useQueueDrain({
    interval: 50,
    onMessage: (msg, options) => {
      console.log('Processing:', msg);
      processed++;
    }
  });
</script>

<div>
  <h2>Queue Status</h2>
  <div>Size: {$status.size} / {$status.capacity}</div>
  <div>Utilization: {($status.utilization * 100).toFixed(1)}%</div>
  {#if $status.isFull}
    <div class="warning">Queue Full!</div>
  {/if}
  
  <h2>Processing</h2>
  <div>Processed: {processed} messages</div>
</div>
```

## See Also

- [useQueue Hook](../hooks/USE-QUEUE.md) - Core queue system documentation
- [Core Bindings](./CORE-BINDINGS.md) - Context and basic stores
- [Listener Helpers](./LISTENER-HELPERS.md) - Event listener utilities

