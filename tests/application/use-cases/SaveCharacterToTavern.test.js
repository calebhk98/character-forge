/**
 * @file Tests for SaveCharacterToTavern use case.
 */

import { describe, it, expect } from 'vitest';
import { SaveCharacterToTavern } from '../../../src/application/use-cases/SaveCharacterToTavern.js';

describe('SaveCharacterToTavern', () => {
    it('should construct with dependencies', () => {
        const mockFormatter = {};
        const mockRepository = {};
        const mockNotifier = {};
        const mockLogger = {};

        const useCase = new SaveCharacterToTavern(
            mockFormatter,
            mockRepository,
            mockNotifier,
            mockLogger,
        );

        expect(useCase).toBeDefined();
        expect(useCase.cardFormatter).toBe(mockFormatter);
        expect(useCase.characterRepository).toBe(mockRepository);
        expect(useCase.notifier).toBe(mockNotifier);
        expect(useCase.logger).toBe(mockLogger);
    });

    it('should have execute method', () => {
        const mockFormatter = {};
        const mockRepository = {};
        const mockNotifier = {};
        const mockLogger = {};

        const useCase = new SaveCharacterToTavern(
            mockFormatter,
            mockRepository,
            mockNotifier,
            mockLogger,
        );

        expect(useCase.execute).toBeDefined();
        expect(typeof useCase.execute).toBe('function');
    });

    it('should throw when execute is called', async () => {
        const mockFormatter = {};
        const mockRepository = {};
        const mockNotifier = {};
        const mockLogger = {};

        const useCase = new SaveCharacterToTavern(
            mockFormatter,
            mockRepository,
            mockNotifier,
            mockLogger,
        );

        await expect(useCase.execute({}, {})).rejects.toThrow(
            'SaveCharacterToTavern.execute not implemented',
        );
    });
});
