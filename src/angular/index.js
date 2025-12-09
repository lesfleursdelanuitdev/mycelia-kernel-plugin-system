/**
 * Mycelia Plugin System - Angular Bindings
 * 
 * Angular utilities that make the Mycelia Plugin System feel natural
 * inside Angular applications using dependency injection and RxJS.
 * 
 * @example
 * ```ts
 * import { MyceliaModule, useFacet, useListener } from 'mycelia-kernel-plugin/angular';
 * import { NgModule } from '@angular/core';
 * 
 * const buildSystem = () => useBase('app')
 *   .use(useDatabase)
 *   .build();
 * 
 * @NgModule({
 *   imports: [MyceliaModule.forRoot({ build: buildSystem })]
 * })
 * export class AppModule {}
 * 
 * // In component
 * @Component({...})
 * export class MyComponent {
 *   constructor(private mycelia: MyceliaService) {
 *     const db = this.mycelia.useFacet('database');
 *     this.mycelia.useListener('user:created', (msg) => console.log(msg));
 *   }
 * }
 * ```
 */

// Note: This is a TypeScript-friendly JavaScript module
// Angular applications typically use TypeScript, but we provide JS bindings
// for compatibility. Type definitions should be provided separately.

/**
 * MyceliaService - Injectable service that provides Mycelia system
 * 
 * This service should be provided at the root level using MyceliaModule.
 * 
 * @example
 * ```ts
 * @Injectable({ providedIn: 'root' })
 * export class MyceliaService {
 *   private system$ = new BehaviorSubject(null);
 *   
 *   constructor(@Inject(MYCELIA_BUILD_TOKEN) private buildFn: () => Promise<any>) {
 *     this.initialize();
 *   }
 *   
 *   async initialize() {
 *     const system = await this.buildFn();
 *     this.system$.next(system);
 *   }
 * }
 * ```
 */

// For JavaScript/CommonJS compatibility, we export factory functions
// that can be used with Angular's dependency injection system

/**
 * createMyceliaService - Factory function to create Mycelia service
 * 
 * @param {Function} build - Async function that returns a built system
 * @returns {Object} Service object with system observable and helper methods
 * 
 * @example
 * ```ts
 * const myceliaService = createMyceliaService(buildSystem);
 * ```
 */
export function createMyceliaService(build) {
  let system = null;
  let systemSubject = null;
  let errorSubject = null;
  let loadingSubject = null;

  // Initialize system
  (async () => {
    try {
      loadingSubject?.next?.(true);
      system = await build();
      systemSubject?.next?.(system);
      errorSubject?.next?.(null);
    } catch (err) {
      errorSubject?.next?.(err);
      systemSubject?.next?.(null);
    } finally {
      loadingSubject?.next?.(false);
    }
  })();

  return {
    /**
     * Get system observable (requires RxJS BehaviorSubject)
     * @returns {Object} Observable-like object
     */
    get system$() {
      if (!systemSubject) {
        // Lazy initialization - requires RxJS
        const { BehaviorSubject } = require('rxjs');
        systemSubject = new BehaviorSubject(system);
      }
      return systemSubject.asObservable();
    },

    /**
     * Get error observable
     * @returns {Object} Observable-like object
     */
    get error$() {
      if (!errorSubject) {
        const { BehaviorSubject } = require('rxjs');
        errorSubject = new BehaviorSubject(null);
      }
      return errorSubject.asObservable();
    },

    /**
     * Get loading observable
     * @returns {Object} Observable-like object
     */
    get loading$() {
      if (!loadingSubject) {
        const { BehaviorSubject } = require('rxjs');
        loadingSubject = new BehaviorSubject(true);
      }
      return loadingSubject.asObservable();
    },

    /**
     * Get current system synchronously
     * @returns {Object|null} Current system instance
     */
    getSystem() {
      return system;
    },

    /**
     * Get a facet by kind
     * @param {string} kind - Facet kind identifier
     * @returns {Object|null} Facet instance or null
     */
    useFacet(kind) {
      return system?.find?.(kind) ?? null;
    },

    /**
     * Register an event listener
     * @param {string} eventName - Event name/path
     * @param {Function} handler - Handler function
     * @returns {Function} Unsubscribe function
     */
    useListener(eventName, handler) {
      const listeners = system?.listeners;
      if (!listeners || !listeners.hasListeners?.()) {
        return () => {};
      }

      listeners.on(eventName, handler);
      return () => {
        listeners.off?.(eventName, handler);
      };
    },

    /**
     * Dispose the system
     * @returns {Promise<void>}
     */
    async dispose() {
      if (system && typeof system.dispose === 'function') {
        await system.dispose().catch(() => {
          // Ignore disposal errors
        });
      }
      system = null;
      systemSubject?.complete?.();
      errorSubject?.complete?.();
      loadingSubject?.complete?.();
    }
  };
}

// Re-export helper functions
export { useFacet, useListener, useEventStream } from './helpers.js';
export { createAngularSystemBuilder } from './builders.js';
export { createFacetService } from './services.js';

