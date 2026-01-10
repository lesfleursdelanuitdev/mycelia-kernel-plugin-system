/**
 * Mycelia Plugin System - React Bindings
 * 
 * React utilities that make the Mycelia Plugin System feel natural
 * inside React applications.
 * 
 * @example
 * ```tsx
 * import { MyceliaProvider, useFacet, useListener } from 'mycelia-kernel-plugin/react';
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

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback
} from 'react';

// ============================================================================
// Core Bindings: Provider + Basic Hooks
// ============================================================================

const MyceliaContext = createContext(null);

/**
 * MyceliaProvider - Provides Mycelia system to React tree
 * 
 * @param {Object} props
 * @param {Function} props.build - Async function that returns a built system
 * @param {React.ReactNode} props.children - Child components
 * @param {React.ReactNode} [props.fallback] - Optional loading/fallback component
 * 
 * @example
 * ```tsx
 * <MyceliaProvider build={buildSystem}>
 *   <App />
 * </MyceliaProvider>
 * ```
 */
export function MyceliaProvider({ build, children, fallback = null }) {
  const [system, setSystem] = useState(null);
  const [error, setError] = useState(null);
  const buildRef = useRef(build);

  // Update build ref when it changes
  useEffect(() => {
    buildRef.current = build;
  }, [build]);

  useEffect(() => {
    let isMounted = true;
    let currentSystem = null;

    (async () => {
      try {
        currentSystem = await buildRef.current();
        if (isMounted) {
          setSystem(currentSystem);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setSystem(null);
        }
      }
    })();

    return () => {
      isMounted = false;
      if (currentSystem && typeof currentSystem.dispose === 'function') {
        currentSystem.dispose().catch(() => {
          // Ignore disposal errors
        });
      }
    };
  }, []); // Only run once on mount

  if (error) {
    throw error; // Let error boundaries handle it
  }

  if (!system) {
    return fallback;
  }

  return (
    <MyceliaContext.Provider value={system}>
      {children}
    </MyceliaContext.Provider>
  );
}

/**
 * useMycelia - Get the Mycelia system from context
 * 
 * @returns {Object} The Mycelia system instance
 * @throws {Error} If used outside MyceliaProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const system = useMycelia();
 *   // Use system.find(), system.listeners, etc.
 * }
 * ```
 */
export function useMycelia() {
  const system = useContext(MyceliaContext);
  if (!system) {
    throw new Error('useMycelia must be used within a MyceliaProvider');
  }
  return system;
}

/**
 * useFacet - Get a facet by kind from the system
 * 
 * @param {string} kind - Facet kind identifier
 * @returns {Object|null} The facet instance, or null if not found
 * 
 * @example
 * ```tsx
 * function UserList() {
 *   const db = useFacet('database');
 *   // Use db.query(), etc.
 * }
 * ```
 */
