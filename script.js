const imageInput = document.querySelector('#imageInput');
const gridSizeInput = document.querySelector('#gridSize');
const startButton = document.querySelector('#startButton');
const resetButton = document.querySelector('#resetButton');
const statusText = document.querySelector('#statusText');
const moveCounter = document.querySelector('#moveCounter');
const timeCounter = document.querySelector('#timeCounter');
const board = document.querySelector('#puzzleBoard');

let imageURL = '';
let gridSize = Number(gridSizeInput.value);
let order = [];
let solvedOrder = [];
let moves = 0;
let timerId = null;
let elapsedSeconds = 0;
let puzzleActive = false;

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const isSolved = () => order.every((value, index) => value === solvedOrder[index]);

const updateStatus = () => {
  if (!puzzleActive) {
    statusText.textContent = imageURL ? 'Click “Start Puzzle” when ready.' : 'Upload an image to begin.';
    return;
  }

  statusText.textContent = isSolved()
    ? '🎉 Nice! Puzzle solved.'
    : 'Drag and drop tiles to reassemble the image.';
};

const stopTimer = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
};

const startTimer = () => {
  stopTimer();
  timerId = setInterval(() => {
    elapsedSeconds += 1;
    timeCounter.textContent = formatTime(elapsedSeconds);
  }, 1000);
};

const resetStats = () => {
  moves = 0;
  elapsedSeconds = 0;
  moveCounter.textContent = '0';
  timeCounter.textContent = formatTime(0);
};

const renderBoard = () => {
  board.innerHTML = '';
  board.style.gridTemplateColumns = `repeat(${gridSize}, var(--tile-size))`;
  const boardSize = gridSize * Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tile-size'));

  order.forEach((pieceId, currentIndex) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.draggable = true;
    tile.dataset.current = String(currentIndex);
    tile.dataset.piece = String(pieceId);

    const x = pieceId % gridSize;
    const y = Math.floor(pieceId / gridSize);

    tile.style.backgroundImage = `url(${imageURL})`;
    tile.style.backgroundSize = `${boardSize}px ${boardSize}px`;
    tile.style.backgroundPosition = `${(-x * 100) / (gridSize - 1 || 1)}% ${(-y * 100) / (gridSize - 1 || 1)}%`;

    if (pieceId === currentIndex) {
      tile.classList.add('correct');
    }

    tile.addEventListener('dragstart', (event) => {
      if (!puzzleActive) {
        event.preventDefault();
        return;
      }
      tile.classList.add('dragging');
      event.dataTransfer?.setData('text/plain', String(currentIndex));
    });

    tile.addEventListener('dragend', () => {
      tile.classList.remove('dragging');
    });

    tile.addEventListener('dragover', (event) => {
      if (puzzleActive) {
        event.preventDefault();
      }
    });

    tile.addEventListener('drop', (event) => {
      event.preventDefault();
      if (!puzzleActive) {
        return;
      }

      const fromIndex = Number(event.dataTransfer?.getData('text/plain'));
      const toIndex = Number(tile.dataset.current);

      if (Number.isNaN(fromIndex) || Number.isNaN(toIndex) || fromIndex === toIndex) {
        return;
      }

      [order[fromIndex], order[toIndex]] = [order[toIndex], order[fromIndex]];
      moves += 1;
      moveCounter.textContent = String(moves);

      renderBoard();

      if (isSolved()) {
        puzzleActive = false;
        stopTimer();
      }
      updateStatus();
    });

    board.append(tile);
  });
};

const startPuzzle = () => {
  if (!imageURL) {
    statusText.textContent = 'Please choose an image first.';
    return;
  }

  gridSize = Number(gridSizeInput.value);
  solvedOrder = Array.from({ length: gridSize * gridSize }, (_, i) => i);

  do {
    order = shuffleArray(solvedOrder);
  } while (order.every((value, index) => value === solvedOrder[index]));

  puzzleActive = true;
  resetStats();
  startTimer();
  renderBoard();
  updateStatus();
};

startButton.addEventListener('click', startPuzzle);

resetButton.addEventListener('click', () => {
  stopTimer();
  puzzleActive = false;
  order = [];
  solvedOrder = [];
  board.innerHTML = '';
  resetStats();
  updateStatus();
});

imageInput.addEventListener('change', () => {
  const [file] = imageInput.files || [];
  if (!file) {
    return;
  }

  imageURL = URL.createObjectURL(file);
  puzzleActive = false;
  stopTimer();
  resetStats();
  board.innerHTML = '';
  updateStatus();
});

gridSizeInput.addEventListener('change', () => {
  gridSize = Number(gridSizeInput.value);
  if (puzzleActive) {
    startPuzzle();
  }
});

updateStatus();
