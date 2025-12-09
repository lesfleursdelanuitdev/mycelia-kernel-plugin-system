# Instrumentation Hooks

The Mycelia Plugin System includes built-in instrumentation hooks for debugging build, initialization, and disposal phases. These hooks help identify slow hooks and facets when debugging performance issues.

## Overview

Instrumentation is **disabled by default** and has **zero performance impact** when disabled. When enabled, it provides detailed timing information for:

- **Hook Execution** - Time taken to execute each hook during the build phase
- **Facet Initialization** - Time taken to initialize each facet (onInit callbacks)
- **Facet Disposal** - Time taken to dispose each facet (onDispose callbacks)
- **Build Phase** - Total time for the entire build phase

## Enabling Instrumentation

### Option 1: Enable via Debug Flag

```javascript
import { StandalonePluginSystem } from 'mycelia-kernel-plugin';

const system = new StandalonePluginSystem('my-app', {
  debug: true  // Enables instrumentation
});
```

### Option 2: Enable via Context

```javascript
const system = new StandalonePluginSystem('my-app', {
  ctx: {
    instrumentation: true  // Explicitly enable instrumentation
  }
});
```

### Option 3: Enable via useBase

```javascript
import { useBase } from 'mycelia-kernel-plugin';

const system = await useBase('my-app', { debug: true })
  .use(useDatabase)
  .build();
```

## Default Thresholds

When instrumentation is enabled, warnings are logged if operations exceed these thresholds:

- **Hook Execution:** 50ms
- **Facet Initialization:** 100ms
- **Facet Disposal:** 50ms

## Customizing Thresholds

You can customize thresholds via configuration:

```javascript
const system = new StandalonePluginSystem('my-app', {
  debug: true,
  config: {
    instrumentation: {
      hookExecutionThreshold: 100,    // Warn if hook takes > 100ms
      facetInitThreshold: 200,        // Warn if init takes > 200ms
      facetDisposeThreshold: 100      // Warn if dispose takes > 100ms
    }
  }
});
```

## Example Output

When instrumentation is enabled, you'll see output like:

```
[my-app] ✓ Hook 'database' executed in 2.34ms [test://database]
[my-app] ✓ Hook 'cache' executed in 1.12ms [test://cache]
[my-app] ✓ Facet 'database' initialized in 15.67ms [test://database]
[my-app] ⚠️  Slow facet initialization: 'cache' took 125.43ms (threshold: 100ms) [test://cache]
[my-app] 📦 Build phase completed in 145.23ms
```

## Use Cases

### Debugging Slow Builds

```javascript
const system = new StandalonePluginSystem('my-app', { debug: true });

system
  .use(useDatabase)
  .use(useCache)
  .use(useAuth)
  .build();

// Output will show which hook/facet is slow:
// ⚠️  Slow hook execution: 'auth' took 87.45ms (threshold: 50ms) [test://auth]
```

### Identifying Third-Party Hook Issues

When a third-party hook adds unexpected latency:

```javascript
// Without instrumentation: "Why is my build slow?"
// With instrumentation: "Hook 'third-party-plugin' took 200ms"
```

### Performance Profiling

Enable instrumentation during development to profile your plugin system:

```javascript
// Development
const system = new StandalonePluginSystem('my-app', { debug: true });

// Production
const system = new StandalonePluginSystem('my-app', { debug: false });
```

## API Reference

### `isInstrumentationEnabled(subsystem)`

Check if instrumentation is enabled for a subsystem.

```javascript
import { isInstrumentationEnabled } from 'mycelia-kernel-plugin';

if (isInstrumentationEnabled(system)) {
  console.log('Instrumentation is enabled');
}
```

### `instrumentHookExecution(hook, resolvedCtx, api, subsystem)`

Time a hook execution (used internally).

### `instrumentFacetInit(facet, ctx, api, subsystem, initCallback)`

Time a facet initialization (used internally).

### `instrumentDisposeCallback(facet, subsystem, disposeCallback)`

Time a facet disposal (used internally).

### `instrumentBuildPhase(subsystem, buildFn)`

Time the entire build phase (used internally).

## Best Practices

1. **Enable in Development:** Use `debug: true` during development to catch slow operations early
2. **Disable in Production:** Set `debug: false` in production to avoid performance overhead
3. **Customize Thresholds:** Adjust thresholds based on your application's performance requirements
4. **Monitor Trends:** Track timing trends over time to identify performance regressions

## Performance Impact

- **When Disabled:** Zero overhead - all instrumentation checks are short-circuited
- **When Enabled:** Minimal overhead (~0.01ms per operation for timing checks)
- **Logging:** Only logs when operations exceed thresholds or when explicitly enabled

## Example: Debugging a Slow Build

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin';

const system = new StandalonePluginSystem('my-app', { debug: true });

// Add your hooks
system.use(useDatabase);
system.use(useCache);
system.use(useAuth);

// Build with instrumentation
await system.build();

// Output:
// [my-app] ✓ Hook 'database' executed in 2.34ms [test://database]
// [my-app] ✓ Hook 'cache' executed in 1.12ms [test://cache]
// [my-app] ⚠️  Slow hook execution: 'auth' took 87.45ms (threshold: 50ms) [test://auth]
// [my-app] ✓ Facet 'database' initialized in 15.67ms [test://database]
// [my-app] ✓ Facet 'cache' initialized in 8.23ms [test://cache]
// [my-app] ⚠️  Slow facet initialization: 'auth' took 125.43ms (threshold: 100ms) [test://auth]
// [my-app] 📦 Build phase completed in 145.23ms
```

Now you know exactly which hook/facet is causing the slowdown!

