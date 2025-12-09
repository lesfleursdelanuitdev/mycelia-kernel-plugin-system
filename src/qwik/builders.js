/**
 * Qwik Builder Helpers
 */

/**
 * createQwikSystemBuilder - Create a reusable system builder function for Qwik
 * 
 * @param {string} name - System name
 * @param {Function} configure - Configuration function: (builder) => builder
 * @returns {Function} Build function: () => Promise<System>
 * 
 * @example
 * ```ts
 * import { useBase } from 'mycelia-kernel-plugin';
 * 
 * const buildTodoSystem = createQwikSystemBuilder('todo-app', (b) =>
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
export function createQwikSystemBuilder(name, configure) {
  return async function build() {
    // Import useBase - users should have it available
    const { useBase } = await import('../utils/use-base.js');
    let builder = useBase(name);
    builder = configure(builder);
    return builder.build();
  };
}


