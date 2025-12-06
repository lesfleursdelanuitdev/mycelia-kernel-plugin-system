# Test Suite

This directory contains comprehensive tests for the Mycelia Plugin System using Vitest.

## Test Structure

```
tests/
├── unit/              # Unit tests for individual components
│   ├── core/          # Core functionality (createHook, Facet)
│   ├── manager/       # FacetManager and transactions
│   ├── system/        # BaseSubsystem and StandalonePluginSystem
│   ├── builder/       # SubsystemBuilder and dependency resolution
│   └── contract/       # FacetContract and registry
├── integration/       # Integration tests for complete workflows
└── examples/          # Example-based tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The test suite covers:

- ✅ Core functionality (createHook, Facet)
- ✅ FacetManager operations
- ✅ BaseSubsystem lifecycle
- ✅ StandalonePluginSystem
- ✅ Dependency resolution
- ✅ Contract validation
- ✅ Transaction safety
- ✅ Integration workflows

## Writing Tests

### Example Test Structure

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StandalonePluginSystem, createHook, Facet } from '../../src/index.js';

describe('MyFeature', () => {
  let system;

  beforeEach(() => {
    system = new StandalonePluginSystem('test', { config: {} });
  });

  afterEach(async () => {
    if (system && system.isBuilt) {
      await system.dispose();
    }
  });

  it('should do something', async () => {
    // Test implementation
  });
});
```

## Notes

- Always clean up systems in `afterEach` hooks
- Use `createHook` and `Facet` for test fixtures
- Test both success and failure cases
- Test lifecycle callbacks (onInit, onDispose)

