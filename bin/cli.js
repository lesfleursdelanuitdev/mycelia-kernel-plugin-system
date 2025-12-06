#!/usr/bin/env node

/**
 * Mycelia Plugin System CLI
 * 
 * Command-line tool for scaffolding hooks, contracts, and project structure.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get command and arguments
const [,, command, ...args] = process.argv;

// Commands
const commands = {
  'create': handleCreate,
  'init': handleInit,
  'help': showHelp,
  '--help': showHelp,
  '-h': showHelp
};

// Main entry point
if (!command || !commands[command]) {
  showHelp();
  process.exit(1);
}

commands[command](args);

/**
 * Handle 'create' command
 */
function handleCreate(args) {
  if (args.length < 2) {
    console.error('Error: Missing arguments');
    console.error('Usage: mycelia-kernel-plugin create <type> <name>');
    console.error('Types: hook, contract');
    process.exit(1);
  }

  const [type, name] = args;

  if (type === 'hook') {
    createHook(name);
  } else if (type === 'contract') {
    createContract(name);
  } else {
    console.error(`Error: Unknown type "${type}"`);
    console.error('Types: hook, contract');
    process.exit(1);
  }
}

/**
 * Handle 'init' command
 */
function handleInit(args) {
  const projectName = args[0] || 'my-plugin-system';
  initProject(projectName);
}

/**
 * Create a hook file
 */
function createHook(name) {
  if (!name) {
    console.error('Error: Hook name is required');
    console.error('Usage: mycelia-kernel-plugin create hook <name>');
    process.exit(1);
  }

  // Validate name (kebab-case or camelCase)
  const sanitizedName = name.replace(/[^a-zA-Z0-9-]/g, '');
  const hookName = toCamelCase(sanitizedName, true); // useXxx
  const kindName = toKebabCase(sanitizedName); // xxx
  const className = toPascalCase(sanitizedName); // Xxx

  // Determine output directory
  const cwd = process.cwd();
  let outputDir;
  
  if (existsSync(join(cwd, 'src/hooks'))) {
    outputDir = join(cwd, 'src/hooks');
  } else if (existsSync(join(cwd, 'hooks'))) {
    outputDir = join(cwd, 'hooks');
  } else if (existsSync(join(cwd, 'src'))) {
    outputDir = join(cwd, 'src');
    mkdirSync(join(outputDir, 'hooks'), { recursive: true });
    outputDir = join(outputDir, 'hooks');
  } else {
    mkdirSync(join(cwd, 'src', 'hooks'), { recursive: true });
    outputDir = join(cwd, 'src', 'hooks');
  }
  
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `use-${kindName}.js`;
  const filePath = join(outputDir, fileName);

  if (existsSync(filePath)) {
    console.error(`Error: File already exists: ${filePath}`);
    process.exit(1);
  }

  const template = `import { createHook, Facet } from 'mycelia-kernel-plugin';

/**
 * ${className} Hook
 * 
 * ${sanitizedName} plugin hook.
 */
export const ${hookName} = createHook({
  kind: '${kindName}',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const config = ctx.config?.${kindName} || {};
    
    return new Facet('${kindName}', {
      attach: true,
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      // Add your methods here
    })
    .onInit(async ({ ctx }) => {
      // Initialization logic
      if (ctx.debug) {
        console.log('${className} plugin initialized');
      }
    })
    .onDispose(async () => {
      // Cleanup logic
    });
  }
});
`;

  writeFileSync(filePath, template, 'utf8');
  console.log(`✅ Created hook: ${filePath}`);
  console.log(`   Hook name: ${hookName}`);
  console.log(`   Facet kind: ${kindName}`);
}

/**
 * Create a contract file
 */
function createContract(name) {
  if (!name) {
    console.error('Error: Contract name is required');
    console.error('Usage: mycelia-kernel-plugin create contract <name>');
    process.exit(1);
  }

  // Validate name
  const sanitizedName = name.replace(/[^a-zA-Z0-9-]/g, '');
  const contractName = toCamelCase(sanitizedName); // xxxContract
  const contractType = toKebabCase(sanitizedName); // xxx

  // Determine output directory
  const cwd = process.cwd();
  let outputDir;
  
  if (existsSync(join(cwd, 'src/contracts'))) {
    outputDir = join(cwd, 'src/contracts');
  } else if (existsSync(join(cwd, 'contracts'))) {
    outputDir = join(cwd, 'contracts');
  } else if (existsSync(join(cwd, 'src'))) {
    outputDir = join(cwd, 'src');
    mkdirSync(join(outputDir, 'contracts'), { recursive: true });
    outputDir = join(outputDir, 'contracts');
  } else {
    mkdirSync(join(cwd, 'src', 'contracts'), { recursive: true });
    outputDir = join(cwd, 'src', 'contracts');
  }
  
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `${contractType}.contract.js`;
  const filePath = join(outputDir, fileName);

  if (existsSync(filePath)) {
    console.error(`Error: File already exists: ${filePath}`);
    process.exit(1);
  }

  const template = `import { createFacetContract } from 'mycelia-kernel-plugin';

/**
 * ${sanitizedName} Contract
 * 
 * Defines the contract for ${sanitizedName} facets.
 */
export const ${contractName}Contract = createFacetContract({
  name: '${contractType}',
  requiredMethods: [
    // Add required method names here
  ],
  requiredProperties: [
    // Add required property names here
  ],
  validate: (ctx, api, subsystem, facet) => {
    // Custom validation logic
    // Throw an error if validation fails
  }
});

// Register with default registry (optional)
// import { defaultContractRegistry } from 'mycelia-kernel-plugin';
// defaultContractRegistry.register(${contractName}Contract);
`;

  writeFileSync(filePath, template, 'utf8');
  console.log(`✅ Created contract: ${filePath}`);
  console.log(`   Contract name: ${contractName}Contract`);
}

