export class UIManager {
    private static instance: UIManager;
    private overlay: HTMLDivElement;
    private input: HTMLInputElement;
    private submitBtn: HTMLButtonElement;
    private resolvePromise: ((name: string | null) => void) | null = null;

    private constructor() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'popup-overlay hidden';
        this.overlay.innerHTML = `
            <div class="popup-content">
                <h2>RANKING REGISTRATION</h2>
                <input type="text" id="player-name" placeholder="YOUR NAME" maxlength="10">
                <button id="submit-name">GO!!!</button>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.input = this.overlay.querySelector('#player-name') as HTMLInputElement;
        this.submitBtn = this.overlay.querySelector('#submit-name') as HTMLButtonElement;

        this.submitBtn.onclick = () => this.handleSubmit();
        this.input.onkeydown = (e) => {
            if (e.key === 'Enter') this.handleSubmit();
        };
    }

    public static getInstance(): UIManager {
        if (!UIManager.instance) {
            UIManager.instance = new UIManager();
        }
        return UIManager.instance;
    }

    public showNamePrompt(): Promise<string | null> {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            this.overlay.classList.remove('hidden');
            this.input.value = "おじさん";
            setTimeout(() => this.input.focus(), 100);
        });
    }

    private handleSubmit() {
        const name = this.input.value.trim() || null;
        this.overlay.classList.add('hidden');
        if (this.resolvePromise) {
            this.resolvePromise(name);
            this.resolvePromise = null;
        }
    }
}
