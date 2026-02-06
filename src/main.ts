import { Game } from './core/Game';
import { getTopRankings } from './core/Firebase';
import { UIManager } from './core/UI';
import './style.css';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const startButton = document.getElementById('startButton') as HTMLButtonElement;
const rankingButton = document.getElementById('rankingButton') as HTMLButtonElement;
const startScreen = document.getElementById('startScreen') as HTMLDivElement;

const game = new Game(canvas);

startButton.addEventListener('click', () => {
  startScreen.style.display = 'none';
  game.start();
});

rankingButton.addEventListener('click', async () => {
  try {
    const rankings = await getTopRankings();
    await UIManager.getInstance().showRankingBoard(rankings);
  } catch (error) {
    console.error("Failed to show rankings from title:", error);
  }
});

// Handle window resizing
window.addEventListener('resize', () => {
  game.resize();
});

// Initial resize
game.resize();
