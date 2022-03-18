const maindiv = document.getElementById('maincontainer');
const canvasHeight = 630;
const canvasWidth = 1230;
const nodeSize = 30;
let gCostMultiplier = 1.1;
let fCostMultiplier = 1;
const canvas = document.createElement('canvas');
canvas.setAttribute('id', 'maingrid');
canvas.setAttribute('height', canvasHeight);
canvas.setAttribute('width', canvasWidth);
maindiv.appendChild(canvas);
const ctx = canvas.getContext('2d');

const tooltipTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="tooltip"]')
);
tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});

let startIsDefined = false;
let targetIsDefined = false;
let clickedDown = false;
let currentNode;
let startingNode;
let targetNode;
const grid = [];
let openSet = [];
let closedSet = [];
let pathCoords = [];
let obstacleSet = [];
let evaluatedNodeCoords = [];
let allCosts = [];
let recMouseCoord = true;
let drawingObstacles = false;
const varData = {
  mouseCoord: { x: undefined, y: undefined },
};
const color = {
  black: 'black',
  white: 'white',
  bland: '#f7e6ff',
  start: '#66bfff',
  startLight: 'rgba(179, 223, 255, 0.5)',
  target: '#ff8880',
  targetLight: '#ffcccc',
  open: 'rgba(118, 89, 250, 1)',
  closed: 'rgba(31, 0, 171, 1)',
  path: '#d4abff',
  pathLine: '#21bcff',
  obstacle: '#0e0054',
  gridlines: '#b46bff',
};

for (let i = 0; i < canvasWidth / nodeSize; i++) {
  grid[i] = new Array(canvasHeight / nodeSize);
}
const fillObstacles = () => {
  obstacleSet.forEach((value) => {
    value.normalfillAs(color.obstacle);
  });
};

const calculateDistance = (node1, node2) => {
  let x = (node1.x - node2.x) ** 2;
  let y = (node1.y - node2.y) ** 2;
  let gCost = Math.round(Math.sqrt(x + y) * 10);
  return gCost;
};

const findNextNode = (openset, grid) => {
  let smallestCost = Infinity;
  let validNodeCoord = '';
  openset.forEach((value) => {
    let cell = grid[value.x][value.y];
    if (cell.fCost < smallestCost) {
      smallestCost = cell.fCost;
      validNodeCoord = value;
    }
    if (
      cell.fCost === smallestCost &&
      cell.gCost < grid[validNodeCoord.x][validNodeCoord.y].gCost
    ) {
      //smallestCost = cell.fCost;
      validNodeCoord = value;
    } else return;
  });
  return validNodeCoord;
};

const clamp = (min, max, inpValue) => {
  return Math.max(min, Math.min(inpValue, max));
};

const counter = document.getElementById('cost');
const travelCost = () => {
  const travel1 =
    grid[targetNode.parentNodeCoord.x][targetNode.parentNodeCoord.y];

  const travel2 = calculateDistance(travel1, targetNode);
  return Math.round(travel1.gCost / gCostMultiplier + travel2);
};

const resetEvaluatedNodes = () => {
  evaluatedNodeCoords.forEach((value) => {
    grid[value.x][value.y] = undefined;
  });
};
const resetNodes = () => {
  startIsDefined = false;
  targetIsDefined = false;
  clearGrids(true, false);
  fillObstacles();
  allresetButton.disabled = true;
  document.getElementById('cost').innerText = '0';
  startingNode.fillAs(color.bland);
  targetNode.fillAs(color.targetLight);
  grid[startingNode.x][startingNode.y] = undefined;
  grid[targetNode.x][targetNode.y] = undefined;
  startingNode = undefined;
  targetNode = undefined;
  openSet = [];
  closedSet = [];
  pathCoords = [];
  evaluatedNodeCoords = [];
};
const resetButton = document.getElementById('reEvaluation');
const allresetButton = document.getElementById('allreset');
resetButton.onclick = () => {
  resetNodes();
  resetButton.disabled = true;
};
allresetButton.onclick = () => {
  startIsDefined = false;
  targetIsDefined = false;
  obstacleSet.forEach((value) => {
    grid[value.x][value.y] = undefined;
  });
  resetEvaluatedNodes();
  grid[startingNode.x][startingNode.y] = undefined;
  grid[targetNode.x][targetNode.y] = undefined;
  startingNode = undefined;
  targetNode = undefined;
  //drawingObstacles = false;
  openSet = [];
  closedSet = [];
  pathCoords = [];
  obstacleSet = [];
  evaluatedNodeCoords = [];
  clearGrids(true, false);
  document.getElementById('cost').innerText = '0';
  allresetButton.disabled = true;
  resetButton.disabled = true;
};

