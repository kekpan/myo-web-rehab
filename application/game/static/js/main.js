import { sounds as Sound } from "./sound.js";
// import * as PIXI from "./pixi.js";

// PIXI.AnimatedSprite objects
let charge, playerChar, shield, warpAnimation;
let [attacks, bursts, enemies] = [{}, {}, {}];
// PIXI.Container objects
let endingCtr, levelCtr, loadingCtr, overworldCtr, pauseCtr, rhombiCtr;
// PIXI.Graphics objects
let bonusBar, bonusBarBgd, healthBar, healthBarBgd, myoBar, myoBarBgd;
let donutMask, nextWaveRhombi, wavesInfoRects;
// PIXI.Sprite objects
let gem, myoSprite;
// PIXI.Text objects
let pauseBody, pauseHeading, wavesInfoLower, wavesInfoUpper;
let loadingTextObj, endingInfo;

// Other pre-setup variables
let app, data, evtSource, idb, idbSesId, state, username;
// Other gameplay-related variables
let assets, keyPressed, lvlSheet, mainSheet, music, playing;
let freePositions = [];
// Other time-related variables
let restTimeoutID, startTs, timeoutID, tsDiff, tZero;
let [bonusTimer, prevTs] = [0, 0];
// Other exercise-related variables
let enemyWaves, totalWaves;
let [repCounter, target] = [0, {}];

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

// const totSetsToDo = [...Object.values(data.setsToDo)].reduce((a, b) => a + b);

document.getElementById("button").addEventListener("click", bootUp);

function bootUp() {
  document.getElementById("container").remove();

  const canvas = document.getElementById("canvas");
  app = new PIXI.Application({ width: 1024, height: 576, view: canvas });

  createLoadingScreen();
  state = loadingState;
  requestAnimationFrame(gameLoop);

  initializeIdb();
}

function fetchUserData(username) {
  fetch(`http://127.0.0.1:5000/api/programs/${username}`)
    .then((response) => response.json())
    .then((resJson) => {
      if (resJson.status == 404) {
        alert(resJson.message);
        return;
      }
      data = resJson;
      syncWithIdb();
    })
    .catch((error) => {
      alert(
        "An error ocurred while getting your data. Please try again later."
      );
      console.error("Error:", error);
    });
}