export function useFacet(kind) {
  const system = useMycelia();
  const [facet, setFacet] = useState(() => system.find?.(kind) ?? null);

  useEffect(() => {
    setFacet(system.find?.(kind) ?? null);
  }, [system, kind]);

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
 * @param {Array} [deps=[]] - React dependency array for handler
 * 
 * @example
 * ```tsx
 * function AuditLog() {
 *   useListener('user:created', (msg) => {
 *     console.log('User created:', msg.body);
 *   });
 *   // ...
 * }
 * ```
 */
export function useListener(eventName, handler, deps = []) {
  const system = useMycelia();
  const listeners = system.listeners; // useListeners facet
  const handlerRef = useRef(handler);

  // Update handler ref when it changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler, ...deps]);

  useEffect(() => {
    if (!listeners || !listeners.hasListeners?.()) {
      return;
    }

    const wrappedHandler = (msg) => {
      handlerRef.current(msg);
    };

    listeners.on(eventName, wrappedHandler);

    return () => {
      listeners.off?.(eventName, wrappedHandler);
    };
  }, [listeners, eventName]);
}

/**
 * useEventStream - Subscribe to events and keep them in React state
 * 
 * @param {string} eventName - Event name/path to listen for
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.accumulate=false] - If true, accumulate events in array
 * @returns {any|any[]|null} Latest event value, array of events, or null
 * 
 * @example
 * ```tsx
 * function EventList() {
 *   const events = useEventStream('todo:created', { accumulate: true });
 *   return <ul>{events?.map(e => <li key={e.id}>{e.text}</li>)}</ul>;
 * }
 * ```
 */
export function useEventStream(eventName, options = {}) {
  const { accumulate = false } = options;
  const [value, setValue] = useState(accumulate ? [] : null);

  useListener(eventName, (msg) => {
    if (accumulate) {
      setValue((prev) => [...prev, msg.body]);
    } else {
      setValue(msg.body);
    }
  }, [accumulate]);

  return value;
}

// ============================================================================
// Queue Helpers
// ============================================================================

/**
 * useQueueStatus - Get queue status with reactive updates
 * 
 * @returns {Object} Queue status object
 * @returns {number} size - Current queue size
 * @returns {number} capacity - Maximum queue capacity
 * @returns {number} utilization - Utilization ratio (0-1)
 * @returns {boolean} isFull - Whether queue is full
 * 
 * @example
 * ```tsx
 * function QueueStatus() {
 *   const status = useQueueStatus();
 *   return <div>Queue: {status.size}/{status.capacity}</div>;
 * }
 * ```
 */
export function useQueueStatus() {
  const queue = useFacet('queue');
  const [status, setStatus] = useState(() => {
    if (queue?.getQueueStatus) {
      return queue.getQueueStatus();
    }
    return { size: 0, maxSize: 0, utilization: 0, isFull: false };
  });

  // Poll for status updates (could be improved with event-based updates)
  useEffect(() => {
    if (!queue || !queue.getQueueStatus) return;

    const interval = setInterval(() => {
      const newStatus = queue.getQueueStatus();
      setStatus(newStatus);
    }, 100); // Poll every 100ms

    return () => clearInterval(interval);
  }, [queue]);

  return {
    size: status.size || 0,
    capacity: status.maxSize || 0,
    utilization: status.utilization || 0,
    isFull: status.isFull || false
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
 * ```tsx
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
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!queue || !queue.hasMessagesToProcess) return;

    const processInterval = setInterval(() => {
      if (queue.hasMessagesToProcess()) {
        const next = queue.selectNextMessage();
        if (next && onMessageRef.current) {
          onMessageRef.current(next.msg, next.options);
        }
      }
    }, interval);

    return () => clearInterval(processInterval);
  }, [queue, interval]);
}

// ============================================================================
// Builder Helpers
// ============================================================================

/**
 * createReactSystemBuilder - Create a reusable system builder function
 * 
 * @param {string} name - System name
 * @param {Function} configure - Configuration function: (builder) => builder
 * @returns {Function} Build function: () => Promise<System>
 * 
 * @example
 * ```ts
 * import { useBase } from 'mycelia-kernel-plugin';
 * 
 * const buildTodoSystem = createReactSystemBuilder('todo-app', (b) =>
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
export function createReactSystemBuilder(name, configure) {
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
 * createFacetHook - Generate a custom hook for a specific facet kind
 * 
 * @param {string} kind - Facet kind identifier
 * @returns {Function} Custom hook: () => Facet | null
 * 
 * @example
 * ```ts
 * // In bindings/todo-hooks.ts
 * export const useTodoStore = createFacetHook('todoStore');
 * export const useAuth = createFacetHook('auth');
 * 
 * // In component
 * function TodoList() {
 *   const todoStore = useTodoStore();
 *   // Use todoStore...
 * }
 * ```
 */
export function createFacetHook(kind) {
  return function useNamedFacet() {
    return useFacet(kind);
  };
}

