/**
 * Mycelia Plugin System - Vue Builder Helpers
 * 
 * Vue utilities for creating system builders.
 */

/**
 * createVueSystemBuilder - Create a reusable system builder function
 * 
 * @param {string} name - System name
 * @param {Function} configure - Configuration function: (builder) => builder
 * @returns {Function} Build function: () => Promise<System>
 * 
 * @example
 * ```js
 * import { useBase } from 'mycelia-kernel-plugin';
 * import { createVueSystemBuilder } from 'mycelia-kernel-plugin/vue';
 * 
 * const buildTodoSystem = createVueSystemBuilder('todo-app', (b) =>
 *   b
 *     .config('database', { host: 'localhost' })
 *     .use(useDatabase)
 *     .use(useListeners)
 * );
 * 
 * // Then use in plugin
 * app.use(MyceliaPlugin, { build: buildTodoSystem });
 * ```
 */
export function createVueSystemBuilder(name, configure) {
  return async function build() {
    // Import useBase - users should have it available
    // This avoids bundling issues by letting users import useBase themselves
    const { useBase } = await import('../utils/use-base.js');
    let builder = useBase(name);
    builder = configure(builder);
    return builder.build();
  };
}

