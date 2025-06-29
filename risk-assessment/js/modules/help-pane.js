/**
 * Help Pane Module
 * Handles help panel display and interactions
 */

export class HelpPane {
    constructor(domElements) {
        this.dom = domElements;
    }

    /**
     * Open help pane
     */
    openHelpPane() {
        this.dom.helpPane.classList.remove('hidden');
        this.dom.helpPane.classList.add('slide-in-right');
    }

    /**
     * Close help pane
     */
    closeHelpPane() {
        this.dom.helpPane.classList.add('slide-out-right');
        
        setTimeout(() => {
            this.dom.helpPane.classList.add('hidden');
            this.dom.helpPane.classList.remove('slide-in-right', 'slide-out-right');
        }, 300);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Help icon button
        this.dom.helpIconBtn.addEventListener('click', () => {
            this.openHelpPane();
        });

        // Close button
        this.dom.closeHelpPaneBtn.addEventListener('click', () => {
            this.closeHelpPane();
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.dom.helpPane.classList.contains('hidden')) {
                this.closeHelpPane();
            }
        });

        // Close on backdrop click
        this.dom.helpPane.addEventListener('click', (e) => {
            if (e.target === this.dom.helpPane) {
                this.closeHelpPane();
            }
        });
    }
}
