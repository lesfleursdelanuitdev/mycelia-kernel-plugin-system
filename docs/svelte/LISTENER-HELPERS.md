# Listener Helpers

Svelte utilities for working with the `useListeners` hook in Svelte components.

## Overview

The listener helpers provide Svelte-friendly ways to register event listeners and subscribe to event streams, with automatic cleanup and reactive state management via stores.

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

- **Registration:** Registers listener when system is available
- **Cleanup:** Automatically unregisters listener on component destroy
- **System Changes:** Re-registers if system changes

### Example

```svelte
<script>
  import { useListener } from 'mycelia-kernel-plugin/svelte';
  
  let events = [];
  
  useListener('user:created', (msg) => {
    events = [...events, msg.body];
  });
</script>

<ul>
  {#each events as event (event.id)}
    <li>{event.name} created</li>
  {/each}
</ul>
```

### With Reactive State

```svelte
<script>
  import { useListener } from 'mycelia-kernel-plugin/svelte';
  
  let userId = 123;
  
  useListener('user:updated', (msg) => {
    if (msg.body.id === userId) {
      console.log('User updated:', msg.body);
    }
  });
</script>

<div>Listening for user {userId} updates</div>
```

### Best Practices

1. **Use Reactive Variables** - Update reactive variables in handlers:
   ```svelte
   <script>
     let events = [];
     
     useListener('event', (msg) => {
       events = [...events, msg.body]; // ✅ Reactive update
     });
   </script>
   ```

2. **Access Reactive Values** - Access reactive values directly in handler:
   ```svelte
   <script>
     let count = 0;
     
     useListener('event', (msg) => {
       console.log(count); // ✅ Access directly
     });
   </script>
   ```

## useEventStream

Subscribe to events and keep them in a reactive store automatically.

### API

```js
useEventStream(
  eventName: string,
  options?: {
    accumulate?: boolean
  }
): Writable
```

### Parameters

- **`eventName`** (string, required): Event name/path to listen for
- **`options`** (Object, optional): Options object
  - **`accumulate`** (boolean, optional): If `true`, accumulate events in array. Default: `false`

### Returns

- **Latest Event Mode** (`accumulate: false`): Returns a writable store with the latest event value, or `null` if no events
- **Accumulate Mode** (`accumulate: true`): Returns a writable store with an array of all events received

### Behavior

- **Latest Event:** Returns most recent event body, replaces previous value
- **Accumulate:** Appends each event to array, never clears
- **Initial State:** Returns store with `null` or `[]` until first event
- **Reactive:** Returns a Svelte store, automatically updates templates

### Example: Latest Event

```svelte
<script>
  import { useEventStream } from 'mycelia-kernel-plugin/svelte';
  
  const latestTodo = useEventStream('todo:created');
</script>

{#if $latestTodo}
  <div>Latest: {$latestTodo.text}</div>
{:else}
  <div>No todos yet</div>
{/if}
```

### Example: Accumulated Events

```svelte
<script>
  import { useEventStream } from 'mycelia-kernel-plugin/svelte';
  
  const todos = useEventStream('todo:created', { accumulate: true });
</script>

<ul>
  {#each $todos as todo (todo.id)}
    <li>{todo.text}</li>
  {/each}
</ul>
```

### Example: With Derived Stores

```svelte
<script>
  import { derived } from 'svelte/store';
  import { useEventStream } from 'mycelia-kernel-plugin/svelte';
  
  const events = useEventStream('todo:created', { accumulate: true });
  
  const totalEvents = derived(events, $events => $events.length);
  const latestEventText = derived(events, $events => 
    $events.length > 0 
      ? $events[$events.length - 1].text 
      : 'None'
  );
</script>

<div>
  <div>Total events: {$totalEvents}</div>
  <div>Latest: {$latestEventText}</div>
</div>
```

### Best Practices

1. **Use in Templates** - Svelte automatically subscribes to stores:
   ```svelte
   <script>
     const latestTodo = useEventStream('todo:created');
   </script>
   
   <div>{$latestTodo.text}</div>
   ```

2. **Combine with Derived** - Create derived state:
   ```svelte
   <script>
     const todos = useEventStream('todo:created', { accumulate: true });
     const completedCount = derived(todos, $todos => 
       $todos.filter(t => t.completed).length
     );
   </script>
   ```

## Complete Example

```svelte
<script>
  import { useEventStream, useMycelia } from 'mycelia-kernel-plugin/svelte';
  
  const systemStore = useMycelia();
  $: system = $systemStore;
  
  const latestEvent = useEventStream('demo:event');
  const allEvents = useEventStream('demo:event', { accumulate: true });
  
  const emitEvent = () => {
    system?.listeners?.emit('demo:event', {
      timestamp: new Date().toISOString(),
      message: 'Hello from Svelte!'
    });
  };
</script>

<div>
  <h2>Event Stream Demo</h2>
  <button on:click={emitEvent}>Emit Event</button>
  
  <div>
    <h3>Latest Event</h3>
    {#if $latestEvent}
      <div>{$latestEvent.timestamp}: {$latestEvent.message}</div>
    {:else}
      <div>No events yet</div>
    {/if}
  </div>
  
  <div>
    <h3>All Events ({$allEvents.length})</h3>
    <ul>
      {#each $allEvents as event (event.timestamp)}
        <li>{event.timestamp}: {event.message}</li>
      {/each}
    </ul>
  </div>
</div>
```

## See Also

- [Core Bindings](./CORE-BINDINGS.md) - Context and basic stores
- [useListeners Hook](../hooks/USE-LISTENERS.md) - Event system documentation
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation

