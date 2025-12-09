# Listener Helpers

Qwik utilities for working with the `useListeners` hook in Qwik components.

## Overview

The listener helpers provide Qwik-friendly ways to register event listeners and subscribe to event streams, with automatic cleanup via Qwik's lifecycle management.

## useListener

Register an event listener with automatic cleanup.

### API

```tsx
useListener(
  eventName: string,
  handler: (message: any) => void
): void
```

### Parameters

- **`eventName`** (string, required): Event name/path to listen for
- **`handler`** (Function, required): Handler function that receives the message

### Behavior

- **Registration:** Registers listener when component mounts
- **Cleanup:** Automatically unregisters listener on unmount
- **Handler:** Called whenever event is emitted

### Example

```tsx
import { useListener } from 'mycelia-kernel-plugin/qwik';
import { useSignal } from '@builder.io/qwik';

export const AuditLog = component$(() => {
  const events = useSignal<any[]>([]);
  
  useListener('user:created', (msg) => {
    events.value = [...events.value, msg.body];
  });
  
  return (
    <ul>
      {events.value.map((event, i) => (
        <li key={i}>{event.name} created</li>
      ))}
    </ul>
  );
});
```

### Best Practices

1. **Use Signals** - Update signals in handlers:
   ```tsx
   const count = useSignal(0);
   
   useListener('event', (msg) => {
     count.value++;
   });
   ```

2. **Multiple Listeners** - Register multiple listeners:
   ```tsx
   useListener('user:created', (msg) => {
     console.log('User created:', msg.body);
   });
   
   useListener('user:updated', (msg) => {
     console.log('User updated:', msg.body);
   });
   ```

## useEventStream

Subscribe to events and keep them in Qwik signal.

### API

```tsx
useEventStream(
  eventName: string,
  options?: {
    accumulate?: boolean
  }
): Signal<any | any[] | null>
```

### Parameters

- **`eventName`** (string, required): Event name/path to listen for
- **`options`** (Object, optional): Options object
  - **`accumulate`** (boolean, optional): If `true`, accumulate events in array. Default: `false`

### Returns

- **Latest Event Mode** (`accumulate: false`): Signal containing the latest event value, or `null`
- **Accumulate Mode** (`accumulate: true`): Signal containing an array of all events

### Behavior

- **Latest Event:** Replaces signal value with most recent event body
- **Accumulate:** Appends each event to array in signal
- **Initial State:** Signal starts as `null` or `[]` until first event

### Example: Latest Event

```tsx
import { useEventStream } from 'mycelia-kernel-plugin/qwik';

export const LatestTodo = component$(() => {
  const latestTodo = useEventStream('todo:created');
  
  if (!latestTodo.value) {
    return <div>No todos yet</div>;
  }
  
  return <div>Latest: {latestTodo.value.text}</div>;
});
```

### Example: Accumulated Events

```tsx
import { useEventStream } from 'mycelia-kernel-plugin/qwik';

export const EventList = component$(() => {
  const events = useEventStream('todo:created', { accumulate: true });
  
  return (
    <ul>
      {events.value.map((event, i) => (
        <li key={i}>{event.text}</li>
      ))}
    </ul>
  );
});
```

## Complete Example

```tsx
import { component$, useSignal } from '@builder.io/qwik';
import { useListener, useEventStream } from 'mycelia-kernel-plugin/qwik';

export const TodoAudit = component$(() => {
  const events = useEventStream('todo:*', { accumulate: true });
  const deletedCount = useSignal(0);
  
  useListener('todo:deleted', (msg) => {
    deletedCount.value++;
    console.log('Todo deleted:', msg.body);
  });
  
  return (
    <div>
      <h2>Todo Audit Log</h2>
      <p>Deleted: {deletedCount.value}</p>
      <ul>
        {events.value.map((event, i) => (
          <li key={i}>
            {event.type}: {event.text} at {event.timestamp}
          </li>
        ))}
      </ul>
    </div>
  );
});
```

## See Also

- [Core Bindings](./CORE-BINDINGS.md) - Provider and basic hooks
- [useListeners Hook](../hooks/USE-LISTENERS.md) - Event system documentation
- [Queue Helpers](./QUEUE-HELPERS.md) - Queue management utilities


