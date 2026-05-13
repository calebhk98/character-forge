/**
 * @file Tests for Toastr notifier adapter.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastrNotifier } from '../../../src/infrastructure/notifications/ToastrNotifier.js';
import { INotifier } from '../../../src/application/ports/INotifier.js';

describe('ToastrNotifier', () => {
    beforeEach(() => {
        globalThis.window = {
            // @ts-ignore - adding toastr to window for test
            toastr: {
                info: vi.fn(),
                success: vi.fn(),
                warning: vi.fn(),
                error: vi.fn(),
            },
        };
    });

    afterEach(() => {
        delete globalThis.window;
    });

    it('should construct with context', () => {
        const mockContext = { name: 'test' };
        const notifier = new ToastrNotifier(mockContext);

        expect(notifier).toBeInstanceOf(INotifier);
        expect(notifier.ctx).toBe(mockContext);
    });

    it('should be instance of INotifier', () => {
        const mockContext = {};
        const notifier = new ToastrNotifier(mockContext);

        expect(notifier).toBeInstanceOf(INotifier);
    });

    it('should call window.toastr.info on info call', () => {
        const mockContext = {};
        const notifier = new ToastrNotifier(mockContext);

        notifier.info('test message');

        // @ts-ignore - window.toastr is mocked in beforeEach
        expect(window.toastr.info).toHaveBeenCalledWith('test message');
    });

    it('should call window.toastr.success on success call', () => {
        const mockContext = {};
        const notifier = new ToastrNotifier(mockContext);

        notifier.success('test message');

        // @ts-ignore - window.toastr is mocked in beforeEach
        expect(window.toastr.success).toHaveBeenCalledWith('test message');
    });

    it('should call window.toastr.warning on warning call', () => {
        const mockContext = {};
        const notifier = new ToastrNotifier(mockContext);

        notifier.warning('test message');

        // @ts-ignore - window.toastr is mocked in beforeEach
        expect(window.toastr.warning).toHaveBeenCalledWith('test message');
    });

    it('should call window.toastr.error on error call', () => {
        const mockContext = {};
        const notifier = new ToastrNotifier(mockContext);

        notifier.error('test message');

        // @ts-ignore - window.toastr is mocked in beforeEach
        expect(window.toastr.error).toHaveBeenCalledWith('test message');
    });

    it('should store context for use in implementation', () => {
        const mockContext = {
            name: 'test context',
            data: { key: 'value' },
        };
        const notifier = new ToastrNotifier(mockContext);

        expect(notifier.ctx).toEqual(mockContext);
        expect(notifier.ctx.name).toBe('test context');
    });
});
