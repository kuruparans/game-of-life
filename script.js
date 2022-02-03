window.addEventListener('DOMContentLoaded', (event) => {
    let state;
    let runningGameInterval;

    let renderBoardButton = document.getElementById('renderBoardButton');
    renderBoardButton.addEventListener('click', function(event) {
        event.preventDefault();
        let boardHeight = document.getElementById('boardHeight').value;
        let boardWidth = document.getElementById('boardWidth').value;
        let board = document.getElementById('board');
        board.style.setProperty('--board-rows', boardWidth);
        board.style.setProperty('--board-cols', boardHeight);
        
        state = getRandomState(boardWidth, boardHeight);
        outputState(state);

        nextStateButton.disabled = false;
        runGameButton.disabled = false;
        let patterns = document.getElementById('patterns');
        patterns.style.display = 'block';
    });

    let nextStateButton = document.getElementById('nextState');
    nextStateButton.addEventListener('click', (event) => {
        event.preventDefault();
        state = getNextState(state);
        outputState(state);
    });

    let runGameButton = document.getElementById('runGame');
    runGameButton.addEventListener('click', (event) => {
        event.preventDefault();
        nextStateButton.disabled = true;
        runningGameInterval = setInterval(
            () => {
                state = getNextState(state);
                outputState(state);
                if (isDeadState(state)) {
                    clearInterval(runningGameInterval);
                    stopGameButton.style.display = 'none';
                    runGameButton.style.display = 'inline';
                }
            }
            , 1000);
        runGameButton.style.display = 'none';
        stopGameButton.style.display = 'inline';
    });

    let stopGameButton = document.getElementById('stopGame');
    stopGameButton.addEventListener('click', (event) => {
        event.preventDefault();
        clearInterval(runningGameInterval);
        stopGameButton.style.display = 'none';
        runGameButton.style.display = 'inline';
        nextStateButton.disabled = false;
    });

    let patterns = [...document.getElementById('patterns').children];
    patterns.forEach(pattern => {
        pattern.setAttribute('draggable', 'true');
        pattern.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('patternType', event.target.id);
        })
    });
});

function getDeadState(width=5, height=5) {
    let state = new Array(height);
    for (let y = 0; y < height; y++) {
        state[y] = new Array(width);
        for (let x = 0; x < width; x++) {
            state[y][x] = 0;
        }
    }
    return state;
}

function getRandomState(width=5, height=5) {
    let state = getDeadState(width, height);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            state[y][x] = Math.floor(Math.random() * 2);
        }
    }
    return state;
}

function cloneState(state) {
    const newState = [...state];
    newState.forEach((row, rowIndex) => newState[rowIndex] = [...row]);
    return newState;
}

function isDeadState(state) {
    // TODO: redo simpler
    let stateSum = state.reduce((prevRow, curRow) => prevRow.concat(curRow)).reduce((prevCell, curCell) => prevCell + curCell)
    if (stateSum == 0)
        return true;
    else
        return false;
}

function getNextState(state) {
    let newState = cloneState(state);
    let height = state.length;
    let width = state[0].length;
    let neighbourhoodType = document.getElementById('neighbourhoodType').value;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let numNeighbours = getNeighbours(x, y, state, neighbourhoodType);

            if (state[y][x] == 1) {
                if (numNeighbours <= 1 || numNeighbours > 3)
                    newState[y][x] = 0;
                else
                    newState[y][x] = 1;
            } else if (state[y][x] === 0 && numNeighbours === 3) {
                newState[y][x] = 1;
            }
        }
    }
    return newState;
}

