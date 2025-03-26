// Import game components
import { initCanvas } from './canvas.js';
import { initPaddles } from './paddles.js';
import { initBall } from './ball.js';
import { initScoreBoard } from './scoreBoard.js';
import { initControls } from './controls.js';
import { startGameLoop } from './gameLoop.js';

// Initialize Pong game
document.addEventListener('DOMContentLoaded', () => {
  // Set up the game environment
  const gameCanvas = initCanvas();
  const paddles = initPaddles(gameCanvas);
  const ball = initBall(gameCanvas);
  const scoreBoard = initScoreBoard();
  
  // Set up user controls
  initControls(paddles);
  
  // Start the game loop
  startGameLoop(gameCanvas, paddles, ball, scoreBoard);
  
  console.log('Pong game initialized successfully');
});