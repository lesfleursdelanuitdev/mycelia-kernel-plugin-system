/**
 * Mycelia Plugin System - Solid.js Bindings
 * 
 * Solid.js utilities that make the Mycelia Plugin System feel natural
 * inside Solid.js applications using signals and context.
 * 
 * @example
 * ```jsx
 * import { MyceliaProvider, useFacet, useListener } from 'mycelia-kernel-plugin/solid';
 * 
 * const buildSystem = () => useBase('app')
 *   .use(useDatabase)
 *   .build();
 * 
 * function App() {
 *   return (
 *     <MyceliaProvider build={buildSystem}>
 *       <MyComponent />
 *     </MyceliaProvider>
 *   );
 * }
 * 
 * function MyComponent() {
 *   const db = useFacet('database');
 *   useListener('user:created', (msg) => console.log(msg));
 *   // ...
 * }
 * ```
 */

import { createContext, useContext, createSignal, createEffect, onCleanup, onMount } from 'solid-js';

// ============================================================================
// Core Bindings: Provider + Basic Hooks
// ============================================================================

const MyceliaContext = createContext();

/**
 * MyceliaProvider - Provides Mycelia system to Solid.js component tree
 * 
 * @param {Object} props
 * @param {Function} props.build - Async function that returns a built system
 * @param {JSX.Element} props.children - Child components
 * @param {JSX.Element} [props.fallback] - Optional loading/fallback component
 * 
 * @example
 * ```jsx
 * <MyceliaProvider build={buildSystem}>
 *   <App />
 * </MyceliaProvider>
 * ```
 */
export function MyceliaProvider(props) {
  const [system, setSystem] = createSignal(null);
  const [error, setError] = createSignal(null);
  const [loading, setLoading] = createSignal(true);
  let currentSystem = null;

  onMount(async () => {
    try {
      currentSystem = await props.build();
      setSystem(currentSystem);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err);
      setSystem(null);
      setLoading(false);
    }
  });

  onCleanup(() => {
    if (currentSystem && typeof currentSystem.dispose === 'function') {
      currentSystem.dispose().catch(() => {
        // Ignore disposal errors
      });
    }
  });

  if (error()) {
    throw error(); // Let error boundaries handle it
  }

  if (loading()) {
    return props.fallback || null;
  }

  return (
    <MyceliaContext.Provider value={system}>
      {props.children}
    </MyceliaContext.Provider>
  );
}

/**
 * useMycelia - Get the Mycelia system from context
 * 
 * @returns {Function} Signal accessor that returns the Mycelia system instance
 * @throws {Error} If used outside MyceliaProvider
 * 
 * @example
 * ```jsx
 * function MyComponent() {
 *   const system = useMycelia();
 *   // Use system().find(), system().listeners, etc.
 * }
 * ```
 */
export function useMycelia() {
  const context = useContext(MyceliaContext);
  if (!context) {
    throw new Error('useMycelia must be used within a MyceliaProvider');
  }
  return context;
}

/**
 * useFacet - Get a facet by kind from the system with reactivity
 * 
 * @param {string} kind - Facet kind identifier
 * @returns {Function} Signal accessor that returns the facet instance, or null if not found
 * 
 * @example
 * ```jsx
 * function UserList() {
 *   const db = useFacet('database');
 *   // Use db().query(), etc.
 * }
 * ```
 */
export function useFacet(kind) {
  const system = useMycelia();
  const [facet, setFacet] = createSignal(() => {
    const sys = system();
    return sys?.find?.(kind) ?? null;
  });

  createEffect(() => {
    const sys = system();
    setFacet(sys?.find?.(kind) ?? null);
  });

  return facet;
}

// ============================================================================
// Listener Helpers
// ============================================================================

/**
 * useListener - Register an event listener with automatic cleanup
 * 
 * @param {string} eventName - Event name/path to listen for
 * @param {Function} handler - Handler function: (message) => void
 * 
 * @example
 * ```jsx
 * function AuditLog() {
 *   useListener('user:created', (msg) => {
 *     console.log('User created:', msg.body);
 *   });
 *   // ...
 * }
 * ```
 */
export function useListener(eventName, handler) {
  const system = useMycelia();
  let listeners = null;
  let wrappedHandler = null;

  createEffect(() => {
    const sys = system();
    if (!sys) return;

    listeners = sys.listeners; // useListeners facet
    if (!listeners || !listeners.hasListeners?.()) {
      return;
    }

    wrappedHandler = (msg) => {
      handler(msg);
    };

    listeners.on(eventName, wrappedHandler);
  });

  onCleanup(() => {
    if (listeners && wrappedHandler) {
      listeners.off?.(eventName, wrappedHandler);
    }
  });
}