function getNeighbours(centralCellX, centralCellY, state, neighbourhoodType = 'moore') {
    let numNeighbours = 0;
    let height = state.length;
    let width = state[0].length;

    if (neighbourhoodType == 'moore') {
        for (let neighbourCellY = centralCellY - 1; neighbourCellY < centralCellY + 2; neighbourCellY++) {
            if (neighbourCellY < 0 || neighbourCellY >= height)
                continue;
            for (let neighbourCellX = centralCellX - 1; neighbourCellX < centralCellX + 2; neighbourCellX++) {
                if (neighbourCellX < 0 || neighbourCellX >= width)
                    continue;
                if (neighbourCellX == centralCellX && neighbourCellY == centralCellY)
                    continue;
                numNeighbours += state[neighbourCellY][neighbourCellX];
            }
        }
    } else if (neighbourhoodType == 'neumann') {
        for (let neighbourCellY = centralCellY - 2; neighbourCellY < centralCellY + 3; neighbourCellY++) {
            if (neighbourCellY < 0 || neighbourCellY >= height)
                continue;
            numNeighbours += state[neighbourCellY][centralCellX];
        }
        for (let neighbourCellX = centralCellX - 2; neighbourCellX < centralCellX + 3; neighbourCellX++) {
            if (neighbourCellX < 0 || neighbourCellX >= width || neighbourCellX == centralCellX)
                continue;
            numNeighbours += state[centralCellY][neighbourCellX];
        }
    }
    return numNeighbours;
}

function outputState(state) {
    let board = document.getElementById('board');
    board.innerHTML = '';

    for (let y = 0; y < state.length; y++) {
        for (let x = 0; x < state[0].length; x++) {
            let cell = document.createElement('div');
            cell.dataset.col = y;
            cell.dataset.row = x;
            cell.addEventListener('drop', (event) => {
                event.preventDefault();
                let patternType = event.dataTransfer.getData('patternType');
                loadPattern(x, y, state, patternType);
            });
            cell.addEventListener('dragover', (event) => {
                event.preventDefault();
            });
            cell.addEventListener('dragenter', (event) => {
                event.target.classList.add('cell-hover');
            });
            cell.addEventListener('dragleave', (event) => {
                event.target.classList.remove('cell-hover');
            });
            if (state[y][x] == 1)
                cell.className = 'cell cell-alive';
            else
                cell.className = 'cell cell-dead';
            cell.addEventListener('click', () => {
                if (state[y][x] == 1)
                    state[y][x] = 0;
                else
                    state[y][x] = 1;
                
                outputState(state);
            });
            board.appendChild(cell);
        }
    }
}

function loadPattern(targetPositionX, targetPositionY, state, patternType) {
    let boardHeight = state.length;
    let boardWidth = state[0].length;
    let patterns = {};
    patterns['patternToad'] = [
        [0, 1, 1, 1],
        [1, 1, 1, 0]
    ];
    patterns['patternBlinker'] = [
        [1],
        [1],
        [1]
    ];
    patterns['patternBeacon'] = [
        [1, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 1]
    ];
    patterns['patternGlider'] = [
        [0, 0, 1],
        [1, 0, 1],
        [0, 1, 1]
    ];
    pattern = patterns[patternType];
    if (!pattern) {
        console.error('No pattern found with ID: ', patternType);
        return;
    }
    patternHeight = pattern.length;
    patternWidth = pattern[0].length;
    for (let y = 0; y < patternHeight; y++) {
        if (y + targetPositionY >= boardHeight)
            continue;
        for (let x = 0; x < patternWidth; x++) {
            if (x + targetPositionX >= boardWidth)
                continue;
            state[y + targetPositionY][x + targetPositionX] = pattern[y][x]; 
        }
    }
    outputState(state);
}


function nextStateTests() {
    // TODO: Move to Jest
    let testInitState1 = [
        [0,0,0],
        [0,0,0],
        [0,0,0]
    ];
    let testNextState1 = [
        [0,0,0],
        [0,0,0],
        [0,0,0]
    ];
    nextStateUnitTest(testInitState1, testNextState1, 'Test 1 Failed');
    let testInitState2 = [
        [0,0,1],
        [0,1,1],
        [0,0,0]
    ];
    let testNextState2 = [
        [0,1,1],
        [0,1,1],
        [0,0,0]
    ];
    nextStateUnitTest(testInitState2, testNextState2, 'Test 2 Failed');
}
function nextStateUnitTest(initState, nextState, message) {
    console.log('Testing:: Init:', initState, ' Expected:', nextState, ' Actual:', getNextState(initState));
    console.assert(JSON.stringify(getNextState(initState)) == JSON.stringify(nextState), message);
}