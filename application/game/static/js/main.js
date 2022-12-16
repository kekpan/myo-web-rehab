import { sounds as Sound } from "./sound.js";

// PIXI.AnimatedSprite objects
let charge, playerChar, shield, warpAnimation;
let [attacks, bursts, enemies] = [{}, {}, {}];
// PIXI.Container objects
let endingCtr, introCtr, levelCtr, loadingCtr;
let overworldCtr, pauseCtr, rhombiCtr;
// PIXI.Graphics objects
let healthBar, healthBarBgd, myoBar, myoBarBgd;
let donutMask, gridGraphic, nextWaveRhombi, wavesInfoRects;
// PIXI.Sprite objects
let gem, myoSprite;
// PIXI.Text objects
let loadingTextObj, pauseBody, pauseHeading;
let wavesInfoLower, wavesInfoUpper;

// Other pre-setup variables
let app, data, evtSource, gameDB;
let postponedState, sesObjKey, state, username;
// Other gameplay-related variables
let levelMusic, lvlSheet, mainSheet, overworldMusic;
let assets, introMusic, introSheet, keyCode;
let [freePositions, introIdx] = [[], 0];
// Other time-related variables
let restTimeoutID, startTs, timeoutID, tsDiff;
let prevTs = 0;
// Other exercise-related variables
let totalWaves;
let [enemyWaves, repCounter, target] = [[], 0, {}];

const devMode = false;
const ignoreDoubleTap = false;

const exercises = ["fingers_spread", "fist", "wave_in", "wave_out"];
if (!ignoreDoubleTap) exercises.push("double_tap");

