/**
 * @file Tests for MockImageHost adapter.
 */

import { describe, it, expect } from 'vitest';
import { MockImageHost } from '../../../src/infrastructure/images/MockImageHost.js';

describe('MockImageHost', () => {
    it('isConfigured() returns true by default', () => {
        const host = new MockImageHost();
        expect(host.isConfigured()).toBe(true);
    });

    it('isConfigured() returns false when configured as unconfigured', () => {
        const host = new MockImageHost({ configured: false });
        expect(host.isConfigured()).toBe(false);
    });

    it('upload() returns a deterministic fake URL', async () => {
        const host = new MockImageHost();
        const blob = new Blob(['data'], { type: 'image/png' });

        const url = await host.upload(blob);

        expect(typeof url).toBe('string');
        expect(url).toMatch(/^https:\/\//);
    });

    it('upload() throws when configured to fail', async () => {
        const host = new MockImageHost({ shouldFail: true });
        const blob = new Blob(['data'], { type: 'image/png' });

        await expect(host.upload(blob)).rejects.toThrow('MockImageHost: upload failed');
    });

    it('upload() records calls for test assertions', async () => {
        const host = new MockImageHost();
        const blob = new Blob(['data'], { type: 'image/png' });

        await host.upload(blob);
        await host.upload(blob);

        expect(host.uploadCalls).toHaveLength(2);
        expect(host.uploadCalls[0]).toBe(blob);
    });
});
