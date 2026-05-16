/**
 * @file Image approval panel UI. Shows generated image thumbnails with checkboxes
 * so the user can approve which ones get uploaded before they are sent to the
 * hosting service.
 */

/**
 * @typedef {object} ImageItem
 * @property {string} label - display label for the thumbnail
 * @property {Blob} blob - image data
 * @property {string} targetField - character field this image will be prepended to
 * @property {string} [previewUrl] - object URL for thumbnail preview
 */

/**
 * Approval panel that lets users select which generated images to upload.
 */
export class ImageApprovalPanel {
    /**
     * Construct with the application container.
     *
     * @param {object} container - application container with wired services
     */
    constructor(container) {
        this.container = container;
        this.element = null;
    }

    /**
     * Render the approval panel into a target element.
     *
     * @param {HTMLElement} target - element to render into
     * @param {object} character - current character (returned unchanged on skip)
     * @param {ImageItem[]} items - generated images awaiting approval
     * @param {Function} onComplete - callback receiving the (possibly updated) character
     */
    render(target, character, items, onComplete) {
        this.element = document.createElement('div');
        this.element.className = 'image-approval-panel';
        this.element.innerHTML = this._buildHtml(items);
        target.appendChild(this.element);
        this._attachListeners(character, items, onComplete);
    }

    /**
     * Build the panel HTML.
     *
     * @param {ImageItem[]} items - image items to display
     * @returns {string} HTML string
     */
    _buildHtml(items) {
        const thumbsHtml = items.map((item, i) => this._buildThumbnailHtml(item, i)).join('');
        return `
            <div class="image-approval-header">
                <h3>Review Generated Images</h3>
                <p>Select which images to upload. Unchecked images will be discarded.</p>
            </div>
            <div class="image-approval-grid">${thumbsHtml}</div>
            <div class="image-approval-actions">
                <button id="upload-selected-button" class="btn btn-primary">Upload selected</button>
                <button id="skip-upload-button" class="btn btn-secondary">Skip</button>
            </div>
        `;
    }

    /**
     * Build HTML for a single thumbnail with checkbox and label.
     *
     * @param {ImageItem} item - image item
     * @param {number} index - item index used for element IDs
     * @returns {string} HTML string
     */
    _buildThumbnailHtml(item, index) {
        const src = item.previewUrl ? ` src="${item.previewUrl}"` : '';
        return `
            <div class="image-approval-thumbnail" data-index="${index}">
                <label>
                    <input type="checkbox" class="approval-checkbox" data-index="${index}" checked />
                    <img${src} alt="${item.label}" class="thumbnail-img" />
                    <span class="thumbnail-label">${item.label}</span>
                </label>
            </div>
        `;
    }

    /**
     * Attach click handlers for Upload and Skip buttons.
     *
     * @param {object} character - original character
     * @param {ImageItem[]} items - all image items
     * @param {Function} onComplete - completion callback
     */
    _attachListeners(character, items, onComplete) {
        const skipBtn = this.element.querySelector('#skip-upload-button');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => onComplete(character));
        }

        const uploadBtn = this.element.querySelector('#upload-selected-button');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this._onUploadClick(character, items, onComplete));
        }
    }

    /**
     * Collect checked items and invoke the upload use case.
     *
     * @param {object} character - original character
     * @param {ImageItem[]} items - all image items
     * @param {Function} onComplete - completion callback
     * @returns {Promise<void>}
     */
    async _onUploadClick(character, items, onComplete) {
        const checkboxes = this.element.querySelectorAll('.approval-checkbox');
        const approvedItems = items.filter((_item, i) => checkboxes[i]?.checked);

        try {
            const updated = await this.container.uploadGreetingImages.execute(character, approvedItems);
            onComplete(updated);
        } catch (error) {
            this.container.logger.error('Upload step failed', { error: error.message });
            this.container.notifier.error(`Image upload failed: ${error.message}`);
            onComplete(character);
        }
    }
}
