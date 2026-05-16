/**
 * @file Use case: upload approved greeting images to a hosting provider and
 * inject the returned URLs into the corresponding character fields.
 */

import { Character } from '../../domain/entities/Character.js';

/**
 * @typedef {object} ImageItem
 * @property {string} label - human-readable label shown in the approval UI
 * @property {Blob} blob - image data to upload
 * @property {string} targetField - character field to prepend the URL to (e.g. 'first_mes')
 */

/**
 * Upload approved greeting images and inject their URLs into the character.
 */
export class UploadGreetingImages {
    /**
     * Construct with dependencies.
     *
     * @param {import('../ports/IImageHost.js').IImageHost} imageHost - image hosting adapter
     * @param {import('../ports/ILogger.js').ILogger} logger - diagnostic logger
     */
    constructor(imageHost, logger) {
        this.imageHost = imageHost;
        this.logger = logger;
    }

    /**
     * Upload each approved item and return a new Character with URLs injected.
     *
     * Items that fail to upload are logged but do not block remaining uploads.
     * The character is returned unchanged if the host is not configured or the
     * items list is empty.
     *
     * @param {Character} character - character whose fields will receive image URLs
     * @param {ImageItem[]} items - approved images to upload
     * @returns {Promise<Character>} updated character with URLs prepended to target fields
     */
    async execute(character, items) {
        if (!items.length) {
            return character;
        }

        if (!this.imageHost.isConfigured()) {
            this.logger.warn('Image host is not configured — skipping upload');
            return character;
        }

        const fieldUpdates = this._copyFields(character);

        for (const item of items) {
            await this._uploadItem(item, fieldUpdates);
        }

        return new Character({ ...character, ...fieldUpdates });
    }

    /**
     * Build a plain-object copy of the mutable character fields.
     *
     * @param {Character} character - source character
     * @returns {object} key/value map of field names to current values
     */
    _copyFields(character) {
        return {
            name: character.name,
            description: character.description,
            personality: character.personality,
            scenario: character.scenario,
            first_mes: character.first_mes,
            mes_example: character.mes_example,
            alternate_greetings: [...(character.alternate_greetings ?? [])],
        };
    }

    /**
     * Upload a single item and prepend its URL to the target field. Logs on failure.
     *
     * @param {ImageItem} item - image item to upload
     * @param {object} fields - mutable field map updated in place
     * @returns {Promise<void>}
     */
    async _uploadItem(item, fields) {
        try {
            this.logger.info('Uploading image', { label: item.label, targetField: item.targetField });
            const url = await this.imageHost.upload(item.blob);
            fields[item.targetField] = `![](${url})\n\n${fields[item.targetField]}`;
            this.logger.info('Image uploaded', { label: item.label, url });
        } catch (error) {
            this.logger.error('Image upload failed', { label: item.label, error: error.message });
        }
    }
}
