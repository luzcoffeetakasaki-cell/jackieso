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
                <h1 id="popup-header" style="color: #ff0000; margin-bottom: 10px;">GAME OVER</h1>
                <p id="popup-reason" style="margin: 0; font-weight: bold; color: #ff00ff;"></p>
                <div id="popup-score" style="font-size: 32px; margin: 15px 0; font-weight: bold; color: #fff;">SCORE: 0m</div>
                <input type="text" id="player-name" placeholder="YOUR NAME" maxlength="10">
                <button id="submit-name">スコアを送信する！</button>
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

    public showNamePrompt(reason: string, score: number): Promise<string | null> {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            const reasonEl = this.overlay.querySelector('#popup-reason') as HTMLParagraphElement;
            const scoreEl = this.overlay.querySelector('#popup-score') as HTMLDivElement;
            reasonEl.textContent = reason;
            scoreEl.textContent = `SCORE: ${score}m`;
            this.overlay.classList.remove('hidden');
            const savedName = localStorage.getItem('player-name') || "ゲスト";
            this.input.value = savedName;
            setTimeout(() => this.input.focus(), 100);
        });
    }

    public showRankingBoard(rankings: any[]): Promise<'retry' | 'title'> {
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
                    <div class="ranking-actions">
                        <button class="retry-button">AGAIN!</button>
                        <button class="back-button">TITLE</button>
                    </div>
                </div>
            `;

            document.body.appendChild(rankingOverlay);

            const retryBtn = rankingOverlay.querySelector('.retry-button') as HTMLButtonElement;
            const backBtn = rankingOverlay.querySelector('.back-button') as HTMLButtonElement;

            retryBtn.onclick = () => {
                document.body.removeChild(rankingOverlay);
                resolve('retry');
            };

            backBtn.onclick = () => {
                document.body.removeChild(rankingOverlay);
                resolve('title');
            };
        });
    }

    public showPostGameChoice(score: number): Promise<'retry' | 'title'> {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'ranking-overlay'; // Reuse ranking style for consistency

            overlay.innerHTML = `
                <div class="ranking-content">
                    <h1 style="color: #ff0000; margin-bottom: 10px;">GAME OVER</h1>
                    <div style="font-size: 48px; margin: 30px 0; font-weight: bold; color: #fff;">SCORE: ${score}m</div>
                    <div class="ranking-actions">
                        <button class="retry-button">AGAIN!</button>
                        <button class="back-button">TITLE</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const retryBtn = overlay.querySelector('.retry-button') as HTMLButtonElement;
            const backBtn = overlay.querySelector('.back-button') as HTMLButtonElement;

            retryBtn.onclick = () => {
                document.body.removeChild(overlay);
                resolve('retry');
            };

            backBtn.onclick = () => {
                document.body.removeChild(overlay);
                resolve('title');
            };
        });
    }

    private handleSubmit() {
        const name = this.input.value.trim() || null;
        this.overlay.classList.add('hidden');
        if (name) {
            localStorage.setItem('player-name', name);
        }
        if (this.resolvePromise) {
            this.resolvePromise(name);
            this.resolvePromise = null;
        }
    }
}
