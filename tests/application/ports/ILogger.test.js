/**
 * @file Tests for ILogger port contract.
 */

import { describe, it, expect } from 'vitest';
import { ILogger } from '../../../src/application/ports/ILogger.js';

describe('ILogger (port)', () => {
    it('should throw on base class debug()', () => {
        const logger = new ILogger();
        expect(() => logger.debug('message')).toThrow('ILogger.debug must be implemented by subclass');
    });

    it('should throw on base class debug() with data', () => {
        const logger = new ILogger();
        expect(() => logger.debug('message', { data: 'test' })).toThrow('ILogger.debug must be implemented by subclass');
    });

    it('should throw on base class info()', () => {
        const logger = new ILogger();
        expect(() => logger.info('message')).toThrow('ILogger.info must be implemented by subclass');
    });

    it('should throw on base class info() with data', () => {
        const logger = new ILogger();
        expect(() => logger.info('message', { data: 'test' })).toThrow('ILogger.info must be implemented by subclass');
    });

    it('should throw on base class warn()', () => {
        const logger = new ILogger();
        expect(() => logger.warn('message')).toThrow('ILogger.warn must be implemented by subclass');
    });

    it('should throw on base class warn() with data', () => {
        const logger = new ILogger();
        expect(() => logger.warn('message', { data: 'test' })).toThrow('ILogger.warn must be implemented by subclass');
    });

    it('should throw on base class error()', () => {
        const logger = new ILogger();
        expect(() => logger.error('message')).toThrow('ILogger.error must be implemented by subclass');
    });

    it('should throw on base class error() with data', () => {
        const logger = new ILogger();
        expect(() => logger.error('message', { data: 'test' })).toThrow('ILogger.error must be implemented by subclass');
    });
});
