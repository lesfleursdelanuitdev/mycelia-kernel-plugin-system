# Service Generator

Generate custom Angular services for specific facet kinds.

## Overview

The service generator allows you to create domain-specific services that make your Angular components more readable and maintainable.

## createFacetService

Generate a service factory for a specific facet kind.

### API

```ts
createFacetService(kind: string): (myceliaService: MyceliaService) => Observable<Facet | null>
```

### Parameters

- **`kind`** (string, required): Facet kind identifier

### Returns

- **Service Factory**: A function that takes MyceliaService and returns an observable of the facet

### Example

```ts
import { createFacetService } from 'mycelia-kernel-plugin/angular';

// Create facet services
export const DatabaseService = createFacetService('database');
export const CacheService = createFacetService('cache');
export const AuthService = createFacetService('auth');

// Use in component
@Component({...})
export class UserListComponent {
  db$ = DatabaseService(this.mycelia);

  constructor(private mycelia: MyceliaService) {}
}
```

### Domain-Specific Services

Create services organized by domain:

```ts
// services/data-services.ts
import { createFacetService } from 'mycelia-kernel-plugin/angular';

export const DatabaseService = createFacetService('database');
export const CacheService = createFacetService('cache');
export const StorageService = createFacetService('storage');

// services/auth-services.ts
export const AuthService = createFacetService('auth');
export const PermissionsService = createFacetService('permissions');
```

### With TypeScript

```ts
// types/facets.ts
interface DatabaseFacet {
  query(sql: string): Promise<any[]>;
  close(): Promise<void>;
}

interface CacheFacet {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
}

// services/data-services.ts
import { createFacetService } from 'mycelia-kernel-plugin/angular';

export const DatabaseService = createFacetService('database') as 
  (mycelia: MyceliaService) => Observable<DatabaseFacet | null>;

export const CacheService = createFacetService('cache') as 
  (mycelia: MyceliaService) => Observable<CacheFacet | null>;

// Use with type safety
@Component({...})
export class MyComponent {
  db$ = DatabaseService(this.mycelia); // Type: Observable<DatabaseFacet | null>

  constructor(private mycelia: MyceliaService) {}
}
```

## Complete Example

```ts
// services/todo-services.ts
import { createFacetService } from 'mycelia-kernel-plugin/angular';

export const TodoStoreService = createFacetService('todoStore');
export const TodoCacheService = createFacetService('todoCache');
export const TodoQueueService = createFacetService('todoQueue');

// components/todo-list.component.ts
import { TodoStoreService, TodoCacheService } from '../services/todo-services';

@Component({
  selector: 'app-todo-list',
  template: `
    <div *ngIf="store$ | async as store">
      <ul>
        <li *ngFor="let todo of todos">
          {{ todo.text }}
        </li>
      </ul>
    </div>
  `
})
export class TodoListComponent {
  store$ = TodoStoreService(this.mycelia);
  cache$ = TodoCacheService(this.mycelia);
  todos: any[] = [];

  constructor(private mycelia: MyceliaService) {
    this.store$.subscribe(store => {
      if (store) {
        store.getAll().then(todos => {
          this.todos = todos;
        });
      }
    });
  }
}
```

## See Also

- [Core Bindings](./CORE-BINDINGS.md#usefacet) - Base `useFacet` helper
- [Builder Helpers](./BUILDER-HELPERS.md) - System builder utilities
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation


