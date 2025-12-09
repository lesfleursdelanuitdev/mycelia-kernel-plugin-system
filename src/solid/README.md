# Solid.js Bindings

Solid.js utilities that make the Mycelia Plugin System feel natural inside Solid.js applications using signals and context.

## Overview

The Solid.js bindings provide a set of components and hooks that integrate the Mycelia Plugin System seamlessly with Solid.js. They handle lifecycle management, context provisioning, and automatic cleanup, making the plugin system feel like a native Solid.js data layer.

## Installation

```bash
npm install mycelia-kernel-plugin solid-js
```

**Requirements:**
- Solid.js >= 1.0.0
- Mycelia Plugin System (included in package)

## Quick Start

```jsx
import { MyceliaProvider, useFacet, useListener } from 'mycelia-kernel-plugin/solid';
import { useBase, useListeners, useDatabase } from 'mycelia-kernel-plugin';

// Create system builder
const buildSystem = () =>
  useBase('my-app')
    .config('database', { host: 'localhost' })
    .use(useDatabase)
    .use(useListeners)
    .build();

// Bootstrap your app
export default function App() {
  return (
    <MyceliaProvider build={buildSystem}>
      <MyComponent />
    </MyceliaProvider>
  );
}

// Use in components
function MyComponent() {
  const db = useFacet('database');
  const system = useMycelia();
  
  useListener('user:created', (msg) => {
    console.log('User created:', msg.body);
  });
  
  // Use db(), system(), etc.
}
```

## Documentation

- **[Core Bindings](./CORE-BINDINGS.md)** - Provider and basic hooks
- **[Listener Helpers](./LISTENER-HELPERS.md)** - Event listener utilities
- **[Queue Helpers](./QUEUE-HELPERS.md)** - Queue management utilities
- **[Builder Helpers](./BUILDER-HELPERS.md)** - System builder utilities
- **[Signal Generator](./SIGNAL-GENERATOR.md)** - Custom signal generation

## Features

- **Automatic Lifecycle Management** - System is built on mount and disposed on unmount
- **Context-Based Access** - System available throughout component tree
- **Automatic Cleanup** - Listeners and effects cleaned up automatically
- **Solid Signals** - Reactive state with Solid.js signals

