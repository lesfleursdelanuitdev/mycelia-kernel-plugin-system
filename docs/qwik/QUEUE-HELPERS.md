# Queue Helpers

Qwik utilities for working with the `useQueue` hook in Qwik components.

## Overview

The queue helpers provide Qwik-friendly ways to monitor queue status and process messages, with reactive signals for updates.

## useQueueStatus

Get queue status with reactive updates.

### API

```tsx
useQueueStatus(): Signal<QueueStatus>
```

### Returns

- **`status`** (Signal): Signal containing queue status object

### Status Object

```ts
interface QueueStatus {
  size: number;        // Current queue size
  capacity: number;    // Maximum queue capacity
  utilization: number; // Utilization ratio (0-1)
  isFull: boolean;     // Whether queue is full
}
```

### Example

```tsx
import { useQueueStatus } from 'mycelia-kernel-plugin/qwik';

export const QueueStatus = component$(() => {
  const status = useQueueStatus();
  
  return (
    <div>
      <p>Queue: {status.value.size}/{status.value.capacity}</p>
      <p>Utilization: {status.value.utilization * 100}%</p>
      {status.value.isFull && <p class="warning">Queue is full!</p>}
    </div>
  );
});
```

## useQueueDrain

Automatically drain queue on mount.

### API

```tsx
useQueueDrain(options?: {
  interval?: number;
  onMessage?: (msg: any, options: any) => void;
}): void
```

### Parameters

- **`options`** (Object, optional): Options object
  - **`interval`** (number, optional): Polling interval in ms. Default: `100`
  - **`onMessage`** (Function, optional): Callback for each message

### Behavior

- **Polling:** Checks for messages at specified interval
- **Processing:** Calls `onMessage` for each message
- **Cleanup:** Automatically cleaned up on component unmount

### Example

```tsx
import { component$, useSignal } from '@builder.io/qwik';
import { useQueueDrain } from 'mycelia-kernel-plugin/qwik';

export const QueueProcessor = component$(() => {
  const processedCount = useSignal(0);
  
  useQueueDrain({
    interval: 50,
    onMessage: (msg) => {
      processedCount.value++;
      console.log('Processed message:', msg);
      // Handle message
    }
  });
  
  return <div>Processed: {processedCount.value}</div>;
});
```

## Complete Example

```tsx
import { component$, useSignal } from '@builder.io/qwik';
import { useQueueStatus, useQueueDrain } from 'mycelia-kernel-plugin/qwik';

export const QueueDashboard = component$(() => {
  const status = useQueueStatus();
  const processedCount = useSignal(0);
  
  useQueueDrain({
    interval: 100,
    onMessage: (msg) => {
      processedCount.value++;
      // Process message
    }
  });
  
  return (
    <div>
      <h2>Queue Dashboard</h2>
      <div class="stats">
        <p>Size: {status.value.size}/{status.value.capacity}</p>
        <p>Utilization: {status.value.utilization * 100}%</p>
        <p class={status.value.isFull ? 'full' : ''}>
          Status: {status.value.isFull ? 'Full' : 'Available'}
        </p>
      </div>
      <div class="processor">
        <p>Processed: {processedCount.value}</p>
      </div>
    </div>
  );
});
```

## See Also

- [Core Bindings](./CORE-BINDINGS.md) - Provider and basic hooks
- [useQueue Hook](../hooks/USE-QUEUE.md) - Queue system documentation
- [Listener Helpers](./LISTENER-HELPERS.md) - Event listener utilities


