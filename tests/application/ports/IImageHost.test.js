/**
 * @file Tests for IImageHost port contract.
 */

import { describe, it, expect } from 'vitest';
import { IImageHost } from '../../../src/application/ports/IImageHost.js';

describe('IImageHost (port)', () => {
    it('should throw on base class upload()', async () => {
        const host = new IImageHost();
        await expect(host.upload(new Blob())).rejects.toThrow('IImageHost.upload must be implemented by subclass');
    });

    it('should throw on base class isConfigured()', () => {
        const host = new IImageHost();
        expect(() => host.isConfigured()).toThrow('IImageHost.isConfigured must be implemented by subclass');
    });
});
