/**
 * @file Tests for SaveCharacterToTavern use case.
 */

import { describe, it, expect, vi } from 'vitest';
import { SaveCharacterToTavern } from '../../../src/application/use-cases/SaveCharacterToTavern.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';

/**
 * Create a mock use case with all dependencies.
 *
 * @param {object} [overrides] - override specific mocks
 * @returns {object} use case and mocks
 */
function createMocks(overrides = {}) {
    const mockFormatter = overrides.formatter || { format: vi.fn().mockReturnValue({ spec: 'chara_card_v3', spec_version: '3.0', data: { name: 'TestChar' } }) };
    const mockValidator = overrides.validator || { validate: vi.fn() };
    const mockRepository = overrides.repository || { save: vi.fn().mockResolvedValue('test-char-id') };
    const mockNotifier = overrides.notifier || { success: vi.fn(), error: vi.fn() };
    const mockLogger = overrides.logger || { info: vi.fn(), error: vi.fn() };

    const useCase = new SaveCharacterToTavern(mockFormatter, mockValidator, mockRepository, mockNotifier, mockLogger);

    return { useCase, mockFormatter, mockValidator, mockRepository, mockNotifier, mockLogger };
}

/**
 * Create a valid test character.
 *
 * @param {object} [overrides] - override specific fields
 * @returns {Character} character instance
 */
function createCharacter(overrides = {}) {
    return new Character({
        name: 'TestChar',
        description: 'A test character',
        personality: 'Friendly',
        scenario: 'A test scenario',
        first_mes: 'Hello!',
        mes_example: 'Hi there!',
        ...overrides,
    });
}

describe('SaveCharacterToTavern - construction', () => {
    it('should construct with dependencies', () => {
        const { useCase, mockFormatter, mockValidator, mockRepository, mockNotifier, mockLogger } = createMocks();

        expect(useCase).toBeDefined();
        expect(useCase.cardFormatter).toBe(mockFormatter);
        expect(useCase.cardValidator).toBe(mockValidator);
        expect(useCase.characterRepository).toBe(mockRepository);
        expect(useCase.notifier).toBe(mockNotifier);
        expect(useCase.logger).toBe(mockLogger);
    });

    it('should have execute method', () => {
        const { useCase } = createMocks();

        expect(useCase.execute).toBeDefined();
        expect(typeof useCase.execute).toBe('function');
    });
});

describe('SaveCharacterToTavern - execute', () => {
    it('should format character and save it', async () => {
        const mockCardJson = { spec: 'chara_card_v3', spec_version: '3.0', data: { name: 'TestChar' } };
        const { useCase, mockFormatter, mockRepository, mockNotifier } = createMocks({
            formatter: { format: vi.fn().mockReturnValue(mockCardJson) },
        });

        const character = createCharacter();
        const result = await useCase.execute(character);

        expect(mockFormatter.format).toHaveBeenCalledWith(character, undefined);
        expect(mockRepository.save).toHaveBeenCalledWith(mockCardJson);
        expect(mockNotifier.success).toHaveBeenCalled();
        expect(result).toBe('test-char-id');
    });

    it('should format character with lorebook and save it', async () => {
        const mockCardJson = { spec: 'chara_card_v3', spec_version: '3.0', data: { name: 'TestChar', character_book: {} } };
        const { useCase, mockFormatter, mockRepository } = createMocks({
            formatter: { format: vi.fn().mockReturnValue(mockCardJson) },
        });

        const character = createCharacter();
        const lorebook = new Lorebook({ name: 'TestLore' });
        const result = await useCase.execute(character, lorebook);

        expect(mockFormatter.format).toHaveBeenCalledWith(character, lorebook);
        expect(mockRepository.save).toHaveBeenCalledWith(mockCardJson);
        expect(result).toBe('test-char-id');
    });

    it('should handle save errors gracefully', async () => {
        const error = new Error('Network error');
        const { useCase, mockLogger, mockNotifier } = createMocks({
            repository: { save: vi.fn().mockRejectedValue(error) },
        });

        await expect(useCase.execute(createCharacter())).rejects.toThrow('Network error');
        expect(mockLogger.error).toHaveBeenCalled();
        expect(mockNotifier.error).toHaveBeenCalled();
    });
});

describe('SaveCharacterToTavern - validation', () => {
    it('should call validator with the formatted card JSON', async () => {
        const mockCardJson = { spec: 'chara_card_v3', spec_version: '3.0', data: { name: 'TestChar' } };
        const mockValidator = { validate: vi.fn() };
        const { useCase } = createMocks({
            formatter: { format: vi.fn().mockReturnValue(mockCardJson) },
            validator: mockValidator,
        });

        await useCase.execute(createCharacter());

        expect(mockValidator.validate).toHaveBeenCalledWith(mockCardJson);
    });

    it('should call validator before saving to the repository', async () => {
        const callOrder = [];
        const mockValidator = { validate: vi.fn(() => callOrder.push('validate')) };
        const mockRepository = { save: vi.fn(() => { callOrder.push('save'); return Promise.resolve('id'); }) };
        const { useCase } = createMocks({ validator: mockValidator, repository: mockRepository });

        await useCase.execute(createCharacter());

        expect(callOrder).toEqual(['validate', 'save']);
    });

    it('should not save if validation throws', async () => {
        const validationError = new Error('Card failed V3 spec validation:\n  - spec must be "chara_card_v3"');
        const mockRepository = { save: vi.fn() };
        const { useCase } = createMocks({
            validator: { validate: vi.fn().mockImplementation(() => { throw validationError; }) },
            repository: mockRepository,
        });

        await expect(useCase.execute(createCharacter())).rejects.toThrow('Card failed V3 spec validation');
        expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should notify error and rethrow when validation fails', async () => {
        const validationError = new Error('Card failed V3 spec validation:\n  - spec must be "chara_card_v3"');
        const { useCase, mockNotifier } = createMocks({
            validator: { validate: vi.fn().mockImplementation(() => { throw validationError; }) },
        });

        await expect(useCase.execute(createCharacter())).rejects.toThrow();
        expect(mockNotifier.error).toHaveBeenCalledWith(expect.stringContaining('Card failed V3 spec validation'));
    });
});
