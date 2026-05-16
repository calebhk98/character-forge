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

    it('should throw on base class list()', async () => {
        const repository = new ICharacterRepository();
        await expect(repository.list()).rejects.toThrow('ICharacterRepository.list must be implemented by subclass');
    });

    it('should throw on base class load()', async () => {
        const repository = new ICharacterRepository();
        await expect(repository.load('Alice.png')).rejects.toThrow('ICharacterRepository.load must be implemented by subclass');
    });
});
