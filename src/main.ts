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
    const choice = await UIManager.getInstance().showRankingBoard(rankings);
    if (choice === 'retry') {
      window.location.href = window.location.pathname + '?retry=true';
    } else {
      // Just stay on title or refresh
      window.location.reload();
    }
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

// Handle Auto-Retry
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('retry') === 'true') {
  startScreen.style.display = 'none';
  // Clear the search param without refreshing
  window.history.replaceState({}, document.title, window.location.pathname);
  game.start();
}
