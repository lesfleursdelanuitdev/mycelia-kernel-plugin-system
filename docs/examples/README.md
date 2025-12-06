# Examples

This directory contains complete, runnable examples demonstrating how to use the Mycelia Plugin System.

## Available Examples

### Basic Examples

- **[Basic Plugin](./basic-plugin.md)** - Create a simple plugin with no dependencies
- **[Plugin with Dependencies](./plugin-with-dependencies.md)** - Create plugins that depend on other plugins
- **[Lifecycle Management](./lifecycle-management.md)** - Manage plugin initialization and cleanup
- **[Contract Validation](./contract-validation.md)** - Use facet contracts to validate plugin interfaces

### Advanced Examples

- **[Multiple Facets](./multiple-facets.md)** - Register multiple facets of the same kind
- **[Error Handling](./error-handling.md)** - Handle errors and transaction rollback
- **[Hot Reloading](./hot-reloading.md)** - Use reload() for hot reloading and incremental extension
- **[Context Configuration](./context-configuration.md)** - Configure plugins using context
- **[Custom Contracts](./custom-contracts.md)** - Create and use custom facet contracts

## Running Examples

All examples are designed to be copy-paste ready. Simply:

1. Install the package:
```bash
npm install mycelia-kernel-plugin-system
```

2. Copy the example code into a file (e.g., `example.js`)

3. Run it:
```bash
node example.js
```

## Example Structure

Each example includes:
- **Complete code** - Ready to run
- **Explanation** - What the code does
- **Expected output** - What you should see
- **Next steps** - How to extend the example

## Contributing

If you have an example that would be helpful to others, please submit a pull request!

