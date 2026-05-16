/**
 * @file Tests for ConfigurableImageHost adapter.
 */

import { describe, it, expect, vi } from 'vitest';
import { ConfigurableImageHost } from '../../../src/infrastructure/images/ConfigurableImageHost.js';

/**
 * Create a mock config store.
 *
 * @param {object} values - key/value config entries to return
 * @returns {object} mock config store
 */
function mockConfig(values = {}) {
    return { get: vi.fn((key) => values[key]) };
}

/**
 * Create a mock delegate host.
 *
 * @param {string} url - URL to return from upload
 * @returns {object} mock image host
 */
function mockDelegate(url = 'https://example.com/img.png') {
    return {
        upload: vi.fn().mockResolvedValue(url),
        isConfigured: vi.fn().mockReturnValue(true),
    };
}

describe('ConfigurableImageHost', () => {
    it('delegates upload() to the active host', async () => {
        const delegate = mockDelegate('https://files.catbox.moe/abc.png');
        const host = new ConfigurableImageHost(mockConfig({ imageHostProvider: 'catbox' }), { catbox: delegate });
        const blob = new Blob(['data'], { type: 'image/png' });

        const url = await host.upload(blob);

        expect(url).toBe('https://files.catbox.moe/abc.png');
        expect(delegate.upload).toHaveBeenCalledWith(blob);
    });

    it('delegates isConfigured() to the active host', () => {
        const delegate = mockDelegate();
        delegate.isConfigured = vi.fn().mockReturnValue(false);
        const host = new ConfigurableImageHost(mockConfig({ imageHostProvider: 'catbox' }), { catbox: delegate });

        expect(host.isConfigured()).toBe(false);
        expect(delegate.isConfigured).toHaveBeenCalled();
    });

    it('defaults to catbox when no provider is configured', async () => {
        const catboxDelegate = mockDelegate('https://files.catbox.moe/def.png');
        const host = new ConfigurableImageHost(mockConfig({}), { catbox: catboxDelegate });
        const blob = new Blob(['data'], { type: 'image/png' });

        await host.upload(blob);

        expect(catboxDelegate.upload).toHaveBeenCalled();
    });

    it('throws when an unknown provider is specified', () => {
        const host = new ConfigurableImageHost(mockConfig({ imageHostProvider: 'unknown' }), {});

        expect(() => host.isConfigured()).toThrow('Unknown image host provider: unknown');
    });
});