const drawObstacleButton = document.getElementById('obstacleControl');
const accuracyToggle = document.getElementById('accuracy');
accuracyToggle.oninput = () => {
  if (accuracyToggle.checked) {
    gCostMultiplier = 1.5;
    fCostMultiplier = 0.75;
  } else {
    gCostMultiplier = 1;
    fCostMultiplier = 1.1;
  }
};
drawObstacleButton.onclick = () => {
  drawingObstacles = !drawingObstacles;
  drawObstacleButton.classList.toggle('button-toggle');
  document.getElementById('spinner').classList.toggle('spinner-grow');
  document.getElementById('spinner').classList.toggle('spinner-grow-sm');
  if (drawingObstacles)
    document.getElementById('ObsState').innerHTML = 'Stop Drawing';
  else document.getElementById('ObsState').innerHTML = 'Draw Obstacle';
};

class Node {
  constructor(grid, gCost, hCost, fCost) {
    this.x = grid.x;
    this.y = grid.y;
    this.gridValues = grid;
    this.startCoord = {
      x: grid.x * nodeSize,
      y: grid.y * nodeSize,
    };
    this.endCoord = {
      x: this.startCoord.x + nodeSize,
      y: this.startCoord.y + nodeSize,
    };
    if (gCost !== undefined && hCost !== undefined) {
      this.gCost = gCost;
      this.hCost = hCost;
      this.fCost = fCost;
    } else this.gCost = 0;
    this.inOpenSet = false;
    this.inClosedSet = false;
    this.parentNodeCoord = {};
  }

  normalfillAs(color) {
    ctx.fillStyle = color;
    ctx.fillRect(this.startCoord.x, this.startCoord.y, nodeSize, nodeSize);
  }
  fillAs(color) {
    let x = this.startCoord.x;
    let y = this.startCoord.y;
    let n = nodeSize;
    let offset = 0.25;
    const animateInterval = setInterval(() => {
      ctx.fillStyle = color;
      ctx.fillRect(
        x + (n * (1 - offset)) / 2,
        y + (n * (1 - offset)) / 2,
        n * offset,
        n * offset
      );
      offset += 0.25;
      if (offset > 1) clearInterval(animateInterval);
    }, 20);
  }
  checkNearbyNodes() {
    let targetNodes = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];
    targetNodes.forEach((value) => {
      let values = {
        x: clamp(0, canvasWidth / nodeSize - 1, this.x + value[0]),
        y: clamp(0, canvasHeight / nodeSize - 1, this.y + value[1]),
      };
      if (grid[values.x][values.y] === undefined) {
        let gCost =
          this.gCost +
          calculateDistance(this.gridValues, values) * gCostMultiplier;
        let hCost =
          calculateDistance(values, targetNode.gridValues) * fCostMultiplier;
        let fcost = gCost + hCost;
        grid[values.x][values.y] = new Node(values, gCost, hCost, fcost);

        if (true) {
          openSet.push(values);
          evaluatedNodeCoords.push(values);
          grid[values.x][values.y].fillAs(color.open);
          grid[values.x][values.y].inOpenSet = true;
          grid[values.x][values.y].parentNodeCoord = this.gridValues;
        }
      } else if (grid[values.x][values.y] === targetNode) {
        currentNode = targetNode;
        targetNode.gCost =
          this.gCost +
          calculateDistance(this.gridValues, values) * gCostMultiplier;
        targetNode.parentNodeCoord = this.gridValues;
      }
    });
    if (currentNode !== targetNode) {
      let validNodeCoord = findNextNode(openSet, grid);
      currentNode = grid[validNodeCoord.x][validNodeCoord.y];
      openSet.splice(openSet.indexOf(validNodeCoord), 1);
      currentNode.fillAs(color.closed);
      currentNode.inClosedSet = true;
    }
  }
}

const draw = (moveto, lineto, clr = color.gridlines) => {
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = clr;
  ctx.moveTo(moveto.x, moveto.y);
  ctx.lineTo(lineto.x, lineto.y);
  ctx.stroke();
};

const drawGrids = () => {
  let x = nodeSize;
  let y = nodeSize;
  while (x < canvasWidth) {
    draw({ x: x, y: 0 }, { x: x, y: canvasHeight });
    x += nodeSize;
    if (y < canvasHeight) {
      draw({ x: 0, y: y }, { x: canvasWidth, y: y });
      y += nodeSize;
    }
  }
};
const clearGrids = (fullerase = false, fillObs = true) => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  drawGrids();
  if (!fullerase) {
    startingNode.fillAs(color.start);
    targetNode.fillAs(color.target);
  }
  if (fillObs) fillObstacles();
};

drawGrids();
const coordToGrid = (coord) => {
  ctx.beginPath();
  const gridX = Math.floor(coord.x / nodeSize);
  const gridY = Math.floor(coord.y / nodeSize);
  return { x: gridX, y: gridY };
};

