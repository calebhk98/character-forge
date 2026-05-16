/**
 * @file Tests for LocalImageHost adapter.
 */

import { describe, it, expect, vi } from 'vitest';
import { LocalImageHost } from '../../../src/infrastructure/images/LocalImageHost.js';

describe('LocalImageHost', () => {
    it('isConfigured() returns true without any setup', () => {
        const host = new LocalImageHost();
        expect(host.isConfigured()).toBe(true);
    });

    it('upload() resolves with a base64 data URI for a PNG blob', async () => {
        const host = new LocalImageHost();
        const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });

        const url = await host.upload(blob);

        expect(typeof url).toBe('string');
        expect(url.startsWith('data:image/png;base64,')).toBe(true);
    });

    it('upload() produces a non-empty base64 payload', async () => {
        const host = new LocalImageHost();
        const blob = new Blob(['hello'], { type: 'image/jpeg' });

        const url = await host.upload(blob);

        const base64Part = url.split(',')[1];
        expect(base64Part.length).toBeGreaterThan(0);
    });

    it('upload() rejects when FileReader fires an error', async () => {
        const host = new LocalImageHost();

        const originalFileReader = globalThis.FileReader;
        const FakeFileReader = vi.fn().mockImplementation(() => ({
            readAsDataURL: vi.fn(function () {
                this.onerror();
            }),
            onload: null,
            onerror: null,
            result: null,
        }));
        globalThis.FileReader = /** @type {any} */ (FakeFileReader);

        try {
            const blob = new Blob(['data'], { type: 'image/png' });
            await expect(host.upload(blob)).rejects.toThrow('LocalImageHost: failed to read image blob');
        } finally {
            globalThis.FileReader = originalFileReader;
        }
    });
});
