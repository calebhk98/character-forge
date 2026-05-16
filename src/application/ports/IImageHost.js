/**
 * @file Abstract port for image hosting. Concrete adapters live in
 * src/infrastructure/images/. Swap by editing the composition root.
 */

/**
 * Abstract image hosting provider. Subclass and implement upload() and isConfigured().
 *
 * @abstract
 */
export class IImageHost {
    /**
     * Upload an image blob and return its public URL.
     *
     * @param {Blob} _blob - image data to upload
     * @returns {Promise<string>} permanent public URL of the uploaded image
     */
    async upload(_blob) {
        throw new Error('IImageHost.upload must be implemented by subclass');
    }

    /**
     * Return whether this host is ready to accept uploads.
     * Subclasses must override this and return a boolean.
     *
     * @returns {boolean} true if the host is configured and ready
     */
    isConfigured() {
        throw new Error('IImageHost.isConfigured must be implemented by subclass');
    }
}
