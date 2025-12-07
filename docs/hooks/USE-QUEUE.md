# useQueue Hook

## Overview

The `useQueue` hook provides message queue management functionality to subsystems. It wraps a `SubsystemQueueManager` and exposes methods for queue operations, status monitoring, and message processing.

**Hook Kind:** `'queue'`  
**Version:** `1.0.0`  
**Contract:** `'queue'`  
**Attach:** `true` (automatically attached to subsystem)

## Features

- **Bounded Queue**: Configurable capacity limits
- **Queue Policies**: Configurable policies for handling queue overflow (drop-oldest, drop-newest, etc.)
- **Status Monitoring**: Get queue status (size, capacity, utilization)
- **Message Selection**: Select next message for processing
- **Queue Management**: Clear queue, check for messages
- **Statistics Integration**: Optional integration with statistics facet for tracking queue full events

## Installation

```javascript
import { StandalonePluginSystem } from 'mycelia-kernel-plugin';
import { useQueue } from 'mycelia-kernel-plugin';

const system = new StandalonePluginSystem('my-app', {
  config: {
    queue: {
      capacity: 1000,        // Maximum queue size
      policy: 'drop-oldest', // Overflow policy
      debug: false           // Enable debug logging
    }
  }
});

system.use(useQueue);
await system.build();
```

## Configuration

The hook accepts configuration via `ctx.config.queue`:

```javascript
{
  capacity: 1000,        // Maximum queue size (default: 1000)
  policy: 'drop-oldest', // Overflow policy (default: 'drop-oldest')
  debug: false           // Enable debug logging (default: false)
}
```

### Queue Policies

- **`'drop-oldest'`** (default): Remove oldest message when queue is full
- **`'drop-newest'`**: Reject new messages when queue is full
- **`'block'`**: Block until space is available (if supported)

## Usage

### Enqueueing Messages

```javascript
// Enqueue a message-options pair
const message = { type: 'user/create', body: { id: 123 } };
const options = { priority: 'high' };
const success = system.queue.queue.enqueue({ msg: message, options });

if (success) {
  console.log('Message enqueued successfully');
} else {
  console.log('Queue is full, message rejected');
}
```

### Processing Messages

```javascript
// Check if there are messages to process
if (system.queue.hasMessagesToProcess()) {
  // Select next message
  const next = system.queue.selectNextMessage();
  if (next) {
    const { msg, options } = next;
    // Process the message
    console.log('Processing:', msg);
  }
}
```

### Queue Status

```javascript
// Get queue status
const status = system.queue.getQueueStatus();
console.log('Queue status:', status);
// {
//   size: 5,
//   maxSize: 1000,
//   utilization: 0.005,
//   isFull: false
// }

// Get status with additional state
const statusWithState = system.queue.getQueueStatus({
  isProcessing: true,
  isPaused: false
});
```

### Queue Management

```javascript
// Clear all messages from the queue
system.queue.clearQueue();

// Check if queue has messages
if (system.queue.hasMessagesToProcess()) {
  // Process messages
}
```

### Direct Queue Access

```javascript
// Access the underlying queue directly
const queue = system.queue.queue;

// Queue has .capacity property and methods like .remove()
console.log('Queue capacity:', queue.capacity);
console.log('Queue size:', queue.size);
```

## API Reference

### Methods

#### `getQueueStatus(additionalState?)`

Get queue status information.

**Parameters:**
- `additionalState` (Object, optional): Additional state to include in status
  - `isProcessing` (boolean): Whether queue is currently processing
  - `isPaused` (boolean): Whether queue is paused
  - Any other custom state properties

**Returns:** `Object` - Queue status object:
```javascript
{
  size: number,        // Current queue size
  maxSize: number,     // Maximum queue capacity
  utilization: number, // Utilization ratio (size / maxSize)
  isFull: boolean,    // Whether queue is full
  // ... any additional state properties
}
```

#### `hasMessagesToProcess()`

Check if queue has messages to process.

**Returns:** `boolean` - `true` if queue has messages

#### `selectNextMessage()`

Select and dequeue the next message to process.

**Returns:** `{msg: Message, options: Object} | null` - Message-options pair, or `null` if queue is empty

#### `clearQueue()`

Clear all messages from the queue.

**Returns:** `void`

### Properties

#### `queue` (property)

Direct access to the underlying `BoundedQueue` instance.

**Type:** `BoundedQueue`

**Properties:**
- `capacity` (number): Maximum queue size
- `size` (number): Current queue size

**Methods:**
- `enqueue(item)`: Add item to queue
- `dequeue()`: Remove and return next item
- `remove(item)`: Remove specific item
- `clear()`: Clear all items

#### `_queueManager` (property)

Internal queue manager instance (used by other hooks for enqueueing).

