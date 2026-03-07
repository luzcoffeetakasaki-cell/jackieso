interface Platform {
    x: number;
    yLeft: number;
    yRight: number;
    width: number;
}

export class World {
    private platforms: Platform[] = [];
    private speed: number = 600; // Slightly slower start for better ramp up
    private distance: number = 0;
    private canvasWidth: number = 0;
    private canvasHeight: number = 0;
    private progression: number = 0; // 0.0 to 1.0 based on distance

    // Constants for jump physics calculation (approximated from Player.ts)
    // Gravity: 2500, JumpForce: -950, maxJumps: 2
    // Air time for one jump approx: (950 * 2) / 2500 = 0.76s
    // Double jump adds more, safe jump window is roughly 1.0s - 1.2s at max speed
    private readonly MAX_REACHABLE_TIME = 1.1;

    public onResize(width: number, height: number) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        if (this.platforms.length === 0) {
            const y = height - 150; // A bit more space for initial platforms
            this.platforms.push({ x: 0, yLeft: y, yRight: y, width: width * 1.5 });
        }
    }

    public update(deltaTime: number) {
        const cappedDelta = Math.min(deltaTime, 0.05);
        const frameDistance = this.speed * cappedDelta;
        this.distance += frameDistance;

        // Update progression: 0.0 at start, reaches 1.0 at 5000m
        this.progression = Math.min(1.0, this.distance / 500000); // dist units are large (* 0.01 in UI)

        this.platforms.forEach(p => p.x -= frameDistance);
        this.platforms = this.platforms.filter(p => p.x + p.width > -800);

        const lastPlatform = this.platforms[this.platforms.length - 1];
        if (lastPlatform.x + lastPlatform.width < this.canvasWidth + 1500) {
            this.spawnPlatform(lastPlatform.x + lastPlatform.width);
        }

        // Smoother, progression-based acceleration
        // Starts at 600, ramps up to ~1100 over time
        const targetAcceleration = 10 + (this.progression * 20);
        this.speed += targetAcceleration * cappedDelta;
    }

    private spawnPlatform(startX: number) {
        const rnd = Math.random();

        // Dynamic pattern chances based on progression
        // Progression 0.0: mostly Steps/Plain
        // Progression 1.0: more Needle Pits and Death Leaps
        const plainChance = Math.max(0.1, 0.7 - this.progression * 0.6);
        const chaosChance = plainChance + (0.3); // Constant chance for steps

        let currentX = startX;

        if (rnd < plainChance) {
            // "The Long Road" - Gentle, safe platforms for early game
            const gap = 50 + (this.progression * 150);
            const width = 800 + Math.random() * 1000;
            const y = this.canvasHeight - 150 - (Math.random() * 100);
            this.addPlatform(currentX + gap, y, y, width);
        } else if (rnd < chaosChance) {
            // "Rhythm Steps" - Progressively harder steps
            const stepCount = 2 + Math.floor(this.progression * 5);
            let lastY = this.platforms[this.platforms.length - 1].yRight;

            for (let i = 0; i < stepCount; i++) {
                const width = 200 + (Math.random() * 600 * (1 - this.progression));
                const gap = 80 + (Math.random() * 300 * this.progression);
                const heightDiff = (Math.random() - 0.5) * (150 + this.progression * 250);

                let yL = lastY + heightDiff;
                // Clamp Y
                yL = Math.max(200, Math.min(this.canvasHeight - 100, yL));

                const slope = (Math.random() - 0.5) * (50 + this.progression * 150);
                this.addPlatform(currentX + gap, yL, yL + slope, width);

                currentX += width + gap;
                lastY = yL + slope;
            }
        } else {
            // "The Challenge" - Pits or Leaps
            const isNeedle = Math.random() > 0.4;
            if (isNeedle) {
                // Needle Pit - Small steps, tricky gaps
                const count = 3 + Math.floor(Math.random() * 4);
                let lastY = this.platforms[this.platforms.length - 1].yRight;
                for (let i = 0; i < count; i++) {
                    const width = 80 + Math.random() * 120;
                    const gap = 120 + Math.random() * 250;
                    const yL = Math.max(250, Math.min(this.canvasHeight - 150, lastY + (Math.random() - 0.5) * 200));
                    this.addPlatform(currentX + gap, yL, yL, width);
                    currentX += width + gap;
                    lastY = yL;
                }
            } else {
                // Death Leap - One big gap
                const gap = 350 + (Math.random() * 300 * this.progression);
                const width = 200 + Math.random() * 300;
                const y = this.canvasHeight - 150 - (Math.random() * 300);
                this.addPlatform(currentX + gap, y, y, width);
            }
        }
    }

    private addPlatform(x: number, yL: number, yR: number, width: number) {
        // SAFETY LIMIT: Ensure the gap doesn't exceed physical limits
        const lastP = this.platforms[this.platforms.length - 1];
        const actualGap = x - (lastP.x + lastP.width);
        const maxGap = this.speed * this.MAX_REACHABLE_TIME;

        let finalX = x;
        if (actualGap > maxGap * 0.9) { // 90% buffer for safety
            finalX = (lastP.x + lastP.width) + (maxGap * 0.85);
        }

        this.platforms.push({ x: finalX, yLeft: yL, yRight: yR, width });
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
