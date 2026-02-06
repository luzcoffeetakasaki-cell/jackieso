import { Game } from './core/Game';
import './style.css';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const startButton = document.getElementById('startButton') as HTMLButtonElement;
const startScreen = document.getElementById('startScreen') as HTMLDivElement;

const game = new Game(canvas);

startButton.addEventListener('click', () => {
  startScreen.style.display = 'none';
  game.start();
});

// Handle window resizing
window.addEventListener('resize', () => {
  game.resize();
});

// Initial resize
game.resize();
