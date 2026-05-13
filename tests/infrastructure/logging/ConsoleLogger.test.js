/**
 * @file Tests for console logger adapter.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsoleLogger } from '../../../src/infrastructure/logging/ConsoleLogger.js';
import { ILogger } from '../../../src/application/ports/ILogger.js';

describe('ConsoleLogger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

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

    it('should call console.debug with prefix and message', () => {
        const spyDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
        const logger = new ConsoleLogger('Test');

        logger.debug('test message');

        expect(spyDebug).toHaveBeenCalledWith('[Test] test message', undefined);
        spyDebug.mockRestore();
    });

    it('should call console.info with prefix and message', () => {
        const spyInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
        const logger = new ConsoleLogger('Test');

        logger.info('test message');

        expect(spyInfo).toHaveBeenCalledWith('[Test] test message', undefined);
        spyInfo.mockRestore();
    });
});

describe('ConsoleLogger warn and error', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call console.warn with prefix and message', () => {
        const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const logger = new ConsoleLogger('Test');

        logger.warn('test message');

        expect(spyWarn).toHaveBeenCalledWith('[Test] test message', undefined);
        spyWarn.mockRestore();
    });

    it('should call console.error with prefix and message', () => {
        const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const logger = new ConsoleLogger('Test');

        logger.error('test message');

        expect(spyError).toHaveBeenCalledWith('[Test] test message', undefined);
        spyError.mockRestore();
    });

    it('should accept optional data parameter in debug', () => {
        const spyDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
        const logger = new ConsoleLogger();
        const data = { key: 'value' };

        logger.debug('test message', data);

        expect(spyDebug).toHaveBeenCalledWith('[CharacterForge] test message', data);
        spyDebug.mockRestore();
    });

    it('should accept optional data parameter in info', () => {
        const spyInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
        const logger = new ConsoleLogger();
        const data = { key: 'value' };

        logger.info('test message', data);

        expect(spyInfo).toHaveBeenCalledWith('[CharacterForge] test message', data);
        spyInfo.mockRestore();
    });

    it('should accept optional data parameter in warn', () => {
        const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const logger = new ConsoleLogger();
        const data = { key: 'value' };

        logger.warn('test message', data);

        expect(spyWarn).toHaveBeenCalledWith('[CharacterForge] test message', data);
        spyWarn.mockRestore();
    });

    it('should accept optional data parameter in error', () => {
        const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const logger = new ConsoleLogger();
        const data = { key: 'value' };

        logger.error('test message', data);

        expect(spyError).toHaveBeenCalledWith('[CharacterForge] test message', data);
        spyError.mockRestore();
    });
});