/**
 * useEventStream - Subscribe to events and keep them in reactive state
 * 
 * @param {string} eventName - Event name/path to listen for
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.accumulate=false] - If true, accumulate events in array
 * @returns {Function} Signal accessor that returns latest event value, array of events, or null
 * 
 * @example
 * ```jsx
 * function EventList() {
 *   const events = useEventStream('todo:created', { accumulate: true });
 *   return <ul>{events()?.map(e => <li key={e.id}>{e.text}</li>)}</ul>;
 * }
 * ```
 */
export function useEventStream(eventName, options = {}) {
  const { accumulate = false } = options;
  const [value, setValue] = createSignal(accumulate ? [] : null);

  useListener(eventName, (msg) => {
    if (accumulate) {
      setValue((prev) => [...prev, msg.body]);
    } else {
      setValue(msg.body);
    }
  });

  return value;
}

// ============================================================================
// Queue Helpers
// ============================================================================

/**
 * useQueueStatus - Get queue status with reactive updates
 * 
 * @returns {Function} Signal accessor that returns queue status object
 * @returns {number} size - Current queue size
 * @returns {number} capacity - Maximum queue capacity
 * @returns {number} utilization - Utilization ratio (0-1)
 * @returns {boolean} isFull - Whether queue is full
 * 
 * @example
 * ```jsx
 * function QueueStatus() {
 *   const status = useQueueStatus();
 *   return <div>Queue: {status().size}/{status().capacity}</div>;
 * }
 * ```
 */
export function useQueueStatus() {
  const queue = useFacet('queue');
  const [status, setStatus] = createSignal(() => {
    const q = queue();
    if (q?.getQueueStatus) {
      return q.getQueueStatus();
    }
    return { size: 0, maxSize: 0, utilization: 0, isFull: false };
  });

  // Poll for status updates (could be improved with event-based updates)
  createEffect(() => {
    const q = queue();
    if (!q || !q.getQueueStatus) return;

    const interval = setInterval(() => {
      const newStatus = q.getQueueStatus();
      setStatus(newStatus);
    }, 100); // Poll every 100ms

    onCleanup(() => clearInterval(interval));
  });

  return () => {
    const s = status();
    return {
      size: s.size || 0,
      capacity: s.maxSize || 0,
      utilization: s.utilization || 0,
      isFull: s.isFull || false
    };
  };
}

/**
 * useQueueDrain - Automatically drain queue on mount
 * 
 * @param {Object} [options={}] - Options
 * @param {number} [options.interval=100] - Polling interval in ms
 * @param {Function} [options.onMessage] - Callback for each message: (msg, options) => void
 * 
 * @example
 * ```jsx
 * function QueueProcessor() {
 *   useQueueDrain({
 *     interval: 50,
 *     onMessage: (msg) => console.log('Processed:', msg)
 *   });
 *   return null;
 * }
 * ```
 */
export function useQueueDrain(options = {}) {
  const { interval = 100, onMessage } = options;
  const queue = useFacet('queue');

  createEffect(() => {
    const q = queue();
    if (!q || !q.hasMessagesToProcess) return;

    const processInterval = setInterval(() => {
      if (q.hasMessagesToProcess()) {
        const next = q.selectNextMessage();
        if (next && onMessage) {
          onMessage(next.msg, next.options);
        }
      }
    }, interval);

    onCleanup(() => clearInterval(processInterval));
  });
}

// ============================================================================
// Builder Helpers
// ============================================================================

/**
 * createSolidSystemBuilder - Create a reusable system builder function
 * 
 * @param {string} name - System name
 * @param {Function} configure - Configuration function: (builder) => builder
 * @returns {Function} Build function: () => Promise<System>
 * 
 * @example
 * ```js
 * import { useBase } from 'mycelia-kernel-plugin';
 * 
 * const buildTodoSystem = createSolidSystemBuilder('todo-app', (b) =>
 *   b
 *     .config('database', { host: 'localhost' })
 *     .use(useDatabase)
 *     .use(useListeners)
 * );
 * 
 * // Then use in Provider
 * <MyceliaProvider build={buildTodoSystem}>
 *   <App />
 * </MyceliaProvider>
 * ```
 */
export function createSolidSystemBuilder(name, configure) {
  return async function build() {
    // Import useBase - users should have it available
    // This avoids bundling issues by letting users import useBase themselves
    const { useBase } = await import('../utils/use-base.js');
    let builder = useBase(name);
    builder = configure(builder);
    return builder.build();
  };
}

// ============================================================================
// Facet Hook Generator
// ============================================================================

/**
 * createFacetSignal - Generate a custom signal hook for a specific facet kind
 * 
 * @param {string} kind - Facet kind identifier
 * @returns {Function} Custom hook: () => Signal<Facet | null>
 * 
 * @example
 * ```js
 * // In bindings/todo-hooks.ts
 * export const useTodoStore = createFacetSignal('todoStore');
 * export const useAuth = createFacetSignal('auth');
 * 
 * // In component
 * function TodoList() {
 *   const todoStore = useTodoStore();
 *   // Use todoStore()...
 * }
 * ```
 */
export function createFacetSignal(kind) {
  return function useNamedFacet() {
    return useFacet(kind);
  };
}

