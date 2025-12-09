# Performance Tests

This directory contains comprehensive performance, stress, and reliability tests for the Mycelia Plugin System.

## Test Suites

### `benchmarks.test.js`
Performance benchmarks that measure and report metrics for various operations:
- **System Build Performance**: Build time for systems with 10, 100, and deep dependency chains
- **Facet Lookup Performance**: Average lookup time for existing and non-existent facets
- **Dependency Resolution Performance**: Complex dependency graph resolution and caching
- **Transaction Rollback Performance**: Speed of rollback operations on failure
- **useBase Fluent API Performance**: Build time using the fluent API
- **Parallel Initialization Performance**: Concurrent facet initialization

**Usage**: Run with `npm test -- tests/performance/benchmarks.test.js`

### `stress.test.js`
Stress tests that push the system to its limits:
- **Many Plugins**: 100, 500, and 1000 independent plugins
- **Complex Dependency Graphs**: Diamond patterns, large trees, deep chains, multiple dependencies
- **Multiple Facets Per Kind**: Handling multiple hooks creating the same facet kind
- **Overwrite Scenarios**: Multiple overwrite operations
- **Hot Reloading Stress**: Multiple reload cycles
- **Mixed Scenarios**: Complex real-world scenarios combining all patterns

**Usage**: Run with `npm test -- tests/performance/stress.test.js`

### `concurrent-access.test.js`
Tests for thread-safety and concurrent access patterns:
- **Concurrent Facet Lookups**: Multiple threads accessing facets simultaneously
- **Concurrent System Operations**: Building multiple systems concurrently
- **Race Conditions**: Handling find() during build, concurrent builds
- **Parallel Facet Initialization**: Independent facets initializing in parallel
- **Concurrent Facet Method Calls**: Multiple threads calling methods on same facet
- **Stress Concurrent Operations**: Many concurrent operations

**Usage**: Run with `npm test -- tests/performance/concurrent-access.test.js`

### `memory-leak.test.js`
Memory leak detection and cleanup verification:
- **Facet Disposal**: Proper disposal of facets on system disposal
- **Disposal Order**: Facets disposed in reverse dependency order
- **Error Handling**: Graceful handling of disposal errors
- **Multiple Build/Dispose Cycles**: No leaks after many cycles
- **Event Listener Cleanup**: Proper cleanup of event listeners
- **Circular Reference Prevention**: No circular references between facets
- **Large System Cleanup**: Proper disposal of large systems (100+ plugins)
- **useBase Cleanup**: Proper disposal of systems created with useBase
- **Memory Pressure Test**: Many systems without memory issues

**Usage**: Run with `npm test -- tests/performance/memory-leak.test.js`

### `long-running.test.js`
Long-running system stability tests:
- **Sustained Operations**: Continuous operations over time (1000+ operations)
- **Continuous Build/Reload Cycles**: Many reload cycles (50+)
- **Time-Based Operations**: Operations over extended time periods
- **Resource Stability**: Stability with many facets (200+)
- **Memory-Efficient Operations**: Using WeakMap for memory efficiency
- **Concurrent Long-Running Operations**: Concurrent operations over time
- **Stress Over Time**: Sustained stress operations
- **useBase Long-Running**: Long-running useBase systems

**Usage**: Run with `npm test -- tests/performance/long-running.test.js`

## Running All Performance Tests

```bash
# Run all performance tests
npm test -- tests/performance

# Run with coverage
npm test -- tests/performance --coverage

# Run in watch mode
npm test -- tests/performance --watch
```

## Performance Expectations

Based on benchmark results, the system should:

- **Build 10 plugins**: < 5ms
- **Build 100 plugins**: < 10ms
- **Facet lookup**: < 0.1ms average
- **Complex dependency graph (50 plugins)**: < 5ms
- **Transaction rollback**: < 2ms
- **Parallel initialization (10 facets)**: < 15ms

## Notes

- Performance tests use `console.log` to output benchmark results
- Some tests may take longer on slower systems
- Memory leak tests verify proper cleanup but don't measure actual memory usage
- Concurrent access tests verify correctness, not necessarily performance
- Long-running tests verify stability over time, not speed

## Contributing

When adding new performance tests:
1. Use descriptive test names
2. Include benchmark output with `console.log`
3. Set reasonable performance expectations
4. Clean up resources in `afterEach`
5. Document any special requirements

