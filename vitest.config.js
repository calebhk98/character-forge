/**
 * @file Vitest configuration. Defines test environment (jsdom),
 * globals setup, and coverage options.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
    },
});
