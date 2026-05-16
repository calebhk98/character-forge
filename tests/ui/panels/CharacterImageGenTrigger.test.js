/**
 * @file Tests for CharacterImageGenTrigger helper that fires background
 * image generation after a character card is saved.
 */

import { describe, it, expect, vi } from 'vitest';
import { startImageGeneration } from '../../../src/ui/panels/CharacterImageGenTrigger.js';

/**
 * Build a minimal container with generateCharacterImages and notifier fakes.
 *
 * @param {object} [overrides] - optional property overrides
 * @returns {object} fake container
 */
function makeContainer(overrides = {}) {
    return {
        generateCharacterImages: {
            execute: vi.fn().mockResolvedValue(undefined),
        },
        notifier: {
            info: vi.fn(),
            error: vi.fn(),
            success: vi.fn(),
        },
        ...overrides,
    };
}

/**
 * Build a minimal saved character object.
 *
 * @returns {object} fake character
 */
function makeCharacter() {
    return { name: 'Aria', description: 'A test character.' };
}

describe('startImageGeneration - guard clauses', () => {
    it('returns immediately when container is null', () => {
        // Should not throw
        startImageGeneration(null, makeCharacter(), null);
    });

    it('returns immediately when container is undefined', () => {
        startImageGeneration(undefined, makeCharacter(), null);
    });

    it('returns immediately when container lacks generateCharacterImages', () => {
        const container = makeContainer();
        delete container.generateCharacterImages;

        startImageGeneration(container, makeCharacter(), null);

        expect(container.notifier.info).not.toHaveBeenCalled();
    });

    it('returns immediately when character is null', () => {
        const container = makeContainer();

        startImageGeneration(container, null, null);

        expect(container.notifier.info).not.toHaveBeenCalled();
        expect(container.generateCharacterImages.execute).not.toHaveBeenCalled();
    });

    it('returns immediately when character is undefined', () => {
        const container = makeContainer();

        startImageGeneration(container, undefined, null);

        expect(container.notifier.info).not.toHaveBeenCalled();
        expect(container.generateCharacterImages.execute).not.toHaveBeenCalled();
    });

    it('returns immediately when character is an empty string (falsy)', () => {
        const container = makeContainer();

        startImageGeneration(container, '', null);

        expect(container.notifier.info).not.toHaveBeenCalled();
        expect(container.generateCharacterImages.execute).not.toHaveBeenCalled();
    });
});

describe('startImageGeneration - happy path', () => {
    it('fires an info notification when generation starts', () => {
        const container = makeContainer();

        startImageGeneration(container, makeCharacter(), null);

        expect(container.notifier.info).toHaveBeenCalledOnce();
    });

    it('calls generateCharacterImages.execute with the character', () => {
        const container = makeContainer();
        const character = makeCharacter();

        startImageGeneration(container, character, null);

        expect(container.generateCharacterImages.execute).toHaveBeenCalledWith(character, null);
    });

    it('passes the lorebook to generateCharacterImages.execute', () => {
        const container = makeContainer();
        const character = makeCharacter();
        const lorebook = { name: 'Aria Lore', entries: [] };

        startImageGeneration(container, character, lorebook);

        expect(container.generateCharacterImages.execute).toHaveBeenCalledWith(character, lorebook);
    });

    it('does not await – returns synchronously without blocking', () => {
        const container = makeContainer();
        let resolveExecute;
        container.generateCharacterImages.execute = vi.fn().mockReturnValue(
            new Promise((resolve) => { resolveExecute = resolve; }),
        );

        // startImageGeneration should return before the promise settles
        const result = startImageGeneration(container, makeCharacter(), null);

        expect(result).toBeUndefined();
        // Settle the outstanding promise to avoid unhandled rejection noise
        resolveExecute(undefined);
    });
});

describe('startImageGeneration - error absorption', () => {
    it('does not propagate errors thrown by execute', async () => {
        const container = makeContainer();
        container.generateCharacterImages.execute = vi.fn().mockRejectedValue(
            new Error('image gen failed'),
        );

        // Should not throw synchronously
        expect(() => startImageGeneration(container, makeCharacter(), null)).not.toThrow();

        // Allow the rejected promise to settle; the .catch() inside should absorb it
        await vi.waitFor(() =>
            expect(container.generateCharacterImages.execute).toHaveBeenCalled(),
        );
    });

    it('still sends the info notification even when execute later rejects', async () => {
        const container = makeContainer();
        container.generateCharacterImages.execute = vi.fn().mockRejectedValue(
            new Error('network error'),
        );

        startImageGeneration(container, makeCharacter(), null);

        expect(container.notifier.info).toHaveBeenCalledOnce();

        // Let the rejection settle without leaking an unhandled rejection
        await vi.waitFor(() =>
            expect(container.generateCharacterImages.execute).toHaveBeenCalled(),
        );
    });

    it('does not call notifier.error when execute rejects', async () => {
        const container = makeContainer();
        container.generateCharacterImages.execute = vi.fn().mockRejectedValue(
            new Error('silent failure'),
        );

        startImageGeneration(container, makeCharacter(), null);

        await vi.waitFor(() =>
            expect(container.generateCharacterImages.execute).toHaveBeenCalled(),
        );

        expect(container.notifier.error).not.toHaveBeenCalled();
    });
});

describe('startImageGeneration - container without notifier', () => {
    it('does not throw when container has no notifier property', () => {
        const container = makeContainer();
        delete container.notifier;

        // Optional chaining on container?.notifier?.info means this should not throw
        expect(() => startImageGeneration(container, makeCharacter(), null)).not.toThrow();
    });

    it('still calls execute even when notifier is absent', () => {
        const container = makeContainer();
        delete container.notifier;

        startImageGeneration(container, makeCharacter(), null);

        expect(container.generateCharacterImages.execute).toHaveBeenCalledOnce();
    });
});
