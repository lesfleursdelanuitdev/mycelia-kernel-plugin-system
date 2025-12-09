# Core Bindings

Core Angular bindings for the Mycelia Plugin System: Service factory and basic utilities.

## createMyceliaService

Factory function that creates a Mycelia service with RxJS observables.

### API

```ts
const service = createMyceliaService(build);
```

### Parameters

- **`build`** (Function, required): Async function that returns a built system instance

### Returns

- **`service`** (Object): Service object with observables and helper methods

### Service Properties

- **`system$`** (Observable): Observable that emits the system instance
- **`error$`** (Observable): Observable that emits errors
- **`loading$`** (Observable): Observable that emits loading state (boolean)

### Service Methods

- **`getSystem()`**: Get current system synchronously (may be null)
- **`useFacet(kind)`**: Get facet by kind synchronously
- **`useListener(eventName, handler)`**: Register event listener, returns unsubscribe function
- **`dispose()`**: Dispose the system

### Behavior

- **On Creation:** Calls `build()` function asynchronously
- **Observables:** Emit values as system state changes
- **Error Handling:** Errors emitted via `error$` observable
- **Loading State:** `loading$` observable tracks build progress

### Example

```ts
import { Injectable } from '@angular/core';
import { createMyceliaService } from 'mycelia-kernel-plugin/angular';
import { useBase, useDatabase, useListeners } from 'mycelia-kernel-plugin';

const buildSystem = () =>
  useBase('my-app')
    .use(useDatabase)
    .use(useListeners)
    .build();

@Injectable({ providedIn: 'root' })
export class MyceliaService {
  private service = createMyceliaService(buildSystem);

  get system$() {
    return this.service.system$;
  }

  get error$() {
    return this.service.error$;
  }

  get loading$() {
    return this.service.loading$;
  }

  getSystem() {
    return this.service.getSystem();
  }

  useFacet(kind: string) {
    return this.service.useFacet(kind);
  }

  useListener(eventName: string, handler: Function) {
    return this.service.useListener(eventName, handler);
  }

  async dispose() {
    await this.service.dispose();
  }
}
```

### Best Practices

1. **Wrap in Injectable Service** - Use Angular's DI system:
   ```ts
   @Injectable({ providedIn: 'root' })
   export class MyceliaService {
     private service = createMyceliaService(buildSystem);
     // ...
   }
   ```

2. **Subscribe to Observables** - Use async pipe or manual subscription:
   ```ts
   // In component
   system$ = this.mycelia.system$;
   loading$ = this.mycelia.loading$;
   ```

3. **Handle Errors** - Subscribe to error$ observable:
   ```ts
   ngOnInit() {
     this.mycelia.error$.subscribe(error => {
       if (error) {
         console.error('System error:', error);
       }
     });
   }
   ```

4. **Cleanup** - Dispose in ngOnDestroy:
   ```ts
   ngOnDestroy() {
     this.mycelia.dispose();
   }
   ```

## useFacet (Helper)

Get a facet by kind as an RxJS observable.

### API

```ts
const facet$ = useFacet(myceliaService, kind);
```

### Parameters

- **`myceliaService`** (Object, required): MyceliaService instance
- **`kind`** (string, required): Facet kind identifier

### Returns

- **`facet$`** (Observable): Observable that emits the facet instance (or null)

### Example

```ts
import { Component } from '@angular/core';
import { useFacet } from 'mycelia-kernel-plugin/angular';

@Component({...})
export class UserListComponent {
  db$ = useFacet(this.mycelia, 'database');

  constructor(private mycelia: MyceliaService) {}
}
```

### Usage in Template

```html
<div *ngIf="db$ | async as db">
  <p>Database ready</p>
</div>
```

## Complete Example

```ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Injectable } from '@angular/core';
import { createMyceliaService, useFacet } from 'mycelia-kernel-plugin/angular';
import { useBase, useDatabase, useListeners } from 'mycelia-kernel-plugin';

// System builder
const buildSystem = () =>
  useBase('todo-app')
    .config('database', { host: 'localhost' })
    .use(useDatabase)
    .use(useListeners)
    .build();

// Service
@Injectable({ providedIn: 'root' })
export class MyceliaService {
  private service = createMyceliaService(buildSystem);

  get system$() {
    return this.service.system$;
  }

  useFacet(kind: string) {
    return this.service.useFacet(kind);
  }
}

// Component
@Component({
  selector: 'app-todo-list',
  template: `
    <div *ngIf="db$ | async as db">
      <p>Database ready</p>
    </div>
  `
})
export class TodoListComponent implements OnInit {
  db$ = useFacet(this.mycelia, 'database');

  constructor(private mycelia: MyceliaService) {}

  ngOnInit() {
    // System is automatically initialized
  }
}
```

## See Also

- [Listener Helpers](./LISTENER-HELPERS.md) - Event listener utilities
- [Queue Helpers](./QUEUE-HELPERS.md) - Queue management utilities
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation


