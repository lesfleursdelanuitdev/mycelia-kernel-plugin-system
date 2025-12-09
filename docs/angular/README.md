# Angular Bindings

Angular utilities that make the Mycelia Plugin System feel natural inside Angular applications using dependency injection and RxJS.

## Overview

The Angular bindings provide a service-based integration that uses Angular's dependency injection system and RxJS observables. They handle lifecycle management, reactive state updates, and automatic cleanup, making the plugin system feel like a native Angular service layer.

## Installation

```bash
npm install mycelia-kernel-plugin @angular/core rxjs
```

**Requirements:**
- Angular >= 15.0.0
- RxJS >= 7.0.0
- Mycelia Plugin System (included in package)

## Quick Start

```ts
import { Injectable } from '@angular/core';
import { createMyceliaService } from 'mycelia-kernel-plugin/angular';
import { useBase, useListeners, useDatabase } from 'mycelia-kernel-plugin';

// Create system builder
const buildSystem = () =>
  useBase('my-app')
    .config('database', { host: 'localhost' })
    .use(useDatabase)
    .use(useListeners)
    .build();

// Create service
@Injectable({ providedIn: 'root' })
export class MyceliaService {
  private service = createMyceliaService(buildSystem);

  get system$() {
    return this.service.system$;
  }

  useFacet(kind: string) {
    return this.service.useFacet(kind);
  }

  useListener(eventName: string, handler: Function) {
    return this.service.useListener(eventName, handler);
  }
}

// Use in component
@Component({...})
export class MyComponent {
  constructor(private mycelia: MyceliaService) {
    const db = this.mycelia.useFacet('database');
    this.mycelia.useListener('user:created', (msg) => {
      console.log('User created:', msg.body);
    });
  }
}
```

## Documentation

- **[Core Bindings](./CORE-BINDINGS.md)** - Service factory and basic utilities
- **[Listener Helpers](./LISTENER-HELPERS.md)** - Event listener utilities
- **[Queue Helpers](./QUEUE-HELPERS.md)** - Queue management utilities
- **[Builder Helpers](./BUILDER-HELPERS.md)** - System builder utilities
- **[Service Generator](./SERVICE-GENERATOR.md)** - Custom service generation

## Features

- **RxJS Integration** - System state exposed as observables
- **Dependency Injection** - Works with Angular's DI system
- **Reactive Updates** - Automatic state synchronization via observables
- **Lifecycle Management** - Proper initialization and disposal
- **TypeScript-Friendly** - Full type support
- **No Circular Dependencies** - Clean module boundaries

## Examples

See the [Examples](../examples/README.md) directory for complete Angular examples, including the [Angular Todo App](../../examples/angular-todo/README.md).

## API Reference

### Core Bindings

- **[createMyceliaService(build)](./CORE-BINDINGS.md#createmyceliaservice)** - Create service factory
- **[useFacet(myceliaService, kind)](./CORE-BINDINGS.md#usefacet)** - Get facet observable
- **[useListener(myceliaService, eventName, handler)](./LISTENER-HELPERS.md#uselistener)** - Register event listener

### Listener Helpers

- **[useListener(myceliaService, eventName, handler)](./LISTENER-HELPERS.md#uselistener)** - Register event listener
- **[useEventStream(myceliaService, eventName, options)](./LISTENER-HELPERS.md#useeventstream)** - Subscribe to events as observable

### Queue Helpers

- **[useQueueStatus(myceliaService)](./QUEUE-HELPERS.md#usequeuestatus)** - Get queue status observable
- **[useQueueDrain(myceliaService, options)](./QUEUE-HELPERS.md#usequeuedrain)** - Automatically drain queue

### Builder Helpers

- **[createAngularSystemBuilder(name, configure)](./BUILDER-HELPERS.md#createangularsystembuilder)** - Create reusable builder

### Service Generator

- **[createFacetService(kind)](./SERVICE-GENERATOR.md#createfacetservice)** - Generate facet service

## Best Practices

1. **Service Factory** - Use `createMyceliaService` in a service class for proper DI integration
2. **Observable Subscriptions** - Always unsubscribe in `ngOnDestroy` to prevent memory leaks
3. **Error Handling** - Subscribe to `error$` observable to handle build errors
4. **Loading States** - Use `loading$` observable to show loading indicators
5. **Facet Services** - Use `createFacetService` to create domain-specific services

## Troubleshooting

### "System is null"

**Problem:** System not initialized yet.

**Solution:** Subscribe to `system$` observable and check for null before using.

### Listeners not firing

**Problem:** Events not being received.

**Solution:** Ensure listeners are enabled (`system.listeners.enableListeners()`) and system is built.

### Memory leaks

**Problem:** Observables not unsubscribed.

**Solution:** Always unsubscribe in `ngOnDestroy` lifecycle hook.

## See Also

- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation
- [useListeners Hook](../hooks/USE-LISTENERS.md) - Event system documentation
- [useQueue Hook](../hooks/USE-QUEUE.md) - Queue system documentation
- [Examples](../examples/README.md) - Complete examples