const wldNames = [
  "THE PEACEVILLE",
  "THE LOST ISLAND",
  "THE ORCS' TURF",
  "THE LEETUS' DEN",
];
const colors = {
  double_tap: 0xe8940e,
  fingers_spread: 0xc4c4c4,
  fist: 0x2ff21d,
  wave_in: 0xf2401e,
  wave_out: 0x1dc8f2,
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Sound.whenLoaded = loadSprites;

const startButton = document.getElementById("button");
startButton.addEventListener("click", bootUp);

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ GAME LOOP ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function gameLoop(currentTs) {
  tsDiff = currentTs - prevTs;
  prevTs = currentTs;
  requestAnimationFrame(gameLoop);
  state();
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ PRE-SETUP ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function bootUp() {
  const htmlContainer = document.getElementById("container");
  htmlContainer.remove();

  const canvas = document.getElementById("canvas");
  app = new PIXI.Application({ width: 1024, height: 576, view: canvas });

  createLoadingScreen();
  state = loadingState;
  requestAnimationFrame(gameLoop);

  openClientDatabase();
}

function createLoadingScreen() {
  loadingCtr = new PIXI.Container();
  app.stage.addChild(loadingCtr);

  loadingTextObj = new PIXI.Text();
  loadingTextObj.text = "LOADING";
  loadingTextObj.style = {
    fill: ["0xffff80", "0xffff00"],
    fontSize: 72,
    fontWeight: "bolder",
  };
  loadingTextObj.anchor.set(0.5, 0.5);
  loadingTextObj.position.set(canvas.width / 2, canvas.height / 2);
  loadingCtr.addChild(loadingTextObj);
}

function openClientDatabase() {
  if (!indexedDB) {
    alert("Your browser doesn't support IndexedDB. Please use another one.");
    return;
  }

  const openRequest = indexedDB.open("GameDatabase");
  openRequest.onupgradeneeded = () => {
    gameDB = openRequest.result;
    gameDB.createObjectStore("sessions", { autoIncrement: true });
  };
  openRequest.onsuccess = () => {
    gameDB = openRequest.result;
    const navbarSpan = document.getElementById("username");
    username = navbarSpan.innerText;
    retrieveServerData(username);
  };
  openRequest.onerror = () => {
    console.error(openRequest.error);
  };
}

async function retrieveServerData(username) {
  const url = `http://127.0.0.1:5000/api/programs/${username}`;
  const response = await fetch(url);
  const resJson = await response.json();

  if (resJson.status == 404) {
    alert(resJson.message);
    return;
  }

  data = resJson;

  if (devMode) {
    checkPlayingEligibility();
  } else {
    synchronizeDatabases();
  }
}

function synchronizeDatabases() {
  const transaction = gameDB.transaction("sessions");
  const objectStore = transaction.objectStore("sessions");

  const openRequest = objectStore.openCursor();
  openRequest.onsuccess = () => {
    const cursor = openRequest.result;
    if (cursor) {
      uploadLeftoverSession(cursor.key, cursor.value);
      cursor.continue();
    } else {
      checkPlayingEligibility();
    }
  };
}

async function uploadLeftoverSession(id, data) {
  const url = "http://127.0.0.1:5000/api/sessions/";
  const initObj = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
  const response = await fetch(url, initObj);

  if (response.ok) {
    const transaction = gameDB.transaction("sessions", "readwrite");
    const objectStore = transaction.objectStore("sessions");

    const deleteRequest = objectStore.delete(id);
    deleteRequest.onsuccess = () => {
      retrieveServerData(username);
    };
  }
}

function checkPlayingEligibility() {
  const urls = [
    "static/sounds/overworld.mp3",
    `static/sounds/lvl_${data.curtLvl}.mp3`,
  ];

  if (data.curtLvl === 1) {
    urls.push("static/sounds/intro.mp3");
    Sound.load(urls);
    return;
  }

  const msecSinceStart = Math.abs(new Date() - new Date(data.startDate));
  const daysSinceStart = msecSinceStart / (1000 * 60 * 60 * 24);
  const threshold = (data.curtWld - 1) * 7 + data.dayWeek - 1 - 0.25;

  if (daysSinceStart > threshold || devMode) {
    Sound.load(urls);
  } else {
    const daysRemain = threshold - daysSinceStart;
    const hoursRemain = Math.floor(daysRemain * 24);
    const minsRemain = Math.ceil((daysRemain * 24 - hoursRemain) * 60);
    alert(`Not enough time passed! ${hoursRemain}h ${minsRemain}m left.`);
  }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SETUP (1) ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

async function loadSprites() {
  const urls = [
    "static/images/main.json",
    `static/images/wld_${data.curtWld}.png`,
    `static/images/lvl_${data.curtLvl}.json`,
  ];

  if (data.curtLvl === 1) {
    urls.push("static/images/intro.json");
  }

  assets = await PIXI.Assets.load(urls);

  gameSetup();
}

function gameSetup() {
  assignAssets();
  divideRoutineSets();

  createPlayerChar();
  overworldSetup();
  levelSetup();
  pauseSetup();
  endScreenSetup();

  if (data.curtLvl === 1) {
    introSetup();
  }

  keyboardListenersSetup();
  myoListenersSetup();

  Myo.connect();
}

function assignAssets() {
  mainSheet = assets["static/images/main.json"];
  overworldMusic = Sound["static/sounds/overworld.mp3"];
  overworldMusic.loop = true;
  overworldMusic.volume = 0.3;

  lvlSheet = assets[`static/images/lvl_${data.curtLvl}.json`];
  levelMusic = Sound[`static/sounds/lvl_${data.curtLvl}.mp3`];
  levelMusic.loop = true;
  levelMusic.volume = 0.3;

  if (data.curtLvl === 1) {
    introSheet = assets["static/images/intro.json"];
    introMusic = Sound["static/sounds/intro.mp3"];
    introMusic.loop = true;
    introMusic.volume = 0;
  }
}

function divideRoutineSets() {
  if (ignoreDoubleTap) delete data.setsToDo.double_tap;
  const setsToDoArray = Object.values(data.setsToDo);
  const totSetsToDo = setsToDoArray.reduce((acc, cur) => acc + cur);

  let helperArray = Array(totSetsToDo);
  exercises.forEach((ex) => {
    const value = exercises.indexOf(ex) + 1;
    const start = helperArray.findIndex((x) => x === undefined);
    const end = start + data.setsToDo[ex];
    helperArray.fill(value, start, end);
  });
  helperArray = rearrangeArray(helperArray, helperArray.length);
  helperArray = helperArray.map((value) => exercises[value - 1]);

  for (let index = 0, start = 0; index <= helperArray.length; index++) {
    const exercise = helperArray[index];
    const subarray = helperArray.slice(start, index);
    if (subarray.includes(exercise) || !exercise) {
      const wave = new Set(subarray);
      enemyWaves.push(wave);
      start = index;
    }
  }
  totalWaves = enemyWaves.length;
}

function rearrangeArray(e, t) {
  let r = new Map(),
    l = new Map();
  for (let l = 0; l < t; l++)
    r.has(e[l]) ? r.set(e[l], r.get(e[l]) + 1) : r.set(e[l], 1);
  let n = [];
  for (let a = 0; a < t; a++) {
    let t = e[a];
    r.get(t) > 0 && 1 != l[t] && n.push([r.get(t), t]), (l[t] = 1);
  }
  n.sort();
  let a = Array(t).fill(0),
    o = [-1, -1],
    s = 0;
  for (; 0 != n.length; ) {
    let e = n[n.length - 1];
    n.pop(),
      (a[s] = e[1]),
      o[0] > 0 && n.push(o),
      n.sort(),
      e[0]--,
      (o = e),
      s++;
  }
  return a;
}

function createPlayerChar() {
  playerChar = new PIXI.AnimatedSprite(mainSheet.animations["stand_south"]);
  playerChar.animationSpeed = 0.15;
  playerChar.anchor.set(0.5, 0.5);
  playerChar.scale.set(1.44, 1.44);
  playerChar.vx = 0;
  playerChar.vy = 0;

  warpAnimation = new PIXI.AnimatedSprite(mainSheet.animations["warp"]);
  warpAnimation.animationSpeed = 0.2;
  warpAnimation.anchor.set(0.5, 0.5);
  warpAnimation.scale.set(0.75, 0.75);
  warpAnimation.visible = false;

  charge = new PIXI.AnimatedSprite(mainSheet.animations["charge"]);
  charge.animationSpeed = 0.15;
  charge.anchor.set(0.5, 0.5);
  charge.visible = false;
}

function overworldSetup() {
  overworldCtr = new PIXI.Container();
  overworldCtr.visible = false;
  app.stage.addChild(overworldCtr);

  const background = new PIXI.Sprite(
    assets[`static/images/wld_${data.curtWld}.png`]
  );
  overworldCtr.addChild(background);

  addOverworldPlatforms();
  addOverworldInfo();
}

function addOverworldPlatforms() {
  const platformsCtr = new PIXI.Container();

  for (let idx = 0; idx < data.totLevels[data.curtWld - 1]; idx++) {
    data.curtWldLvl = data.curtLvl;
    for (let i = 0; i < data.curtWld - 1; i++) {
      data.curtWldLvl -= data.totLevels[i];
    }
    let tempSprite;
    if (idx < data.curtWldLvl - 1) {
      tempSprite = new PIXI.Sprite(mainSheet.textures["green_platform.png"]);
    } else if (idx === data.curtWldLvl - 1) {
      tempSprite = new PIXI.Sprite(mainSheet.textures["blue_platform.png"]);
    } else {
      tempSprite = new PIXI.Sprite(mainSheet.textures["yellow_platform.png"]);
    }
    tempSprite.anchor.set(0.5, 0.5);
    tempSprite.position.set(140 * idx + 35, 15);
    platformsCtr.addChild(tempSprite);
  }

  platformsCtr.x = canvas.width / 2 - platformsCtr.width / 2;
  platformsCtr.y = canvas.height / 2 - platformsCtr.height / 2;

  const lineObj = new PIXI.Graphics();
  lineObj.lineStyle(6, 0xd1d1d1);
  lineObj.moveTo(platformsCtr.x + 35, platformsCtr.y + 12);
  lineObj.lineTo(platformsCtr.x + platformsCtr.width - 35, platformsCtr.y + 12);

  playerChar.x = platformsCtr.x + 140 * (data.curtWldLvl - 1) + 37;
  playerChar.y = canvas.height / 2 - playerChar.height / 2;
  warpAnimation.x = playerChar.x;
  warpAnimation.y = playerChar.y;

  overworldCtr.addChild(lineObj, platformsCtr, playerChar, warpAnimation);
}

function addOverworldInfo() {
  const headingBgd = new PIXI.Sprite(mainSheet.textures["ow_heading.png"]);
  headingBgd.position.set(canvas.width / 2 - 365, 25);

  const footerBgd = new PIXI.Sprite(mainSheet.textures["ow_footer.png"]);
  footerBgd.position.set(canvas.width / 2 - 310, 456);

  const headingText = new PIXI.Text(
    `WORLD ${data.curtWld}: ${wldNames[data.curtWld - 1]}`,
    { fill: 0x451c0c, fontWeight: "bold" }
  );
  headingText.x = canvas.width / 2 - headingText.width / 2;
  headingText.y = 65 - headingText.height / 2;

  const footerText = new PIXI.Text(`LEVEL ${data.curtWld}-${data.curtWldLvl}`, {
    fill: 0x451c0c,
    fontWeight: "bold",
  });
  footerText.x = canvas.width / 2 - footerText.width / 2;
  footerText.y = 501 - footerText.height / 2;

  const enterKeySprite = new PIXI.Sprite(mainSheet.textures["enter_key.png"]);
  enterKeySprite.anchor.set(0.5, 0.5);
  enterKeySprite.position.set(50, footerText.y + footerText.height / 2);

  const enterKeyText = new PIXI.Text("CONTINUE", {
    fill: "white",
    fontSize: 18,
    fontWeight: 800,
    strokeThickness: 4,
  });
  enterKeyText.anchor.set(0.5, 0.5);
  enterKeyText.x = 80 + enterKeyText.width / 2;
  enterKeyText.y = footerText.y + footerText.height / 2;

  overworldCtr.addChild(headingBgd, footerBgd, headingText, footerText);
  overworldCtr.addChild(enterKeySprite, enterKeyText);
}

function pauseSetup() {
  pauseCtr = new PIXI.Container();
  pauseCtr.visible = false;
  app.stage.addChild(pauseCtr);

  const pauseBackground = new PIXI.Graphics();
  pauseBackground.beginFill(0, 0.75);
  pauseBackground.drawRect(0, 0, canvas.width, canvas.height);
  pauseBackground.endFill();
  pauseCtr.addChild(pauseBackground);

  const headingStyle = { fill: "gold", fontSize: 60, fontWeight: "bolder" };
  pauseHeading = new PIXI.Text("", headingStyle);
  pauseHeading.anchor.set(0.5, 0.5);
  pauseHeading.position.set(canvas.width / 2, canvas.height / 6);
  pauseCtr.addChild(pauseHeading);

  const bodyStyle = { fill: "white", fontSize: 36, fontWeight: "bold" };
  pauseBody = new PIXI.Text("", bodyStyle);
  pauseBody.anchor.set(0.5, 0.5);
  pauseBody.position.set(canvas.width / 2, canvas.height / 2);
  pauseCtr.addChild(pauseBody);
}

function endScreenSetup() {
  endingCtr = new PIXI.Container();
  endingCtr.visible = false;
  app.stage.addChild(endingCtr);

  const background = new PIXI.Sprite(
    assets[`static/images/wld_${data.curtWld}.png`]
  );
  endingCtr.addChild(background);

  const black = new PIXI.Graphics();
  black.beginFill(0, 0.75);
  black.drawRect(0, 0, canvas.width, canvas.height);
  black.endFill();
  endingCtr.addChild(black);

  const headingStyle = {
    fill: "gold",
    fontSize: 60,
    fontWeight: "bolder",
  };
  const endingHeading = new PIXI.Text("LEVEL COMPLETED", headingStyle);
  endingHeading.anchor.set(0.5, 0.5);
  endingHeading.position.set(canvas.width / 2, canvas.height / 6);
  endingCtr.addChild(endingHeading);

  const totLevels = data.totLevels.reduce((acc, cur) => acc + cur);
  const op = Math.ceil((data.curtLvl / totLevels) * 100);
  const bodyStyle = {
    fill: "white",
    fontSize: 36,
    fontWeight: "bold",
  };
  const endingBody = new PIXI.Text(`Overall Progress: ${op}%`, bodyStyle);
  endingBody.anchor.set(0.5, 0.5);
  endingBody.position.set(canvas.width / 2, canvas.height / 2);
  endingCtr.addChild(endingBody);
}

function introSetup() {
  introCtr = new PIXI.Container();
  introCtr.visible = false;
  app.stage.addChild(introCtr);

  const date = new Date();
  const [month, day, year] = [
    date.getMonth() + 1,
    date.getDate(),
    date.getFullYear(),
  ];
  const getHours = date.getHours();
  const getMinutes = date.getMinutes();
  const [hour, minutes, period] = [
    getHours <= 12 ? getHours : getHours - 12,
    getMinutes < 10 ? `0${getMinutes}` : getMinutes,
    getHours === getHours < 12 ? "AM" : "PM",
  ];

  const dateNow = `${day}/${month}/${year}, ${hour}:${minutes} ${period}`;
  const totalGems = data.totLevels.reduce((acc, cur) => acc + cur);

  let daysLeft;
  for (let index = 3; index >= 0; index--) {
    if (data.totLevels[index] === 0) continue;
    if (daysLeft === undefined) {
      daysLeft = 0;
      continue;
    }
    daysLeft += 7;
  }
  daysLeft += data.lastDayWeek;

  const texts = [
    `${dateNow}, in another universe...`,
    `SIER LEETUS has stolen the ${totalGems} MIRACLE GEMS.`,
    `You, BLEIC, are the one who can retrieve them.`,
    `We have ${daysLeft} days left. The countdown is on...`,
  ];

  for (let i = 0; i < 4; i++) {
    const introChildCtr = new PIXI.Container();
    introChildCtr.visible = i === 0 ? true : false;

    const image = new PIXI.Sprite(introSheet.textures[`intro_${i + 1}.png`]);
    introChildCtr.addChild(image);

    const style = {
      fill: "white",
      fontFamily: "Arial Black",
      padding: 5,
      miterLimit: 2,
      strokeThickness: 6,
      align: "center",
    };
    const text = new PIXI.Text(`${texts[i]}`, style);
    text.anchor.set(0.5, 0.5);
    text.position.set(canvas.width / 2, canvas.height / 2);
    introChildCtr.addChild(text);

    introCtr.addChild(introChildCtr);
  }

  const enterKeySprite = new PIXI.Sprite(mainSheet.textures["enter_key.png"]);
  enterKeySprite.anchor.set(0.5, 0.5);
  enterKeySprite.position.set(75, 501);

  const enterKeyText = new PIXI.Text("NEXT", {
    fill: "white",
    fontSize: 18,
    fontWeight: 800,
    strokeThickness: 4,
  });
  enterKeyText.anchor.set(0.5, 0.5);
  enterKeyText.x = 105 + enterKeyText.width / 2;
  enterKeyText.y = 501;

  const whiteScreen = new PIXI.Graphics();
  whiteScreen.beginFill();
  whiteScreen.drawRect(0, 0, 1024, 576);
  whiteScreen.endFill();
  whiteScreen.alpha = 0;
  whiteScreen.visible = false;

  introCtr.addChild(enterKeySprite, enterKeyText, whiteScreen);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SETUP (2) ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function levelSetup() {
  levelCtr = new PIXI.Container();
  levelCtr.visible = false;
  app.stage.addChild(levelCtr);

  const battleground = new PIXI.Sprite(lvlSheet.textures["battleground.png"]);
  const backLand = new PIXI.Sprite(lvlSheet.textures["back_land.png"]);
  const groundDecor = new PIXI.Sprite(lvlSheet.textures["ground_decor.png"]);
  levelCtr.addChild(battleground, backLand, groundDecor);

  const gridRows = 5;
  const gridCols = 10;
  const levelGrid = Array(gridRows);
  for (let index = 0; index < levelGrid.length; index++) {
    levelGrid[index] = Array(gridCols);
  }
  findFreePositions(levelGrid, enemyWaves[0].size + 2);

  if (devMode) {
    drawGrid(levelGrid);
  }

  appendGem();
  appendEnemies();

  const frontDecor = new PIXI.Sprite(lvlSheet.textures["front_decor.png"]);
  levelCtr.addChild(frontDecor);

  myoSprite = new PIXI.Sprite(mainSheet.textures["rest.png"]);
  myoSprite.position.set(10, 10);
  myoSprite.isIdle = true;
  levelCtr.addChild(myoSprite);

  appendBars();
  appendWavesInfo();
}

function findFreePositions(levelGrid, posToFind) {
  for (let i = 0; i < posToFind; i++) {
    while (true) {
      const randInt = getRandomInt(0, 50);
      const randRow = ~~(randInt / 10);
      const randCol = randInt % 10;

      if (levelGrid[randRow][randCol]) continue;

      reservePosition(levelGrid, randRow, randCol);
      levelGrid[randRow][randCol] = "X";
      break;
    }
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function reservePosition(levelGrid, randRow, randCol, hidePosition = false) {
  const squareLen = 72;
  const offsetX = 152;
  const offsetY = 153;

  for (let r = randRow - 1; r <= randRow + 1; r++) {
    if (r < 0 || r > 4) continue;
    for (let c = randCol - 1; c <= randCol + 1; c++) {
      if (c < 0 || c > 9) continue;
      levelGrid[r][c] = "-";
    }
  }

  if (hidePosition) return;

  const freeX = offsetX + squareLen * randCol + squareLen / 2;
  const freeY = offsetY + squareLen * randRow + squareLen / 2;
  freePositions.push([freeX, freeY]);
}

function drawGrid(levelGrid) {
  const squareLen = 72;
  const offsetX = 152;
  const offsetY = 153;
  gridGraphic = new PIXI.Graphics();

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 10; c++) {
      const gridSymbol = levelGrid[r][c];
      const rectX = offsetX + squareLen * c;
      const rectY = offsetY + squareLen * r;
      let rectColor = 0x000000;

      if (gridSymbol === "X") rectColor = 0xff0000;
      else if (gridSymbol === "-") rectColor = 0x00ffff;

      gridGraphic.beginFill(rectColor, 0.25);
      gridGraphic.lineStyle(2);
      gridGraphic.drawRect(rectX, rectY, 72, 72);
      gridGraphic.endFill();
    }
  }

  levelCtr.addChildAt(gridGraphic, 3);
}

function appendGem() {
  gem = new PIXI.Sprite(lvlSheet.textures[`gem_${data.curtLvl}.png`]);
  gem.anchor.set(0.5, 0.5);
  gem.scale.set(0.5, 0.5);

  shield = new PIXI.AnimatedSprite(mainSheet.animations["shield"]);
  shield.anchor.set(0.5, 0.5);
  shield.animationSpeed = 0.3;
  shield.play();

  placeLevelElements([shield, gem], 3);
  drawShieldMask(totalWaves);
}

function placeLevelElements(spritesArray, indexToPlaceChild) {
  spritesArray.forEach((sprite) => {
    sprite.visible = true;
    sprite.x = freePositions[0][0];
    sprite.y = freePositions[0][1];
    levelCtr.addChildAt(sprite, indexToPlaceChild);
  });
  freePositions.splice(0, 1);
}

function drawShieldMask(wavesLeft) {
  if (donutMask) donutMask.clear();
  donutMask = new PIXI.Graphics();
  donutMask.beginFill(0xff0000);
  donutMask.drawCircle(0, 0, 36);
  donutMask.beginHole();
  donutMask.drawCircle(0, 0, 36 - (18 * wavesLeft) / totalWaves);
  donutMask.endHole();
  donutMask.endFill();
  donutMask.x = shield.x;
  donutMask.y = shield.y;
  levelCtr.addChildAt(donutMask, 5);
  shield.mask = donutMask;
}

function appendEnemies() {
  exercises.forEach((ex) => {
    enemies[ex] = new PIXI.AnimatedSprite(mainSheet.animations[`${ex}_zzz`]);
    enemies[ex].visible = false;
    enemies[ex].anchor.set(0.5, 0.5);
    enemies[ex].scale.set(1.5, 1.5);
    enemies[ex].animationSpeed = 0.06 + 0.01 * exercises.indexOf(ex);
    enemies[ex].play();

    attacks[ex] = new PIXI.AnimatedSprite(mainSheet.animations[`${ex}_att`]);
    attacks[ex].anchor.set(0.5, 0.5);
    attacks[ex].animationSpeed = 0.2;

    bursts[ex] = new PIXI.AnimatedSprite(mainSheet.animations["burst"]);
    bursts[ex].anchor.set(0.5, 0.5);
    bursts[ex].animationSpeed = 0.3;
    bursts[ex].loop = false;

    if (!enemyWaves[0].has(ex)) return;

    placeLevelElements([attacks[ex], enemies[ex]], 3);
    correctAttacksPos(ex);

    attacks[ex].visible = false;
    bursts[ex].visible = false;
  });
}

function correctAttacksPos(ex) {
  if (ex === "wave_in") {
    attacks[ex].scale.set(1.25, 1.25);
    attacks[ex].y -= 16;
  }
  if (ex === "wave_out") {
    attacks[ex].scale.set(1.25, 1.75);
    attacks[ex].y -= 12;
  }
  if (ex === "double_tap") {
    attacks[ex].scale.set(1.5, 1.5);
  }
  if (ex === "fingers_spread") {
    attacks[ex].scale.set(1.1, 1.1);
    attacks[ex].x += 3;
  }
  if (ex === "fist") {
    attacks[ex].scale.set(1.25, 1);
    attacks[ex].x += 3;
  }
}

function appendBars() {
  myoBarBgd = new PIXI.Graphics();
  myoBarBgd.beginFill(0, 0.75);
  myoBarBgd.lineStyle({ width: 2, color: 0x212529 });
  myoBarBgd.drawRect(0, 0, 72, 7);
  myoBarBgd.endFill();
  myoBarBgd.visible = false;

  myoBar = new PIXI.Graphics();
  myoBar.visible = false;

  healthBarBgd = new PIXI.Graphics();
  healthBarBgd.beginFill(0, 0.75);
  healthBarBgd.lineStyle({ width: 2, color: 0x212529 });
  healthBarBgd.drawRect(0, 0, 72, 7);
  healthBarBgd.endFill();
  healthBarBgd.visible = false;

  healthBar = new PIXI.Graphics();
  healthBar.beginFill(0xdc3545);
  healthBar.drawRect(0, 0, 70, 5);
  healthBar.endFill();
  healthBar.visible = false;

  levelCtr.addChild(myoBarBgd, myoBar, healthBarBgd, healthBar);
}

function appendWavesInfo() {
  wavesInfoRects = new PIXI.Graphics();
  wavesInfoRects.beginFill(0, 0.75);
  wavesInfoRects.lineStyle({ width: 2, color: 0x677078 });
  wavesInfoRects.drawRoundedRect(0, 0, 158, 28, 5);
  wavesInfoRects.endFill();
  wavesInfoRects.beginFill(0, 0.75);
  wavesInfoRects.lineStyle({ width: 2, color: 0x677078 });
  wavesInfoRects.drawRoundedRect(0, 40, 158, 58, 5);
  wavesInfoRects.endFill();
  wavesInfoRects.position.set(1024 - wavesInfoRects.width - 9, 11);

  let style = { fontSize: 16, fontWeight: 700, fill: "white", align: "center" };

  wavesInfoUpper = new PIXI.Text("", style);
  wavesInfoUpper.anchor.set(0.5, 0.5);
  wavesInfoUpper.x = wavesInfoRects.x + 0.5 * (wavesInfoRects.width - 2);
  wavesInfoUpper.y = wavesInfoRects.y + 14;

  wavesInfoLower = new PIXI.Text(`NEXT WAVE`, style);
  wavesInfoLower.anchor.set(0.5, 0.5);
  wavesInfoLower.x = wavesInfoRects.x + 0.5 * (wavesInfoRects.width - 2);
  wavesInfoLower.y = wavesInfoRects.y + wavesInfoRects.height - 2 - 8 - 6;

  nextWaveRhombi = new PIXI.Graphics();
  rhombiCtr = new PIXI.Container();
  rhombiCtr.addChild(nextWaveRhombi);

  levelCtr.addChild(wavesInfoRects, wavesInfoUpper, wavesInfoLower, rhombiCtr);

  displayNextWave();
}

function displayNextWave() {
  nextWaveRhombi.clear();

  if (!enemyWaves[0]) {
    wavesInfoLower.text = "NO MORE\nENEMIES";
    wavesInfoLower.x = wavesInfoRects.x + 0.5 * (wavesInfoRects.width - 2);
    wavesInfoLower.y = wavesInfoRects.y + 69;
    return;
  }

  const currentWave = totalWaves - enemyWaves.length + 1;
  wavesInfoUpper.text = `WAVE ${currentWave} OF ${totalWaves}`;
  wavesInfoUpper.x = wavesInfoRects.x + 0.5 * (wavesInfoRects.width - 2);
  wavesInfoUpper.y = wavesInfoRects.y + 14;

  if (!enemyWaves[1]) {
    wavesInfoLower.text = "FINAL WAVE";
    wavesInfoLower.x = wavesInfoRects.x + 0.5 * (wavesInfoRects.width - 2);
    wavesInfoLower.y = wavesInfoRects.y + 69;
    return;
  }

  let idx = 0;
  for (const ex of enemyWaves[1]) {
    nextWaveRhombi.beginFill(colors[ex]);
    nextWaveRhombi.moveTo(10 + idx * 30, 0);
    nextWaveRhombi.lineTo(20 + idx * 30, 10);
    nextWaveRhombi.lineTo(10 + idx * 30, 20);
    nextWaveRhombi.lineTo(idx * 30, 10);
    nextWaveRhombi.lineTo(10 + idx * 30, 0);
    nextWaveRhombi.endFill();
    idx++;
  }
  rhombiCtr.x = wavesInfoUpper.x - rhombiCtr.width / 2;
  rhombiCtr.y = wavesInfoUpper.y + 34;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SETUP (3) ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function keyboardListenersSetup() {
  document.addEventListener("keydown", keyDownListener);
  document.addEventListener("keyup", keyUpListener);
}

function keyDownListener(event) {
  if (keyCode) return;

  keyCode = event.code;
  event.preventDefault();

  if (["ArrowRight", "KeyD"].includes(keyCode)) walk("east", 0.25, 0, 70, 0);
  if (["ArrowLeft", "KeyA"].includes(keyCode)) walk("west", -0.25, 0, -70, 0);
  if (["ArrowUp", "KeyW"].includes(keyCode)) walk("north", 0, -0.15, 0, -70);
  if (["ArrowDown", "KeyS"].includes(keyCode)) walk("south", 0, 0.15, 0, 70);

  if (event.repeat) return;

  if (keyCode === "Enter") {
    const unwantedStates = [loadingState, myoPauseState, endingState];
    if (unwantedStates.includes(state)) return;

    if (state === introState) {
      if (introIdx < 3) introCtr.children[introIdx].visible = false;
      if (++introIdx < 4) introCtr.children[introIdx].visible = true;
      else {
        introCtr.children[6].visible = true;
        setTimeout(goToOverworld, 1000);
      }
      return;
    }

    if (state === overworldState) {
      storeNewSessionObj(data.pt_id, data.prog_id);
      warpFromOverworld();
      return;
    }

    state = state === playState ? mainPauseState : playState;
  }

  if (keyCode === "KeyZ") Myo.trigger("pose", "fingers_spread");
  if (keyCode === "KeyF") Myo.trigger("pose", "fist");
  if (keyCode === "KeyT") Myo.trigger("pose", "double_tap");
  if (keyCode === "KeyI") Myo.trigger("pose", "wave_in");
  if (keyCode === "KeyO") Myo.trigger("pose", "wave_out");
}

function walk(direction, vx, vy, txOffset, tyOffset) {
  if (state !== playState) return;
  playerChar.textures = mainSheet.animations[`walk_${direction}`];
  playerChar.play();
  playerChar.vx = vx;
  playerChar.vy = vy;
  target.x = playerChar.x + txOffset;
  target.y = playerChar.y + tyOffset;
}

function goToOverworld() {
  state = overworldState;
  introMusic.pause();
  overworldMusic.play();
}

function storeNewSessionObj(pt_id, prog_id) {
  const transaction = gameDB.transaction("sessions", "readwrite");
  const objectStore = transaction.objectStore("sessions");
  const sessionData = {
    username: username,
    pt_id: pt_id,
    prog_id: prog_id,
    start_ts: Date.now() / 1000,
    success: false,
    wvi_sets: 0,
    wvo_sets: 0,
    fst_sets: 0,
    dtp_sets: 0,
    fsd_sets: 0,
  };

  const addRequest = objectStore.add(sessionData);
  addRequest.onsuccess = () => {
    sesObjKey = addRequest.result;
    window.addEventListener("beforeunload", confirmUnload);
  };
}

function confirmUnload(e) {
  const confirmationMessage = "o/";
  (e || window.event).returnValue = confirmationMessage;
  return confirmationMessage;
}

function warpFromOverworld() {
  warpAnimation.visible = true;
  warpAnimation.play();
  setTimeout(teleportToLevel, 600);
}

function teleportToLevel() {
  overworldCtr.visible = false;
  warpAnimation.stop();
  warpAnimation.visible = false;
  placeLevelElements([playerChar], 3);
  levelCtr.addChildAt(warpAnimation, 5);
  levelCtr.addChildAt(charge, 5);
  levelCtr.visible = true;
  overworldMusic.pause();
  levelMusic.play();
  state = playState;
  warpInLevel();
}

function warpInLevel() {
  warpAnimation.x = playerChar.x;
  warpAnimation.y = playerChar.y;
  warpAnimation.visible = true;
  warpAnimation.play();
  setTimeout(stopWarping, 600);
}

function stopWarping() {
  warpAnimation.stop();
  warpAnimation.visible = false;
  playerChar.alpha = 1;
}

function keyUpListener(event) {
  if (keyCode !== event.code) return;

  if (["ArrowRight", "KeyD"].includes(keyCode)) halt("east", 0.25, 0, 70, 0);
  if (["ArrowLeft", "KeyA"].includes(keyCode)) halt("west", -0.25, 0, -70, 0);
  if (["ArrowUp", "KeyW"].includes(keyCode)) halt("north", 0, -0.15, 0, -70);
  if (["ArrowDown", "KeyS"].includes(keyCode)) halt("south", 0, 0.15, 0, 70);

  if (keyCode === "KeyZ") Myo.trigger("pose_off", "fingers_spread");
  if (keyCode === "KeyF") Myo.trigger("pose_off", "fist");
  if (keyCode === "KeyT") Myo.trigger("pose_off", "double_tap");
  if (keyCode === "KeyI") Myo.trigger("pose_off", "wave_in");
  if (keyCode === "KeyO") Myo.trigger("pose_off", "wave_out");

  keyCode = undefined;
  event.preventDefault();
}

function halt(direction) {
  if (state !== playState) return;
  playerChar.textures = mainSheet.animations[`stand_${direction}`];
  playerChar.vx = 0;
  playerChar.vy = 0;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SETUP (4) ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function myoListenersSetup() {
  Myo.onError = myoConnectionListener;
  Myo.on("ready", myoConnectionListener);

  if (devMode) {
    Myo.on("pose", myoPoseOnListener);
    Myo.on("pose_off", myoPoseOffListener);
    return;
  }

  Myo.on("status", myoStatusListener);
  evtSource = new EventSource("http://127.0.0.1:8080/");
  evtSource.addEventListener("pose", myoPoseOnListener);
  evtSource.addEventListener("pose_off", myoPoseOffListener);
}

function myoConnectionListener(event) {
  if (event.type === "error") Myo.error = true;
  else Myo.setLockingPolicy("none");
  loadingCtr.visible = false;

  // postponedState = data.curtLvl === 1 ? introState : overworldState;

  if (data.curtLvl === 1) {
    postponedState = introState;
    introMusic.play();
  } else {
    postponedState = overworldState;
    overworldMusic.play();
  }

  if (devMode) {
    state = postponedState;
    return;
  }

  state = myoPauseState;
}

function myoStatusListener(event) {
  const myoStatusEvents = [
    "arm_synced",
    "arm_unsynced",
    "connected",
    "disconnected",
    "warmup_completed",
  ];

  // if (event.type === "battery_level") console.log(Myo.myos[0].batteryLevel);

  if (myoStatusEvents.includes(event.type) && state !== myoPauseState) {
    postponedState = state;
    state = myoPauseState;
  }
}

function myoPoseOnListener(event) {
  const input = devMode ? event : event.data;

  if (!target.exercise) return;
  if (input !== target.exercise) return;
  if (myoBar.restMode) return;
  if (enemies[input].defeated) return;
  if (!enemyWaves[0]) return;

  myoSprite.texture = PIXI.utils.TextureCache[`${input}_on.png`];
  myoSprite.isIdle = false;

  myoBar.dur = data.durations[input];
  myoBar.init = true;

  adjustChargeAnimation();

  timeoutID = setTimeout(indicateSuccess, myoBar.dur, input);
}

function adjustChargeAnimation() {
  charge.isCompleted = false;
  charge.alpha = 1;
  if (playerChar.textures[0].textureCacheIds[0].includes("east")) {
    playerChar.textures = mainSheet.animations["attack_east"];
    charge.x = playerChar.x + playerChar.width / 2 - 4;
    charge.y = playerChar.y - 8;
  } else if (playerChar.textures[0].textureCacheIds[0].includes("west")) {
    playerChar.textures = mainSheet.animations["attack_west"];
    charge.x = playerChar.x - playerChar.width / 2 + 4;
    charge.y = playerChar.y - 8;
  } else if (playerChar.textures[0].textureCacheIds[0].includes("south")) {
    playerChar.textures = mainSheet.animations["attack_south"];
    charge.x = playerChar.x + playerChar.width / 2;
    charge.y = playerChar.y + 2;
  } else {
    playerChar.textures = mainSheet.animations["attack_north"];
    charge.x = playerChar.x + playerChar.width / 2;
    charge.y = playerChar.y - 2;
  }
  charge.visible = true;
  charge.gotoAndPlay(0);
  playerChar.play();
}

function indicateSuccess(input) {
  myoSprite.texture = PIXI.utils.TextureCache[`${input}_ok.png`];

  myoBar.successMode = true;
  myoBar.clear();
  myoBar.beginFill(0x198754);
  myoBar.drawRect(0, 0, 70, 5);
  myoBar.endFill();

  charge.alpha = 0;
  charge.gotoAndStop(8);
  charge.isCompleted = true;

  if (repCounter !== data.repsToDo[input] - 1) myoBar.dur = data.restBtwReps;
  else myoBar.dur = data.restBtwSets > 1000 ? data.restBtwSets : 1000;
}

function myoPoseOffListener(event) {
  const input = devMode ? event : event.data;

  if (myoBar.restMode) return;

  myoSprite.isIdle = true;
  restorePlayerChar();
  clearTimeout(timeoutID);

  if (!myoBar.successMode) {
    myoBar.clear();
    return;
  }

  myoBar.restMode = true;
  myoBar.successMode = false;
  myoBar.init = true;

  attacks[`${input}`].gotoAndPlay(0);
  attacks[`${input}`].visible = true;

  restTimeoutID = setTimeout(applyAttackImpact, myoBar.dur, input);
}

function restorePlayerChar() {
  if (playerChar.textures[0].textureCacheIds[0].includes("east")) {
    playerChar.textures = mainSheet.animations["stand_east"];
  } else if (playerChar.textures[0].textureCacheIds[0].includes("west")) {
    playerChar.textures = mainSheet.animations["stand_west"];
  } else if (playerChar.textures[0].textureCacheIds[0].includes("south")) {
    playerChar.textures = mainSheet.animations["stand_south"];
  } else {
    playerChar.textures = mainSheet.animations["stand_north"];
  }
  playerChar.play();
  charge.visible = false;
}

function applyAttackImpact(input) {
  myoBar.restMode = false;
  myoBar.clear();

  attacks[`${input}`].stop();
  attacks[`${input}`].visible = false;

  const factor = Math.random() < 0.5 ? 0.5 : -0.5;
  enemies[input].gotoAndStop(0);
  enemies[input].rotation = factor * Math.PI;

  repCounter += 1;

  if (repCounter !== data.repsToDo[input]) {
    setTimeout(restoreEnemySprite, 1000, input);
    return;
  }

  enemies[input].defeated = true;
  healthBar.init = true;
  setTimeout(finishRoutineSet, 1000, input);
}

function restoreEnemySprite(input) {
  enemies[input].rotation = 0;
  enemies[input].alpha = 1;

  if (!enemies[input].defeated) {
    enemies[input].gotoAndPlay(0);
    return;
  }

  enemies[input].visible = false;
}

function finishRoutineSet(input) {
  restoreEnemySprite(input);
  enemies[input].defeated = false;
  enemyWaves[0].delete(input);

  repCounter = 0;
  updateSessionObj(sesObjKey, input);

  if (enemyWaves[0].size === 0) {
    updateEnemyWave();
  }
}

function updateSessionObj(sesObjKey, exercise) {
  const transaction = gameDB.transaction("sessions", "readwrite");
  const objectStore = transaction.objectStore("sessions");

  const getRequest = objectStore.get(sesObjKey);
  getRequest.onsuccess = () => {
    const data = getRequest.result;

    const map = new Map([
      ["wave_in", "wvi_sets"],
      ["wave_out", "wvo_sets"],
      ["double_tap", "dtp_sets"],
      ["fingers_spread", "fsd_sets"],
      ["fist", "fst_sets"],
    ]);
    const dataObjKey = map.get(exercise);

    data[dataObjKey] += 1;
    data.end_ts = Date.now() / 1000;

    objectStore.put(data, sesObjKey);
  };
}

function uploadSession(sesObjKey) {
  const transaction = gameDB.transaction("sessions", "readwrite");
  const objectStore = transaction.objectStore("sessions");

  const getRequest = objectStore.get(sesObjKey);
  getRequest.onsuccess = async () => {
    const data = getRequest.result;
    data.success = true;

    const url = "http://127.0.0.1:5000/api/sessions/";
    const initObj = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
    const response = await fetch(url, initObj);

    if (response.ok) {
      objectStore.delete(sesObjKey);
    }
  };
}

function updateEnemyWave() {
  enemyWaves.splice(0, 1);
  displayNextWave();

  if (enemyWaves[0]) {
    updateFreePositions();
    drawShieldMask(enemyWaves.length);
    for (const ex of enemyWaves[0]) {
      placeLevelElements([bursts[ex], attacks[ex], enemies[ex]], 3);
      correctAttacksPos(ex);
      createBurstAnimation(ex);
    }
    return;
  }

  myoSprite.texture = PIXI.utils.TextureCache["rest.png"];
  shield.visible = false;
  healthBarBgd.visible = false;
  healthBar.visible = false;
  myoBarBgd.visible = false;
  myoBar.visible = false;
}

function updateFreePositions() {
  const gridRows = 5;
  const gridCols = 10;
  const levelGrid = Array(gridRows);
  for (let index = 0; index < levelGrid.length; index++) {
    levelGrid[index] = Array(gridCols);
  }

  const squareLen = 72;
  const offsetX = 152;
  const offsetY = 169;

  const playerRow = ~~((playerChar.y - offsetY) / squareLen);
  const playerCol = ~~((playerChar.x - offsetX) / squareLen);
  reservePosition(levelGrid, playerRow, playerCol, true);
  levelGrid[playerRow][playerCol] = "X";

  const gemRow = ~~((gem.y - offsetY) / squareLen);
  const gemCol = ~~((gem.x - offsetX) / squareLen);
  reservePosition(levelGrid, gemRow, gemCol, true);
  levelGrid[gemRow][gemCol] = "X";

  findFreePositions(levelGrid, enemyWaves[0].size);

  if (devMode) {
    gridGraphic.clear();
    drawGrid(levelGrid);
  }
}

function createBurstAnimation(ex) {
  enemies[ex].visible = false;
  attacks[ex].visible = false;
  bursts[ex].gotoAndPlay(0);
  setTimeout(() => {
    enemies[ex].visible = true;
  }, 500);
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ STATE FUNCS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function loadingState() {
  loadingTextObj.rotation = 0.125 * Math.sin(prevTs / 500);
}

function myoPauseState() {
  pauseCtr.visible = true;

  if (Myo.error) {
    pauseHeading.text = "ERROR";
    pauseBody.text = "RUN THE MYO CONNECT APPLICATION AND RELOAD";
    return;
  }

  pauseHeading.text = "PAUSED";

  const pauseHeadingFactor = 0.03 * Math.sin(prevTs / 250) + 1.02;
  pauseHeading.scale.set(pauseHeadingFactor, pauseHeadingFactor);

  if (Myo.myos.length === 0 || Myo.myos[0].connected === false) {
    pauseBody.text = "CONNECT THE MYO ARMBAND TO YOUR COMPUTER";
    return;
  }
  if (Myo.myos[0].synced === false) {
    pauseBody.text = "WAVE OUT AND HOLD TO SYNC THE MYO ARMBAND";
    return;
  }
  if (Myo.myos[0].warmupState === "cold") {
    pauseBody.text = "WAIT FOR THE MYO ARMBAND TO BE WARMED UP";
    return;
  }

  pauseBody.text = "PRESS ENTER TO CONTINUE";
  state = postponedState;
}

function introState() {
  pauseCtr.visible = false;
  introCtr.visible = true;

  if (introMusic.volume < 0.3) introMusic.volume += 0.003;
  if (introCtr.children[6].visible) introCtr.children[6].alpha += 0.02;
}

function overworldState() {
  pauseCtr.visible = false;
  if (introCtr) introCtr.visible = false;
  overworldCtr.visible = true;

  if (warpAnimation.visible) playerChar.alpha -= 0.1;
}

function mainPauseState() {
  pauseCtr.visible = true;

  pauseHeading.text = "PAUSED";
  pauseBody.text = "PRESS ENTER TO CONTINUE";

  const pauseHeadingFactor = 0.03 * Math.sin(prevTs / 250) + 1.02;
  pauseHeading.scale.set(pauseHeadingFactor, pauseHeadingFactor);
}

function endingState() {
  pauseCtr.visible = false;
  levelCtr.visible = false;
  endingCtr.visible = true;
}

function playState() {
  pauseCtr.visible = false;
  overworldCtr.visible = false;
  levelCtr.visible = true;

  playerChar.x += tsDiff * playerChar.vx;
  playerChar.y += tsDiff * playerChar.vy;
  target.x += tsDiff * playerChar.vx;
  target.y += tsDiff * playerChar.vy;

  boundPlayerToScreen();
  handleSpritesCollision(shield);

  if (!enemyWaves[0]) return;

  for (const ex of enemyWaves[0]) handleSpritesCollision(enemies[ex]);
  const ne = findNearEnemy();

  if (ne) {
    animatePossibleDefeat(ne);
    if (target.exercise && target.exercise !== ne) cancelExerciseAttempt();
    if (!enemies[ne].oriented) orientEnemyToPlayer(ne);
    if (myoSprite.isIdle) showHealthAndHint(ne);
    target.exercise = ne;
  }
  if (!ne) {
    restoreExerciseParameters();
    for (const ex of enemyWaves[0]) {
      animatePossibleDefeat(ex);
      if (enemies[ex].oriented) restoreEnemy(ex);
    }
  }

  animateMyoBars();
  if (charge.isCompleted) charge.alpha = 0.5 * (1 + Math.sin(prevTs / 250));
}

function boundPlayerToScreen() {
  if (playerChar.x < 16) playerChar.x = 16;
  if (playerChar.y < 189 - 36) playerChar.y = 189 - 36;
  if (playerChar.x > 1008) playerChar.x = 1008;
  if (playerChar.y > 576 - 63 - 36) playerChar.y = 576 - 63 - 36;
}

function handleSpritesCollision(sprite) {
  let xDist = Math.abs(sprite.x - playerChar.x);
  let yDist = Math.abs(sprite.y - playerChar.y);
  let hwCombined = sprite.width / 2 + playerChar.width / 2;
  let hhCombined = sprite.height / 2 + playerChar.height / 2;

  if (!(xDist < hwCombined && yDist < hhCombined)) return;

  if (!enemyWaves[0]) {
    uploadSession(sesObjKey);
    window.removeEventListener("beforeunload", confirmUnload);
    state = endingState;
    return;
  }

  if (target.y === playerChar.y) {
    if (playerChar.x < sprite.x) {
      playerChar.x = sprite.x - hwCombined;
      target.x = sprite.x - hwCombined + 70;
    } else {
      playerChar.x = sprite.x + hwCombined;
      target.x = sprite.x + hwCombined - 70;
    }
  } else {
    if (playerChar.y < sprite.y) {
      playerChar.y = sprite.y - hhCombined;
      target.y = sprite.y - hhCombined + 70;
    } else {
      playerChar.y = sprite.y + hhCombined;
      target.y = sprite.y + hhCombined - 70;
    }
  }
}

function findNearEnemy() {
  for (const ex of enemyWaves[0]) {
    let xDist = Math.abs(enemies[ex].x - target.x);
    let yDist = Math.abs(enemies[ex].y - target.y);
    let hwEnemy = enemies[ex].width / 2;
    let hhEnemy = enemies[ex].height / 2;
    if (xDist < hwEnemy && yDist < hhEnemy) return ex;
  }
}

function animatePossibleDefeat(enemyKey) {
  if (healthBar.init) {
    startTs = prevTs;
    healthBar.init = false;
  }

  if (enemies[enemyKey].defeated) {
    enemies[enemyKey].alpha = 1 - 0.001 * (prevTs - startTs);
  }
}

function cancelExerciseAttempt() {
  const targetEx = target.exercise;

  enemies[targetEx].textures = mainSheet.animations[`${targetEx}_zzz`];
  enemies[targetEx].play();
  enemies[targetEx].oriented = false;

  repCounter = 0;

  if (!restTimeoutID) return;

  clearTimeout(restTimeoutID);

  myoBar.restMode = false;
  myoBar.clear();

  attacks[targetEx].stop();
  attacks[targetEx].visible = false;
}

function orientEnemyToPlayer(ex) {
  healthBarBgd.x = enemies[ex].x - 36;
  healthBar.x = enemies[ex].x - 35;
  myoBarBgd.x = enemies[ex].x - 36;
  myoBar.x = enemies[ex].x - 35;

  healthBarBgd.y = enemies[ex].y - 52;
  healthBar.y = enemies[ex].y - 51;
  myoBarBgd.y = enemies[ex].y - 63;
  myoBar.y = enemies[ex].y - 62;
  if (target.x === playerChar.x) {
    if (playerChar.y < target.y) {
      enemies[ex].textures = mainSheet.animations[`${ex}_north`];
      healthBarBgd.y = enemies[ex].y + 41;
      healthBar.y = enemies[ex].y + 42;
      myoBarBgd.y = enemies[ex].y + 52;
      myoBar.y = enemies[ex].y + 53;
    } else enemies[ex].textures = mainSheet.animations[`${ex}_south`];
  } else {
    if (playerChar.x < target.x) {
      enemies[ex].textures = mainSheet.animations[`${ex}_west`];
    } else enemies[ex].textures = mainSheet.animations[`${ex}_east`];
  }
  healthBarBgd.visible = true;
  healthBar.visible = true;
  myoBarBgd.visible = true;
  myoBar.visible = true;
  enemies[ex].play();
  enemies[ex].oriented = true;
}

function showHealthAndHint(enemyKey) {
  myoSprite.texture = PIXI.utils.TextureCache[`${enemyKey}_hint.png`];
  healthBar.clear();
  healthBar.beginFill(0xdc3545);
  healthBar.drawRect(0, 0, 70 - (70 * repCounter) / data.repsToDo[enemyKey], 5);
  healthBar.endFill();
}

function restoreExerciseParameters() {
  myoSprite.texture = PIXI.utils.TextureCache["rest.png"];
  target.exercise = undefined;
  repCounter = 0;
  healthBarBgd.visible = false;
  healthBar.visible = false;
  myoBarBgd.visible = false;
  myoBar.visible = false;
}

function restoreEnemy(ex) {
  enemies[ex].textures = mainSheet.animations[`${ex}_zzz`];
  enemies[ex].play();
  enemies[ex].oriented = false;
  attacks[ex].stop();
  attacks[ex].visible = false;
  if (restTimeoutID) {
    clearTimeout(restTimeoutID);
    myoBar.restMode = false;
    myoBar.clear();
    attacks[ex].stop();
    attacks[ex].visible = false;
  }
}

function animateMyoBars() {
  if (myoBar.init) {
    startTs = prevTs;
    myoBar.init = false;
  }

  if (!myoSprite.isIdle && !myoBar.successMode) {
    myoBar.clear();
    myoBar.beginFill(0x0d6efd);
    myoBar.drawRect(0, 0, (70 * (prevTs - startTs)) / myoBar.dur, 5);
    myoBar.endFill();
  } else if (myoBar.restMode) {
    myoBar.clear();
    myoBar.beginFill(0xffffff);
    myoBar.drawRect(0, 0, 70 - (70 * (prevTs - startTs)) / myoBar.dur, 5);
    myoBar.endFill();
  }
}
