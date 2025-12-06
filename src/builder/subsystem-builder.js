import { verifySubsystemBuild, buildSubsystem as executeBuild, deepMerge } from './utils.js';

export class SubsystemBuilder {
  #subsystem;
  #ctx = {};
  #plan = null;
  #lastCtxHash = null;
  #lastGraphCache = null;

  constructor(subsystem) {
    if (!subsystem) throw new Error('SubsystemBuilder: subsystem is required');
    this.#subsystem = subsystem;
    // Note: ctx is resolved in verifySubsystemBuild, not stored here
  }

  // Simple hash function for context comparison
  #hashCtx(ctx) {
    try {
      return JSON.stringify(ctx);
    } catch {
      // If JSON.stringify fails, use a fallback
      return String(ctx);
    }
  }

  withCtx(ctx = {}) {
    // Shallow merge for most properties
    const merged = { ...this.#ctx, ...ctx };
    
    // Deep merge config objects if both exist
    if (this.#ctx.config && typeof this.#ctx.config === 'object' && 
        ctx.config && typeof ctx.config === 'object' &&
        !Array.isArray(this.#ctx.config) && !Array.isArray(ctx.config)) {
      merged.config = deepMerge(this.#ctx.config, ctx.config);
    }
    
    this.#ctx = merged;
    return this;
  }

  clearCtx() {
    this.#ctx = {};
    this.#lastCtxHash = null;
    this.#plan = null; // Clear plan when context is cleared
    return this;
  }

  plan(graphCache = null) {
    // Determine which graphCache to use (priority: subsystem.ctx > parameter > cached)
    const subsystemCache = this.#subsystem.ctx?.graphCache;
    
    // Check if we have a cached plan and if the context hasn't changed
    const currentCtxHash = this.#hashCtx(this.#ctx);
    if (this.#plan && this.#lastCtxHash === currentCtxHash) {
      // Update lastGraphCache if a new one is provided
      const cacheToUse = subsystemCache || (graphCache !== null ? graphCache : this.#lastGraphCache);
      if (cacheToUse !== this.#lastGraphCache) {
        this.#lastGraphCache = cacheToUse;
      }
      // Return this for method chaining
      return this;
    }
    
    // Use the determined cache (subsystem.ctx takes priority, then parameter, then null)
    const cacheToUse = subsystemCache || graphCache;
    const result = verifySubsystemBuild(this.#subsystem, this.#ctx, cacheToUse);
    // Extract plan and updated graphCache from result
    const { graphCache: updatedGraphCache, ...plan } = result;
    this.#plan = plan;
    this.#lastCtxHash = currentCtxHash;
    this.#lastGraphCache = updatedGraphCache || cacheToUse;
    // Return this for method chaining
    return this;
  }

  dryRun(graphCache = null) { return this.plan(graphCache); }

  getPlan() { return this.#plan; }
  
  getGraphCache() { return this.#lastGraphCache; }

  invalidate() { 
    this.#plan = null;
    this.#lastCtxHash = null;
    this.#lastGraphCache = null;
    return this;
  }

  /** Executes verify → transactional facet add/init/attach → build children. No internal guards here. */
  async build(graphCache = null) {
    // Create or use cached plan
    this.plan(graphCache);
    const plan = this.#plan;
    if (!plan) {
      throw new Error('SubsystemBuilder.build: failed to create plan');
    }
    // graphCache is already included in plan.resolvedCtx by verifySubsystemBuild
    // and will be set on subsystem.ctx by buildSubsystem
    
    await executeBuild(this.#subsystem, plan);
    return this.#subsystem;
  }
}

