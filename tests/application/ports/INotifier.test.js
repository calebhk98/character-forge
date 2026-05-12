/**
 * @file Tests for INotifier port contract.
 */

import { describe, it, expect } from 'vitest';
import { INotifier } from '../../../src/application/ports/INotifier.js';

describe('INotifier (port)', () => {
    it('should throw on base class info()', () => {
        const notifier = new INotifier();
        expect(() => notifier.info('message')).toThrow('INotifier.info must be implemented by subclass');
    });

    it('should throw on base class success()', () => {
        const notifier = new INotifier();
        expect(() => notifier.success('message')).toThrow('INotifier.success must be implemented by subclass');
    });

    it('should throw on base class warning()', () => {
        const notifier = new INotifier();
        expect(() => notifier.warning('message')).toThrow('INotifier.warning must be implemented by subclass');
    });

    it('should throw on base class error()', () => {
        const notifier = new INotifier();
        expect(() => notifier.error('message')).toThrow('INotifier.error must be implemented by subclass');
    });
});
