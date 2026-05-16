/**
 * @file Configurable image host that reads provider settings and delegates to
 * the appropriate concrete adapter.
 */

import { IImageHost } from '../../application/ports/IImageHost.js';

const DEFAULT_PROVIDER = 'catbox';

/**
 * Image host adapter that delegates to a concrete provider selected by config.
 *
 * Reads `imageHostProvider` from the config store to choose which delegate to
 * use. Supported values: `'catbox'` (default). Additional providers can be
 * injected via the `delegates` map.
 *
 * @augments IImageHost
 */
export class ConfigurableImageHost extends IImageHost {
    /**
     * Construct with a config store and delegate map.
     *
     * @param {object} configStore - config store with a get(key) method
     * @param {object} delegates - map of provider keys to IImageHost instances
     */
    constructor(configStore, delegates) {
        super();
        this.configStore = configStore;
        this.delegates = delegates;
    }

    /**
     * Resolve the active delegate from settings.
     *
     * @returns {IImageHost} the concrete host for the configured provider
     */
    _activeDelegate() {
        const provider = this.configStore.get('imageHostProvider') || DEFAULT_PROVIDER;
        const delegate = this.delegates[provider];
        if (!delegate) {
            throw new Error(`Unknown image host provider: ${provider}`);
        }
        return delegate;
    }

    /**
     * Upload a blob using the configured provider.
     *
     * @param {Blob} blob - image data
     * @returns {Promise<string>} public URL from the active provider
     */
    async upload(blob) {
        return this._activeDelegate().upload(blob);
    }

    /**
     * Report whether the active provider is ready to accept uploads.
     *
     * @returns {boolean} true if the active provider is configured
     */
    isConfigured() {
        return /** @type {boolean} */ (this._activeDelegate().isConfigured());
    }
}
