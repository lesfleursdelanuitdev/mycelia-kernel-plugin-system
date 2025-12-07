# useListeners Hook

## Overview

The `useListeners` hook provides event-driven listener management functionality to subsystems. It wraps a `ListenerManager` and exposes methods for registering, unregistering, and emitting events to listeners.

**Hook Kind:** `'listeners'`  
**Version:** `1.0.0`  
**Contract:** `'listeners'`  
**Attach:** `true` (automatically attached to subsystem)

## Features

- **Event Registration**: Register listeners for specific message paths
- **Pattern Matching**: Support for pattern-based listener registration
- **Handler Groups**: Support for grouped handlers (onSuccess, onFailure, onTimeout)
- **Registration Policies**: Configurable policies for listener registration (multiple, single, etc.)
- **Optional Feature**: Listeners are disabled by default and must be explicitly enabled
- **Statistics**: Optional integration with statistics facet for tracking

## Installation

```javascript
import { StandalonePluginSystem } from 'mycelia-kernel-plugin';
import { useListeners } from 'mycelia-kernel-plugin';

const system = new StandalonePluginSystem('my-app', {
  config: {
    listeners: {
      registrationPolicy: 'multiple',  // 'multiple' | 'single' | 'replace'
      debug: true,
      policyOptions: {
        maxListeners: 10  // Policy-specific options
      }
    }
  }
});

system.use(useListeners);
await system.build();
```

## Configuration

The hook accepts configuration via `ctx.config.listeners`:

```javascript
{
  registrationPolicy: 'multiple',  // Registration policy (default: 'multiple')
  debug: false,                    // Enable debug logging (default: false)
  policyOptions: {}                // Policy-specific options (default: {})
}
```

### Registration Policies

- **`'multiple'`** (default): Allow multiple listeners per path
- **`'single'`**: Only allow one listener per path (replaces existing)
- **`'replace'`**: Replace existing listeners when registering new ones

## Usage

### Enabling Listeners

Listeners are **disabled by default** and must be explicitly enabled:

```javascript
// Enable listeners with default config
system.listeners.enableListeners();

// Enable listeners with custom options
system.listeners.enableListeners({
  registrationPolicy: 'single',
  debug: true
});
```

### Registering Listeners

#### Basic Listener Registration

```javascript
// Register a simple listener
system.listeners.on('user/create', (message) => {
  console.log('User created:', message);
});

// Register multiple listeners for the same path
system.listeners.on('user/create', (message) => {
  console.log('Another handler for user creation');
});
```

#### Pattern-Based Listeners

Pattern-based listeners are available through the underlying `ListenerManager`:

```javascript
// Access ListenerManager and register a pattern listener
if (system.listeners.listeners) {
  system.listeners.listeners.onPattern('user/{id}/action', (message, params) => {
    console.log(`User ${params.id} performed action:`, message);
  });
}
```

**Note:** Pattern listeners require the `listeners` property to be enabled and the underlying `ListenerManager` to be initialized.

#### Handler Groups

Handler groups allow you to register multiple related handlers at once:

```javascript
system.listeners.on('save/msg_123', {
  onSuccess: (message) => console.log('Save succeeded:', message),
  onFailure: (message) => console.error('Save failed:', message),
  onTimeout: (message) => console.warn('Save timed out:', message)
}, { isHandlerGroup: true });
```

### Unregistering Listeners

```javascript
// Unregister a specific listener
const handler = (message) => console.log(message);
system.listeners.on('event/path', handler);
system.listeners.off('event/path', handler);

// Unregister a handler group
system.listeners.off('save/msg_123', {
  onSuccess: handler1,
  onFailure: handler2
}, { isHandlerGroup: true });
```

### Emitting Events

```javascript
// Emit an event to all registered listeners
const message = { type: 'user/create', body: { id: 123, name: 'John' } };
const notified = system.listeners.emit('user/create', message);
console.log(`Notified ${notified} listeners`);
```

### Checking Listener Status

```javascript
// Check if listeners are enabled
if (system.listeners.hasListeners()) {
  // Listeners are enabled and ready
}

// Disable listeners (keeps manager instance)
system.listeners.disableListeners();
```

### Direct Access to ListenerManager

```javascript
// Get the underlying ListenerManager instance
const manager = system.listeners.listeners;
if (manager) {
  // Use ListenerManager directly
  manager.on('path', handler);
}
```

## API Reference

### Methods

#### `enableListeners(listenerOptions?)`

Enable listeners and initialize the ListenerManager.

**Parameters:**
- `listenerOptions` (Object, optional): Options that override config
  - `registrationPolicy` (string): Registration policy
  - `debug` (boolean): Enable debug logging
  - `policyOptions` (Object): Policy-specific options

**Returns:** `void`

#### `disableListeners()`

Disable listeners (keeps the manager instance).

**Returns:** `void`

#### `hasListeners()`

Check if listeners are enabled.

**Returns:** `boolean` - `true` if listeners are enabled

