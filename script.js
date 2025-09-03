let rows = 5, cols = 5;
let drone = [0,0];
let warehouse = null;
let clinicA = null;
let clinicB = null;
let noFlyZones = [];
let carrying = false;
let points = 0;
let deliveredA = false;
let deliveredB = false;
let gameOver = false;
let autoPlaying = false;

const gridEl = document.getElementById('grid');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const setGridBtn = document.getElementById('setGrid');
const resetBtn = document.getElementById('reset');
const pointsEl = document.getElementById('points');
const carryingEl = document.getElementById('carrying');
const delAEl = document.getElementById('delA');
const delBEl = document.getElementById('delB');
const upBtn = document.getElementById('up');
const downBtn = document.getElementById('down');
const leftBtn = document.getElementById('left');
const rightBtn = document.getElementById('right');
const pickupBtn = document.getElementById('pickup');
const dropBtn = document.getElementById('drop');
const helpBtn = document.getElementById('helpBtn');
const modalRoot = document.getElementById('modalRoot');

function randInt(max){ return Math.floor(Math.random()*max); }
function inside(r,c){ return r>=0 && r<rows && c>=0 && c<cols; }
function isNoFly(r,c){ return noFlyZones.some(z => z[0]===r && z[1]===c); }
function same(a,b){ return a[0]===b[0] && a[1]===b[1]; }

function bfs(start, goal){
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const q = [];
  const visited = new Set();
  q.push(start);
  visited.add(start.toString());
  const parent = new Map();
  parent.set(start.toString(), null);

  while(q.length){
    const cur = q.shift();
    if(cur[0]===goal[0] && cur[1]===goal[1]){
      const path=[];
      let c = cur;
      while(c){
        path.push(c);
        c = parent.get(c.toString());
      }
      return path.reverse();
    }
    for(const d of dirs){
      const nr = cur[0]+d[0], nc = cur[1]+d[1];
      if(!inside(nr,nc)) continue;
      if(isNoFly(nr,nc)) continue;
      const key = [nr,nc].toString();
      if(!visited.has(key)){
        visited.add(key);
        parent.set(key, cur);
        q.push([nr,nc]);
      }
    }
  }
  return null;
}

function updateStatus(){
  pointsEl.textContent = points;
  carryingEl.textContent = carrying ? 'Yes' : 'No';
  delAEl.textContent = deliveredA ? 'Yes' : 'No';
  delBEl.textContent = deliveredB ? 'Yes' : 'No';
}

function renderGrid(){
  gridEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
  gridEl.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;
  gridEl.innerHTML = '';

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      if(same(drone,[r,c])){
        cell.classList.add('drone');
        cell.textContent = '🚁';
      } else if(same(warehouse,[r,c])){
        cell.classList.add('warehouse');
        cell.textContent = '🏭';
      } else if(same(clinicA,[r,c])){
        cell.classList.add('clinicA');
        cell.textContent = deliveredA ? '✔A' : '🏥A';
        if(deliveredA) cell.classList.add('delivered');
      } else if(same(clinicB,[r,c])){
        cell.classList.add('clinicB');
        cell.textContent = deliveredB ? '✔B' : '🏥B';
        if(deliveredB) cell.classList.add('delivered');
      } else if(isNoFly(r,c)){
        cell.classList.add('no-fly');
        cell.textContent = '⛔';
      } else {
        cell.textContent = '';
      }
      gridEl.appendChild(cell);
    }
  }
}

function placeSpecials(){
  drone = [0,0];
  warehouse = [0, cols-1];
  clinicA = [rows-1, 0];
  clinicB = [rows-1, cols-1];
}

function generateNoFlyZones(){
  noFlyZones = [];
  const needed = (rows>3 && cols>3) ? 2 : 1;
  const forbidden = new Set([drone.toString(), warehouse.toString(), clinicA.toString(), clinicB.toString()]);
  while(noFlyZones.length < needed){
    const r = randInt(rows), c = randInt(cols);
    const key = [r,c].toString();
    if(forbidden.has(key)) continue;
    if(noFlyZones.some(z => z[0]===r && z[1]===c)) continue;
    noFlyZones.push([r,c]);
  }
}

function initGame(){
  rows = Math.max(2, parseInt(rowsInput.value) || 5);
  cols = Math.max(2, parseInt(colsInput.value) || 5);
  placeSpecials();
  generateNoFlyZones();
  carrying = false;
  points = 0;
  deliveredA = false;
  deliveredB = false;
  gameOver = false;
  autoPlaying = false;
  updateStatus();
  renderGrid();
}

