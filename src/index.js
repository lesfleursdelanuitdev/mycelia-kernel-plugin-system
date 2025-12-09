/**
 * Mycelia Plugin System
 * 
 * Main entry point for the plugin system.
 * Exports all core classes, hooks, and utilities.
 */

// Core exports
export { createHook } from './core/create-hook.js';
export { Facet } from './core/facet.js';

// Manager exports
export { FacetManager } from './manager/facet-manager.js';
export { FacetManagerTransaction } from './manager/facet-manager-transaction.js';

// Builder exports
export { SubsystemBuilder } from './builder/subsystem-builder.js';
export { DependencyGraphCache } from './builder/dependency-graph-cache.js';

// System exports
export { BaseSubsystem } from './system/base-subsystem.js';
export { StandalonePluginSystem } from './system/standalone-plugin-system.js';
export { collectChildren, buildChildren, disposeChildren } from './system/base-subsystem.utils.js';

// Contract exports
export { FacetContract, createFacetContract } from './contract/facet-contract.js';
export { FacetContractRegistry, defaultContractRegistry } from './contract/index.js';

// Export all contracts
export * from './contract/contracts/index.js';

// Hook exports
export { useListeners } from './hooks/listeners/use-listeners.js';
export { useQueue } from './hooks/queue/use-queue.js';
export { useSpeak } from './hooks/speak/use-speak.js';

// Framework bindings are available via subpath exports:
// - 'mycelia-kernel-plugin/react' for React bindings
// - 'mycelia-kernel-plugin/vue' for Vue bindings
// - 'mycelia-kernel-plugin/svelte' for Svelte bindings
// - 'mycelia-kernel-plugin/angular' for Angular bindings
// - 'mycelia-kernel-plugin/qwik' for Qwik bindings
// - 'mycelia-kernel-plugin/solid' for Solid.js bindings
// 
// They are not re-exported from the main entry point to avoid
// requiring framework dependencies when using the core system.

// Utility exports
export { createLogger, createSubsystemLogger } from './utils/logger.js';
export { getDebugFlag } from './utils/debug-flag.js';
export { findFacet } from './utils/find-facet.js';
export { useBase } from './utils/use-base.js';
export { 
  isInstrumentationEnabled,
  instrumentHookExecution,
  instrumentFacetInit,
  instrumentDisposeCallback,
  instrumentBuildPhase
} from './utils/instrumentation.js';
export { 
  parseVersion, 
  isValidSemver, 
  compareVersions, 
  satisfiesRange, 
  getDefaultVersion, 
  validateVersion 
} from './utils/semver.js';

