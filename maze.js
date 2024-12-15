document.addEventListener("DOMContentLoaded", function () {
  let mazeGrid, gridSize, destinationPosition, debounceTimeout;
  let isPaused = false; // Flag to check if the maze-solving is paused
  let isSolved = false; // Flag to indicate if the maze has been solved
  let stopExecution = false; // Flag to stop the execution on restart
  let ratPath = []; // Track the rat's path
  let visitedCells; // Track visited cells

  // Function to disable or enable inputs
  const disableInputs = (disable) => {
    document.getElementById("n").disabled = disable;
    document.getElementById("blocks").disabled = disable;
  };

  const generateMaze = () => {
    gridSize = parseInt(document.getElementById("n").value);
    let numberOfBlocks = parseInt(document.getElementById("blocks").value);

    // Calculate the maximum number of blocks allowed
    const maxBlocksAllowed = gridSize * gridSize - 2;

    // Ensure the number of blocks does not exceed the maximum limit
    if (numberOfBlocks > maxBlocksAllowed) {
      numberOfBlocks = maxBlocksAllowed;
      document.getElementById("blocks").value = numberOfBlocks;
    }

    const mazeContainer = document.getElementById("maze");
    mazeContainer.innerHTML = "";
    mazeContainer.style.setProperty("--n", gridSize);

    // Initialize the maze grid
    mazeGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

    // Randomly place blocks in the maze
    for (let i = 0; i < numberOfBlocks; i++) {
      let row, col;
      do {
        row = Math.floor(Math.random() * gridSize);
        col = Math.floor(Math.random() * gridSize);
      } while (
        mazeGrid[row][col] !== 0 ||
        (row === 0 && col === 0) ||
        (row === gridSize - 1 && col === gridSize - 1)
      );
      mazeGrid[row][col] = 1;
    }

    // Set rat's starting position and destination position
    mazeGrid[0][0] = "R";
    mazeGrid[gridSize - 1][gridSize - 1] = "D";

    // Render the maze grid
    mazeGrid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellDiv = document.createElement("div");
        cellDiv.classList.add("cell");
        if (cell === 1) cellDiv.classList.add("blocked");
        if (cell === "R") cellDiv.classList.add("rat");
        if (cell === "D") cellDiv.classList.add("destination");
        cellDiv.dataset.row = rowIndex;
        cellDiv.dataset.col = colIndex;
        mazeContainer.appendChild(cellDiv);
      });
    });

    ratCurrentPosition = [0, 0];
    destinationPosition = [gridSize - 1, gridSize - 1];
    document.getElementById("message").innerText =
      "Maze generated. Click Start to begin.";

    document.getElementById("pause").classList.add("disabled"); // Add disabled class
    document.getElementById("pause").disabled = true;
  };

  const moveRat = async () => {
    disableInputs(true); // Disable inputs when the execution starts
    document.getElementById("start").classList.add("disabled"); // Add disabled class
    document.getElementById("start").disabled = true; // Disable Start button
    document.getElementById("pause").classList.remove("disabled"); // Remove disabled class
    document.getElementById("pause").disabled = false;

    ratPath = [];
    visitedCells = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(false)
    );
    isSolved = false; // Reset the solved flag
    stopExecution = false; // Reset the stopExecution flag
    let destinationReached = false; // Flag to stop the function when destination is reached

    const isSafeToMove = (x, y) =>
      x >= 0 &&
      x < gridSize &&
      y >= 0 &&
      y < gridSize &&
      mazeGrid[x][y] !== 1 &&
      !visitedCells[x][y];

    const solveMazeRecursively = async (x, y) => {
      if (destinationReached || stopExecution) return true; // Exit if destination is reached or execution is stopped
      if (isPaused) {
        // Wait until resume
        while (isPaused) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (isSolved || stopExecution) return false; // Stop recursion if the maze is already solved or execution is stopped

      if (x === destinationPosition[0] && y === destinationPosition[1]) {
        ratPath.push([x, y]);
        isSolved = true; // Mark the maze as solved
        destinationReached = true; // Set flag to stop further processing
        return true;
      }

      if (isSafeToMove(x, y)) {
        visitedCells[x][y] = true;
        ratPath.push([x, y]);

        const currentCell = document.querySelector(
          `[data-row="${x}"][data-col="${y}"]`
        );
        // Only apply the 'path' class if the cell is not the starting node
        if (!(x === 0 && y === 0)) {
          currentCell.classList.add("path");
        }
        currentCell.classList.add("rat");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Move in the order of down, right, up, left
        if (
          (await solveMazeRecursively(x + 1, y)) ||
          (await solveMazeRecursively(x, y + 1)) ||
          (await solveMazeRecursively(x - 1, y)) ||
          (await solveMazeRecursively(x, y - 1))
        ) {
          return true;
        }

        ratPath.pop();
        if (!(x === 0 && y === 0)) {
          currentCell.classList.remove("rat", "path");
        } else {
          currentCell.classList.remove("rat");
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      return false;
    };

    document.getElementById("message").innerText = "Rat is moving...";
    await solveMazeRecursively(0, 0);

    // Update message based on whether the maze was solved
    if (isSolved) {
      document.getElementById("message").innerText =
        "Rat has reached the destination!";
    } else {
      if (!stopExecution) {
        document.getElementById("message").innerText = "No solution found!";
      }
    }
    disableInputs(false); // Re-enable inputs when the maze solving is complete
  };

  const startMaze = () => {
    isPaused = false; // Ensure it's not paused when starting
    stopExecution = false; // Ensure execution is not stopped when starting
    disableInputs(true); // Disable inputs on start
    moveRat();
  };

  const pauseResumeMaze = () => {
    isPaused = !isPaused; // Toggle pause/resume
    if (isPaused) {
      document.getElementById("message").innerText = "Paused.";
      document.getElementById("pause").innerText = "Resume";
      disableInputs(false); // Re-enable inputs when paused
    } else {
      document.getElementById("message").innerText = "Resumed.";
      document.getElementById("pause").innerText = "Pause";
      disableInputs(true); // Disable inputs when resumed
    }
  };

  const restartMaze = () => {
    stopExecution = true; // Stop the current execution
    generateMaze();
    document.getElementById("message").innerText = "";
    document.getElementById("start").classList.remove("disabled"); // Remove disabled class
    document.getElementById("start").disabled = false; // Re-enable Start button
    document.getElementById("pause").innerText = "Pause";
    document.getElementById("pause").classList.add("disabled"); // Add disabled class
    document.getElementById("pause").disabled = true;
    disableInputs(false); // Re-enable inputs on restart
  };

  const updateMaze = () => {
    // Debounce to prevent too many calls
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      restartMaze(); // Reset the execution
      generateMaze();
      // Enable the Start button when the input changes
      document.getElementById("start").classList.remove("disabled");
      document.getElementById("start").disabled = false;
    }, 300); // 300ms debounce
  };

  // Event listeners for inputs
  document.getElementById("start").addEventListener("click", startMaze);
  document.getElementById("pause").addEventListener("click", pauseResumeMaze);
  document.getElementById("restart").addEventListener("click", restartMaze);
  document.getElementById("n").addEventListener("input", updateMaze);
  document.getElementById("blocks").addEventListener("input", updateMaze);

  generateMaze(); // Initialize with a default maze
});
