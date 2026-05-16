/**
 * @file Local image host adapter. Converts blobs to base64 data URIs so
 * character images can be embedded offline without an external upload service.
 * Useful as a fallback when no internet connection is available or when the
 * user prefers to keep images self-contained in the character card.
 */

import { IImageHost } from '../../application/ports/IImageHost.js';

/**
 * Image host that converts blobs to base64 data URIs via FileReader.
 * No external service or API key is required. The resulting URLs are
 * embedded directly in character fields as data: URIs.
 *
 * @augments IImageHost
 */
export class LocalImageHost extends IImageHost {
    /**
     * Convert an image blob to a base64 data URI.
     *
     * @param {Blob} blob - image data to encode
     * @returns {Promise<string>} base64 data URI (e.g. data:image/png;base64,...)
     */
    upload(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(/** @type {string} */ (reader.result));
            reader.onerror = () => reject(new Error('LocalImageHost: failed to read image blob'));
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Always configured — requires no external service.
     *
     * @returns {boolean} always true
     */
    isConfigured() {
        return true;
    }
}
