/**
 * @file Tests for ILorebookRepository port contract.
 */

import { describe, it, expect } from 'vitest';
import { ILorebookRepository } from '../../../src/application/ports/ILorebookRepository.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';

describe('ILorebookRepository (port)', () => {
    it('should throw on base class save()', async () => {
        const repository = new ILorebookRepository();
        const lorebook = new Lorebook({ name: 'test lorebook' });
        await expect(repository.save(lorebook)).rejects.toThrow('ILorebookRepository.save must be implemented by subclass');
    });
});
