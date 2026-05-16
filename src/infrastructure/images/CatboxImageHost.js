/**
 * @file Adapter that uploads images to catbox.moe — no account or API key needed.
 */

import { IImageHost } from '../../application/ports/IImageHost.js';

const CATBOX_ENDPOINT = 'https://catbox.moe/user/api.php';

/**
 * Image hosting adapter backed by catbox.moe.
 *
 * Catbox accepts anonymous uploads up to 200 MB via a simple multipart POST
 * and returns the permanent URL as plain text.
 *
 * @augments IImageHost
 */
export class CatboxImageHost extends IImageHost {
    /**
     * Construct with an optional fetch implementation (injected for testing).
     *
     * @param {Function} [fetchImpl] - fetch-compatible function; defaults to global fetch
     */
    constructor(fetchImpl = globalThis.fetch.bind(globalThis)) {
        super();
        this.fetch = fetchImpl;
    }

    /**
     * Upload a blob to catbox.moe and return the permanent URL.
     *
     * @param {Blob} blob - image data
     * @returns {Promise<string>} permanent public URL
     */
    async upload(blob) {
        const form = new FormData();
        form.set('reqtype', 'fileupload');
        form.set('fileToUpload', blob);

        const response = await this.fetch(CATBOX_ENDPOINT, { method: 'POST', body: form });
        const body = await response.text();

        if (!response.ok) {
            throw new Error(`Catbox upload failed (${response.status}): ${body}`);
        }

        return body;
    }

    /**
     * Catbox requires no API key, so it is always configured.
     *
     * @returns {boolean} always true
     */
    isConfigured() {
        return true;
    }
}
