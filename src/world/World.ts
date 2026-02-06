interface Platform {
    x: number;
    yLeft: number;
    yRight: number;
    width: number;
}

export class World {
    private platforms: Platform[] = [];
    private speed: number = 750; // Starting even faster
    private distance: number = 0;
    private canvasWidth: number = 0;
    private canvasHeight: number = 0;

    public onResize(width: number, height: number) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        if (this.platforms.length === 0) {
            const y = height - 100;
            this.platforms.push({ x: 0, yLeft: y, yRight: y, width: width * 1.5 });
        }
    }

    public update(deltaTime: number) {
        // Limit deltaTime to prevent huge jumps if the tab was inactive
        const cappedDelta = Math.min(deltaTime, 0.05);
        const frameDistance = this.speed * cappedDelta;
        this.distance += frameDistance;

        this.platforms.forEach(p => p.x -= frameDistance);
        this.platforms = this.platforms.filter(p => p.x + p.width > -800);

        const lastPlatform = this.platforms[this.platforms.length - 1];
        if (lastPlatform.x + lastPlatform.width < this.canvasWidth + 1500) {
            this.spawnPlatform(lastPlatform.x + lastPlatform.width);
        }

        this.speed += 30 * cappedDelta; // Aggressive acceleration
    }

    private spawnPlatform(startX: number) {
        const type = Math.random();

        if (type < 0.15) {
            // "The Needle Pit" - Tiny platforms with varying gaps
            let currentX = startX + 150 + Math.random() * 200;
            const needleCount = 3 + Math.floor(Math.random() * 5);
            for (let i = 0; i < needleCount; i++) {
                const width = 50 + Math.random() * 100;
                const gap = 120 + Math.random() * 300; // Highly variable gaps
                const y = this.canvasHeight - 150 - (Math.random() * 250);
                this.platforms.push({ x: currentX, yLeft: y, yRight: y, width });
                currentX += width + gap;
            }
        } else if (type < 0.85) {
            // "Chaos City" - Extreme width and height variety
            const stepCount = 3 + Math.floor(Math.random() * 6);
            let currentX = startX + 100 + Math.random() * 250;
            let lastY = this.platforms[this.platforms.length - 1].yRight;

            for (let i = 0; i < stepCount; i++) {
                const stepWidth = 80 + Math.random() * 900;
                const stepGap = 60 + Math.random() * 350; // Random spacing
                const slope = (Math.random() - 0.5) * 160;
                const heightJump = (Math.random() - 0.5) * 400;

                let yL = lastY + heightJump;
                let yR = yL + slope;

                // Vertical clamping with some variety
                if (yL < 180) { yL = 180 + Math.random() * 100; yR = yL + slope; }
                if (yL > this.canvasHeight - 80) { yL = this.canvasHeight - 80 - Math.random() * 100; yR = yL + slope; }

                this.platforms.push({ x: currentX, yLeft: yL, yRight: yR, width: stepWidth });
                currentX += stepWidth + stepGap;
                lastY = yR;
            }
        } else {
            // "The Leap of Death" - Huge gap followed by varied placement
            const gap = 500 + Math.random() * 250;
            const width = 100 + Math.random() * 400;
            const y = this.canvasHeight - 150 - (Math.random() * 300);
            this.platforms.push({ x: startX + gap, yLeft: y, yRight: y, width });
        }
    }

    public getDistance() {
        return this.distance;
    }

    public render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#000000';
        this.platforms.forEach(p => {
            // Draw block if it's within or near screen bounds
            if (p.x + p.width > -100 && p.x < this.canvasWidth + 100) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.yLeft);
                ctx.lineTo(p.x + p.width, p.yRight);
                ctx.lineTo(p.x + p.width, this.canvasHeight);
                ctx.lineTo(p.x, this.canvasHeight);
                ctx.closePath();
                ctx.fill();
            }
        });
    }

    public checkCollision(playerX: number, playerY: number, playerW: number, playerH: number, _velocityY: number) {
        const feetY = playerY + playerH;
        const pCenterX = playerX + playerW / 2;

        for (const p of this.platforms) {
            if (pCenterX > p.x && pCenterX < p.x + p.width) {
                const t = (pCenterX - p.x) / p.width;
                const groundY = p.yLeft + (p.yRight - p.yLeft) * t;

                // Forgiving buffer for extreme speeds
                if (feetY >= groundY && feetY <= groundY + 55) {
                    return groundY;
                }
            }
        }
        return null;
    }

    public checkWallCollision(playerX: number, playerY: number, playerW: number, playerH: number) {
        const pRight = playerX + playerW * 0.75;
        const pBottom = playerY + playerH;

        for (const p of this.platforms) {
            // Check if player's front hits the left side of a block
            if (pRight >= p.x && pRight <= p.x + 50 && playerX < p.x) {
                // Check if player is below the top edge
                if (pBottom > p.yLeft + 20) {
                    return true;
                }
            }
        }
        return false;
    }
}
