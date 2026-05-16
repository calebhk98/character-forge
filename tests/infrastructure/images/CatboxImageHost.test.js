/**
 * @file Tests for CatboxImageHost adapter.
 */

import { describe, it, expect, vi } from 'vitest';
import { CatboxImageHost } from '../../../src/infrastructure/images/CatboxImageHost.js';

describe('CatboxImageHost', () => {
    it('should implement IImageHost', () => {
        const host = new CatboxImageHost();
        expect(typeof host.upload).toBe('function');
        expect(typeof host.isConfigured).toBe('boolean' === typeof host.isConfigured() ? 'function' : 'function');
    });

    it('isConfigured() should return true (no key required)', () => {
        const host = new CatboxImageHost();
        expect(host.isConfigured()).toBe(true);
    });

    it('should upload a blob and return the catbox URL', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('https://files.catbox.moe/abc123.png'),
        });
        const host = new CatboxImageHost(mockFetch);
        const blob = new Blob(['image-data'], { type: 'image/png' });

        const url = await host.upload(blob);

        expect(url).toBe('https://files.catbox.moe/abc123.png');
        expect(mockFetch).toHaveBeenCalledOnce();
        const [fetchUrl, fetchOpts] = mockFetch.mock.calls[0];
        expect(fetchUrl).toBe('https://catbox.moe/user/api.php');
        expect(fetchOpts.method).toBe('POST');
    });

    it('should include reqtype=fileupload in the form data', async () => {
        const capturedBody = { formData: null };
        const mockFetch = vi.fn().mockImplementation((_url, opts) => {
            capturedBody.formData = opts.body;
            return Promise.resolve({
                ok: true,
                text: () => Promise.resolve('https://files.catbox.moe/xyz.png'),
            });
        });
        const host = new CatboxImageHost(mockFetch);
        const blob = new Blob(['data'], { type: 'image/png' });

        await host.upload(blob);

        expect(capturedBody.formData.get('reqtype')).toBe('fileupload');
        // FormData wraps a plain Blob in a File; verify the entry exists and is a Blob subtype
        const uploaded = capturedBody.formData.get('fileToUpload');
        expect(uploaded).toBeInstanceOf(Blob);
    });

    it('should throw when the HTTP response is not ok', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: () => Promise.resolve('Server Error'),
        });
        const host = new CatboxImageHost(mockFetch);
        const blob = new Blob(['data'], { type: 'image/png' });

        await expect(host.upload(blob)).rejects.toThrow('Catbox upload failed');
    });

    it('should throw when fetch rejects (network error)', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('Network failure'));
        const host = new CatboxImageHost(mockFetch);
        const blob = new Blob(['data'], { type: 'image/png' });

        await expect(host.upload(blob)).rejects.toThrow('Network failure');
    });
});
