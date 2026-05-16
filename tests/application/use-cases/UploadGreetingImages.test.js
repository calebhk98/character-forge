/**
 * @file Tests for UploadGreetingImages use case.
 */

import { describe, it, expect, vi } from 'vitest';
import { UploadGreetingImages } from '../../../src/application/use-cases/UploadGreetingImages.js';
import { Character } from '../../../src/domain/entities/Character.js';

/**
 * Create a mock image host.
 *
 * @param {object} [opts] - options
 * @param {boolean} [opts.configured] - whether the host reports itself configured
 * @param {boolean} [opts.shouldFail] - whether upload() should reject
 * @returns {object} mock image host
 */
function mockHost({ configured = true, shouldFail = false } = {}) {
    return {
        isConfigured: vi.fn().mockReturnValue(configured),
        upload: shouldFail
            ? vi.fn().mockRejectedValue(new Error('upload error'))
            : vi.fn().mockResolvedValue('https://files.catbox.moe/test.png'),
    };
}

/**
 * Create a mock logger.
 *
 * @returns {object} mock logger
 */
function mockLogger() {
    return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

/**
 * Create a test character.
 *
 * @param {object} [overrides] - property overrides for the Character constructor
 * @returns {Character} test character instance
 */
function makeCharacter(overrides = {}) {
    return new Character({
        name: 'Aria',
        description: 'A test character',
        personality: 'Kind',
        scenario: 'In a park',
        first_mes: 'Hello there.',
        mes_example: 'Hi!',
        ...overrides,
    });
}

describe('UploadGreetingImages', () => {
    it('constructs with dependencies', () => {
        const useCase = new UploadGreetingImages(mockHost(), mockLogger());
        expect(useCase).toBeDefined();
    });

    it('returns the character unchanged when no images are provided', async () => {
        const useCase = new UploadGreetingImages(mockHost(), mockLogger());
        const character = makeCharacter();

        const result = await useCase.execute(character, []);

        expect(result.first_mes).toBe('Hello there.');
    });

    it('prepends uploaded URL to first_mes when targetField is first_mes', async () => {
        const host = mockHost();
        const useCase = new UploadGreetingImages(host, mockLogger());
        const character = makeCharacter();
        const blob = new Blob(['img'], { type: 'image/png' });

        const result = await useCase.execute(character, [
            { label: 'Greeting', blob, targetField: 'first_mes' },
        ]);

        expect(result.first_mes).toBe('![](https://files.catbox.moe/test.png)\n\nHello there.');
        expect(host.upload).toHaveBeenCalledWith(blob);
    });

    it('handles upload failure per-image without aborting others', async () => {
        let callCount = 0;
        const host = {
            isConfigured: vi.fn().mockReturnValue(true),
            upload: vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.reject(new Error('upload error'));
                }
                return Promise.resolve('https://files.catbox.moe/second.png');
            }),
        };
        const logger = mockLogger();
        const useCase = new UploadGreetingImages(host, logger);
        const character = makeCharacter();
        const blob = new Blob(['img'], { type: 'image/png' });

        const result = await useCase.execute(character, [
            { label: 'First', blob, targetField: 'first_mes' },
            { label: 'First (retry)', blob, targetField: 'first_mes' },
        ]);

        expect(logger.error).toHaveBeenCalledOnce();
        expect(result.first_mes).toContain('https://files.catbox.moe/second.png');
    });

    it('returns character unchanged when imageHost is not configured', async () => {
        const host = mockHost({ configured: false });
        const logger = mockLogger();
        const useCase = new UploadGreetingImages(host, logger);
        const character = makeCharacter();
        const blob = new Blob(['img'], { type: 'image/png' });

        const result = await useCase.execute(character, [
            { label: 'Greeting', blob, targetField: 'first_mes' },
        ]);

        expect(host.upload).not.toHaveBeenCalled();
        expect(result.first_mes).toBe('Hello there.');
        expect(logger.warn).toHaveBeenCalled();
    });

    it('only uploads approved images (those passed in the items array)', async () => {
        const host = mockHost();
        const useCase = new UploadGreetingImages(host, mockLogger());
        const character = makeCharacter();
        const blob = new Blob(['img'], { type: 'image/png' });

        await useCase.execute(character, [
            { label: 'Approved', blob, targetField: 'first_mes' },
        ]);

        expect(host.upload).toHaveBeenCalledOnce();
    });
});