function syncWithIdb() {
  const objectStore = idb.transaction("sessions").objectStore("sessions");
  const leftoverSessions = [];
  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      if (cursor.value.username === username) {
        cursor.value.ses_id = cursor.key;
        leftoverSessions.push(cursor.value);
      }
      cursor.continue();
    } else if (leftoverSessions.length !== 0) {
      leftoverSessions.sort((a, b) => a.prog_id - b.prog_id);
      leftoverSessions.forEach((ses) => {
        fetch(`http://127.0.0.1:5000/api/sessions/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ses),
        })
          .then((response) => {
            if (response.ok) {
              const sessionObjStore = idb
                .transaction("sessions", "readwrite")
                .objectStore("sessions");
              const deleteRequest = sessionObjStore.delete(ses.ses_id);
              deleteRequest.onsuccess = () => {
                fetchUserData(username);
              };
            } else {
              throw new Error(
                "Something went wrong during the communication with the server. Please try again later."
              );
            }
          })
          .catch((error) => {
            alert(error);
          });
      });
    } else {
      checkEligibility();
    }
  };
}

function checkEligibility() {
  if (data.curtLvl === 1) {
    Sound.load([
      "static/sounds/overworld.mp3",
      `static/sounds/lvl_${data.curtLvl}.mp3`,
    ]);
    return;
  }
  const diffMilliseconds = Math.abs(new Date() - new Date(data.startDate));
  const diffDays = diffMilliseconds / (1000 * 60 * 60 * 24);
  const daysBtwLevels = (data.curtWld - 1) * 7 + data.dayWeek - 1;
  if (diffDays > daysBtwLevels - 0.25) {
    Sound.load([
      "static/sounds/overworld.mp3",
      `static/sounds/lvl_${data.curtLvl}.mp3`,
    ]);
  } else {
    const daysRemain = daysBtwLevels - 0.25 - diffDays;
    const hoursRemain = Math.floor(daysRemain * 24);
    const minsRemain = Math.ceil((daysRemain * 24 - hoursRemain) * 60);
    if (minsRemain === 60) {
      hoursRemain++;
      minsRemain = 0;
    }
    alert(
      `Not enough time passed since last game. Please come back in ${hoursRemain} hours and ${minsRemain} minutes.`
    );
  }
}

Sound.whenLoaded = async () => {
  assets = await PIXI.Assets.load([
    "static/images/main.json",
    `static/images/wld_${data.curtWld}.png`,
    `static/images/lvl_${data.curtLvl}.json`,
  ]);
  gameSetup();
};

function initializeIdb() {
  if (!indexedDB) {
    alert(
      "Your browser doesn't support a stable version of IndexedDB. Please use another browser."
    );
    return;
  }

  const openRequest = indexedDB.open("BleicDatabase");
  openRequest.onerror = () => {
    console.error("Error", openRequest.error);
  };
  openRequest.onsuccess = () => {
    idb = openRequest.result;
    username = document.getElementById("username").innerText;
    fetchUserData(username);
  };
  openRequest.onupgradeneeded = () => {
    const idb = openRequest.result;
    const objStore = idb.createObjectStore("sessions", { autoIncrement: true });
    // objStore.createIndex("pt_id", "pt_id");
    // objStore.transaction.oncomplete = (event) => {};
  };
}

function createIdbSession(pt_id, prog_id) {
  const sessionObjStore = idb
    .transaction("sessions", "readwrite")
    .objectStore("sessions");
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
  const request = sessionObjStore.add(sessionData);
  request.onsuccess = (event) => {
    idbSesId = event.target.result;
    window.addEventListener("beforeunload", confirmUnload);
  };
}

function updateIdbSession(ses_id, keyToUpdate) {
  const sessionObjStore = idb
    .transaction("sessions", "readwrite")
    .objectStore("sessions");
  const request = sessionObjStore.get(ses_id);

  request.onsuccess = (event) => {
    const data = event.target.result;
    switch (keyToUpdate) {
      case "wave_in":
        data.wvi_sets++;
        break;
      case "wave_out":
        data.wvo_sets++;
        break;
      case "double_tap":
        data.dtp_sets++;
        break;
      case "fingers_spread":
        data.fsd_sets++;
        break;
      case "fist":
        data.fst_sets++;
        break;
      case "success":
        data.success = true;
        fetch(`http://127.0.0.1:5000/api/sessions/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => {
            if (response.ok) {
              updateIdbSession(ses_id, "synced");
              return;
            }
            throw new Error("Something went wrong while uploading user data.");
          })
          .catch((error) => {
            endingInfo.text = `LEVEL COMPLETED!

FAILED TO UPLOAD DATA.`;
            console.error("Error:", error);
          });
        break;
      case "synced":
        const deleteRequest = sessionObjStore.delete(ses_id);
        // deleteRequest.onsuccess = (event) => {};
        endingInfo.text = `LEVEL COMPLETED!

DATA UPLOADED SUCCESSFULLY!
YOU MAY NOW CLOSE THE WINDOW.`;
        return;
      default:
        break;
    }
    if (keyToUpdate !== "synced") data.end_ts = Date.now() / 1000;

    const requestUpdate = sessionObjStore.put(data, ses_id);
    // requestUpdate.onsuccess = (event) => {};
  };
}

function gameSetup() {
  mainSheet = assets["static/images/main.json"];
  lvlSheet = assets[`static/images/lvl_${data.curtLvl}.json`];

  music = Sound["static/sounds/overworld.mp3"];
  music.loop = true;
  music.volume = 0.1;

  partitionSetsInWaves();
  calculateBonusDuration();

  createPlayerChar();

  overworldSetup();
  levelSetup();
  pauseSetup();

  // FIXME:
  endingCtr = new PIXI.Container();
  endingCtr.visible = false;
  app.stage.addChild(endingCtr);
  endingInfo = new PIXI.Text(
    `LEVEL COMPLETED!
  
  PLEASE WAIT WHILE DATA IS BEING UPLOADED...`,
    {
      fill: 0xffffff,
      fontWeight: "bold",
      align: "center",
    }
  );
  endingInfo.anchor.set(0.5, 0.5);
  endingInfo.position.set(canvas.width / 2, canvas.height / 2);
  endingCtr.addChild(endingInfo);

  keyboardListenersSetup();
  evtSource = new EventSource("http://127.0.0.1:8080/");
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

function partitionSetsInWaves() {
  let auxArray = new Array();
  exercises.forEach((ex) => {
    for (let idx = 0; idx < data.setsToDo[ex]; idx++)
      auxArray.push(exercises.indexOf(ex) + 1);
  });
  auxArray = rearrangeArray(auxArray, auxArray.length);

  let idx = 0;
  enemyWaves = [new Set()];
  auxArray.forEach((auxNum) => {
    if (!enemyWaves[idx].has(exercises[auxNum - 1])) {
      enemyWaves[idx].add(exercises[auxNum - 1]);
    } else {
      enemyWaves.push(new Set());
      idx++;
      enemyWaves[idx].add(exercises[auxNum - 1]);
    }
  });

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
    assets[`static/images/wld_${data.curtWld}.png`]
  );
  overworldCtr.addChild(background);

  createOverworldPlatforms();
  createOverworldInfo();
}

