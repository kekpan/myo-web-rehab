import { sounds as Sound } from "./sound.js";
// import * as PIXI from "./pixi.js";

const canvas = document.getElementById("canvas");
const app = new PIXI.Application({ width: 1024, height: 576, view: canvas });

let loadingCtr, loadingTextObj;
createLoadingScreen();
let state = loadingState;

let [prevTs, tsDiff] = [0];
requestAnimationFrame(gameLoop);

let overworldCtr, pauseCtr, levelCtr, endingCtr, rhombiCtr;
let pauseHeading, pauseBody, heatsInfoUpper, heatsInfoLower;
let myoSprite, myoBar, myoBarBgd, healthBar, healthBarBgd, charge;
let playerChar, warpAnimation, shield, gem, bonusBar, bonusBarBgd;
let donutMask, heatsInfoRects, nextHeatRhombi;
let mainSheet, lvlSheet, music, enemyHeats;
let timeoutID, keyPressed, playing, startTs, tZero, totalHeats, restTimeoutID;
let [repCounter, bonusTimer] = [0, 0];
let [attacks, enemies, bursts, freePositions, target] = [{}, {}, {}, [], {}];
let tempGraphics;
const exercises = [
  "fingers_spread",
  "fist",
  "double_tap",
  "wave_in",
  "wave_out",
];
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
const bypassMyo = true;

const data = {
  curtWld: 1,
  curtLvl: 1,
  // totWorlds: 4,
  totLevels: [4, 5, 5, 5],
  setsToDo: {
    fingers_spread: 2,
    fist: 1,
    double_tap: 3,
    wave_in: 4,
    wave_out: 1,
  },
  repsToDo: {
    fingers_spread: 3,
    fist: 3,
    double_tap: 3,
    wave_in: 3,
    wave_out: 3,
  },
  durations: {
    fingers_spread: 1500,
    fist: 1500,
    double_tap: 1000,
    wave_in: 1000,
    wave_out: 1500,
  },
  restBtwReps: 1500,
  restBtwSets: 0,
};

// const totSetsToDo = [...Object.values(data.setsToDo)].reduce((a, b) => a + b);

Sound.load([
  "static/sounds/overworld.mp3",
  `static/sounds/lvl_${data.curtLvl}.mp3`,
]);
Sound.whenLoaded = () => {
  PIXI.Loader.shared.baseUrl = "static/images/";
  PIXI.Loader.shared.add([
    "main.json",
    `wld_${data.curtWld}.png`,
    `lvl_${data.curtLvl}.json`,
  ]);
  PIXI.Loader.shared.load(gameSetup);
};

