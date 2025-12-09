import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.{js,jsx,ts,tsx}',
      'tests/**/*.test.{js,jsx,ts,tsx}',
      'examples/**/*.test.{js,jsx,ts,tsx}'
    ],
    globals: true,
    coverage: {
      reportsDirectory: 'coverage',
    },
  },
});

