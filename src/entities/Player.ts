import { World } from '../world/World';

export class Player {
    public x: number = 100;
    public y: number = -200;
    private velocityY: number = 0;
    private gravity: number = 2500; // Even stronger gravity for turbo speed
    private jumpForce: number = -950; // Matching jump force
    private jumpCount: number = 0;
    private maxJumps: number = 2;

    private width: number = 80;
    private height: number = 150;

    private standSprite: HTMLImageElement;
    private jumpSprite: HTMLImageElement;
    private isJumping: boolean = false;

    constructor() {
        this.standSprite = new Image();
        this.standSprite.src = '/player_stand.png';

        this.jumpSprite = new Image();
        this.jumpSprite.src = '/player_jump.png';

        window.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.jump();
        }, { passive: false });
        window.addEventListener('mousedown', () => this.jump());
    }

    public onResize(_w: number, _h: number) { }

    public jump() {
        if (this.jumpCount < this.maxJumps) {
            this.velocityY = this.jumpForce;
            this.jumpCount++;
            this.isJumping = true;
        }
    }

    public update(deltaTime: number, world: World): string {
        const steps = 8; // More sub-steps for extreme speed stability
        const stepDelta = deltaTime / steps;

        for (let i = 0; i < steps; i++) {
            this.velocityY += this.gravity * stepDelta;
            this.y += this.velocityY * stepDelta;

            // Check Wall Impact
            if (world.checkWallCollision(this.x, this.y, this.width, this.height)) {
                return 'HIT';
            }

            const groundY = world.checkCollision(this.x, this.y, this.width, this.height, this.velocityY);

            if (groundY !== null && this.velocityY >= 0) {
                this.y = groundY - this.height;
                this.velocityY = 0;
                this.jumpCount = 0;
                this.isJumping = false;
                break;
            }
        }

        if (this.y > window.innerHeight + 200) return 'FALL';
        return 'ALIVE';
    }

    public render(ctx: CanvasRenderingContext2D) {
        const currentSprite = this.isJumping ? this.jumpSprite : this.standSprite;

        if (!currentSprite.complete) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(
            currentSprite,
            0, 0, currentSprite.width, currentSprite.height,
            -this.width / 2, -this.height / 2, this.width, this.height
        );
        ctx.restore();
    }
}
