/**
 * @file Abstract port for image generation. Concrete adapters live in
 * src/infrastructure/images/. The port is intentionally thin — callers
 * must check isAvailable() before generating and treat all errors as
 * non-fatal (generation is always a background best-effort operation).
 */

/**
 * Abstract image generator. Subclass and implement all three methods.
 *
 * @abstract
 */
export class IImageGenerator {
    /**
     * Report whether a configured image-generation backend is reachable.
     * Implementations should return false (not throw) when the backend is
     * absent or offline.
     *
     * @returns {Promise<boolean>} true if generation is possible
     */
    async isAvailable() {
        throw new Error('IImageGenerator.isAvailable must be implemented by subclass');
    }

    /**
     * Generate a character portrait from a text description.
     *
     * @param {string} _description - character description used to build the prompt
     * @returns {Promise<Uint8Array>} PNG image bytes
     */
    async generatePortrait(_description) {
        throw new Error('IImageGenerator.generatePortrait must be implemented by subclass');
    }

    /**
     * Generate an expression sprite for the given emotion.
     *
     * @param {string} _description - character description used to build the prompt
     * @param {string} _emotion - emotion label (e.g. 'neutral', 'happy', 'sad')
     * @returns {Promise<Uint8Array>} PNG image bytes
     */
    async generateExpression(_description, _emotion) {
        throw new Error('IImageGenerator.generateExpression must be implemented by subclass');
    }
}
