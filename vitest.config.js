/**
 * @file Vitest configuration. Defines test environment (jsdom),
 * globals setup, and coverage options.
 */

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
    },
    resolve: {
        alias: [
            // Stub SillyTavern's script.js so index.js can be imported in tests.
            // The real file is part of ST's installation, not this repo.
            {
                find: /^\.{2,4}[/\\](?:\.\.\/)*script\.js$/,
                replacement: resolve(__dirname, 'tests/__mocks__/st-script.js'),
            },
        ],
    },
});