/**
 * Initialize a new project
 */
function initProject(projectName) {
  const projectDir = projectName;
  
  if (existsSync(projectDir)) {
    console.error(`Error: Directory already exists: ${projectDir}`);
    process.exit(1);
  }

  console.log(`Creating project: ${projectName}...`);

  // Create directory structure
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(join(projectDir, 'src'), { recursive: true });
  mkdirSync(join(projectDir, 'src/hooks'), { recursive: true });
  mkdirSync(join(projectDir, 'src/contracts'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    type: 'module',
    main: 'src/index.js',
    scripts: {
      start: 'node src/index.js',
      test: 'vitest run'
    },
    dependencies: {
      'mycelia-kernel-plugin': '^1.0.0'
    },
    devDependencies: {
      vitest: '^2.1.5'
    }
  };

  writeFileSync(
    join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );

  // Create README.md
  const readme = `# ${projectName}

A plugin system built with Mycelia Plugin System.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## Creating Plugins

Use the CLI to scaffold new plugins:

\`\`\`bash
npx mycelia-kernel-plugin create hook my-plugin
\`\`\`

## Structure

- \`src/hooks/\` - Plugin hooks
- \`src/contracts/\` - Facet contracts
- \`src/index.js\` - Main entry point
`;

  writeFileSync(join(projectDir, 'README.md'), readme, 'utf8');

  // Create example hook
  const exampleHook = `import { createHook, Facet } from 'mycelia-kernel-plugin';

/**
 * Example Hook
 */
export const useExample = createHook({
  kind: 'example',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('example', {
      attach: true,
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      greet(name) {
        return \`Hello, \${name}!\`;
      }
    });
  }
});
`;

  writeFileSync(join(projectDir, 'src/hooks/use-example.js'), exampleHook, 'utf8');

  // Create main index.js
  const indexJs = `import { StandalonePluginSystem } from 'mycelia-kernel-plugin';
import { useExample } from './hooks/use-example.js';

async function main() {
  const system = new StandalonePluginSystem('${projectName}', {
    config: {},
    debug: true
  });

  await system
    .use(useExample)
    .build();

  const example = system.find('example');
  console.log(example.greet('World'));

  await system.dispose();
}

main().catch(console.error);
`;

  writeFileSync(join(projectDir, 'src/index.js'), indexJs, 'utf8');

  // Create .gitignore
  const gitignore = `node_modules/
*.log
.DS_Store
`;

  writeFileSync(join(projectDir, '.gitignore'), gitignore, 'utf8');

  console.log(`✅ Project created: ${projectDir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectDir}`);
  console.log(`  npm install`);
  console.log(`  npm start`);
}

/**
 * Show help message
 */
function showHelp() {
  const help = `
Mycelia Plugin System CLI

Usage:
  mycelia-kernel-plugin <command> [options]

Commands:
  create hook <name>      Create a new hook file
  create contract <name>  Create a new contract file
  init [name]             Initialize a new project
  help                    Show this help message

Examples:
  mycelia-kernel-plugin create hook database
  mycelia-kernel-plugin create contract database
  mycelia-kernel-plugin init my-app

For more information, visit:
  https://github.com/lesfleursdelanuitdev/mycelia-kernel-plugin-system
`;
  console.log(help);
}

/**
 * Convert string to camelCase (with use prefix for hooks)
 */
function toCamelCase(str, usePrefix = false) {
  const parts = str.split('-').filter(Boolean);
  const camel = parts.map((part, i) => {
    if (i === 0 && !usePrefix) {
      return part.toLowerCase();
    }
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join('');
  return usePrefix ? `use${camel}` : camel;
}

/**
 * Convert string to kebab-case
 */
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Convert string to PascalCase
 */
function toPascalCase(str) {
  const parts = str.split('-').filter(Boolean);
  return parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join('');
}

