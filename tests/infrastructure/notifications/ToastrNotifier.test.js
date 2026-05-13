/**
 * @file Tests for Toastr notifier adapter.
 */

import { describe, it, expect } from 'vitest';
import { ToastrNotifier } from '../../../src/infrastructure/notifications/ToastrNotifier.js';
import { INotifier } from '../../../src/application/ports/INotifier.js';

describe('ToastrNotifier', () => {
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

    it('should throw on info call', () => {
        const mockContext = {};
        const notifier = new ToastrNotifier(mockContext);

        expect(() => notifier.info('test message')).toThrow('ToastrNotifier.info not implemented');
    });

    it('should throw on success call', () => {
        const mockContext = {};
        const notifier = new ToastrNotifier(mockContext);

        expect(() => notifier.success('test message')).toThrow('ToastrNotifier.success not implemented');
    });

    it('should throw on warning call', () => {
        const mockContext = {};
        const notifier = new ToastrNotifier(mockContext);

        expect(() => notifier.warning('test message')).toThrow('ToastrNotifier.warning not implemented');
    });

    it('should throw on error call', () => {
        const mockContext = {};
        const notifier = new ToastrNotifier(mockContext);

        expect(() => notifier.error('test message')).toThrow('ToastrNotifier.error not implemented');
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
