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
  if (args.length === 0) {
    const projectName = 'my-plugin-system';
    initProject(projectName);
  } else if (args[0] === 'react') {
    const projectName = args[1] || 'my-react-app';
    initReactProject(projectName);
  } else if (args[0] === 'vue') {
    const projectName = args[1] || 'my-vue-app';
    initVueProject(projectName);
  } else if (args[0] === 'svelte') {
    const projectName = args[1] || 'my-svelte-app';
    initSvelteProject(projectName);
  } else if (args[0] === 'angular') {
    const projectName = args[1] || 'my-angular-app';
    initAngularProject(projectName);
  } else if (args[0] === 'qwik') {
    const projectName = args[1] || 'my-qwik-app';
    initQwikProject(projectName);
  } else {
    const projectName = args[0];
    initProject(projectName);
  }
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
 * Initialize a React project with Mycelia bindings
 */
function initReactProject(projectName) {
  const projectDir = projectName;
  
  if (existsSync(projectDir)) {
    console.error(`Error: Directory already exists: ${projectDir}`);
    process.exit(1);
  }

  console.log(`Creating React project: ${projectName}...`);

  // Create directory structure
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(join(projectDir, 'src'), { recursive: true });
  mkdirSync(join(projectDir, 'src/hooks'), { recursive: true });
  mkdirSync(join(projectDir, 'src/components'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      'mycelia-kernel-plugin': '^1.2.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.2.0',
      'vite': '^5.0.0'
    }
  };

  writeFileSync(
    join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );

  // Create vite.config.js
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

  writeFileSync(join(projectDir, 'vite.config.js'), viteConfig, 'utf8');

  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

  writeFileSync(join(projectDir, 'index.html'), indexHtml, 'utf8');

  // Create main.jsx
  const mainJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import { MyceliaProvider } from 'mycelia-kernel-plugin/react';
import { useBase } from 'mycelia-kernel-plugin';
import App from './App.jsx';

const buildSystem = () =>
  useBase('${projectName}')
    .build();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MyceliaProvider build={buildSystem}>
      <App />
    </MyceliaProvider>
  </React.StrictMode>
);
`;

  writeFileSync(join(projectDir, 'src/main.jsx'), mainJsx, 'utf8');

  // Create App.jsx
  const appJsx = `import React from 'react';
import { useMycelia } from 'mycelia-kernel-plugin/react';

function App() {
  const system = useMycelia();
  
  return (
    <div>
      <h1>${projectName}</h1>
      <p>System: {system?.name}</p>
    </div>
  );
}

export default App;
`;

  writeFileSync(join(projectDir, 'src/App.jsx'), appJsx, 'utf8');

  // Create README.md
  const readme = `# ${projectName}

A React application built with Mycelia Plugin System.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Creating Plugins

Use the CLI to scaffold new plugins:

\`\`\`bash
npx mycelia-kernel-plugin create hook my-plugin
\`\`\`

## Structure

- \`src/hooks/\` - Plugin hooks
- \`src/components/\` - React components
- \`src/App.jsx\` - Main app component
- \`src/main.jsx\` - Entry point
`;

  writeFileSync(join(projectDir, 'README.md'), readme, 'utf8');

  // Create .gitignore
  const gitignore = `node_modules/
dist/
*.log
.DS_Store
`;

  writeFileSync(join(projectDir, '.gitignore'), gitignore, 'utf8');

  console.log(`✅ React project created: ${projectDir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectDir}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
}

/**
 * Initialize a Vue project with Mycelia bindings
 */
function initVueProject(projectName) {
  const projectDir = projectName;
  
  if (existsSync(projectDir)) {
    console.error(`Error: Directory already exists: ${projectDir}`);
    process.exit(1);
  }

  console.log(`Creating Vue project: ${projectName}...`);

  // Create directory structure
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(join(projectDir, 'src'), { recursive: true });
  mkdirSync(join(projectDir, 'src/hooks'), { recursive: true });
  mkdirSync(join(projectDir, 'src/components'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      'mycelia-kernel-plugin': '^1.2.0',
      'vue': '^3.4.0'
    },
    devDependencies: {
      '@vitejs/plugin-vue': '^5.0.0',
      'vite': '^5.0.0'
    }
  };

  writeFileSync(
    join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );

  // Create vite.config.js
  const viteConfig = `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});
