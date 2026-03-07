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
    private nextMilestone: number = 500; // First milestone at 500m

    constructor(canvas: HTMLCanvasElement) {
        console.log('Game initialized');
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.player = new Player();
        this.world = new World();

        this.initInput();
    }

    public reset() {
        console.log('Game resetting');
        this.player = new Player();
        this.world = new World();
        this.resize(); // Ensure world is set up correctly for current screen
        this.start();
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

    private dynamicZoom: number = 0.5;

    public resize() {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Dynamic Zoom calculation:
        // Mobile (portrait, < 600px): ~0.35-0.4
        // PC (landscape, > 1200px): ~0.6-0.7
        this.dynamicZoom = Math.max(0.35, Math.min(0.65, width / 1800 + 0.15));

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        // Pass "Virtual" dimensions (Logic space) to entities
        const virtualWidth = width / this.dynamicZoom;
        const virtualHeight = height / this.dynamicZoom;

        this.player.onResize(virtualWidth, virtualHeight);
        this.world.onResize(virtualWidth, virtualHeight);

        // Standardize context scaling for high DPI
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
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

        const score = Math.floor(this.world.getDistance() * 0.01);
        if (score >= this.nextMilestone) {
            UIManager.getInstance().showMessage(`${this.nextMilestone}m 突破！`);
            this.nextMilestone += (this.nextMilestone < 3000 ? 500 : 1000); // Ramping milestones
        }

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
            this.reset();
        } else {
            window.location.reload();
        }
    }

    private render() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const score = Math.floor(this.world.getDistance() * 0.01);

        // Dynamic Background Color
        // 0m: Sky Blue (#87CEEB)
        // 1000m: Sunset Orange (#FF4500)
        // 3000m+: Deep Night (#191970)
        let bgColor = '#87CEEB';
        if (score < 1000) {
            const t = score / 1000;
            bgColor = this.lerpColor('#87CEEB', '#FF4500', t);
        } else if (score < 3000) {
            const t = (score - 1000) / 2000;
            bgColor = this.lerpColor('#FF4500', '#191970', t);
        } else {
            bgColor = '#191970';
        }

        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, width, height);

        this.ctx.save();

        // Apply Global Zoom
        this.ctx.scale(this.dynamicZoom, this.dynamicZoom);

        // Refined Vertical Centering
        const yOffset = 200 - height / (2 * this.dynamicZoom);
        this.ctx.translate(0, yOffset);

        this.world.render(this.ctx);
        this.player.render(this.ctx);

        this.ctx.restore();

        this.renderUI(width);
    }

    private lerpColor(a: string, b: string, amount: number): string {
        const ah = parseInt(a.replace(/#/g, ''), 16),
            ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
            bh = parseInt(b.replace(/#/g, ''), 16),
            br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
            rr = ar + amount * (br - ar),
            rg = ag + amount * (bg - ag),
            rb = ab + amount * (bb - ab);

        return '#' + ((1 << 24) + (Math.round(rr) << 16) + (Math.round(rg) << 8) + Math.round(rb)).toString(16).slice(1);
    }

    private renderUI(width: number) {
        const score = Math.floor(this.world.getDistance() * 0.01);
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 36px sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(`${score}m`, width - 20, 20);
        this.ctx.fillText(`${score}m`, width - 20, 20);
    }
}
