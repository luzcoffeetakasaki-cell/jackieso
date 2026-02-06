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
                <h2 id="popup-title">RANKING REGISTRATION</h2>
                <p id="popup-message" style="margin: 0; font-weight: bold; color: #ff00ff;"></p>
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

    public showNamePrompt(message: string): Promise<string | null> {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            const messageEl = this.overlay.querySelector('#popup-message') as HTMLParagraphElement;
            messageEl.textContent = message;
            this.overlay.classList.remove('hidden');
            this.input.value = "おじさん";
            setTimeout(() => this.input.focus(), 100);
        });
    }

    public showRankingBoard(rankings: any[]): Promise<void> {
        return new Promise((resolve) => {
            const rankingOverlay = document.createElement('div');
            rankingOverlay.className = 'ranking-overlay';

            const listHtml = rankings.map((entry, i) => `
                <div class="ranking-item">
                    <span class="rank">${i + 1}</span>
                    <span class="name">${entry.name}</span>
                    <span class="score">${entry.score}m</span>
                </div>
            `).join('');

            rankingOverlay.innerHTML = `
                <div class="ranking-content">
                    <h2>TOP RANKING</h2>
                    <div class="ranking-list">
                        ${listHtml}
                    </div>
                    <button class="back-button">BACK TO TITLE</button>
                </div>
            `;

            document.body.appendChild(rankingOverlay);

            const backBtn = rankingOverlay.querySelector('.back-button') as HTMLButtonElement;
            backBtn.onclick = () => {
                document.body.removeChild(rankingOverlay);
                resolve();
            };
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
