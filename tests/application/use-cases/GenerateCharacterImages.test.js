/**
 * @file Tests for GenerateCharacterImages use case.
 */

// @ts-check
import { describe, it, expect, vi } from 'vitest';
import { GenerateCharacterImages } from '../../../src/application/use-cases/GenerateCharacterImages.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';

/** Minimal placeholder PNG bytes. */
const FAKE_PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

/**
 * Build a mock image generator.
 *
 * @param {object} [opts] - options
 * @param {boolean} [opts.available] - whether the generator reports as available
 * @returns {object} mock image generator
 */
function mockImageGen({ available = true } = {}) {
    return {
        isAvailable: vi.fn().mockResolvedValue(available),
        generatePortrait: vi.fn().mockResolvedValue(FAKE_PNG),
        generateExpression: vi.fn().mockResolvedValue(FAKE_PNG),
    };
}

/**
 * Build a config store mock.
 *
 * @param {boolean} avatarEnabled - value for generateAvatarAfterSave
 * @param {boolean} spritesEnabled - value for generateSpritesAfterSave
 * @returns {object} mock config store
 */
function mockConfig(avatarEnabled = true, spritesEnabled = false) {
    return {
        get: vi.fn((key, def) => {
            if (key === 'generateAvatarAfterSave') return avatarEnabled;
            if (key === 'generateSpritesAfterSave') return spritesEnabled;
            return def;
        }),
    };
}

/**
 * Build all mocks and the use case.
 *
 * @param {object} [overrides] - override specific mocks
 * @returns {{useCase: GenerateCharacterImages, mocks: object}} use case and mocks
 */