function createOverworldPlatforms() {
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
  findFreePositions(grid, enemyWaves[0].size + 2);
  appendGem();
  appendEnemies();

  const frontDecor = new PIXI.Sprite(lvlSheet.textures["front_decor.png"]);
  levelCtr.addChild(frontDecor);

  myoSprite = new PIXI.Sprite(mainSheet.textures["rest.png"]);
  myoSprite.position.set(10, 10); // myoSprite.position.set(914, 10);
  myoSprite.isIdle = true;
  levelCtr.addChild(myoSprite);

  appendBars();
  appendWavesInfo();
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
  if (enemyWaves[0]) {
    wavesInfoUpper.text = `WAVE ${
      totalWaves - enemyWaves.length + 1
    } OF ${totalWaves}`;
    wavesInfoUpper.x = wavesInfoRects.x + 0.5 * (wavesInfoRects.width - 2);
    wavesInfoUpper.y = wavesInfoRects.y + 14;
    if (enemyWaves[1]) {
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
    } else {
      wavesInfoLower.text = "FINAL WAVE";
      wavesInfoLower.x = wavesInfoRects.x + 0.5 * (wavesInfoRects.width - 2);
      wavesInfoLower.y = wavesInfoRects.y + 69;
    }
  } else {
    wavesInfoLower.text = `LEVEL\nCOMPLETED`;
    wavesInfoLower.x = wavesInfoRects.x + 0.5 * (wavesInfoRects.width - 2);
    wavesInfoLower.y = wavesInfoRects.y + 69;
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
  if (!enemyWaves[0]) return;
  for (const ex of enemyWaves[0]) handleSpritesCollision(enemies[ex]);

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
    for (const ex of enemyWaves[0]) {
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
  for (const ex of enemyWaves[0]) {
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
    if (!enemyWaves[0]) {
      updateIdbSession(idbSesId, "success");
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
      createIdbSession(data.pt_id, data.prog_id);
      transitionToLevel();
    } else if (state === playState) {
      state = mainPauseState;
      music.pause();
    } else if (state === mainPauseState) {
      state = playState;
      music.play();
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
    music.volume = 0.1;
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
  // Myo.on("pose", myoPoseOnListener);
  // Myo.on("pose_off", myoPoseOffListener);
  evtSource.addEventListener("pose", myoPoseOnListener);
  evtSource.addEventListener("pose_off", myoPoseOffListener);
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
    // console.log(Myo.myos[0].batteryLevel);
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

function myoPoseOnListener(event) {
  let ex = event.data;
  // let ex = event;
  // keyPressed = "MYO";
  if (
    !target.exercise ||
    ex !== target.exercise ||
    myoBar.restMode ||
    enemies[ex].defeated ||
    !enemyWaves[0]
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

  findFreePositions(grid, enemyWaves[0].size);
}

function myoPoseOffListener(event) {
  // keyPressed = undefined;
  let ex = event.data;
  // let ex = event;
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
          enemyWaves[0].delete(ex);
          enemies[ex].visible = false;
          enemies[ex].alpha = 1;
          enemies[ex].rotation = 0;
          repCounter = 0;
          updateIdbSession(idbSesId, ex);
          if (enemyWaves[0].size === 0) {
            enemyWaves.splice(0, 1);
            displayNextWave();
            if (enemyWaves[0]) {
              // levelCtr.removeChild(tempGraphics);
              updateFreePositions();
              drawShieldMask(enemyWaves.length);
              for (const ex of enemyWaves[0]) {
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

function confirmUnload(e) {
  const confirmationMessage = "o/";
  (e || window.event).returnValue = confirmationMessage;
  return confirmationMessage;
}