`;

  writeFileSync(join(projectDir, 'vite.config.js'), viteConfig, 'utf8');

  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`;

  writeFileSync(join(projectDir, 'index.html'), indexHtml, 'utf8');

  // Create main.js
  const mainJs = `import { createApp } from 'vue';
import { MyceliaPlugin } from 'mycelia-kernel-plugin/vue';
import { useBase } from 'mycelia-kernel-plugin';
import App from './App.vue';

const buildSystem = () =>
  useBase('${projectName}')
    .build();

const app = createApp(App);
app.use(MyceliaPlugin, { build: buildSystem });
app.mount('#app');
`;

  writeFileSync(join(projectDir, 'src/main.js'), mainJs, 'utf8');

  // Create App.vue
  const appVue = `<template>
  <div>
    <h1>${projectName}</h1>
    <p>System: {{ system?.name }}</p>
  </div>
</template>

<script setup>
import { useMycelia } from 'mycelia-kernel-plugin/vue';

const system = useMycelia();
</script>
`;

  writeFileSync(join(projectDir, 'src/App.vue'), appVue, 'utf8');

  // Create README.md
  const readme = `# ${projectName}

A Vue 3 application built with Mycelia Plugin System.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Creating Plugins

Use the CLI to scaffold new plugins:

\`\`\`bash
npx mycelia-kernel-plugin create hook my-plugin
\`\`\`

## Structure

- \`src/hooks/\` - Plugin hooks
- \`src/components/\` - Vue components
- \`src/App.vue\` - Main app component
- \`src/main.js\` - Entry point
`;

  writeFileSync(join(projectDir, 'README.md'), readme, 'utf8');

  // Create .gitignore
  const gitignore = `node_modules/
dist/
*.log
.DS_Store
`;

  writeFileSync(join(projectDir, '.gitignore'), gitignore, 'utf8');

  console.log(`✅ Vue project created: ${projectDir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectDir}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
}

/**
 * Initialize a Svelte project with Mycelia bindings
 */
function initSvelteProject(projectName) {
  const projectDir = projectName;
  
  if (existsSync(projectDir)) {
    console.error(`Error: Directory already exists: ${projectDir}`);
    process.exit(1);
  }

  console.log(`Creating Svelte project: ${projectName}...`);

  // Create directory structure
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(join(projectDir, 'src'), { recursive: true });
  mkdirSync(join(projectDir, 'src/hooks'), { recursive: true });
  mkdirSync(join(projectDir, 'src/components'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite dev',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      'mycelia-kernel-plugin': '^1.2.0',
      'svelte': '^4.2.0'
    },
    devDependencies: {
      '@sveltejs/vite-plugin-svelte': '^3.0.0',
      'vite': '^5.0.0'
    }
  };

  writeFileSync(
    join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );

  // Create vite.config.js
  const viteConfig = `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
});
`;

  writeFileSync(join(projectDir, 'vite.config.js'), viteConfig, 'utf8');

  // Create svelte.config.js
  const svelteConfig = `import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
};
`;

  writeFileSync(join(projectDir, 'svelte.config.js'), svelteConfig, 'utf8');

  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`;

  writeFileSync(join(projectDir, 'index.html'), indexHtml, 'utf8');

  // Create main.js
  const mainJs = `import App from './App.svelte';

const app = new App({
  target: document.getElementById('app'),
});

export default app;
`;

  writeFileSync(join(projectDir, 'src/main.js'), mainJs, 'utf8');

  // Create App.svelte
  const appSvelte = `<script>
  import { onMount } from 'svelte';
  import { setMyceliaSystem, useMycelia } from 'mycelia-kernel-plugin/svelte';
  import { useBase } from 'mycelia-kernel-plugin';
  
  let system;
  
  onMount(async () => {
    system = await useBase('${projectName}').build();
    setMyceliaSystem(system);
  });
  
  const systemStore = useMycelia();
  $: currentSystem = $systemStore;
</script>

<div>
  <h1>${projectName}</h1>
  {#if currentSystem}
    <p>System: {currentSystem.name}</p>
  {:else}
    <p>Loading system...</p>
  {/if}
</div>
`;

  writeFileSync(join(projectDir, 'src/App.svelte'), appSvelte, 'utf8');

  // Create README.md
  const readme = `# ${projectName}

A Svelte application built with Mycelia Plugin System.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Creating Plugins

Use the CLI to scaffold new plugins:

\`\`\`bash
npx mycelia-kernel-plugin create hook my-plugin
\`\`\`

## Structure

- \`src/hooks/\` - Plugin hooks
- \`src/components/\` - Svelte components
- \`src/App.svelte\` - Main app component
- \`src/main.js\` - Entry point
`;

  writeFileSync(join(projectDir, 'README.md'), readme, 'utf8');

  // Create .gitignore
  const gitignore = `node_modules/
dist/
*.log
.DS_Store
`;

  writeFileSync(join(projectDir, '.gitignore'), gitignore, 'utf8');

  console.log(`✅ Svelte project created: ${projectDir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectDir}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
}

/**
 * Initialize an Angular project with Mycelia bindings
 */
function initAngularProject(projectName) {
  const projectDir = projectName;
  
  if (existsSync(projectDir)) {
    console.error(`Error: Directory already exists: ${projectDir}`);
    process.exit(1);
  }

  console.log(`Creating Angular project: ${projectName}...`);
  console.log(`\nNote: This creates a basic Angular project structure.`);
  console.log(`You may need to run 'ng new' separately for a full Angular CLI setup.`);

  // Create directory structure
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(join(projectDir, 'src'), { recursive: true });
  mkdirSync(join(projectDir, 'src/app'), { recursive: true });
  mkdirSync(join(projectDir, 'src/app/services'), { recursive: true });
  mkdirSync(join(projectDir, 'src/app/components'), { recursive: true });
  mkdirSync(join(projectDir, 'src/mycelia'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    type: 'module',
    scripts: {
      start: 'ng serve',
      build: 'ng build',
      test: 'ng test'
    },
    dependencies: {
      'mycelia-kernel-plugin': '^1.3.0',
      '@angular/core': '^17.0.0',
      '@angular/common': '^17.0.0',
      'rxjs': '^7.8.0'
    },
    devDependencies: {
      '@angular/cli': '^17.0.0',
      '@angular/compiler-cli': '^17.0.0',
      'typescript': '^5.0.0'
    }
  };

  writeFileSync(
    join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );

  // Create Mycelia service
  const myceliaService = `import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { createMyceliaService } from 'mycelia-kernel-plugin/angular';
import { buildSystem } from '../mycelia/system.builder.js';

@Injectable({ providedIn: 'root' })
export class MyceliaService {
  private service = createMyceliaService(buildSystem);

  get system$(): Observable<any> {
    return this.service.system$;
  }

  getSystem() {
    return this.service.getSystem();
  }

  useFacet(kind: string) {
    return this.service.useFacet(kind);
  }

  useListener(eventName: string, handler: Function) {
    return this.service.useListener(eventName, handler);
  }

  async dispose() {
    await this.service.dispose();
  }
}
`;

  writeFileSync(join(projectDir, 'src/app/services/mycelia.service.ts'), myceliaService, 'utf8');

  // Create system builder
  const systemBuilder = `import { useBase } from 'mycelia-kernel-plugin';
import { useListeners } from 'mycelia-kernel-plugin';

export async function buildSystem() {
  return useBase('${projectName}')
    .use(useListeners)
    .build();
}
`;

  writeFileSync(join(projectDir, 'src/mycelia/system.builder.ts'), systemBuilder, 'utf8');

  // Create README
  const readme = `# ${projectName}

An Angular application built with Mycelia Plugin System.

## Getting Started

\`\`\`bash
npm install
ng serve
\`\`\`

## Structure

- \`src/app/services/\` - Angular services (including MyceliaService)
- \`src/app/components/\` - Angular components
- \`src/mycelia/\` - Mycelia plugin code (framework-agnostic)
`;

  writeFileSync(join(projectDir, 'README.md'), readme, 'utf8');

  console.log(`✅ Angular project created: ${projectDir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectDir}`);
  console.log(`  npm install`);
  console.log(`  ng serve`);
}

