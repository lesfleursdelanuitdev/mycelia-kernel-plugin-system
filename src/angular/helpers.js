/**
 * Angular Helper Functions
 * 
 * Helper functions for working with Mycelia in Angular components
 */

/**
 * useFacet - Get a facet by kind (for use in Angular components)
 * 
 * @param {Object} myceliaService - MyceliaService instance
 * @param {string} kind - Facet kind identifier
 * @returns {import('rxjs').Observable} Observable that emits the facet
 * 
 * @example
 * ```ts
 * @Component({...})
 * export class MyComponent {
 *   db$ = useFacet(this.mycelia, 'database');
 * }
 * ```
 */
export function useFacet(myceliaService, kind) {
  const { map } = require('rxjs/operators');
  return myceliaService.system$.pipe(
    map(system => system?.find?.(kind) ?? null)
  );
}

/**
 * useListener - Register an event listener in Angular component
 * 
 * @param {Object} myceliaService - MyceliaService instance
 * @param {string} eventName - Event name/path
 * @param {Function} handler - Handler function
 * @returns {Function} Unsubscribe function
 * 
 * @example
 * ```ts
 * @Component({...})
 * export class MyComponent implements OnInit, OnDestroy {
 *   private unsubscribe: Function;
 *   
 *   ngOnInit() {
 *     this.unsubscribe = useListener(this.mycelia, 'user:created', (msg) => {
 *       console.log('User created:', msg.body);
 *     });
 *   }
 *   
 *   ngOnDestroy() {
 *     this.unsubscribe();
 *   }
 * }
 * ```
 */
export function useListener(myceliaService, eventName, handler) {
  return myceliaService.useListener(eventName, handler);
}

/**
 * useEventStream - Subscribe to events as an RxJS observable
 * 
 * @param {Object} myceliaService - MyceliaService instance
 * @param {string} eventName - Event name/path
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.accumulate=false] - If true, accumulate events
 * @returns {import('rxjs').Observable} Observable that emits event messages
 * 
 * @example
 * ```ts
 * @Component({...})
 * export class EventListComponent {
 *   events$ = useEventStream(this.mycelia, 'todo:created', { accumulate: true });
 * }
 * ```
 */
export function useEventStream(myceliaService, eventName, options = {}) {
  const { Subject } = require('rxjs');
  const { scan, startWith } = require('rxjs/operators');
  const { accumulate = false } = options;
  
  const subject = new Subject();
  
  const unsubscribe = myceliaService.useListener(eventName, (msg) => {
    subject.next(msg.body);
  });
  
  let stream$ = subject.asObservable();
  
  if (accumulate) {
    stream$ = stream$.pipe(
      scan((acc, value) => [...acc, value], []),
      startWith([])
    );
  }
  
  // Note: In Angular, you'd typically handle unsubscription in ngOnDestroy
  // This is a simplified version - real implementation would need proper cleanup
  
  return stream$;
}


