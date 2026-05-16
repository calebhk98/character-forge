/**
 * @file Tests for ImageApprovalPanel UI component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageApprovalPanel } from '../../../src/ui/panels/ImageApprovalPanel.js';

/**
 * Create a mock container with required services.
 *
 * @param {object} [overrides] - service overrides
 * @returns {object} mock container
 */
function mockContainer(overrides = {}) {
    return {
        uploadGreetingImages: {
            execute: vi.fn().mockResolvedValue({
                name: 'Aria',
                first_mes: '![](https://files.catbox.moe/test.png)\n\nHello there.',
            }),
        },
        notifier: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
        ...overrides,
    };
}

/**
 * Create a test image item.
 *
 * @param {string} [label] - display label for the thumbnail
 * @param {string} [field] - target character field name
 * @returns {object} image item
 */
function makeItem(label = 'Avatar', field = 'first_mes') {
    return {
        label,
        blob: new Blob(['img'], { type: 'image/png' }),
        targetField: field,
        previewUrl: 'blob:http://localhost/fake-uuid',
    };
}

describe('ImageApprovalPanel - rendering', () => {
    let container;
    let character;

    beforeEach(() => {
        container = mockContainer();
        character = { name: 'Aria', first_mes: 'Hello there.' };
        document.body.innerHTML = '<div id="target"></div>';
    });

    it('renders a thumbnail for each image item', () => {
        const panel = new ImageApprovalPanel(container);
        const target = document.getElementById('target');
        const items = [makeItem('Avatar'), makeItem('Greeting 1', 'first_mes')];

        panel.render(target, character, items, vi.fn());

        const thumbs = target.querySelectorAll('.image-approval-thumbnail');
        expect(thumbs).toHaveLength(2);
    });

    it('renders a checkbox for each thumbnail', () => {
        const panel = new ImageApprovalPanel(container);
        const target = document.getElementById('target');

        panel.render(target, character, [makeItem()], vi.fn());

        const checkboxes = target.querySelectorAll('input[type="checkbox"]');
        expect(checkboxes.length).toBeGreaterThanOrEqual(1);
    });

    it('renders the label for each image item', () => {
        const panel = new ImageApprovalPanel(container);
        const target = document.getElementById('target');

        panel.render(target, character, [makeItem('My Label')], vi.fn());

        expect(target.textContent).toContain('My Label');
    });

    it('renders an Upload Selected button', () => {
        const panel = new ImageApprovalPanel(container);
        const target = document.getElementById('target');

        panel.render(target, character, [makeItem()], vi.fn());

        const btn = target.querySelector('#upload-selected-button');
        expect(btn).not.toBeNull();
    });

    it('renders a Skip button', () => {
        const panel = new ImageApprovalPanel(container);
        const target = document.getElementById('target');

        panel.render(target, character, [makeItem()], vi.fn());

        const btn = target.querySelector('#skip-upload-button');
        expect(btn).not.toBeNull();
    });
});

describe('ImageApprovalPanel - interactions', () => {
    let container;
    let character;

    beforeEach(() => {
        container = mockContainer();
        character = { name: 'Aria', first_mes: 'Hello there.' };
        document.body.innerHTML = '<div id="target"></div>';
    });

    it('calls onComplete with the original character when Skip is clicked', () => {
        const panel = new ImageApprovalPanel(container);
        const target = document.getElementById('target');
        const onComplete = vi.fn();

        panel.render(target, character, [makeItem()], onComplete);

        target.querySelector('#skip-upload-button').click();

        expect(onComplete).toHaveBeenCalledWith(character);
    });

    it('uploads only checked images when Upload Selected is clicked', async () => {
        const panel = new ImageApprovalPanel(container);
        const target = document.getElementById('target');
        const onComplete = vi.fn();
        const items = [makeItem('Avatar'), makeItem('Greeting 1')];

        panel.render(target, character, items, onComplete);

        const checkboxes = target.querySelectorAll('input[type="checkbox"]');
        checkboxes[1].checked = false;

        target.querySelector('#upload-selected-button').click();

        await vi.waitFor(() => expect(onComplete).toHaveBeenCalled());
        const approvedItems = container.uploadGreetingImages.execute.mock.calls[0][1];
        expect(approvedItems).toHaveLength(1);
        expect(approvedItems[0].label).toBe('Avatar');
    });

    it('calls onComplete with updated character after upload', async () => {
        const updatedCharacter = { name: 'Aria', first_mes: '![](url)\n\nHello.' };
        container.uploadGreetingImages.execute = vi.fn().mockResolvedValue(updatedCharacter);
        const panel = new ImageApprovalPanel(container);
        const target = document.getElementById('target');
        const onComplete = vi.fn();

        panel.render(target, character, [makeItem()], onComplete);

        target.querySelector('#upload-selected-button').click();

        await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(updatedCharacter));
    });

    it('notifies on upload error and still calls onComplete with original character', async () => {
        container.uploadGreetingImages.execute = vi.fn().mockRejectedValue(new Error('fail'));
        const panel = new ImageApprovalPanel(container);
        const target = document.getElementById('target');
        const onComplete = vi.fn();

        panel.render(target, character, [makeItem()], onComplete);

        target.querySelector('#upload-selected-button').click();

        await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(character));
        expect(container.notifier.error).toHaveBeenCalled();
    });
});
