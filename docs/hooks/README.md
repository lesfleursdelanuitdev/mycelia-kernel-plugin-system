# Built-in Hooks

This directory contains documentation for the built-in hooks provided with the Mycelia Plugin System.

## Available Hooks

- **[useListeners](./USE-LISTENERS.md)** - Event-driven listener management system
- **[useQueue](./USE-QUEUE.md)** - Message queue management with capacity limits
- **[useSpeak](./USE-SPEAK.md)** - Simple output/printing functionality

## Quick Start

All built-in hooks can be imported from the main package:

```javascript
import { useListeners, useQueue, useSpeak } from 'mycelia-kernel-plugin';
```

Then use them with your plugin system:

```javascript
const system = new StandalonePluginSystem('my-app', {
  config: {
    listeners: { /* config */ },
    queue: { /* config */ },
    speak: { /* config */ }
  }
});

system
  .use(useListeners)
  .use(useQueue)
  .use(useSpeak)
  .build();
```

## Hook Contracts

All built-in hooks implement facet contracts that ensure interface compatibility:

- `listeners` contract - Validates listener management interface
- `queue` contract - Validates queue management interface
- `speak` contract - Validates output interface

See the individual hook documentation for contract details.