**Type:** `SubsystemQueueManager`

**Note:** This is primarily for internal use by other hooks.

## Contract

The `useQueue` hook implements the `'queue'` contract, which requires:

**Required Methods:**
- `selectNextMessage()`
- `hasMessagesToProcess()`
- `getQueueStatus(additionalState?)`

**Required Properties:**
- `_queueManager` (object with `enqueue` method)
- `queue` (object - BoundedQueue instance)

## Examples

### Basic Queue Usage

```javascript
import { StandalonePluginSystem } from 'mycelia-kernel-plugin';
import { useQueue } from 'mycelia-kernel-plugin';

const system = new StandalonePluginSystem('queue-system', {
  config: {
    queue: {
      capacity: 10,
      policy: 'drop-oldest'
    }
  }
});

system.use(useQueue);
await system.build();

// Enqueue messages
const messages = [
  { msg: 'Message 1', options: {} },
  { msg: 'Message 2', options: {} },
  { msg: 'Message 3', options: {} }
];

for (const message of messages) {
  const success = system.queue.queue.enqueue(message);
  console.log(`Enqueued: ${message.msg} (success: ${success})`);
}

// Get queue status
const status = system.queue.getQueueStatus();
console.log('Queue status:', status);

// Process messages
while (system.queue.hasMessagesToProcess()) {
  const next = system.queue.selectNextMessage();
  if (next) {
    console.log('Processed:', next.msg);
  }
}

// Get final status
const finalStatus = system.queue.getQueueStatus();
console.log('Final queue status:', finalStatus);
```

### Queue with Processing Loop

```javascript
async function processQueue(system) {
  while (system.queue.hasMessagesToProcess()) {
    const next = system.queue.selectNextMessage();
    if (next) {
      try {
        await processMessage(next.msg, next.options);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
    
    // Get status for monitoring
    const status = system.queue.getQueueStatus({
      isProcessing: true
    });
    console.log('Queue status:', status);
  }
}

async function processMessage(msg, options) {
  // Process message logic
  console.log('Processing:', msg);
}
```

### Queue Monitoring

```javascript
function monitorQueue(system) {
  setInterval(() => {
    const status = system.queue.getQueueStatus();
    
    if (status.utilization > 0.8) {
      console.warn('Queue utilization high:', status.utilization);
    }
    
    if (status.isFull) {
      console.error('Queue is full!');
    }
    
    console.log(`Queue: ${status.size}/${status.maxSize} (${(status.utilization * 100).toFixed(1)}%)`);
  }, 1000);
}
```

### Queue with Statistics

If the statistics hook is available, queue full events are automatically tracked:

```javascript
import { useQueue } from 'mycelia-kernel-plugin';
import { useStatistics } from 'mycelia-kernel-plugin'; // If available

const system = new StandalonePluginSystem('app', {
  config: {
    queue: { capacity: 100 }
  }
});

system
  .use(useStatistics) // Optional: for queue full tracking
  .use(useQueue)
  .build();

// Queue full events are automatically recorded in statistics
```

## Integration with Other Hooks

The queue hook can integrate with other hooks:

- **Statistics Hook**: Automatically records queue full events if statistics facet is available
- **Message Processor Hook**: Uses queue for message processing
- **Router Hook**: Can enqueue routed messages

## Best Practices

1. **Capacity Planning**: Set appropriate capacity based on expected message volume
2. **Policy Selection**: Choose the right overflow policy for your use case
3. **Status Monitoring**: Regularly check queue status to prevent overflow
4. **Error Handling**: Handle cases where queue might be full
5. **Message Processing**: Process messages in a loop, handling errors gracefully
6. **Cleanup**: Clear queue when no longer needed

## Troubleshooting

### Queue Always Full

**Problem:** Queue seems to be full all the time.

**Solution:**
- Check if messages are being processed
- Increase capacity if needed
- Verify processing loop is running
- Check for memory leaks in message processing

### Messages Not Being Processed

**Problem:** Messages are enqueued but not processed.

**Solution:**
- Ensure `selectNextMessage()` is being called
- Check that processing loop is running
- Verify `hasMessagesToProcess()` returns `true`
- Check for errors in message processing

### Queue Status Incorrect

**Problem:** Queue status doesn't match actual queue state.

**Solution:**
- Ensure status is checked after enqueue/dequeue operations
- Check if multiple systems are accessing the same queue
- Verify queue manager is properly initialized

## See Also

- [useListeners Hook](./USE-LISTENERS.md) - Event-driven listener management
- [useSpeak Hook](./USE-SPEAK.md) - Output functionality
- [Facet Contracts](../facet-contracts/FACET-CONTRACTS-OVERVIEW.md) - Contract system
- [Examples](../examples/README.md) - More examples

