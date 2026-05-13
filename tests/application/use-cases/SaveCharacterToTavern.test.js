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
    const mockFormatter = overrides.formatter || { format: vi.fn().mockReturnValue({ spec: 'chara_card_v3' }) };
    const mockRepository = overrides.repository || { save: vi.fn().mockResolvedValue('test-char-id') };
    const mockNotifier = overrides.notifier || { success: vi.fn(), error: vi.fn() };
    const mockLogger = overrides.logger || { info: vi.fn(), error: vi.fn() };

    const useCase = new SaveCharacterToTavern(mockFormatter, mockRepository, mockNotifier, mockLogger);

    return { useCase, mockFormatter, mockRepository, mockNotifier, mockLogger };
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

describe('SaveCharacterToTavern', () => {
    it('should construct with dependencies', () => {
        const { useCase, mockFormatter, mockRepository, mockNotifier, mockLogger } = createMocks();

        expect(useCase).toBeDefined();
        expect(useCase.cardFormatter).toBe(mockFormatter);
        expect(useCase.characterRepository).toBe(mockRepository);
        expect(useCase.notifier).toBe(mockNotifier);
        expect(useCase.logger).toBe(mockLogger);
    });

    it('should have execute method', () => {
        const { useCase } = createMocks();

        expect(useCase.execute).toBeDefined();
        expect(typeof useCase.execute).toBe('function');
    });

    it('should format character and save it', async () => {
        const mockCardJson = { spec: 'chara_card_v3', data: { name: 'TestChar' } };
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
        const mockCardJson = { spec: 'chara_card_v3', data: { name: 'TestChar', character_book: {} } };
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

        const character = createCharacter();

        await expect(useCase.execute(character)).rejects.toThrow('Network error');
        expect(mockLogger.error).toHaveBeenCalled();
        expect(mockNotifier.error).toHaveBeenCalled();
    });
});
