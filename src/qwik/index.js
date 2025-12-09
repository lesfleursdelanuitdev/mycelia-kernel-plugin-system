/**
 * Mycelia Plugin System - Qwik Bindings
 * 
 * Qwik utilities that make the Mycelia Plugin System feel natural
 * inside Qwik applications using signals and context.
 * 
 * @example
 * ```tsx
 * import { MyceliaProvider, useFacet, useListener } from 'mycelia-kernel-plugin/qwik';
 * 
 * const buildSystem = () => useBase('app')
 *   .use(useDatabase)
 *   .build();
 * 
 * export default component$(() => {
 *   return (
 *     <MyceliaProvider build={buildSystem}>
 *       <MyComponent />
 *     </MyceliaProvider>
 *   );
 * });
 * 
 * export const MyComponent = component$(() => {
 *   const db = useFacet('database');
 *   useListener('user:created', (msg) => console.log(msg));
 *   // ...
 * });
 * ```
 */

import { createContextId, useContextProvider, useContext, useSignal, useStore, useTask$, component$, Slot } from '@builder.io/qwik';

// ============================================================================
// Core Bindings: Provider + Basic Hooks
// ============================================================================

const MyceliaContextId = createContextId('mycelia');

/**
 * MyceliaProvider - Provides Mycelia system to Qwik component tree
 * 
 * @param {Object} props
 * @param {Function} props.build - Async function that returns a built system
 * @param {import('@builder.io/qwik').QRL} props.children - Child components
 * @param {import('@builder.io/qwik').QRL} [props.fallback] - Optional loading/fallback component
 * 
 * @example
 * ```tsx
 * export default component$(() => {
 *   return (
 *     <MyceliaProvider build={buildSystem}>
 *       <App />
 *     </MyceliaProvider>
 *   );
 * });
 * ```
 */
export const MyceliaProvider = component$(({ build, fallback = null }) => {
  const system = useSignal(null);
  const error = useSignal(null);
  const loading = useSignal(true);

  useTask$(async () => {
    try {
      const builtSystem = await build();
      system.value = builtSystem;
      error.value = null;
    } catch (err) {
      error.value = err;
      system.value = null;
    } finally {
      loading.value = false;
    }
  });

  const context = {
    system,
    error,
    loading
  };

  useContextProvider(MyceliaContextId, context);

  if (error.value) {
    throw error.value; // Let error boundaries handle it
  }

  if (loading.value) {
    return fallback || <div>Loading...</div>;
  }

  return <Slot />;
});

/**
 * useMycelia - Get the Mycelia system from context
 * 
 * @returns {Object} The Mycelia system instance
 * @throws {Error} If used outside MyceliaProvider
 * 
 * @example
 * ```tsx
 * export const MyComponent = component$(() => {
 *   const system = useMycelia();
 *   // Use system.find(), system.listeners, etc.
 * });
 * ```
 */
export function useMycelia() {
  const context = useContext(MyceliaContextId);
  if (!context) {
    throw new Error('useMycelia must be used within a MyceliaProvider');
  }
  return context.system.value;
}

/**
 * useMyceliaContext - Get the full Mycelia context (system, loading, error)
 * 
 * @returns {Object} Context object with system, loading, and error signals
 * @throws {Error} If used outside MyceliaProvider
 * 
 * @example
 * ```tsx
 * export const MyComponent = component$(() => {
 *   const { system, loading, error } = useMyceliaContext();
 *   if (loading.value) return <div>Loading...</div>;
 *   if (error.value) return <div>Error: {error.value.message}</div>;
 *   return <div>System: {system.value.name}</div>;
 * });
 * ```
 */
export function useMyceliaContext() {
  const context = useContext(MyceliaContextId);
  if (!context) {
    throw new Error('useMyceliaContext must be used within a MyceliaProvider');
  }
  return context;
}

/**
 * useFacet - Get a facet by kind from the system (reactive signal)
 * 
 * @param {string} kind - Facet kind identifier
 * @returns {import('@builder.io/qwik').Signal} Signal containing the facet instance, or null if not found
 * 
 * @example
 * ```tsx
 * export const UserList = component$(() => {
 *   const db = useFacet('database');
 *   // Use db.value.query(), etc.
 * });
 * ```
 */
export function useFacet(kind) {
  const context = useMyceliaContext();
  const facet = useSignal(null);

  useTask$(({ track }) => {
    const system = track(() => context.system.value);
    facet.value = system?.find?.(kind) ?? null;
  });

  return facet;
}

// Re-export listener helpers
export { useListener, useEventStream } from './listeners.js';

// Re-export queue helpers
export { useQueueStatus, useQueueDrain } from './queues.js';

// Re-export builder helpers
export { createQwikSystemBuilder } from './builders.js';

// Re-export facet signal generator
export { createFacetSignal } from './signals.js';

