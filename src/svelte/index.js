/**
 * Mycelia Plugin System - Svelte Bindings
 * 
 * Svelte utilities that make the Mycelia Plugin System feel natural
 * inside Svelte applications using stores and context.
 * 
 * @example
 * ```svelte
 * <script>
 *   import { setMyceliaSystem, useFacet, useListener } from 'mycelia-kernel-plugin/svelte';
 *   import { buildSystem } from './system.js';
 *   
 *   let system;
 *   buildSystem().then(s => {
 *     system = s;
 *     setMyceliaSystem(system);
 *   });
 * </script>
 * ```
 */

import { writable, derived, get } from 'svelte/store';
import { setContext, getContext } from 'svelte';

// ============================================================================
// Core Bindings: Context + Basic Stores
// ============================================================================

const MYCELIA_KEY = Symbol('mycelia');

/**
 * setMyceliaSystem - Provide Mycelia system to Svelte component tree
 * 
 * @param {Object} system - The Mycelia system instance
 * @returns {Object} Context object with system, loading, and error stores
 * 
 * @example
 * ```svelte
 * <script>
 *   import { onMount } from 'svelte';
 *   import { setMyceliaSystem } from 'mycelia-kernel-plugin/svelte';
 *   import { buildSystem } from './system.js';
 *   
 *   let system;
 *   
 *   onMount(async () => {
 *     system = await buildSystem();
 *     setMyceliaSystem(system);
 *   });
 * </script>
 * ```
 */
export function setMyceliaSystem(system) {
  const systemStore = writable(system);
  const loadingStore = writable(false);
  const errorStore = writable(null);
  
  const context = {
    system: systemStore,
    loading: loadingStore,
    error: errorStore
  };
  
  setContext(MYCELIA_KEY, context);
  
  return context;
}

/**
 * getMyceliaSystem - Get Mycelia system store from context
 * 
 * @returns {import('svelte/store').Writable} Writable store containing the system instance
 * @throws {Error} If used outside setMyceliaSystem context
 * 
 * @example
 * ```svelte
 * <script>
 *   import { getMyceliaSystem } from 'mycelia-kernel-plugin/svelte';
 *   
 *   const systemStore = getMyceliaSystem();
 *   $: system = $systemStore;
 * </script>
 * ```
 */
export function getMyceliaSystem() {
  const context = getContext(MYCELIA_KEY);
  if (!context) {
    throw new Error('getMyceliaSystem must be used within setMyceliaSystem context');
  }
  return context.system;
}

/**
 * getMyceliaContext - Get the full Mycelia context (system, loading, error stores)
 * 
 * @returns {Object} Context object with system, loading, and error stores
 * @throws {Error} If used outside setMyceliaSystem context
 * 
 * @example
 * ```svelte
 * <script>
 *   import { getMyceliaContext } from 'mycelia-kernel-plugin/svelte';
 *   
 *   const { system, loading, error } = getMyceliaContext();
 * </script>
 * 
 * {#if $loading}
 *   <div>Loading...</div>
 * {:else if $error}
 *   <div>Error: {$error.message}</div>
 * {:else}
 *   <div>System ready: {$system.name}</div>
 * {/if}
 * ```
 */
export function getMyceliaContext() {
  const context = getContext(MYCELIA_KEY);
  if (!context) {
    throw new Error('getMyceliaContext must be used within setMyceliaSystem context');
  }
  return context;
}

/**
 * useMycelia - Get Mycelia system store (reactive)
 * 
 * @returns {import('svelte/store').Writable} Writable store containing the system instance
 * 
 * @example
 * ```svelte
 * <script>
 *   import { useMycelia } from 'mycelia-kernel-plugin/svelte';
 *   
 *   const systemStore = useMycelia();
 *   $: system = $systemStore;
 *   $: db = system?.find('database');
 * </script>
 * ```
 */
export function useMycelia() {
  return getMyceliaSystem();
}

/**
 * useFacet - Get a facet by kind from the system (reactive store)
 * 
 * @param {string} kind - Facet kind identifier
 * @returns {import('svelte/store').Readable} Readable store containing the facet instance, or null if not found
 * 
 * @example
 * ```svelte
 * <script>
 *   import { useFacet } from 'mycelia-kernel-plugin/svelte';
 *   
 *   const dbStore = useFacet('database');
 *   $: db = $dbStore;
 * </script>
 * 
 * {#if db}
 *   <div>Database ready</div>
 * {/if}
 * ```
 */
export function useFacet(kind) {
  const systemStore = getMyceliaSystem();
  
  return derived(systemStore, ($system) => {
    return $system?.find?.(kind) ?? null;
  });
}

// Re-export listener helpers
export { useListener, useEventStream } from './listeners.js';

// Re-export queue helpers
export { useQueueStatus, useQueueDrain } from './queues.js';

// Re-export builder helpers
export { createSvelteSystemBuilder } from './builders.js';

// Re-export store generator
export { createFacetStore } from './stores.js';

