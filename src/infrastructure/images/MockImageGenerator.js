/**
 * @file Mock image generator for use in tests and development. Returns a
 * static 1×1 placeholder PNG for all generation requests so tests never make
 * real HTTP calls.
 */

import { IImageGenerator } from '../../application/ports/IImageGenerator.js';
import { createPlaceholderPng } from '../utils/PngChunkWriter.js';

/**
 * In-memory image generator that returns a placeholder PNG.
 * Pass `{ available: false }` to simulate an unavailable backend.
 *
 * @augments IImageGenerator
 */
export class MockImageGenerator extends IImageGenerator {
    /**
     * Construct with optional configuration.
     *
     * @param {object} [opts] - configuration options
     * @param {boolean} [opts.available] - whether to report as available (default true)
     */
    constructor({ available = true } = {}) {
        super();
        this._available = available;
    }

    /**
     * Report whether the mock backend is configured as available.
     *
     * @returns {Promise<boolean>} availability flag
     */
    async isAvailable() {
        return this._available;
    }

    /**
     * Return a placeholder PNG portrait.
     *
     * @param {string} _description - ignored
     * @returns {Promise<Uint8Array>} placeholder PNG bytes
     */
    async generatePortrait(_description) {
        if (!this._available) {
            throw new Error('MockImageGenerator: backend not available');
        }
        return createPlaceholderPng();
    }

    /**
     * Return a placeholder PNG expression sprite.
     *
     * @param {string} _description - ignored
     * @param {string} _emotion - ignored
     * @returns {Promise<Uint8Array>} placeholder PNG bytes
     */
    async generateExpression(_description, _emotion) {
        if (!this._available) {
            throw new Error('MockImageGenerator: backend not available');
        }
        return createPlaceholderPng();
    }
}
