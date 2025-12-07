/**
 * Mycelia Plugin System - Vue Bindings
 * 
 * Vue utilities that make the Mycelia Plugin System feel natural
 * inside Vue 3 applications using the Composition API.
 * 
 * @example
 * ```js
 * import { MyceliaPlugin, useFacet, useListener } from 'mycelia-kernel-plugin/vue';
 * import { createApp } from 'vue';
 * 
 * const buildSystem = () => useBase('app')
 *   .use(useDatabase)
 *   .build();
 * 
 * const app = createApp(App);
 * app.use(MyceliaPlugin, { build: buildSystem });
 * 
 * // In component
 * export default {
 *   setup() {
 *     const db = useFacet('database');
 *     useListener('user:created', (msg) => console.log(msg));
 *   }
 * }
 * ```
 */

import { provide, inject, ref, onUnmounted, watch, getCurrentInstance, onBeforeUnmount } from 'vue';

// ============================================================================
// Core Bindings: Plugin + Basic Composables
// ============================================================================

const MyceliaKey = Symbol('mycelia');

/**
 * MyceliaPlugin - Vue plugin that provides Mycelia system to the app
 * 
 * @param {Object} app - Vue app instance
 * @param {Object} options - Plugin options
 * @param {Function} options.build - Async function that returns a built system
 * 
 * @example
 * ```js
 * import { createApp } from 'vue';
 * import { MyceliaPlugin } from 'mycelia-kernel-plugin/vue';
 * 
 * const buildSystem = () => useBase('app').use(useDatabase).build();
 * 
 * const app = createApp(App);
 * app.use(MyceliaPlugin, { build: buildSystem });
 * ```
 */
export const MyceliaPlugin = {
  async install(app, options) {
    const { build } = options;
    const system = ref(null);
    const error = ref(null);
    const loading = ref(true);
    let currentSystem = null;

    try {
      currentSystem = await build();
      system.value = currentSystem;
      loading.value = false;
      error.value = null;
    } catch (err) {
      error.value = err;
      loading.value = false;
      system.value = null;
      // Re-throw to let Vue handle it
      throw err;
    }

    // Provide system to all components
    const context = {
      system,
      loading,
      error
    };
    
    app.provide(MyceliaKey, context);

    // Store cleanup function on app config for manual cleanup
    // Vue 3 doesn't provide a plugin unmount hook, so cleanup should be
    // handled manually when unmounting the app:
    //   const dispose = app.config.globalProperties.$myceliaDispose;
    //   if (dispose) await dispose();
    //   app.unmount();
    app.config.globalProperties.$myceliaDispose = async () => {
      if (currentSystem && typeof currentSystem.dispose === 'function') {
        await currentSystem.dispose().catch(() => {
          // Ignore disposal errors
        });
      }
    };
  }
};

/**
 * useMycelia - Get the Mycelia system from inject
 * 
 * @returns {Object} The Mycelia system instance
 * @throws {Error} If used outside MyceliaPlugin
 * 
 * @example
 * ```js
 * import { useMycelia } from 'mycelia-kernel-plugin/vue';
 * 
 * export default {
 *   setup() {
 *     const system = useMycelia();
 *     // Use system.find(), system.listeners, etc.
 *   }
 * }
 * ```
 */
export function useMycelia() {
  const context = inject(MyceliaKey);
  if (!context) {
    throw new Error('useMycelia must be used within MyceliaPlugin');
  }
  return context.system.value;
}

/**
 * useMyceliaContext - Get the full Mycelia context (system, loading, error)
 * 
 * @returns {Object} Context object with system, loading, and error refs
 * @throws {Error} If used outside MyceliaPlugin
 * 
 * @example
 * ```js
 * import { useMyceliaContext } from 'mycelia-kernel-plugin/vue';
 * 
 * export default {
 *   setup() {
 *     const { system, loading, error } = useMyceliaContext();
 *     if (loading.value) return { loading: true };
 *     if (error.value) return { error: error.value };
 *     return { system: system.value };
 *   }
 * }
 * ```
 */
export function useMyceliaContext() {
  const context = inject(MyceliaKey);
  if (!context) {
    throw new Error('useMyceliaContext must be used within MyceliaPlugin');
  }
  return context;
}

/**
 * useFacet - Get a facet by kind from the system with reactivity
 * 
 * @param {string} kind - Facet kind identifier
 * @returns {import('vue').Ref<Object|null>} Reactive ref to the facet instance, or null if not found
 * 
 * @example
 * ```js
 * import { useFacet } from 'mycelia-kernel-plugin/vue';
 * 
 * export default {
 *   setup() {
 *     const db = useFacet('database');
 *     // Use db.value.query(), etc.
 *   }
 * }
 * ```
 */
export function useFacet(kind) {
  const system = useMycelia();
  const facet = ref(system?.find?.(kind) ?? null);

  // Watch for system changes (e.g., after reload)
  watch(() => system, (newSystem) => {
    facet.value = newSystem?.find?.(kind) ?? null;
  }, { immediate: true });

  return facet;
}

/**
 * useMyceliaCleanup - Automatically handle system cleanup on component unmount
 * 
 * This composable automatically disposes the Mycelia system when the component
 * unmounts. It's useful for root components or components that manage app lifecycle.
 * 
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.auto=true] - If true, automatically cleanup on unmount. If false, only return cleanup function.
 * @returns {Function} Cleanup function that can be called manually
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useMyceliaCleanup } from 'mycelia-kernel-plugin/vue';
 * 
 * // Automatic cleanup on component unmount
 * useMyceliaCleanup();
 * </script>
 * ```
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useMyceliaCleanup } from 'mycelia-kernel-plugin/vue';
 * 
 * // Get cleanup function for manual use
 * const dispose = useMyceliaCleanup({ auto: false });
 * 
 * const handleLogout = async () => {
 *   await dispose();
 *   // Continue with logout logic
 * };
 * </script>
 * ```
 */
export function useMyceliaCleanup(options = {}) {
  const { auto = true } = options;
  const instance = getCurrentInstance();
  const app = instance?.appContext.app;
  
  const cleanup = async () => {
    const dispose = app?.config.globalProperties.$myceliaDispose;
    if (dispose) {
      await dispose();
    }
  };
  
  if (auto) {
    onBeforeUnmount(async () => {
      await cleanup();
    });
  }
  
  return cleanup;
}

// Re-export listener helpers
export { useListener, useEventStream } from './listeners.js';

// Re-export queue helpers
export { useQueueStatus, useQueueDrain } from './queues.js';

// Re-export builder helpers
export { createVueSystemBuilder } from './builders.js';

// Re-export composable generator
export { createFacetComposable } from './composables.js';

