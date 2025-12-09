# Queue Helpers

React utilities for working with the `useQueue` hook in React components.

## Overview

The queue helpers provide React-friendly ways to monitor queue status and process messages from queues in React components.

## useQueueStatus

Get queue status with reactive updates.

### API

```tsx
const status = useQueueStatus();
```

### Returns

```tsx
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

### Example

```tsx
import { useQueueStatus } from 'mycelia-kernel-plugin/react';

function QueueStatus() {
  const status = useQueueStatus();
  
  return (
    <div>
      <div>Queue: {status.size}/{status.capacity}</div>
      <div>Utilization: {(status.utilization * 100).toFixed(1)}%</div>
      {status.isFull && <div className="warning">Queue is full!</div>}
    </div>
  );
}
```

### With Progress Bar

```tsx
function QueueProgress() {
  const status = useQueueStatus();
  
  return (
    <div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${status.utilization * 100}%` }}
        />
      </div>
      <span>{status.size} / {status.capacity}</span>
    </div>
  );
}
```

### Best Practices

1. **Null Checks** - Check if queue exists before using:
   ```tsx
   const queue = useFacet('queue');
   if (!queue) return <div>Queue not available</div>;
   ```

2. **Performance** - Consider throttling updates for high-frequency queues:
   ```tsx
   // Status already polls every 100ms, which is usually sufficient
   ```

3. **Visual Feedback** - Use status for UI indicators:
   ```tsx
   {status.utilization > 0.8 && <WarningIcon />}
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
  - **`interval`** (number, optional): Polling interval in milliseconds. Default: `100`
  - **`onMessage`** (Function, optional): Callback for each message processed

### Behavior

- **On Mount:** Starts polling queue for messages
- **Processing:** Calls `selectNextMessage()` at specified interval
- **On Unmount:** Stops polling automatically
- **Callback:** Calls `onMessage` for each message processed

### Example

```tsx
import { useQueueDrain } from 'mycelia-kernel-plugin/react';

function QueueProcessor() {
  useQueueDrain({
    interval: 50,
    onMessage: (msg, options) => {
      console.log('Processed:', msg);
      // Handle message
    }
  });
  
  return <div>Processing queue...</div>;
}
```

### With State Updates

```tsx
function MessageProcessor() {
  const [processed, setProcessed] = useState(0);
  
  useQueueDrain({
    interval: 100,
    onMessage: (msg, options) => {
      // Process message
      handleMessage(msg);
      setProcessed(prev => prev + 1);
    }
  });
  
  return <div>Processed {processed} messages</div>;
}
```

### Best Practices

1. **Error Handling** - Wrap message processing in try-catch:
   ```tsx
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
   ```tsx
   // Fast processing
   useQueueDrain({ interval: 10 });
   
   // Slow processing
   useQueueDrain({ interval: 1000 });
   ```

3. **Conditional Processing** - Check queue status before processing:
   ```tsx
   const status = useQueueStatus();
   
   useQueueDrain({
     interval: 100,
     onMessage: (msg) => {
       if (status.isFull) {
         // Handle backpressure
       }
       processMessage(msg);
     }
   });
   ```

## Complete Example

```tsx
import { 
  MyceliaProvider,
  useQueueStatus,
  useQueueDrain 
} from 'mycelia-kernel-plugin/react';
import { useBase, useQueue } from 'mycelia-kernel-plugin';

const buildSystem = () =>
  useBase('queue-app')
    .config('queue', { capacity: 100 })
    .use(useQueue)
    .build();

function App() {
  return (
    <MyceliaProvider build={buildSystem}>
      <QueueDashboard />
    </MyceliaProvider>
  );
}

function QueueDashboard() {
  const status = useQueueStatus();
  const [processed, setProcessed] = useState(0);
  
  useQueueDrain({
    interval: 50,
    onMessage: (msg, options) => {
      console.log('Processing:', msg);
      setProcessed(prev => prev + 1);
    }
  });
  
  return (
    <div>
      <h2>Queue Status</h2>
      <div>Size: {status.size} / {status.capacity}</div>
      <div>Utilization: {(status.utilization * 100).toFixed(1)}%</div>
      {status.isFull && <div className="warning">Queue Full!</div>}
      
      <h2>Processing</h2>
      <div>Processed: {processed} messages</div>
    </div>
  );
}
```

## Integration with useQueue

These helpers work with the `useQueue` hook. The queue facet provides:

- **`getQueueStatus()`** - Get current queue status
- **`hasMessagesToProcess()`** - Check if queue has messages
- **`selectNextMessage()`** - Get and remove next message
- **`queue`** - Direct access to underlying queue

## See Also

- [useQueue Hook](../hooks/USE-QUEUE.md) - Core queue system documentation
- [Core Bindings](./CORE-BINDINGS.md) - Provider and basic hooks
- [Listener Helpers](./LISTENER-HELPERS.md) - Event listener utilities




