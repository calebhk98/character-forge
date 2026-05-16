/**
 * @file Tests for Toastr notifier adapter.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastrNotifier } from '../../../src/infrastructure/notifications/ToastrNotifier.js';
import { INotifier } from '../../../src/application/ports/INotifier.js';

/** @returns {object} a fake jQuery-like toast element */
function makeFakeToast() {
    const textSpy = vi.fn();
    return { element: { find: vi.fn().mockReturnValue({ text: textSpy }) }, textSpy };
}

describe('ToastrNotifier - basic notifications', () => {
    beforeEach(() => {
        globalThis.window = {
            // @ts-ignore
            toastr: { info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() },
        };
    });

    afterEach(() => { delete globalThis.window; });

    it('should be an instance of INotifier with stored context', () => {
        const ctx = { name: 'test' };
        const notifier = new ToastrNotifier(ctx);
        expect(notifier).toBeInstanceOf(INotifier);
        expect(notifier.ctx).toBe(ctx);
    });

    it('should delegate info/success/warning to toastr', () => {
        const notifier = new ToastrNotifier({});
        notifier.info('i');
        notifier.success('s');
        notifier.warning('w');
        // @ts-ignore
        expect(window.toastr.info).toHaveBeenCalledWith('i');
        // @ts-ignore
        expect(window.toastr.success).toHaveBeenCalledWith('s');
        // @ts-ignore
        expect(window.toastr.warning).toHaveBeenCalledWith('w');
    });

    it('should open a sticky closeable toast on first error', () => {
        const notifier = new ToastrNotifier({});
        notifier.error('test message');
        // @ts-ignore
        expect(window.toastr.error).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(window.toastr.error).toHaveBeenCalledWith(
            'test message',
            'Character Forge',
            expect.objectContaining({ timeOut: 0, closeButton: true }),
        );
    });

    it('should open separate toasts for different messages', () => {
        const notifier = new ToastrNotifier({});
        notifier.error('alpha');
        notifier.error('beta');
        // @ts-ignore
        expect(window.toastr.error).toHaveBeenCalledTimes(2);
    });
});

describe('ToastrNotifier - toastr unavailable', () => {
    beforeEach(() => {
        // Simulate ST not yet loaded or toastr missing
        globalThis.window = {};
    });

    afterEach(() => { delete globalThis.window; });

    it('should not throw when window.toastr is undefined on info()', () => {
        const notifier = new ToastrNotifier({});
        expect(() => notifier.info('msg')).not.toThrow();
    });

    it('should not throw when window.toastr is undefined on success()', () => {
        const notifier = new ToastrNotifier({});
        expect(() => notifier.success('msg')).not.toThrow();
    });

    it('should not throw when window.toastr is undefined on warning()', () => {
        const notifier = new ToastrNotifier({});
        expect(() => notifier.warning('msg')).not.toThrow();
    });

    it('should not throw when window.toastr is undefined on error()', () => {
        const notifier = new ToastrNotifier({});
        expect(() => notifier.error('msg')).not.toThrow();
    });
});

describe('ToastrNotifier - error deduplication', () => {
    beforeEach(() => {
        globalThis.window = {
            // @ts-ignore
            toastr: { error: vi.fn() },
        };
    });

    afterEach(() => { delete globalThis.window; });

    it('should update existing toast text on duplicate instead of opening another', () => {
        const { element: fakeToast, textSpy } = makeFakeToast();
        // @ts-ignore
        window.toastr.error = vi.fn().mockReturnValue(fakeToast);

        const notifier = new ToastrNotifier({});
        notifier.error('boom');
        notifier.error('boom');
        notifier.error('boom');

        // @ts-ignore
        expect(window.toastr.error).toHaveBeenCalledTimes(1);
        expect(fakeToast.find).toHaveBeenCalledWith('.toast-message');
        expect(textSpy).toHaveBeenNthCalledWith(1, 'boom ×2');
        expect(textSpy).toHaveBeenNthCalledWith(2, 'boom ×3');
    });

    it('should reset after toast is dismissed and open a fresh one', () => {
        /** @type {Function} */
        let onHidden;
        const { element: fakeToast } = makeFakeToast();
        // @ts-ignore
        window.toastr.error = vi.fn().mockImplementation((_msg, _title, opts) => {
            onHidden = opts.onHidden;
            return fakeToast;
        });

        const notifier = new ToastrNotifier({});
        notifier.error('oops');
        onHidden();
        notifier.error('oops');

        // @ts-ignore
        expect(window.toastr.error).toHaveBeenCalledTimes(2);
    });
});
