/**
 * @file Tests for console logger adapter.
 */

import { describe, it, expect } from 'vitest';
import { ConsoleLogger } from '../../../src/infrastructure/logging/ConsoleLogger.js';
import { ILogger } from '../../../src/application/ports/ILogger.js';

describe('ConsoleLogger', () => {
    it('should construct with default prefix', () => {
        const logger = new ConsoleLogger();

        expect(logger).toBeInstanceOf(ILogger);
        expect(logger.prefix).toBe('CharacterForge');
    });

    it('should construct with custom prefix', () => {
        const logger = new ConsoleLogger('TestLogger');

        expect(logger.prefix).toBe('TestLogger');
    });

    it('should be instance of ILogger', () => {
        const logger = new ConsoleLogger();

        expect(logger).toBeInstanceOf(ILogger);
    });

    it('should throw on debug call', () => {
        const logger = new ConsoleLogger();

        expect(() => logger.debug('test message')).toThrow('ConsoleLogger.debug not implemented');
    });

    it('should throw on info call', () => {
        const logger = new ConsoleLogger();

        expect(() => logger.info('test message')).toThrow('ConsoleLogger.info not implemented');
    });

    it('should throw on warn call', () => {
        const logger = new ConsoleLogger();

        expect(() => logger.warn('test message')).toThrow('ConsoleLogger.warn not implemented');
    });

    it('should throw on error call', () => {
        const logger = new ConsoleLogger();

        expect(() => logger.error('test message')).toThrow('ConsoleLogger.error not implemented');
    });

    it('should accept optional data parameter in debug', () => {
        const logger = new ConsoleLogger();

        expect(() => logger.debug('test message', { key: 'value' })).toThrow();
    });

    it('should accept optional data parameter in info', () => {
        const logger = new ConsoleLogger();

        expect(() => logger.info('test message', { key: 'value' })).toThrow();
    });

    it('should accept optional data parameter in warn', () => {
        const logger = new ConsoleLogger();

        expect(() => logger.warn('test message', { key: 'value' })).toThrow();
    });

    it('should accept optional data parameter in error', () => {
        const logger = new ConsoleLogger();

        expect(() => logger.error('test message', { key: 'value' })).toThrow();
    });
});
