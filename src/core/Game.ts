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

    private readonly ZOOM_SCALE = 0.4;

    public resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Pass "Virtual" dimensions to the game entities
        // If we zoom out (scale < 1), the world needs to be larger to fill the screen
        const virtualWidth = this.canvas.width / this.ZOOM_SCALE;
        const virtualHeight = this.canvas.height / this.ZOOM_SCALE;

        this.player.onResize(virtualWidth, virtualHeight);
        this.world.onResize(virtualWidth, virtualHeight);
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

        // Apply Global Zoom
        this.ctx.scale(this.ZOOM_SCALE, this.ZOOM_SCALE);

        // Vertical Centering:
        // Player is roughly at (virtualHeight - 100).
        // we want this to be at (screenHeight / 2) on screen.
        // ScreenY = (WorldY + TranslateY) * Zoom
        // h/2 = (vH - 100 + ty) * Zoom
        // h/(2*Zoom) = vH - 100 + ty.   (Note: vH = h/Zoom)
        // h/(2*Zoom) = h/Zoom - 100 + ty
        // ty = 100 - h/(2*Zoom)
        const yOffset = 100 - this.canvas.height / (2 * this.ZOOM_SCALE);
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