function tryMove(dr, dc){
  if(gameOver || autoPlaying) return;
  const nr = drone[0]+dr, nc = drone[1]+dc;
  if(!inside(nr,nc)) return;
  if(isNoFly(nr,nc)) return;
  drone = [nr,nc];
  renderGrid();
}

function doPickup(){
  if(gameOver || autoPlaying) return;
  if(same(drone,warehouse) && !carrying){
    carrying = true;
    alert('Picked up a kit from Warehouse.');
    updateStatus();
  } else {
    alert('You must be at the warehouse to pick up a kit (and not already carrying).');
  }
}

function doDrop(){
  if(gameOver || autoPlaying) return;
  if(!carrying){
    alert('You are not carrying a kit to drop!');
    return;
  }
  if(same(drone,clinicA) && !deliveredA){
    carrying = false;
    deliveredA = true;
    points += 10;
    alert('Dropped kit at Clinic A! +10 points');
    updateStatus();
    renderGrid();
    checkWin();
    return;
  }
  if(same(drone,clinicB) && !deliveredB){
    carrying = false;
    deliveredB = true;
    points += 10;
    alert('Dropped kit at Clinic B! +10 points');
    updateStatus();
    renderGrid();
    checkWin();
    return;
  }
  gameOver = true;
  renderGrid();
  showGameOver('Wrong Drop! Game Over.');
}

function checkWin(){
  if(deliveredA && deliveredB){
    setTimeout(()=>{ alert('🎉 All kits delivered! Final points: ' + points); }, 50);
  }
}

function showGameOver(msg){
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<div class="modal"><h2 style="color:#b91c1c">Game Over</h2><p style="margin:10px 0">${msg}</p><button id="modalReset">Reset</button></div>`;
  modalRoot.appendChild(overlay);
  document.getElementById('modalReset').addEventListener('click', ()=>{
    modalRoot.innerHTML = '';
    initGame();
  });
}

function sleep(ms){ return new Promise(res => setTimeout(res,ms)); }
async function followPath(path, stepDelay=300){
  for(let i=1;i<path.length;i++){
    if(gameOver) return false;
    const [r,c] = path[i];
    if(isNoFly(r,c)){
      alert('Path blocked by No-Fly zone during auto-play.');
      return false;
    }
    drone = [r,c];
    renderGrid();
    await sleep(stepDelay);
  }
  return true;
}

async function autoHelp(){
  if(gameOver) return;
  autoPlaying = true;
  let path = bfs(drone, warehouse);
  if(!path){ alert('No path to Warehouse — Help aborted'); autoPlaying=false; return; }
  await followPath(path, 300);
  carrying = true;
  updateStatus();
  await sleep(300);

  path = bfs(drone, clinicA);
  if(!path){ alert('No path to Clinic A — Help aborted'); autoPlaying=false; return; }
  await followPath(path, 300);
  if(!deliveredA){
    carrying = false;
    deliveredA = true;
    points += 10;
    updateStatus();
    renderGrid();
    await sleep(300);
  }

  path = bfs(drone, warehouse);
  if(!path){ alert('No path back to Warehouse — Help aborted'); autoPlaying=false; return; }
  await followPath(path, 300);
  carrying = true;
  updateStatus();
  await sleep(300);

  path = bfs(drone, clinicB);
  if(!path){ alert('No path to Clinic B — Help aborted'); autoPlaying=false; return; }
  await followPath(path, 300);
  if(!deliveredB){
    carrying = false;
    deliveredB = true;
    points += 10;
    updateStatus();
    renderGrid();
  }
  autoPlaying = false;
  alert('Help completed the deliveries!');
}

setGridBtn.addEventListener('click', initGame);
resetBtn.addEventListener('click', initGame);
upBtn.addEventListener('click', ()=> tryMove(-1,0));
downBtn.addEventListener('click', ()=> tryMove(1,0));
leftBtn.addEventListener('click', ()=> tryMove(0,-1));
rightBtn.addEventListener('click', ()=> tryMove(0,1));
pickupBtn.addEventListener('click', doPickup);
dropBtn.addEventListener('click', doDrop);
helpBtn.addEventListener('click', async ()=>{
  if(gameOver || autoPlaying) return;
  await autoHelp();
});

initGame();
