# Listener Helpers

React utilities for working with the `useListeners` hook in React components.

## Overview

The listener helpers provide React-friendly ways to register event listeners and subscribe to event streams, with automatic cleanup and state management.

## useListener

Register an event listener with automatic cleanup.

### API

```tsx
useListener(
  eventName: string,
  handler: (message: any) => void,
  deps?: React.DependencyList
): void
```

### Parameters

- **`eventName`** (string, required): Event name/path to listen for
- **`handler`** (Function, required): Handler function that receives the message
- **`deps`** (Array, optional): React dependency array for the handler function

### Behavior

- **Registration:** Registers listener when component mounts
- **Cleanup:** Automatically unregisters listener on unmount
- **Updates:** Re-registers if eventName or deps change
- **Handler Updates:** Uses ref to always call latest handler version

### Example

```tsx
import { useListener } from 'mycelia-kernel-plugin/react';

function AuditLog() {
  const [events, setEvents] = useState([]);
  
  useListener('user:created', (msg) => {
    setEvents(prev => [...prev, msg.body]);
  }, []); // Empty deps - handler doesn't use external values
  
  return (
    <ul>
      {events.map((event, i) => (
        <li key={i}>{event.name} created</li>
      ))}
    </ul>
  );
}
```

### With Dependencies

```tsx
function UserNotifications({ userId }) {
  useListener(
    'user:updated',
    (msg) => {
      if (msg.body.id === userId) {
        console.log('User updated:', msg.body);
      }
    },
    [userId] // Re-register if userId changes
  );
  
  return <div>Listening for user {userId} updates</div>;
}
```

### Best Practices

1. **Include Dependencies** - Add all values used in handler to deps:
   ```tsx
   const [count, setCount] = useState(0);
   
   useListener('event', (msg) => {
     console.log(count); // Uses count
   }, [count]); // ✅ Include count in deps
   ```

2. **Empty Deps for Stable Handlers** - Use empty array if handler doesn't need external values:
   ```tsx
   useListener('event', (msg) => {
     console.log(msg.body); // Only uses message
   }, []); // ✅ Empty deps
   ```

3. **State Updates** - Use functional updates for state:
   ```tsx
   useListener('event', (msg) => {
     setEvents(prev => [...prev, msg.body]); // ✅ Functional update
   }, []);
   ```

## useEventStream

Subscribe to events and keep them in React state automatically.

### API

```tsx
useEventStream(
  eventName: string,
  options?: {
    accumulate?: boolean
  }
): any | any[] | null
```

### Parameters

- **`eventName`** (string, required): Event name/path to listen for
- **`options`** (Object, optional): Options object
  - **`accumulate`** (boolean, optional): If `true`, accumulate events in array. Default: `false`

### Returns

- **Latest Event Mode** (`accumulate: false`): Returns the latest event value, or `null` if no events
- **Accumulate Mode** (`accumulate: true`): Returns an array of all events received

### Behavior

- **Latest Event:** Returns most recent event body, replaces previous value
- **Accumulate:** Appends each event to array, never clears
- **Initial State:** Returns `null` or `[]` until first event

### Example: Latest Event

```tsx
import { useEventStream } from 'mycelia-kernel-plugin/react';

function LatestTodo() {
  const latestTodo = useEventStream('todo:created');
  
  if (!latestTodo) {
    return <div>No todos yet</div>;
  }
  
  return <div>Latest: {latestTodo.text}</div>;
}
```

### Example: Accumulated Events

```tsx
function TodoHistory() {
  const todos = useEventStream('todo:created', { accumulate: true });
  
  return (
    <ul>
      {todos.map((todo, i) => (
        <li key={i}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

### Use Cases

**Latest Event Mode:**
- Display most recent notification
- Show current status
- Single-value updates

**Accumulate Mode:**
- Event history/logs
- Activity feeds
- Audit trails

### Best Practices

1. **Null Checks** - Always check for null in latest mode:
   ```tsx
   const event = useEventStream('event');
   if (!event) return <div>No events</div>;
   ```

2. **Array Checks** - Check array length in accumulate mode:
   ```tsx
   const events = useEventStream('event', { accumulate: true });
   if (events.length === 0) return <div>No events</div>;
   ```

3. **Memory Management** - Be careful with accumulate mode in long-running apps:
   ```tsx
   // Consider clearing periodically or limiting array size
   useEffect(() => {
     if (events.length > 100) {
       setEvents(events.slice(-50)); // Keep last 50
     }
   }, [events]);
   ```

## Complete Example

```tsx
import { 
  MyceliaProvider, 
  useListener, 
  useEventStream 
} from 'mycelia-kernel-plugin/react';
import { useBase, useListeners } from 'mycelia-kernel-plugin';

const buildSystem = () =>
  useBase('event-app')
    .use(useListeners)
    .build();

function App() {
  return (
    <MyceliaProvider build={buildSystem}>
      <EventDashboard />
    </MyceliaProvider>
  );
}

function EventDashboard() {
  const system = useMycelia();
  
  // Enable listeners
  useEffect(() => {
    system.listeners.enableListeners();
  }, [system]);
  
  // Latest event
  const latestEvent = useEventStream('user:action');
  
  // Accumulated events
  const allEvents = useEventStream('user:action', { accumulate: true });
  
  // Custom handler
  useListener('user:created', (msg) => {
    console.log('User created:', msg.body);
  }, []);
  
  return (
    <div>
      <h2>Latest Event</h2>
      {latestEvent ? <div>{latestEvent.type}</div> : <div>None</div>}
      
      <h2>Event History ({allEvents.length})</h2>
      <ul>
        {allEvents.map((e, i) => (
          <li key={i}>{e.type} at {e.timestamp}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Integration with useListeners

These helpers work with the `useListeners` hook. Make sure to:

1. **Enable Listeners** - Call `system.listeners.enableListeners()` before using:
   ```tsx
   useEffect(() => {
     system.listeners.enableListeners();
   }, [system]);
   ```

2. **Emit Events** - Use `system.listeners.emit()` to trigger events:
   ```tsx
   system.listeners.emit('user:created', {
     type: 'user:created',
     body: { id: 1, name: 'John' }
   });
   ```

## See Also

- [useListeners Hook](../hooks/USE-LISTENERS.md) - Core listener system documentation
- [Core Bindings](./CORE-BINDINGS.md) - Provider and basic hooks
- [Queue Helpers](./QUEUE-HELPERS.md) - Queue management utilities

