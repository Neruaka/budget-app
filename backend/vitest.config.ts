// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Utilise les globals Vitest (describe, it, expect) sans import
    globals:     false,
    environment: 'node',
    // Affiche chaque test individuellement
    reporter:    'verbose',
    // Où trouver les tests
    include: ['tests/**/*.test.ts'],
  },
});
