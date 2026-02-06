import { Player } from '../entities/Player';
import { World } from '../world/World';

export class Game {
    private ctx: CanvasRenderingContext2D;
    private player: Player;
    private world: World;
    private lastTime: number = 0;
    private isRunning: boolean = false;

    constructor(private canvas: HTMLCanvasElement) {
        console.log('Game initialized');
        this.ctx = canvas.getContext('2d')!;
        this.player = new Player();
        this.world = new World();
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
            this.gameOver(message);
            return;
        }

        this.render();
        this.requestUpdate();
    }

    private gameOver(reason: string) {
        this.isRunning = false;
        const score = Math.floor(this.world.getDistance() * 0.01);
        alert(`${reason}\nScore: ${score}m`);
        location.reload();
    }

    private render() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.world.render(this.ctx);
        this.player.render(this.ctx);

        this.renderUI();
    }

    private renderUI() {
        const score = Math.floor(this.world.getDistance() * 0.01);
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 36px sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';

        // Outline for visibility
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(`${score}m`, this.canvas.width - 20, 20);
        this.ctx.fillText(`${score}m`, this.canvas.width - 20, 20);
    }
}
