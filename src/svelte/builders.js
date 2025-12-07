/**
 * Mycelia Plugin System - Svelte Builder Helpers
 * 
 * Svelte utilities for creating system builders.
 */

/**
 * createSvelteSystemBuilder - Create a reusable system builder function
 * 
 * @param {string} name - System name
 * @param {Function} configure - Configuration function: (builder) => builder
 * @returns {Function} Build function: () => Promise<System>
 * 
 * @example
 * ```js
 * import { useBase } from 'mycelia-kernel-plugin';
 * import { createSvelteSystemBuilder } from 'mycelia-kernel-plugin/svelte';
 * 
 * const buildTodoSystem = createSvelteSystemBuilder('todo-app', (b) =>
 *   b
 *     .config('database', { host: 'localhost' })
 *     .use(useDatabase)
 *     .use(useListeners)
 * );
 * 
 * // Then use in component
 * onMount(async () => {
 *   const system = await buildTodoSystem();
 *   setMyceliaSystem(system);
 * });
 * ```
 */
export function createSvelteSystemBuilder(name, configure) {
  return async function build() {
    // Import useBase - users should have it available
    // This avoids bundling issues by letting users import useBase themselves
    const { useBase } = await import('../utils/use-base.js');
    let builder = useBase(name);
    builder = configure(builder);
    return builder.build();
  };
}