const drawPathLine = () => {
  let i = 0;
  let coords = pathCoords;
  const lineInterval = setInterval(() => {
    let x = coords[i].x + nodeSize / 2;
    let y = coords[i].y + nodeSize / 2;
    let newpathcoords = pathCoords[i + 1];
    let newX =
      newpathcoords != undefined ? pathCoords[i + 1].x + nodeSize / 2 : x;
    let newY =
      newpathcoords != undefined ? pathCoords[i + 1].y + nodeSize / 2 : y;
    i++;
    ctx.strokeStyle = color.pathLine;
    ctx.fillStyle = color.pathLine;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(newX, newY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(newX, newY, 5, 0, 2 * Math.PI);
    ctx.fill();
    counter.innerText = Math.round(allCosts[i - 1] / gCostMultiplier);

    if (i > coords.length - 1) {
      clearInterval(lineInterval);
      resetButton.disabled = false;
      allresetButton.disabled = false;
    }
  }, 40);
};

const getMousePos = (canvas, e) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
};
canvas.addEventListener('mouseup', () => {
  recMouseCoord = false;
  clickedDown = false;
});
canvas.addEventListener('mousedown', (e) => {
  clickedDown = true;
  recMouseCoord = true;
  if (drawingObstacles && clickedDown) {
    const mousePos = getMousePos(canvas, e);
    varData.mouseCoord = mousePos;
    const gCoord = coordToGrid(varData.mouseCoord);
    if (grid[gCoord.x][gCoord.y] === undefined) {
      grid[gCoord.x][gCoord.y] = new Node(gCoord, 0);
      grid[gCoord.x][gCoord.y].fillAs(color.obstacle);
      obstacleSet.push(grid[gCoord.x][gCoord.y]);
    }
  }
  const mousePos = getMousePos(canvas, e);
  varData.mouseCoord = mousePos;
  const gCoord = coordToGrid(varData.mouseCoord);
  if (recMouseCoord === true && !drawingObstacles) {
    //console.log(gCoord);
    if (!startIsDefined && grid[gCoord.x][gCoord.y] === undefined) {
      grid[gCoord.x][gCoord.y] = new Node(gCoord, 0);
      grid[gCoord.x][gCoord.y].fillAs(color.start);

      closedSet.push(grid[gCoord.x][gCoord.y]);
      currentNode = grid[gCoord.x][gCoord.y];
      startingNode = grid[gCoord.x][gCoord.y];
      startIsDefined = true;
    } else if (
      !targetIsDefined &&
      startIsDefined &&
      grid[gCoord.x][gCoord.y] === undefined
    ) {
      let targethCost = calculateDistance(startingNode.gridValues, gCoord);
      grid[gCoord.x][gCoord.y] = new Node(gCoord, undefined, targethCost);
      grid[gCoord.x][gCoord.y].fillAs(color.target);
      targetNode = grid[gCoord.x][gCoord.y];
      startingNode.fCost = calculateDistance(
        startingNode.gridValues,
        targetNode.gridValues
      );
      targetIsDefined = true;
      startingNode.checkNearbyNodes();

      const mainfunction = () => {
        if (openSet.length !== 0) currentNode.checkNearbyNodes();
        if (openSet.length === 0) {
          setTimeout(() => {
            clearGrids();
          }, 500);
          clearInterval(maininterval);
        }
        if (currentNode.gridValues === targetNode.gridValues) {
          clearInterval(maininterval);
          let currentparent = targetNode;
          while (true) {
            pathCoords.push(currentparent.startCoord);
            allCosts.push(currentparent.gCost);
            if (currentparent != targetNode) currentparent.fillAs(color.path);
            currentparent =
              grid[currentparent.parentNodeCoord.x][
                currentparent.parentNodeCoord.y
              ];
            if (currentparent.gridValues === startingNode.gridValues) {
              pathCoords.push(currentparent.startCoord);
              allCosts.push(currentparent.gCost);
              allCosts.reverse();
              pathCoords.reverse();
              break;
            }
          }
          setTimeout(() => {
            clearGrids();
            drawPathLine();
            resetEvaluatedNodes();
          }, 700);
        }
      };

      const maininterval = setInterval(mainfunction, 8);
    }
  }

  canvas.addEventListener('mousemove', (e) => {
    if (recMouseCoord && drawingObstacles && clickedDown) {
      const mousePos = getMousePos(canvas, e);
      varData.mouseCoord = mousePos;

      const gCoord = coordToGrid(varData.mouseCoord);
      if (grid[gCoord.x][gCoord.y] === undefined) {
        grid[gCoord.x][gCoord.y] = new Node(gCoord, 0);
        grid[gCoord.x][gCoord.y].fillAs(color.obstacle);
        obstacleSet.push(grid[gCoord.x][gCoord.y]);
      }
    }
  });
});
