/**
 * @file Tests for ICharacterRepository port contract.
 */

import { describe, it, expect } from 'vitest';
import { ICharacterRepository } from '../../../src/application/ports/ICharacterRepository.js';

describe('ICharacterRepository (port)', () => {
    it('should throw on base class save()', async () => {
        const repository = new ICharacterRepository();
        const cardJson = { spec: 'chara_card_v3', data: {} };
        await expect(repository.save(cardJson)).rejects.toThrow('ICharacterRepository.save must be implemented by subclass');
    });
});
