import { Player } from '../entities/Player';
import { World } from '../world/World';
import { submitScore, getTopRankings, type RankingEntry } from './Firebase';
import { UIManager } from './UI';

export class Game {
    private ctx: CanvasRenderingContext2D;
    private player: Player;
    private world: World;
    private lastTime: number = 0;
    private isRunning: boolean = false;
    private rankings: RankingEntry[] = [];
    private showRankings: boolean = false;

    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        console.log('Game initialized');
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.player = new Player();
        this.world = new World();

        // Load initial rankings
        this.refreshRankings();
    }

    private async refreshRankings() {
        this.rankings = await getTopRankings();
    }

    public resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.player.onResize(this.canvas.width, this.canvas.height);
        this.world.onResize(this.canvas.width, this.canvas.height);
    }

    public start() {
        console.log('Game starting');
        this.isRunning = true;
        this.lastTime = performance.now();
        this.requestUpdate();
    }

    private requestUpdate() {
        if (!this.isRunning) return;
        requestAnimationFrame((time) => this.update(time));
    }

    private update(time: number) {
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        const status = this.player.update(deltaTime, this.world);
        this.world.update(deltaTime);

        if (status === 'FALL' || status === 'HIT') {
            const message = status === 'FALL' ? '落ちちゃった！' : '激突！';
            this.handleGameOver(message);
            return;
        }

        this.render();
        this.requestUpdate();
    }

    private async handleGameOver(reason: string) {
        this.isRunning = false;
        const score = Math.floor(this.world.getDistance() * 0.01);

        // Use custom UI instead of prompt
        const ui = UIManager.getInstance();
        const playerName = await ui.showNamePrompt(reason);

        if (playerName) {
            await submitScore(playerName, score);
        }

        // Refresh and show final rankings before reload
        this.rankings = await getTopRankings();
        this.showRankings = true;
        this.render();

        setTimeout(() => {
            location.reload();
        }, 5000); // Wait a bit longer to see the rankings
    }

    private render() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.world.render(this.ctx);
        this.player.render(this.ctx);

        this.renderUI();

        if (this.showRankings) {
            this.renderRankingOverlay();
        }
    }

    private renderUI() {
        const score = Math.floor(this.world.getDistance() * 0.01);
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 36px sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(`${score}m`, this.canvas.width - 20, 20);
        this.ctx.fillText(`${score}m`, this.canvas.width - 20, 20);
    }

    private renderRankingOverlay() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, w, h);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('TOP RANKING', w / 2, 80);

        this.ctx.font = '24px sans-serif';
        this.rankings.forEach((entry, i) => {
            const y = 160 + i * 40;
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${i + 1}. ${entry.name}`, w / 2 - 150, y);
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${entry.score}m`, w / 2 + 150, y);
        });
    }
}