function createMocks(overrides = {}) {
    const imageGenerator = overrides.imageGenerator ?? mockImageGen();
    const characterRepository = overrides.characterRepository ?? { save: vi.fn().mockResolvedValue('char.png') };
    const cardFormatter = overrides.cardFormatter ?? { format: vi.fn().mockReturnValue({ spec: 'chara_card_v3' }) };
    const configStore = overrides.configStore ?? mockConfig();
    const logger = overrides.logger ?? { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
    const notifier = overrides.notifier ?? { success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() };

    const useCase = new GenerateCharacterImages(
        imageGenerator, characterRepository, cardFormatter, configStore, logger, notifier,
    );

    return { useCase, mocks: { imageGenerator, characterRepository, cardFormatter, configStore, logger, notifier } };
}

/**
 * Create a valid test character.
 *
 * @returns {Character} character instance
 */
function makeCharacter() {
    return new Character({
        name: 'Alice',
        description: 'A brave knight',
        personality: 'Courageous',
        scenario: 'A fantasy world',
        first_mes: 'Greetings!',
        mes_example: 'Example dialogue.',
    });
}

describe('GenerateCharacterImages — construction', () => {
    it('should store all dependencies', () => {
        const { useCase, mocks } = createMocks();
        expect(useCase.imageGenerator).toBe(mocks.imageGenerator);
        expect(useCase.characterRepository).toBe(mocks.characterRepository);
        expect(useCase.cardFormatter).toBe(mocks.cardFormatter);
        expect(useCase.configStore).toBe(mocks.configStore);
        expect(useCase.logger).toBe(mocks.logger);
        expect(useCase.notifier).toBe(mocks.notifier);
    });

    it('should have execute method', () => {
        const { useCase } = createMocks();
        expect(typeof useCase.execute).toBe('function');
    });
});

describe('GenerateCharacterImages — avatar disabled', () => {
    it('skips all generation when avatar setting is disabled', async () => {
        const { useCase, mocks } = createMocks({ configStore: mockConfig(false, false) });
        await useCase.execute(makeCharacter(), null);
        expect(mocks.imageGenerator.isAvailable).not.toHaveBeenCalled();
    });

    it('skips generation when image generator is unavailable', async () => {
        const { useCase, mocks } = createMocks({ imageGenerator: mockImageGen({ available: false }) });
        await useCase.execute(makeCharacter(), null);
        expect(mocks.imageGenerator.generatePortrait).not.toHaveBeenCalled();
        expect(mocks.characterRepository.save).not.toHaveBeenCalled();
    });
});

describe('GenerateCharacterImages — happy path', () => {
    it('calls generatePortrait with character description', async () => {
        const { useCase, mocks } = createMocks();
        const character = makeCharacter();
        await useCase.execute(character, null);
        expect(mocks.imageGenerator.generatePortrait).toHaveBeenCalledWith(
            expect.stringContaining(character.description),
        );
    });

    it('calls characterRepository.save with card JSON and portrait bytes', async () => {
        const portrait = new Uint8Array([137, 80, 78, 71]);
        const cardJson = { spec: 'chara_card_v3' };
        const { useCase, mocks } = createMocks({
            imageGenerator: { ...mockImageGen(), generatePortrait: vi.fn().mockResolvedValue(portrait) },
            cardFormatter: { format: vi.fn().mockReturnValue(cardJson) },
        });
        await useCase.execute(makeCharacter(), null);
        expect(mocks.characterRepository.save).toHaveBeenCalledWith(cardJson, portrait);
    });

    it('formats card with lorebook before saving', async () => {
        const lorebook = new Lorebook({ name: 'Lore' });
        const { useCase, mocks } = createMocks();
        const character = makeCharacter();
        await useCase.execute(character, lorebook);
        expect(mocks.cardFormatter.format).toHaveBeenCalledWith(character, lorebook);
    });
});

describe('GenerateCharacterImages — failure handling', () => {
    it('does not throw when portrait generation fails', async () => {
        const { useCase, mocks } = createMocks({
            imageGenerator: {
                isAvailable: vi.fn().mockResolvedValue(true),
                generatePortrait: vi.fn().mockRejectedValue(new Error('Backend offline')),
                generateExpression: vi.fn().mockResolvedValue(FAKE_PNG),
            },
        });
        await expect(useCase.execute(makeCharacter(), null)).resolves.not.toThrow();
        expect(mocks.logger.warn).toHaveBeenCalled();
    });

    it('does not save when portrait generation fails', async () => {
        const { useCase, mocks } = createMocks({
            imageGenerator: {
                isAvailable: vi.fn().mockResolvedValue(true),
                generatePortrait: vi.fn().mockRejectedValue(new Error('Backend offline')),
                generateExpression: vi.fn().mockResolvedValue(FAKE_PNG),
            },
        });
        await useCase.execute(makeCharacter(), null);
        expect(mocks.characterRepository.save).not.toHaveBeenCalled();
    });
});

describe('GenerateCharacterImages — expression sprites', () => {
    it('skips expression generation when sprites setting is disabled', async () => {
        const { useCase, mocks } = createMocks();
        await useCase.execute(makeCharacter(), null);
        expect(mocks.imageGenerator.generateExpression).not.toHaveBeenCalled();
    });

    it('calls generateExpression for neutral when sprites are enabled', async () => {
        const { useCase, mocks } = createMocks({ configStore: mockConfig(true, true) });
        await useCase.execute(makeCharacter(), null);
        expect(mocks.imageGenerator.generateExpression).toHaveBeenCalledWith(
            expect.any(String), 'neutral',
        );
    });

    it('does not throw when expression generation fails', async () => {
        const { useCase, mocks } = createMocks({
            configStore: mockConfig(true, true),
            imageGenerator: {
                isAvailable: vi.fn().mockResolvedValue(true),
                generatePortrait: vi.fn().mockResolvedValue(FAKE_PNG),
                generateExpression: vi.fn().mockRejectedValue(new Error('Sprite failed')),
            },
        });
        await expect(useCase.execute(makeCharacter(), null)).resolves.not.toThrow();
        expect(mocks.logger.warn).toHaveBeenCalled();
    });
});
