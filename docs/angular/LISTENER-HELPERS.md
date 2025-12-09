# Listener Helpers

Angular utilities for working with the `useListeners` hook in Angular components.

## Overview

The listener helpers provide Angular-friendly ways to register event listeners and subscribe to event streams, with RxJS observables and proper cleanup.

## useListener

Register an event listener in Angular component.

### API

```ts
useListener(
  myceliaService: MyceliaService,
  eventName: string,
  handler: (message: any) => void
): () => void
```

### Parameters

- **`myceliaService`** (MyceliaService, required): MyceliaService instance
- **`eventName`** (string, required): Event name/path to listen for
- **`handler`** (Function, required): Handler function that receives the message

### Returns

- **`unsubscribe`** (Function): Function to unsubscribe the listener

### Behavior

- **Registration:** Registers listener immediately
- **Cleanup:** Must be called in `ngOnDestroy`
- **Handler:** Called whenever event is emitted

### Example

```ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { useListener } from 'mycelia-kernel-plugin/angular';

@Component({...})
export class AuditLogComponent implements OnInit, OnDestroy {
  private unsubscribe: (() => void) | null = null;

  constructor(private mycelia: MyceliaService) {}

  ngOnInit() {
    this.unsubscribe = useListener(
      this.mycelia,
      'user:created',
      (msg) => {
        console.log('User created:', msg.body);
      }
    );
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```

### Best Practices

1. **Always Unsubscribe** - Clean up in `ngOnDestroy`:
   ```ts
   ngOnDestroy() {
     if (this.unsubscribe) {
       this.unsubscribe();
     }
   }
   ```

2. **Store Unsubscribe Function** - Keep reference for cleanup:
   ```ts
   private unsubscribe: (() => void) | null = null;
   ```

3. **Multiple Listeners** - Store array of unsubscribe functions:
   ```ts
   private unsubscribes: (() => void)[] = [];

   ngOnInit() {
     this.unsubscribes.push(
       useListener(this.mycelia, 'user:created', this.handleUserCreated),
       useListener(this.mycelia, 'user:updated', this.handleUserUpdated)
     );
   }

   ngOnDestroy() {
     this.unsubscribes.forEach(unsub => unsub());
   }
   ```

## useEventStream

Subscribe to events as an RxJS observable.

### API

```ts
useEventStream(
  myceliaService: MyceliaService,
  eventName: string,
  options?: {
    accumulate?: boolean
  }
): Observable<any | any[]>
```

### Parameters

- **`myceliaService`** (MyceliaService, required): MyceliaService instance
- **`eventName`** (string, required): Event name/path to listen for
- **`options`** (Object, optional): Options object
  - **`accumulate`** (boolean, optional): If `true`, accumulate events in array. Default: `false`

### Returns

- **Latest Event Mode** (`accumulate: false`): Observable that emits the latest event value
- **Accumulate Mode** (`accumulate: true`): Observable that emits an array of all events

### Behavior

- **Latest Event:** Emits most recent event body, replaces previous value
- **Accumulate:** Appends each event to array, never clears
- **Initial State:** Emits nothing until first event

### Example: Latest Event

```ts
import { Component } from '@angular/core';
import { useEventStream } from 'mycelia-kernel-plugin/angular';

@Component({
  selector: 'app-latest-todo',
  template: `
    <div *ngIf="latestTodo$ | async as todo">
      Latest: {{ todo.text }}
    </div>
  `
})
export class LatestTodoComponent {
  latestTodo$ = useEventStream(this.mycelia, 'todo:created');

  constructor(private mycelia: MyceliaService) {}
}
```

### Example: Accumulated Events

```ts
import { Component } from '@angular/core';
import { useEventStream } from 'mycelia-kernel-plugin/angular';

@Component({
  selector: 'app-event-list',
  template: `
    <ul>
      <li *ngFor="let event of events$ | async">
        {{ event.text }}
      </li>
    </ul>
  `
})
export class EventListComponent {
  events$ = useEventStream(this.mycelia, 'todo:created', { accumulate: true });

  constructor(private mycelia: MyceliaService) {}
}
```

### Best Practices

1. **Use Async Pipe** - Let Angular handle subscription/unsubscription:
   ```ts
   events$ = useEventStream(this.mycelia, 'todo:created', { accumulate: true });
   ```
   ```html
   <div *ngFor="let event of events$ | async">
     {{ event.text }}
   </div>
   ```

2. **Manual Subscription** - If needed, unsubscribe in `ngOnDestroy`:
   ```ts
   private subscription: Subscription;

   ngOnInit() {
     this.subscription = useEventStream(this.mycelia, 'todo:created')
       .subscribe(event => {
         // Handle event
       });
   }

   ngOnDestroy() {
     this.subscription.unsubscribe();
   }
   ```

## Complete Example

```ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { useListener, useEventStream } from 'mycelia-kernel-plugin/angular';

@Component({
  selector: 'app-todo-audit',
  template: `
    <h2>Todo Audit Log</h2>
    <ul>
      <li *ngFor="let event of events$ | async">
        {{ event.type }}: {{ event.text }} at {{ event.timestamp }}
      </li>
    </ul>
  `
})
export class TodoAuditComponent implements OnInit, OnDestroy {
  events$ = useEventStream(this.mycelia, 'todo:*', { accumulate: true });
  private unsubscribe: (() => void) | null = null;

  constructor(private mycelia: MyceliaService) {}

  ngOnInit() {
    // Also listen for specific events
    this.unsubscribe = useListener(
      this.mycelia,
      'todo:deleted',
      (msg) => {
        console.log('Todo deleted:', msg.body);
      }
    );
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```

## See Also

- [Core Bindings](./CORE-BINDINGS.md) - Service factory and basic utilities
- [useListeners Hook](../hooks/USE-LISTENERS.md) - Event system documentation
- [Queue Helpers](./QUEUE-HELPERS.md) - Queue management utilities


