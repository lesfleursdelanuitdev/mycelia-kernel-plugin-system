/**
 * Angular Service Generators
 */

/**
 * createFacetService - Generate a service for a specific facet kind
 * 
 * @param {string} kind - Facet kind identifier
 * @returns {Function} Service factory: (myceliaService) => Observable<Facet>
 * 
 * @example
 * ```ts
 * // In services/todo.service.ts
 * export const TodoService = createFacetService('todoStore');
 * 
 * // In component
 * @Component({...})
 * export class TodoListComponent {
 *   todos$ = TodoService(this.mycelia);
 * }
 * ```
 */
export function createFacetService(kind) {
  return function(myceliaService) {
    const { map } = require('rxjs/operators');
    return myceliaService.system$.pipe(
      map(system => system?.find?.(kind) ?? null)
    );
  };
}


