export class SoundManager {
    private static instance: SoundManager;
    private bgm: HTMLAudioElement;
    private isBgmPlaying: boolean = false;

    private constructor() {
        this.bgm = new Audio('/assets/bgm.mp3');
        this.bgm.loop = true;
        this.bgm.volume = 0.5; // Default volume 50%
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    public playBGM() {
        if (this.isBgmPlaying) return;

        // User interaction is required to play audio
        this.bgm.play().then(() => {
            this.isBgmPlaying = true;
            console.log("BGM started");
        }).catch(error => {
            console.warn("BGM play failed (user interaction needed?):", error);
        });
    }

    public stopBGM() {
        this.bgm.pause();
        this.bgm.currentTime = 0;
        this.isBgmPlaying = false;
    }

    public pauseBGM() {
        this.bgm.pause();
        this.isBgmPlaying = false;
    }

    public resumeBGM() {
        if (!this.isBgmPlaying && this.bgm.paused) {
            this.bgm.play().catch(console.warn);
            this.isBgmPlaying = true;
        }
    }
}