/**
 * Initialize a Qwik project with Mycelia bindings
 */
function initQwikProject(projectName) {
  const projectDir = projectName;
  
  if (existsSync(projectDir)) {
    console.error(`Error: Directory already exists: ${projectDir}`);
    process.exit(1);
  }

  console.log(`Creating Qwik project: ${projectName}...`);

  // Create directory structure
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(join(projectDir, 'src'), { recursive: true });
  mkdirSync(join(projectDir, 'src/components'), { recursive: true });
  mkdirSync(join(projectDir, 'src/mycelia'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      'mycelia-kernel-plugin': '^1.3.0',
      '@builder.io/qwik': '^1.0.0',
      '@builder.io/qwik-city': '^1.0.0'
    },
    devDependencies: {
      'vite': '^5.0.0',
      '@vitejs/plugin-qwik': '^1.0.0'
    }
  };

  writeFileSync(
    join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );

  // Create App component
  const appComponent = `import { component$ } from '@builder.io/qwik';
import { MyceliaProvider } from 'mycelia-kernel-plugin/qwik';
import { buildSystem } from './mycelia/system.builder.js';
import { TodoApp } from './components/TodoApp';

export default component$(() => {
  return (
    <MyceliaProvider build={buildSystem}>
      <TodoApp />
    </MyceliaProvider>
  );
});
`;

  writeFileSync(join(projectDir, 'src/App.tsx'), appComponent, 'utf8');

  // Create system builder
  const systemBuilder = `import { useBase } from 'mycelia-kernel-plugin';
import { useListeners } from 'mycelia-kernel-plugin';

export async function buildSystem() {
  return useBase('${projectName}')
    .use(useListeners)
    .build();
}
`;

  writeFileSync(join(projectDir, 'src/mycelia/system.builder.ts'), systemBuilder, 'utf8');

  // Create example component
  const todoComponent = `import { component$ } from '@builder.io/qwik';
import { useFacet, useListener } from 'mycelia-kernel-plugin/qwik';

export const TodoApp = component$(() => {
  const todos = useFacet('todos');
  useListener('todos:changed', (msg) => {
    console.log('Todos changed:', msg.body);
  });

  return (
    <div>
      <h1>Todo App</h1>
      {todos.value && <p>Todos facet loaded</p>}
    </div>
  );
});
`;

  writeFileSync(join(projectDir, 'src/components/TodoApp.tsx'), todoComponent, 'utf8');

  // Create README
  const readme = `# ${projectName}

A Qwik application built with Mycelia Plugin System.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Structure

- \`src/components/\` - Qwik components
- \`src/mycelia/\` - Mycelia plugin code (framework-agnostic)
`;

  writeFileSync(join(projectDir, 'README.md'), readme, 'utf8');

  console.log(`✅ Qwik project created: ${projectDir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectDir}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
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
  init [name]             Initialize a new project (vanilla JS)
  init react [name]       Initialize a React project with Mycelia bindings
  init vue [name]         Initialize a Vue 3 project with Mycelia bindings
  init svelte [name]      Initialize a Svelte project with Mycelia bindings
  init angular [name]     Initialize an Angular project with Mycelia bindings
  init qwik [name]        Initialize a Qwik project with Mycelia bindings
  help                    Show this help message

Examples:
  mycelia-kernel-plugin create hook database
  mycelia-kernel-plugin create contract database
  mycelia-kernel-plugin init my-app
  mycelia-kernel-plugin init react my-react-app
  mycelia-kernel-plugin init vue my-vue-app
  mycelia-kernel-plugin init svelte my-svelte-app
  mycelia-kernel-plugin init angular my-angular-app
  mycelia-kernel-plugin init qwik my-qwik-app

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