#### `on(path, handlers, options?)`

Register a listener for a specific path.

**Parameters:**
- `path` (string): Message path to listen for
- `handlers` (Function | Object): Handler function or handler group object
- `options` (Object, optional):
  - `isHandlerGroup` (boolean): Whether handlers is a handler group object
  - `debug` (boolean): Runtime debug flag

**Returns:** `boolean` - Success status

**Note:** Returns `false` if listeners are not enabled.

#### `off(path, handlers, options?)`

Unregister a listener for a specific path.

**Parameters:**
- `path` (string): Message path
- `handlers` (Function | Object): Handler function or handler group object to remove
- `options` (Object, optional):
  - `isHandlerGroup` (boolean): Whether handlers is a handler group object
  - `debug` (boolean): Runtime debug flag

**Returns:** `boolean` - Success status

**Note:** Returns `false` if listeners are not enabled.

#### `emit(path, message)`

Emit an event to listeners for a specific path.

**Parameters:**
- `path` (string): Message path to emit to
- `message` (Message): Message to send to listeners

**Returns:** `number` - Number of listeners notified, or `0` if listeners not enabled

### Properties

#### `listeners` (getter)

Direct access to the underlying `ListenerManager` instance.

**Returns:** `ListenerManager | null` - The ListenerManager instance, or `null` if not enabled

#### `_listenerManager()` (function)

Function accessor that returns the ListenerManager instance.

**Returns:** `ListenerManager | null` - The ListenerManager instance, or `null` if not enabled

## Contract

The `useListeners` hook implements the `'listeners'` contract, which requires:

**Required Methods:**
- `on(path, handlers, options?)`
- `off(path, handlers, options?)`
- `hasListeners()`
- `enableListeners(listenerOptions?)`
- `disableListeners()`

**Required Properties:**
- `listeners` (getter)
- `_listenerManager` (function)

## Examples

### Basic Event System

```javascript
import { StandalonePluginSystem } from 'mycelia-kernel-plugin';
import { useListeners } from 'mycelia-kernel-plugin';

const system = new StandalonePluginSystem('event-system', {
  config: {
    listeners: {
      registrationPolicy: 'multiple'
    }
  }
});

system.use(useListeners);
await system.build();

// Enable listeners
system.listeners.enableListeners();

// Register listeners
system.listeners.on('user/create', (message) => {
  console.log('User created:', message.body);
});

system.listeners.on('user/update', (message) => {
  console.log('User updated:', message.body);
});

// Emit events
system.listeners.emit('user/create', {
  type: 'user/create',
  body: { id: 1, name: 'John' }
});
```

### Handler Groups

```javascript
// Register a handler group for async operations
system.listeners.on('api/request', {
  onSuccess: (message) => {
    console.log('Request succeeded:', message.body);
  },
  onFailure: (message) => {
    console.error('Request failed:', message.body);
  },
  onTimeout: (message) => {
    console.warn('Request timed out:', message.body);
  }
}, { isHandlerGroup: true });
```

### Conditional Listener Registration

```javascript
// Only register if listeners are enabled
if (system.listeners.hasListeners()) {
  system.listeners.on('important/event', (message) => {
    // Handle event
  });
} else {
  console.warn('Listeners not enabled');
}
```

## Integration with Other Hooks

The listeners hook can integrate with other hooks:

- **Statistics Hook**: If available, can track listener statistics
- **Queue Hook**: Can emit events when messages are queued
- **Router Hook**: Can listen for routing events

## Best Practices

1. **Always Enable Listeners**: Remember to call `enableListeners()` before using listeners
2. **Check Status**: Use `hasListeners()` before registering listeners in conditional code
3. **Clean Up**: Unregister listeners when no longer needed using `off()`
4. **Error Handling**: Handle cases where listeners might not be enabled
5. **Policy Selection**: Choose the appropriate registration policy for your use case

## Troubleshooting

### Listeners Not Working

**Problem:** Listeners don't seem to be receiving events.

**Solution:**
- Ensure `enableListeners()` has been called
- Check that `hasListeners()` returns `true`
- Verify the path matches exactly (case-sensitive)
- Check debug logs if `debug: true` is set

### Multiple Listeners Not Firing

**Problem:** Only one listener fires even when multiple are registered.

**Solution:**
- Check the `registrationPolicy` - if set to `'single'`, only one listener is allowed
- Use `'multiple'` policy to allow multiple listeners per path

### Handler Groups Not Working

**Problem:** Handler groups aren't being called correctly.

**Solution:**
- Ensure `isHandlerGroup: true` is set in options
- Verify the handler group object has the correct structure (onSuccess, onFailure, onTimeout)

## See Also

- [useQueue Hook](./USE-QUEUE.md) - Message queue management
- [useSpeak Hook](./USE-SPEAK.md) - Output functionality
- [Facet Contracts](../facet-contracts/FACET-CONTRACTS-OVERVIEW.md) - Contract system
- [Examples](../examples/README.md) - More examples