function gameSetup(_, resources) {
  mainSheet = resources["main.json"].spritesheet;
  lvlSheet = resources[`lvl_${data.curtLvl}.json`].spritesheet;

  music = Sound["static/sounds/overworld.mp3"];
  music.loop = true;
  music.volume = 0.25;

  partitionSetsInHeats();
  console.log(enemyHeats);
  calculateBonusDuration();

  createPlayerChar();

  overworldSetup();
  levelSetup();
  pauseSetup();

  // FIXME:
  endingCtr = new PIXI.Container();
  endingCtr.visible = false;
  app.stage.addChild(endingCtr);
  const endingText = new PIXI.Text("OK", {
    fill: 0xffffff,
    fontWeight: "bold",
  });
  endingText.x = canvas.width / 2 - endingText.width / 2;
  endingText.y = canvas.height / 2 - endingText.height / 2;
  endingCtr.addChild(endingText);

  keyboardListenersSetup();
  myoListenersSetup();

  Myo.connect();
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

function partitionSetsInHeats() {
  let auxArray = new Array();
  exercises.forEach((ex) => {
    for (let idx = 0; idx < data.setsToDo[ex]; idx++)
      auxArray.push(exercises.indexOf(ex) + 1);
  });
  auxArray = rearrangeArray(auxArray, auxArray.length);

  let idx = 0;
  enemyHeats = [new Set()];
  auxArray.forEach((auxNum) => {
    if (!enemyHeats[idx].has(exercises[auxNum - 1])) {
      enemyHeats[idx].add(exercises[auxNum - 1]);
    } else {
      enemyHeats.push(new Set());
      idx++;
      enemyHeats[idx].add(exercises[auxNum - 1]);
    }
  });

  totalHeats = enemyHeats.length;
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

function calculateBonusDuration() {
  exercises.forEach((ex) => {
    bonusTimer += data.setsToDo[ex] * data.repsToDo[ex] * data.durations[ex];
    bonusTimer += (data.repsToDo[ex] - 1) * data.restBtwReps;
  });
  let totalSets = [...Object.values(data.setsToDo)].reduce((a, b) => a + b);
  bonusTimer += (totalSets - 1) * data.restBtwSets;
  bonusTimer *= 3;
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
    PIXI.Loader.shared.resources[`wld_${data.curtWld}.png`].texture
  );
  overworldCtr.addChild(background);

  createOverworldPlatforms();
  createOverworldInfo();
}

function createOverworldPlatforms() {
  const platformsCtr = new PIXI.Container();

  for (let idx = 0; idx < data.totLevels[data.curtWld - 1]; idx++) {
    let tempSprite;
    if (idx < data.curtLvl - 1) {
      tempSprite = new PIXI.Sprite(mainSheet.textures["green_platform.png"]);
    } else if (idx === data.curtLvl - 1) {
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

  playerChar.x = platformsCtr.x + 140 * (data.curtLvl - 1) + 37;
  playerChar.y = canvas.height / 2 - playerChar.height / 2;
  warpAnimation.x = playerChar.x;
  warpAnimation.y = playerChar.y;

  overworldCtr.addChild(lineObj, platformsCtr, playerChar, warpAnimation);
}

function createOverworldInfo() {
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

  const footerText = new PIXI.Text(`LEVEL ${data.curtWld}-${data.curtLvl}`, {
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

function levelSetup() {
  levelCtr = new PIXI.Container();
  levelCtr.visible = false;
  app.stage.addChild(levelCtr);

  const battleground = new PIXI.Sprite(lvlSheet.textures["battleground.png"]);
  const backLand = new PIXI.Sprite(lvlSheet.textures["back_land.png"]);
  const groundDecor = new PIXI.Sprite(lvlSheet.textures["ground_decor.png"]);
  levelCtr.addChild(battleground, backLand, groundDecor);

  let grid = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];
  findFreePositions(grid, enemyHeats[0].size + 2);
  appendGem();
  appendEnemies();

  const frontDecor = new PIXI.Sprite(lvlSheet.textures["front_decor.png"]);
  levelCtr.addChild(frontDecor);

  myoSprite = new PIXI.Sprite(mainSheet.textures["rest.png"]);
  myoSprite.position.set(10, 10); // myoSprite.position.set(914, 10);
  myoSprite.isIdle = true;
  levelCtr.addChild(myoSprite);

  appendBars();
  appendHeatsInfo();
}

function findFreePositions(grid, numOfPositions) {
  // tempGraphics = new PIXI.Graphics();
  for (let i = 0; i < numOfPositions; i++) {
    while (true) {
      let int = getRandomInt(0, 50);
      let row = ~~(int / 10);
      let col = int % 10;
      if (grid[row][col] === 0) {
        freePositions.push([72 * col + 36 + 152, 72 * row + 189]);
        for (let r = row - 1; r <= row + 1; r++) {
          if (r < 0 || r > 4) continue;
          for (let c = col - 1; c <= col + 1; c++) {
            if (c < 0 || c > 9) continue;
            grid[r][c] = 1;
            // tempGraphics.beginFill(0xff0000);
            // tempGraphics.lineStyle(2);
            // tempGraphics.drawRect(72 * c + 152, 72 * r + 189 - 36, 72, 72);
            // tempGraphics.endFill();
          }
        }
        break;
      }
    }
  }
  // levelCtr.addChildAt(tempGraphics, 3);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
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
  drawShieldMask(totalHeats);
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

function drawShieldMask(heatsLeft) {
  if (donutMask) donutMask.clear();
  donutMask = new PIXI.Graphics();
  donutMask.beginFill(0xff0000);
  donutMask.drawCircle(0, 0, 36);
  donutMask.beginHole();
  donutMask.drawCircle(0, 0, 36 - (18 * heatsLeft) / totalHeats);
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

    if (!enemyHeats[0].has(ex)) return;

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

  bonusBarBgd = new PIXI.Graphics();
  bonusBarBgd.beginFill(0, 0.75);
  bonusBarBgd.lineStyle({ width: 2, color: 0x677078 });
  bonusBarBgd.drawRoundedRect(0, 0, 494, 28, 5);
  bonusBarBgd.endFill();
  bonusBarBgd.position.set(10 + 100 + 124 + 1, 11);

  let style = { fontSize: 16, fontWeight: 700, fill: "white", align: "center" };
  const bonusBarTxt = new PIXI.Text("BONUS", style);
  bonusBarTxt.anchor.set(0.5, 0.5);
  bonusBarTxt.x = bonusBarBgd.x + bonusBarTxt.width / 2 + 7;
  bonusBarTxt.y = bonusBarBgd.y + 1 + bonusBarBgd.height / 2 - 2;

  bonusBarBgd.lineStyle({ width: 2, color: 0x677078 });
  bonusBarBgd.moveTo(bonusBarTxt.width + 14, 0);
  bonusBarBgd.lineTo(bonusBarTxt.width + 14, 28);
  bonusBarBgd.endFill();

  bonusBar = new PIXI.Graphics();
  bonusBar.beginFill(0xd63384, 0.75);
  bonusBar.drawRect(0, 0, 492 - bonusBarTxt.width - 14, 26);
  bonusBar.endFill();
  bonusBar.x = bonusBarTxt.x + bonusBarTxt.width / 2 + 7 + 1;
  bonusBar.y = bonusBarBgd.y + 1;

  levelCtr.addChild(myoBarBgd, myoBar, healthBarBgd, healthBar);
  levelCtr.addChild(bonusBarBgd, bonusBarTxt, bonusBar);
}

function appendHeatsInfo() {
  heatsInfoRects = new PIXI.Graphics();
  heatsInfoRects.beginFill(0, 0.75);
  heatsInfoRects.lineStyle({ width: 2, color: 0x677078 });
  heatsInfoRects.drawRoundedRect(0, 0, 158, 28, 5);
  heatsInfoRects.endFill();
  heatsInfoRects.beginFill(0, 0.75);
  heatsInfoRects.lineStyle({ width: 2, color: 0x677078 });
  heatsInfoRects.drawRoundedRect(0, 40, 158, 58, 5);
  heatsInfoRects.endFill();
  heatsInfoRects.position.set(1024 - heatsInfoRects.width - 9, 11);

  let style = { fontSize: 16, fontWeight: 700, fill: "white", align: "center" };

  heatsInfoUpper = new PIXI.Text("", style);
  heatsInfoUpper.anchor.set(0.5, 0.5);
  heatsInfoUpper.x = heatsInfoRects.x + 0.5 * (heatsInfoRects.width - 2);
  heatsInfoUpper.y = heatsInfoRects.y + 14;

  heatsInfoLower = new PIXI.Text(`NEXT HEAT`, style);
  heatsInfoLower.anchor.set(0.5, 0.5);
  heatsInfoLower.x = heatsInfoRects.x + 0.5 * (heatsInfoRects.width - 2);
  heatsInfoLower.y = heatsInfoRects.y + heatsInfoRects.height - 2 - 8 - 6;

  nextHeatRhombi = new PIXI.Graphics();
  rhombiCtr = new PIXI.Container();
  rhombiCtr.addChild(nextHeatRhombi);

  levelCtr.addChild(heatsInfoRects, heatsInfoUpper, heatsInfoLower, rhombiCtr);

  displayNextHeat();
}

function displayNextHeat() {
  nextHeatRhombi.clear();
  if (enemyHeats[0]) {
    heatsInfoUpper.text = `HEAT ${
      totalHeats - enemyHeats.length + 1
    } OF ${totalHeats}`;
    heatsInfoUpper.x = heatsInfoRects.x + 0.5 * (heatsInfoRects.width - 2);
    heatsInfoUpper.y = heatsInfoRects.y + 14;
    if (enemyHeats[1]) {
      let idx = 0;
      for (const ex of enemyHeats[1]) {
        nextHeatRhombi.beginFill(colors[ex]);
        nextHeatRhombi.moveTo(10 + idx * 30, 0);
        nextHeatRhombi.lineTo(20 + idx * 30, 10);
        nextHeatRhombi.lineTo(10 + idx * 30, 20);
        nextHeatRhombi.lineTo(idx * 30, 10);
        nextHeatRhombi.lineTo(10 + idx * 30, 0);
        nextHeatRhombi.endFill();
        idx++;
      }
      rhombiCtr.x = heatsInfoUpper.x - rhombiCtr.width / 2;
      rhombiCtr.y = heatsInfoUpper.y + 34;
    } else {
      heatsInfoLower.text = "FINAL HEAT";
      heatsInfoLower.x = heatsInfoRects.x + 0.5 * (heatsInfoRects.width - 2);
      heatsInfoLower.y = heatsInfoRects.y + 69;
    }
  } else {
    heatsInfoLower.text = `LEVEL\nCOMPLETED`;
    heatsInfoLower.x = heatsInfoRects.x + 0.5 * (heatsInfoRects.width - 2);
    heatsInfoLower.y = heatsInfoRects.y + 69;
  }
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

  pauseHeading = new PIXI.Text("", {
    fill: "gold",
    fontSize: 60,
    fontWeight: "bolder",
  });
  pauseHeading.anchor.set(0.5, 0.5);
  pauseHeading.position.set(canvas.width / 2, canvas.height / 6);
  pauseCtr.addChild(pauseHeading);

  pauseBody = new PIXI.Text("", {
    fill: "white",
    fontSize: 36,
    fontWeight: "bold",
  });
  pauseBody.anchor.set(0.5, 0.5);
  pauseBody.position.set(canvas.width / 2, canvas.height / 2);
  pauseCtr.addChild(pauseBody);
}

function gameLoop(currentTs) {
  tsDiff = currentTs - prevTs;
  prevTs = currentTs;
  requestAnimationFrame(gameLoop);
  state();
}

function loadingState() {
  loadingTextObj.rotation = 0.125 * Math.sin(prevTs / 500);
}

function myoPauseState() {
  pauseCtr.visible = true;

  if (bypassMyo) {
    if (playing) {
      state = mainPauseState;
      pauseBody.text = "PRESS ENTER TO CONTINUE";
    } else {
      state = overworldState;
      playing = true;
    }
    return;
  }

  if (Myo.error) {
    pauseHeading.text = "ERROR";
    pauseBody.text = "RUN THE MYO CONNECT APPLICATION AND RELOAD";
    return;
  }

  pauseHeading.text = "PAUSED";

  let pauseHeadingFactor = 0.03 * Math.sin(prevTs / 250) + 1.02;
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

  if (playing) {
    state = mainPauseState;
    pauseBody.text = "PRESS ENTER TO CONTINUE";
  } else {
    state = overworldState;
    playing = true;
  }
}

function mainPauseState() {
  pauseCtr.visible = true;

  pauseHeading.text = "PAUSED";
  pauseBody.text = "PRESS ENTER TO CONTINUE";

  let pauseHeadingFactor = 0.03 * Math.sin(prevTs / 250) + 1.02;
  pauseHeading.scale.set(pauseHeadingFactor, pauseHeadingFactor);
}

function overworldState() {
  pauseCtr.visible = false;
  overworldCtr.visible = true;

  if (warpAnimation.visible) playerChar.alpha -= 0.1;
}

function playState() {
  pauseCtr.visible = false;
  levelCtr.visible = true;

  playerChar.x += tsDiff * playerChar.vx;
  playerChar.y += tsDiff * playerChar.vy;
  target.x += tsDiff * playerChar.vx;
  target.y += tsDiff * playerChar.vy;

  if (!bonusBar.empty) {
    bonusBar.clear();
    bonusBar.beginFill(0xd63384, 0.75);
    let width = Math.max(420 - (420 * (Date.now() - tZero)) / bonusTimer, 0);
    if (width === 0) bonusBar.empty = true;
    bonusBar.drawRect(0, 0, width, 26);
    bonusBar.endFill();
  }

  boundPlayerToScreen();
  handleSpritesCollision(shield);
  if (!enemyHeats[0]) return;
  for (const ex of enemyHeats[0]) handleSpritesCollision(enemies[ex]);

  let en = findNearEnemy();
  if (en) {
    if (healthBar.init) {
      startTs = prevTs;
      healthBar.init = false;
    }
    if (enemies[en].defeated) {
      enemies[en].alpha = 1 - 0.001 * (prevTs - startTs);
    }
    if (target.exercise && target.exercise !== en) {
      repCounter = 0;
      enemies[target.exercise].textures =
        mainSheet.animations[`${target.exercise}_zzz`];
      enemies[target.exercise].play();
      enemies[target.exercise].oriented = false;
      if (restTimeoutID) {
        clearTimeout(restTimeoutID);
        myoBar.restMode = false;
        myoBar.clear();
        attacks[target.exercise].stop();
        attacks[target.exercise].visible = false;
      }
    }

    healthBarBgd.x = enemies[en].x - 36;
    healthBar.x = enemies[en].x - 35;
    myoBarBgd.x = enemies[en].x - 36;
    myoBar.x = enemies[en].x - 35;
    target.exercise = en;
    if (myoSprite.isIdle) {
      myoSprite.texture = PIXI.utils.TextureCache[`${en}_hint.png`];
      healthBar.clear();
      healthBar.beginFill(0xdc3545);
      healthBar.drawRect(0, 0, 70 - (70 * repCounter) / data.repsToDo[en], 5);
      healthBar.endFill();
    }
    if (!enemies[en].oriented) {
      orientEnemyToPlayer(en);
      enemies[en].oriented = true;
    }
  } else {
    target.exercise = undefined;
    repCounter = 0;
    myoSprite.texture = PIXI.utils.TextureCache["rest.png"];
    healthBarBgd.visible = false;
    healthBar.visible = false;
    myoBarBgd.visible = false;
    myoBar.visible = false;
    for (const ex of enemyHeats[0]) {
      if (enemies[ex].defeated) {
        enemies[ex].alpha = 1 - 0.001 * (prevTs - startTs);
      }
      if (enemies[ex].oriented) {
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
    }
  }

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

  if (charge.isCompleted) charge.alpha = 0.5 * (1 + Math.sin(prevTs / 250));
}

function endingState() {
  levelCtr.visible = false;
  endingCtr.visible = true;
}

function orientEnemyToPlayer(ex) {
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
}

function findNearEnemy() {
  for (const ex of enemyHeats[0]) {
    let xDist = Math.abs(enemies[ex].x - target.x);
    let yDist = Math.abs(enemies[ex].y - target.y);
    let hwEnemy = enemies[ex].width / 2;
    let hhEnemy = enemies[ex].height / 2;
    if (xDist < hwEnemy && yDist < hhEnemy) return ex;
  }
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
  if (xDist < hwCombined && yDist < hhCombined) {
    if (!enemyHeats[0]) {
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
}

function keyboardListenersSetup() {
  document.addEventListener("keydown", keyDownListener);
  document.addEventListener("keyup", keyUpListener);
}

function keyDownListener(event) {
  if (keyPressed) return;

  keyPressed = event.code;
  event.preventDefault();

  if (keyPressed === "ArrowRight") {
    playerChar.textures = mainSheet.animations["walk_east"];
    playerChar.play();
    playerChar.vx = 0.25;
    target.x = playerChar.x + 70;
    target.y = playerChar.y;
  }
  if (keyPressed === "ArrowLeft") {
    playerChar.textures = mainSheet.animations["walk_west"];
    playerChar.play();
    playerChar.vx = -0.25;
    target.x = playerChar.x - 70;
    target.y = playerChar.y;
  }
  if (keyPressed === "ArrowUp") {
    playerChar.textures = mainSheet.animations["walk_north"];
    playerChar.play();
    playerChar.vy = -0.15;
    target.x = playerChar.x;
    target.y = playerChar.y - 70;
  }
  if (keyPressed === "ArrowDown") {
    playerChar.textures = mainSheet.animations["walk_south"];
    playerChar.play();
    playerChar.vy = 0.15;
    target.x = playerChar.x;
    target.y = playerChar.y + 70;
  }

  if (event.repeat) return;

  if (keyPressed === "Enter") {
    if (state === overworldState) {
      transitionToLevel();
    } else if (state === playState) {
      state = mainPauseState;
    } else if (state === mainPauseState) {
      state = playState;
    }
  }

  if (keyPressed === "KeyS") {
    Myo.trigger("pose", "fingers_spread");
  }
  if (keyPressed === "KeyF") {
    Myo.trigger("pose", "fist");
  }
  if (keyPressed === "KeyT") {
    Myo.trigger("pose", "double_tap");
  }
  if (keyPressed === "KeyI") {
    Myo.trigger("pose", "wave_in");
  }
  if (keyPressed === "KeyO") {
    Myo.trigger("pose", "wave_out");
  }
}

function keyUpListener(event) {
  if (keyPressed !== event.code) return;

  if (keyPressed === "ArrowRight") {
    playerChar.textures = mainSheet.animations["stand_east"];
    playerChar.vx = 0;
  }
  if (keyPressed === "ArrowLeft") {
    playerChar.textures = mainSheet.animations["stand_west"];
    playerChar.vx = 0;
  }
  if (keyPressed === "ArrowUp") {
    playerChar.textures = mainSheet.animations["stand_north"];
    playerChar.vy = 0;
  }
  if (keyPressed === "ArrowDown") {
    playerChar.textures = mainSheet.animations["stand_south"];
    playerChar.vy = 0;
  }

  if (keyPressed === "KeyS") {
    Myo.trigger("pose_off", "fingers_spread");
  }
  if (keyPressed === "KeyF") {
    Myo.trigger("pose_off", "fist");
  }
  if (keyPressed === "KeyT") {
    Myo.trigger("pose_off", "double_tap");
  }
  if (keyPressed === "KeyI") {
    Myo.trigger("pose_off", "wave_in");
  }
  if (keyPressed === "KeyO") {
    Myo.trigger("pose_off", "wave_out");
  }

  keyPressed = undefined;
  event.preventDefault();
}

function transitionToLevel() {
  warpAnimation.visible = true;
  warpAnimation.play();
  setTimeout(() => {
    overworldCtr.visible = false;
    warpAnimation.stop();
    warpAnimation.visible = false;
    placeLevelElements([playerChar], 3);
    levelCtr.addChildAt(warpAnimation, 5);
    levelCtr.addChildAt(charge, 5);
    levelCtr.visible = true;
    state = playState;
    warpInTransition();
    music.pause();
    music = Sound[`static/sounds/lvl_${data.curtLvl}.mp3`];
    music.loop = true;
    music.volume = 0.25;
    music.play();
  }, 600);
}

function warpInTransition() {
  warpAnimation.x = playerChar.x;
  warpAnimation.y = playerChar.y;
  warpAnimation.visible = true;
  warpAnimation.play();
  setTimeout(() => {
    warpAnimation.stop();
    warpAnimation.visible = false;
    playerChar.alpha = 1;
    tZero = Date.now();
  }, 600);
}

function myoListenersSetup() {
  Myo.on("status", myoStatusListener);
  Myo.onError = myoConnectionListener;
  Myo.on("ready", myoConnectionListener);
  Myo.on("pose", myoPoseOnListener);
  Myo.on("pose_off", myoPoseOffListener);
}

function myoStatusListener(event) {
  const myoStatusEvents = [
    "arm_synced",
    "arm_unsynced",
    "connected",
    "disconnected",
    "warmup_completed",
  ];

  if (event.type === "battery_level") {
    console.log(Myo.myos[0].batteryLevel);
  } else if (myoStatusEvents.includes(event.type)) {
    state = myoPauseState;
  }
}

function myoConnectionListener(event) {
  state = myoPauseState;
  if (event.type === "error") Myo.error = true;
  else Myo.setLockingPolicy("none");
  loadingCtr.visible = false;
  music.play();
}

function myoPoseOnListener(ex) {
  // keyPressed = "MYO";
  if (
    !target.exercise ||
    ex !== target.exercise ||
    myoBar.restMode ||
    enemies[ex].defeated ||
    !enemyHeats[0]
  )
    return;

  myoSprite.texture = PIXI.utils.TextureCache[`${ex}_on.png`];
  myoSprite.isIdle = false;

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

  myoBar.dur = data.durations[ex];
  myoBar.init = true;

  timeoutID = setTimeout(() => {
    myoSprite.texture = PIXI.utils.TextureCache[`${ex}_ok.png`];
    myoBar.successMode = true;
    myoBar.clear();
    myoBar.beginFill(0x198754);
    myoBar.drawRect(0, 0, 70, 5);
    myoBar.endFill();
    charge.alpha = 0;
    charge.gotoAndStop(8);
    charge.isCompleted = true;
    if (repCounter !== data.repsToDo[ex] - 1) myoBar.dur = data.restBtwReps;
    else myoBar.dur = data.restBtwSets > 1000 ? data.restBtwSets : 1000;
  }, myoBar.dur);
}

function updateFreePositions() {
  let grid = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  let row = ~~((playerChar.y - 169) / 72);
  let col = ~~((playerChar.x - 152) / 72);
  for (let r = row - 1; r <= row + 1; r++) {
    if (r < 0 || r > 4) continue;
    for (let c = col - 1; c <= col + 1; c++) {
      if (c < 0 || c > 9) continue;
      grid[r][c] = 1;
    }
  }

  row = ~~((gem.y - 169) / 72);
  col = ~~((gem.x - 152) / 72);
  for (let r = row - 1; r <= row + 1; r++) {
    if (r < 0 || r > 4) continue;
    for (let c = col - 1; c <= col + 1; c++) {
      if (c < 0 || c > 9) continue;
      grid[r][c] = 1;
    }
  }

  findFreePositions(grid, enemyHeats[0].size);
}

function myoPoseOffListener(ex) {
  // keyPressed = undefined;
  myoSprite.isIdle = true;

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

  if (myoBar.successMode) {
    myoBar.restMode = true;
    myoBar.successMode = false;
    myoBar.init = true;
    attacks[`${ex}`].gotoAndPlay(0);
    attacks[`${ex}`].visible = true;
    restTimeoutID = setTimeout(() => {
      myoBar.restMode = false;
      myoBar.clear();
      attacks[`${ex}`].stop();
      attacks[`${ex}`].visible = false;
      enemies[ex].gotoAndStop(0);
      let factor = Math.random() < 0.5 ? 0.5 : -0.5;
      enemies[ex].rotation = factor * Math.PI;
      if (++repCounter === data.repsToDo[ex]) {
        enemies[ex].defeated = true;
        healthBar.init = true;
        setTimeout(() => {
          enemies[ex].defeated = false;
          enemyHeats[0].delete(ex);
          enemies[ex].visible = false;
          enemies[ex].alpha = 1;
          enemies[ex].rotation = 0;
          repCounter = 0;
          if (enemyHeats[0].size === 0) {
            enemyHeats.splice(0, 1);
            displayNextHeat();
            if (enemyHeats[0]) {
              // levelCtr.removeChild(tempGraphics);
              updateFreePositions();
              drawShieldMask(enemyHeats.length);
              for (const ex of enemyHeats[0]) {
                placeLevelElements([bursts[ex], attacks[ex], enemies[ex]], 3);
                correctAttacksPos(ex);
                enemies[ex].visible = false;
                attacks[ex].visible = false;
                bursts[ex].gotoAndPlay(0);
                setTimeout(() => {
                  enemies[ex].visible = true;
                }, 500);
              }
            } else {
              myoSprite.texture = PIXI.utils.TextureCache["rest.png"];
              shield.visible = false;
              healthBarBgd.visible = false;
              healthBar.visible = false;
              myoBarBgd.visible = false;
              myoBar.visible = false;
              Myo.trigger("pose_off");
            }
          }
        }, 1000);
      } else {
        setTimeout(() => {
          enemies[ex].gotoAndPlay(0);
          enemies[ex].rotation = 0;
        }, 1000);
      }
    }, myoBar.dur);
  } else if (!myoBar.restMode) {
    myoBar.clear();
  }
  clearTimeout(timeoutID);
}
