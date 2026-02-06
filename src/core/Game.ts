import { Player } from '../entities/Player';
import { World } from '../world/World';
import { submitScore } from './Firebase';
import { UIManager } from './UI';

export class Game {
    private ctx: CanvasRenderingContext2D;
    private player: Player;
    private world: World;
    private lastTime: number = 0;
    private isRunning: boolean = false;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        console.log('Game initialized');
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.player = new Player();
        this.world = new World();

        this.initInput();
    }

    private initInput() {
        // Pointer down handles both mouse clicks and touch taps on the canvas
        this.canvas.addEventListener('pointerdown', (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            this.player.jump();
        });

        // Keyboard support
        window.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                this.player.jump();
            }
        });
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

        const ui = UIManager.getInstance();
        const playerName = await ui.showNamePrompt(reason, score);

        if (playerName) {
            // FIRE AND FORGET: Don't await submission to avoid UI lag
            submitScore(playerName, score).catch(err => console.error("Background submission failed:", err));
        }

        const choice = await ui.showPostGameChoice(score);

        if (choice === 'retry') {
            window.location.href = window.location.pathname + '?retry=true';
        } else {
            window.location.reload();
        }
    }

    private render() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // Zoom out for better visibility (0.4 scale - Extreme wide view)
        // Center the scaling or keep it simple? 
        // Let's scale from (0, height) or just (0,0)? 
        // Scaling from (0,0) is easiest for coordinate math.
        const zoom = 0.4;
        this.ctx.scale(zoom, zoom);

        // Adjust translation so the scene remains at the bottom? 
        // If we scale by 0.75, we should translate up a bit if we want the bottom to stay bottom.
        // But since the world is generated based on canvasHeight, maybe just scaling is enough.
        // Actually, let's translate to keep the bottom aligned.
        const yOffset = (this.canvas.height * (1 - zoom)) / zoom;
        this.ctx.translate(0, yOffset);

        this.world.render(this.ctx);
        this.player.render(this.ctx);

        this.ctx.restore();

        this.renderUI();
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
}
