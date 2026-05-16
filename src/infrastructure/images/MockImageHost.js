/**
 * @file Mock image host for testing. Returns deterministic fake URLs.
 */

import { IImageHost } from '../../application/ports/IImageHost.js';

/**
 * Mock image hosting adapter for tests. Records upload calls and can simulate failures.
 *
 * @augments IImageHost
 */
export class MockImageHost extends IImageHost {
    /**
     * Construct with optional behaviour overrides.
     *
     * @param {object} [opts] - configuration options
     * @param {boolean} [opts.configured] - whether isConfigured() should return true
     * @param {boolean} [opts.shouldFail] - whether upload() should reject
     */
    constructor({ configured = true, shouldFail = false } = {}) {
        super();
        this._configured = configured;
        this._shouldFail = shouldFail;
        /** @type {Blob[]} */
        this.uploadCalls = [];
    }

    /**
     * Simulate an upload. Records the blob and either rejects or returns a fake URL.
     *
     * @param {Blob} blob - image data
     * @returns {Promise<string>} fake public URL
     */
    async upload(blob) {
        this.uploadCalls.push(blob);
        if (this._shouldFail) {
            throw new Error('MockImageHost: upload failed');
        }
        return `https://mock-host.example.com/images/img-${this.uploadCalls.length}.png`;
    }

    /**
     * Return whether the mock is configured.
     *
     * @returns {boolean} value set at construction time
     */
    isConfigured() {
        return this._configured;
    }
}
