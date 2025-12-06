# CLI Tool Guide

The Mycelia Plugin System includes a CLI tool (`mycelia-kernel-plugin`) for scaffolding hooks, contracts, and project structures.

## Installation

The CLI is included with the package. Use it via `npx`:

```bash
npx mycelia-kernel-plugin <command>
```

Or install globally:

```bash
npm install -g mycelia-kernel-plugin
mycelia-kernel-plugin <command>
```

## Commands

### Create Hook

Generate a new hook file with a template:

```bash
mycelia-kernel-plugin create hook <name>
```

**Example:**
```bash
mycelia-kernel-plugin create hook database
```

**Output:**
- Creates `src/hooks/use-database.js` (or `hooks/use-database.js` if `src` doesn't exist)
- Generates a complete hook template with:
  - `createHook` setup
  - `Facet` creation
  - `onInit` and `onDispose` callbacks
  - Configuration access
  - Proper imports

**Generated Template:**
```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin';

export const useDatabase = createHook({
  kind: 'database',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const config = ctx.config?.database || {};
    
    return new Facet('database', {
      attach: true,
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      // Add your methods here
    })
    .onInit(async ({ ctx }) => {
      // Initialization logic
    })
    .onDispose(async () => {
      // Cleanup logic
    });
  }
});
```

### Create Contract

Generate a new contract file:

```bash
mycelia-kernel-plugin create contract <name>
```

**Example:**
```bash
mycelia-kernel-plugin create contract database
```

**Output:**
- Creates `src/contracts/database.contract.js` (or `contracts/database.contract.js`)
- Generates a contract template with:
  - `createFacetContract` setup
  - Required methods and properties arrays
  - Custom validation function
  - Optional registry registration

**Generated Template:**
```javascript
import { createFacetContract } from 'mycelia-kernel-plugin';

export const databaseContract = createFacetContract({
  name: 'database',
  requiredMethods: [
    // Add required method names here
  ],
  requiredProperties: [
    // Add required property names here
  ],
  validate: (ctx, api, subsystem, facet) => {
    // Custom validation logic
  }
});
```

### Initialize Project

Create a new project structure:

```bash
mycelia-kernel-plugin init [project-name]
```

**Example:**
```bash
mycelia-kernel-plugin init my-app
```

**Output:**
Creates a complete project structure:
```
my-app/
├── src/
│   ├── hooks/
│   │   └── use-example.js
│   ├── contracts/
│   └── index.js
├── package.json
├── README.md
└── .gitignore
```

**Generated Files:**
- `package.json` - With dependencies and scripts
- `src/index.js` - Example usage with `StandalonePluginSystem`
- `src/hooks/use-example.js` - Example hook
- `README.md` - Project documentation
- `.gitignore` - Git ignore file

## Usage Examples

### Creating Multiple Hooks

```bash
# Create hooks for different features
mycelia-kernel-plugin create hook database
mycelia-kernel-plugin create hook cache
mycelia-kernel-plugin create hook auth
mycelia-kernel-plugin create hook api
```

### Creating Contracts for Hooks

```bash
# Create contracts to validate your hooks
mycelia-kernel-plugin create contract database
mycelia-kernel-plugin create contract cache
```

### Project Workflow

```bash
# 1. Initialize project
mycelia-kernel-plugin init my-plugin-system

# 2. Navigate to project
cd my-plugin-system

# 3. Install dependencies
npm install

# 4. Create your hooks
npx mycelia-kernel-plugin create hook database
npx mycelia-kernel-plugin create hook cache

# 5. Start developing
npm start
```

## File Location Detection

The CLI automatically detects your project structure:

1. **If `src/hooks/` exists**: Creates files there
2. **If `hooks/` exists**: Creates files there
3. **If `src/` exists**: Creates `src/hooks/` and `src/contracts/`
4. **Otherwise**: Creates `src/hooks/` and `src/contracts/` in current directory

## Naming Conventions

The CLI handles name conversion automatically:

- **Input**: `database` → **Hook**: `useDatabase`, **File**: `use-database.js`
- **Input**: `user-auth` → **Hook**: `useUserAuth`, **File**: `use-user-auth.js`
- **Input**: `API` → **Hook**: `useAPI`, **File**: `use-api.js`

## Tips

1. **Use kebab-case or camelCase** for hook names
2. **Run from project root** for best results
3. **Check generated files** before committing
4. **Customize templates** after generation
5. **Use contracts** to validate hook interfaces

## Troubleshooting

### File Already Exists

If a file already exists, the CLI will error:
```
Error: File already exists: src/hooks/use-database.js
```

**Solution:** Delete the existing file or use a different name.

### Wrong Directory

If files are created in the wrong location:
- Check your current working directory
- Ensure you're in the project root
- Manually create `src/hooks/` or `src/contracts/` if needed

### Import Errors

If imports fail after generation:
- Ensure `mycelia-kernel-plugin` is installed
- Check that the package name matches your `package.json`
- Verify the import path is correct

## Next Steps

After generating files:
1. Customize the generated templates
2. Add your implementation logic
3. Create contracts for validation
4. Write tests for your hooks
5. Use in your plugin system

