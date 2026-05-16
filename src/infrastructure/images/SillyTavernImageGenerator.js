/**
 * @file SillyTavern image generator adapter. Delegates to the global
 * generatePicture() function exposed by SillyTavern's image generation
 * extension, which supports 20+ backends (AUTOMATIC1111, ComfyUI, DALL-E,
 * Stable Horde, Pollinations, NovelAI, and more).
 */

import { IImageGenerator } from '../../application/ports/IImageGenerator.js';

/**
 * Image generator adapter backed by SillyTavern's built-in image generation
 * extension. Returns isAvailable() = false when the extension is absent so
 * callers can skip gracefully without surfacing an error to the user.
 *
 * @augments IImageGenerator
 */
export class SillyTavernImageGenerator extends IImageGenerator {
    /**
     * Construct with SillyTavern context.
     *
     * @param {object} _stContext - SillyTavern context (reserved for future use)
     */
    constructor(_stContext) {
        super();
    }

    /**
     * Return true if ST's generatePicture function is present in the global scope.
     *
     * @returns {Promise<boolean>} true when image generation is available
     */
    async isAvailable() {
        return typeof globalThis.generatePicture === 'function';
    }

    /**
     * Generate a character portrait using SillyTavern's image generation extension.
     *
     * @param {string} description - character description used to build the prompt
     * @returns {Promise<Uint8Array>} PNG image bytes
     * @throws {Error} when generatePicture is not available or the call fails
     */
    async generatePortrait(description) {
        const prompt = `portrait of ${description}, character art, detailed, high quality`;
        return this._generate(prompt);
    }

    /**
     * Generate an expression sprite using SillyTavern's image generation extension.
     *
     * @param {string} description - character description used to build the prompt
     * @param {string} emotion - emotion label (e.g. 'neutral', 'happy', 'sad')
     * @returns {Promise<Uint8Array>} PNG image bytes
     * @throws {Error} when generatePicture is not available or the call fails
     */
    async generateExpression(description, emotion) {
        const prompt = `${description}, ${emotion} expression, character art, detailed`;
        return this._generate(prompt);
    }

    /**
     * Call ST's generatePicture with a prompt and return the result as bytes.
     *
     * @param {string} prompt - image generation prompt
     * @returns {Promise<Uint8Array>} image bytes
     */
    async _generate(prompt) {
        if (typeof globalThis.generatePicture !== 'function') {
            throw new Error('SillyTavernImageGenerator: generatePicture is not available');
        }
        const imageUrl = await globalThis.generatePicture(prompt, { quiet: true });
        return this._fetchImageBytes(imageUrl);
    }

    /**
     * Fetch image bytes from a URL or data URL.
     *
     * @param {string} url - URL or data URL pointing to a PNG image
     * @returns {Promise<Uint8Array>} image bytes
     */
    async _fetchImageBytes(url) {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
    }
}
