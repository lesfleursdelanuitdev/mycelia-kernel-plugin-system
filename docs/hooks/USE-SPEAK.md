# useSpeak Hook

## Overview

The `useSpeak` hook provides simple speaking/printing functionality to subsystems. It's a minimal example hook that demonstrates the plugin system's capabilities and implements the speak contract.

**Hook Kind:** `'speak'`  
**Version:** `1.0.0`  
**Contract:** `'speak'`  
**Attach:** `true` (automatically attached to subsystem)

## Features

- **Simple Output**: Print messages with or without newlines
- **Configurable Prefix**: Add prefixes to all output
- **Custom Output Function**: Override the default output function
- **Debug Logging**: Optional debug logging for output operations
- **Contract Compliance**: Implements the speak contract for interface validation

## Installation

```javascript
import { StandalonePluginSystem } from 'mycelia-kernel-plugin';
import { useSpeak } from 'mycelia-kernel-plugin';

const system = new StandalonePluginSystem('my-app', {
  config: {
    speak: {
      prefix: '[MyApp] ',  // Optional prefix for all output
      output: console.log,  // Optional custom output function
      debug: false           // Enable debug logging
    }
  }
});

system.use(useSpeak);
await system.build();
```

## Configuration

The hook accepts configuration via `ctx.config.speak`:

```javascript
{
  prefix: '',           // Prefix for all output (default: '')
  output: console.log, // Output function (default: console.log)
  debug: false          // Enable debug logging (default: false)
}
```

### Configuration Options

- **`prefix`** (string): String to prepend to all output messages. Default: `''`
- **`output`** (Function): Function to use for output. Must accept a string. Default: `console.log`
- **`debug`** (boolean): Enable debug logging for speak operations. Default: `false`

## Usage

### Basic Usage

```javascript
// Say a message (without newline)
system.speak.say('Hello');
system.speak.say(' World');
// Output: "Hello World"

// Say a message with newline
system.speak.sayLine('Hello, World!');
// Output: "Hello, World!\n"
```

### With Prefix

```javascript
const system = new StandalonePluginSystem('my-app', {
  config: {
    speak: {
      prefix: '[MyApp] '
    }
  }
});

system.use(useSpeak);
await system.build();

system.speak.sayLine('Application started');
// Output: "[MyApp] Application started\n"
```

### Custom Output Function

```javascript
// Use a custom output function
const system = new StandalonePluginSystem('my-app', {
  config: {
    speak: {
      output: (message) => {
        // Custom output logic
        document.getElementById('output').innerText += message + '\n';
      }
    }
  }
});

system.use(useSpeak);
await system.build();

system.speak.sayLine('This goes to the DOM');
```

### Debug Mode

```javascript
const system = new StandalonePluginSystem('my-app', {
  config: {
    speak: {
      debug: true  // Enable debug logging
    }
  }
});

system.use(useSpeak);
await system.build();

system.speak.say('Test message');
// Output: "Test message"
// Debug log: "Said: Test message"
```

## API Reference

### Methods

#### `say(message)`

Say a message without adding a newline.

**Parameters:**
- `message` (string): Message to say

**Returns:** `void`

**Throws:** `Error` if message is not a string

**Example:**
```javascript
system.speak.say('Hello');
system.speak.say(' World');
// Output: "Hello World"
```

#### `sayLine(message)`

Say a message with a newline.

**Parameters:**
- `message` (string): Message to say

**Returns:** `void`

**Throws:** `Error` if message is not a string

**Example:**
```javascript
system.speak.sayLine('Hello, World!');
// Output: "Hello, World!\n"
```

## Contract

The `useSpeak` hook implements the `'speak'` contract, which requires:

**Required Methods:**
- `say(message)` - Must accept at least one argument (message)
- `sayLine(message)` - Must accept at least one argument (message)

**Required Properties:**
- None

**Custom Validation:**
- Validates that `say()` method accepts at least one argument
- Validates that `sayLine()` method accepts at least one argument

## Examples

### Hello World Example

```javascript
import { StandalonePluginSystem } from 'mycelia-kernel-plugin';
import { useSpeak } from 'mycelia-kernel-plugin';

const system = new StandalonePluginSystem('hello-world', {
  debug: true,
  config: {
    speak: {
      prefix: '[HelloWorld] '
    }
  }
});

system.use(useSpeak);
await system.build();

// Use the speak facet
system.speak.sayLine('Hello, World!');
system.speak.say('This is a ');
system.speak.sayLine('simple example.');

// Output:
// [HelloWorld] Hello, World!
// [HelloWorld] This is a simple example.
```

### Logging System

```javascript
// Create a logging system using speak
const system = new StandalonePluginSystem('logger', {
  config: {
    speak: {
      prefix: '[LOG] ',
      output: (message) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
      }
    }
  }
});

system.use(useSpeak);
await system.build();

system.speak.sayLine('Application started');
system.speak.sayLine('Loading configuration');
system.speak.sayLine('Ready');
```

### Multi-Line Output

```javascript
// Build multi-line output
system.speak.sayLine('=== System Status ===');
system.speak.say('Status: ');
system.speak.sayLine('OK');
system.speak.say('Version: ');
system.speak.sayLine('1.0.0');

// Output:
// === System Status ===
// Status: OK
// Version: 1.0.0
```

### Conditional Output

```javascript
function logIfEnabled(system, message, enabled = true) {
  if (enabled) {
    system.speak.sayLine(message);
  }
}

logIfEnabled(system, 'Debug message', process.env.DEBUG === 'true');
```

## Integration with Other Hooks

The speak hook can be used with other hooks for output:

- **useListeners**: Output events to console
- **useQueue**: Log queue operations
- **Custom Hooks**: Use speak for any output needs

## Best Practices

1. **Use Prefixes**: Add meaningful prefixes to identify output source
2. **Consistent Formatting**: Use consistent formatting across your application
3. **Error Handling**: Handle cases where output might fail
4. **Debug Mode**: Use debug mode during development
5. **Custom Output**: Override output function for custom destinations (files, DOM, etc.)

## Troubleshooting

### No Output Appearing

**Problem:** Messages aren't appearing in output.

**Solution:**
- Check that `output` function is correctly configured
- Verify the output function is actually being called
- Check for errors in custom output functions
- Ensure system is built before using speak

### Prefix Not Working

**Problem:** Prefix isn't being added to messages.

**Solution:**
- Verify prefix is set in config
- Check that config is passed correctly to system
- Ensure prefix is a string (not null or undefined)

### Custom Output Not Working

**Problem:** Custom output function isn't being called.

**Solution:**
- Verify output function is a function
- Check that function accepts at least one argument
- Ensure function is set in config before build
- Test function independently

## See Also

- [useListeners Hook](./USE-LISTENERS.md) - Event-driven listener management
- [useQueue Hook](./USE-QUEUE.md) - Message queue management
- [Facet Contracts](../facet-contracts/FACET-CONTRACTS-OVERVIEW.md) - Contract system
- [Examples](../examples/README.md) - More examples
- [Getting Started](../getting-started/README.md) - Quick start guide

