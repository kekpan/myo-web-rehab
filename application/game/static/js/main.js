// import * as PIXI from "./pixi";

// PIXI application initialization
const app = new PIXI.Application({
  view: document.getElementById("canvas"),
  backgroundColor: 0x1034a6,
});

// DEV: Variable for toggling Myo usage
const bypassMyo = true;

// State variable
let state = myoHandling;
// Scene objects
let myoSceneObj, gameSceneObj, endSceneObj;
// Standalone sprites
let myoTextObj, guy, demoFeedback, restSprite, endTextObj;
// Arrays of grouped sprites
let [gems, moves, potsMenu] = [{}, {}, {}];

// Gems and pots information
const gemsPositions = [260, 368, 476, 584, 692];
const potsProperties = {
  0: { x: 5, y: 5, w: 190, h: 195, name: "Use" },
  1: { x: 5, y: 200, w: 190, h: 200, name: "Store" },
  2: { x: 5, y: 400, w: 190, h: 195, name: "Destroy" },
};

// Rehab program for current level
const program = {
  fingers_spread: { reps: 2, sets: 1, duration: 1000 },
  fist: { reps: 2, sets: 2, duration: 1000 },
  double_tap: { reps: 2, sets: 1, duration: 1000 },
  wave_in: { reps: 2, sets: 2, duration: 1000 },
  wave_out: { reps: 2, sets: 2, duration: 1000 },
};
const repsRestDuration = 1000;
const setsRestDuration = 1000;
let restActive = false;
let restFlag, restDuration;

// Reps and sets information
let remainingSets = {};
let [totalRemainingSets, setsPivot] = [0, 0];
for (const exercise in program) {
  remainingSets[exercise] = program[exercise].sets;
  totalRemainingSets += program[exercise].sets;
  if (program[exercise].sets > setsPivot) setsPivot = program[exercise].sets;
}
let onScreenExercises = [];
let idleExercise, currentExercise, previousExercise;
let currentRep = 0;

// Timing information
let basicTimer, timerBackground, successTimer, timeout, timerStart;

// Pots initialization
let potsContents = {
  0: { fingers_spread: 0, fist: 0, double_tap: 0, wave_in: 0, wave_out: 0 },
  1: { fingers_spread: 0, fist: 0, double_tap: 0, wave_in: 0, wave_out: 0 },
  2: { fingers_spread: 0, fist: 0, double_tap: 0, wave_in: 0, wave_out: 0 },
};
for (let i = 0; i < 3; i++) {
  potsContents[i].total = 0;
  potsContents[i].capacity = ~~(totalRemainingSets / 3);
  if (i < totalRemainingSets % 3) {
    potsContents[i].capacity++;
  }
}

// Basic style for in-game text
const baseTextStyle = new PIXI.TextStyle({
  fill: "white",
  fontFamily: "helsinkiregular",
});

// Load texture atlas and then call setup
PIXI.Loader.shared.add("static/images/demoLevel.json").load(setup);

function setup(loader, resources) {
  /** The "Myo" Scene */

  myoSceneObj = new PIXI.Container();
  myoSceneObj.visible = false;
  app.stage.addChild(myoSceneObj);

  myoTextObj = new PIXI.Text("", baseTextStyle);
  myoSceneObj.addChild(myoTextObj);

  /** The "Game" Scene */

  gameSceneObj = new PIXI.Container();
  gameSceneObj.visible = false;
  app.stage.addChild(gameSceneObj);

  // Pots menu
  for (let i = 0; i < 3; i++) potsMenu[i] = new PIXI.Graphics();
  drawPots(-1);

  // Dungeon
  const background = new PIXI.Sprite(
    resources["static/images/demoLevel.json"].textures["dungeon.png"]
  );
  background.x = 200;
  gameSceneObj.addChild(background);

  // Guy
  guy = new PIXI.Sprite(
    resources["static/images/demoLevel.json"].textures["guy.png"]
  );
  guy.position.set(250, 50);
  gameSceneObj.addChild(guy);

  // Gems
  let index = 0;
  for (const exercise in program) {
    gems[exercise] = new PIXI.Sprite(
      resources["static/images/demoLevel.json"].textures[`gem_${exercise}.png`]
    );
    gems[exercise].position.set(gemsPositions[index], 450);
    index++;
  }

  // Moves
  for (const exercise in program) {
    moves[exercise] = new PIXI.Sprite(
      resources["static/images/demoLevel.json"].textures[`myo_${exercise}.png`]
    );
    moves[exercise].position.set(690, 5);
    moves[exercise].visible = false;
    gameSceneObj.addChild(moves[exercise]);
  }

  // Rest
  restSprite = new PIXI.Sprite(
    resources["static/images/demoLevel.json"].textures[`rest.png`]
  );
  restSprite.position.set(690, 5);
  restSprite.visible = false;
  gameSceneObj.addChild(restSprite);

  // Sprites for timer
  timerBackground = new PIXI.Graphics();
  timerBackground.position.set(689, 109);
  timerBackground.beginFill(0x808080);
  timerBackground.lineStyle({ width: 2 });
  timerBackground.drawRect(0, 0, 102, 12);
  timerBackground.endFill();
  timerBackground.visible = false;
  gameSceneObj.addChild(timerBackground);
  basicTimer = new PIXI.Graphics();
  basicTimer.position.set(690, 110);
  basicTimer.visible = false;
  gameSceneObj.addChild(basicTimer);
  successTimer = new PIXI.Graphics();
  successTimer.position.set(690, 110);
  successTimer.beginFill(0x006400);
  successTimer.drawRect(0, 0, 100, 10);
  successTimer.endFill();
  successTimer.visible = false;
  gameSceneObj.addChild(successTimer);

  /** The "End" Scene */

  endSceneObj = new PIXI.Container();
  endSceneObj.visible = false;
  app.stage.addChild(endSceneObj);

  endTextObj = new PIXI.Text("", {
    fill: "white",
    fontFamily: "helsinkiregular",
    align: "center",
  });
  endSceneObj.addChild(endTextObj);

  /** Game controls */

  for (const exercise in program) {
    /** Pose on */
    Myo.on(exercise, () => {
      // If player is in middle of set and does another exercise, do nothing
      if (currentExercise && exercise !== currentExercise) return;

      // If the exercise selected is not available, do nothing
      if (!onScreenExercises.includes(exercise)) return;

      if (restActive || potsMenu.potEnabled === -1) return;

      // Toggle visibility
      moves[exercise].visible = true;
      basicTimer.visible = true;
      timerBackground.visible = true;

      // Timer-involved variables
      basicTimer.duration = program[exercise].duration;
      timerStart = Date.now();

      // After "exercise duration" seconds, if timeout still exists, award the player
      timeout = setTimeout(() => {
        // Toggle visibility
        successTimer.visible = true;
        basicTimer.visible = false;

        // Determine which exercise player is executing
        currentExercise = exercise;

        if (currentRep === program[exercise].reps - 1) {
          remainingSets[exercise] -= 1;
          totalRemainingSets -= 1;
          potsContents[potsMenu.potEnabled][exercise] += 1;
          potsContents[potsMenu.potEnabled].total += 1;
          if (
            potsContents[potsMenu.potEnabled].total ===
            potsContents[potsMenu.potEnabled].capacity
          ) {
            potsMenu.potEnabled += 1;
            if (
              potsContents[potsMenu.potEnabled % 3].total ===
              potsContents[potsMenu.potEnabled % 3].capacity
            ) {
              potsMenu.potEnabled += 1;
            }
            drawPots(potsMenu.potEnabled % 3);
          }
          onScreenExercises.splice(onScreenExercises.indexOf(exercise), 1);
          previousExercise = currentExercise;
          currentRep = 0;
          currentExercise = undefined;
          restDuration = setsRestDuration;
          gameSceneObj.removeChild(gems[exercise]);
          if (idleExercise) {
            onScreenExercises.push(idleExercise);
            gameSceneObj.addChild(gems[idleExercise]);
            idleExercise = false;
          }
          if (onScreenExercises.length === 0) setsPivot -= 1;
        } else {
          currentRep++;
          restDuration = repsRestDuration;
        }
        restActive = true;
        restFlag = true;
      }, program[exercise].duration);
    });

    /** Pose off */
    Myo.on(`${exercise}_off`, () => {
      // Toggle visibility
      if (!restActive) {
        moves[exercise].visible = false;
        basicTimer.visible = false;
        timerBackground.visible = false;
        successTimer.visible = false;

        basicTimer.clear();
      }

      if (restFlag) {
        restSprite.visible = true;
        successTimer.visible = false;
        timerStart = Date.now();
        basicTimer.clear();
        basicTimer.visible = true;
        basicTimer.duration = restDuration;

        restFlag = false;
        setTimeout(() => {
          restSprite.visible = false;
          basicTimer.visible = false;
          timerBackground.visible = false;
          restActive = false;
          Myo.trigger(`${exercise}_off`);
        }, restDuration);
      }

      if (timeout) clearTimeout(timeout);
    });
  }

  keyboard(49).press = () => {
    if (basicTimer.visible ^ restActive) return;
    if (potsContents[0].total === potsContents[0].capacity) return;
    drawPots(0);
  };
  keyboard(50).press = () => {
    if (basicTimer.visible ^ restActive) return;
    if (potsContents[1].total === potsContents[1].capacity) return;
    drawPots(1);
  };
  keyboard(51).press = () => {
    if (basicTimer.visible ^ restActive) return;
    if (potsContents[2].total === potsContents[2].capacity) return;
    drawPots(2);
  };

  /** DEV: Keyboard controls */

  keyboard(71).press = () => Myo.trigger("double_tap");
  keyboard(71).release = () => Myo.trigger("double_tap_off");
  keyboard(66).press = () => Myo.trigger("fingers_spread");
  keyboard(66).release = () => Myo.trigger("fingers_spread_off");
  keyboard(82).press = () => Myo.trigger("fist");
  keyboard(82).release = () => Myo.trigger("fist_off");
  keyboard(80).press = () => Myo.trigger("wave_in");
  keyboard(80).release = () => Myo.trigger("wave_in_off");
  keyboard(89).press = () => Myo.trigger("wave_out");
  keyboard(89).release = () => Myo.trigger("wave_out_off");

  demoFeedback = new PIXI.Text("", {
    fill: "#ffffff",
    fontFamily: "helsinkiregular",
    wordWrap: true,
    wordWrapWidth: 800,
    breakWords: true,
  });
  demoFeedback.x = 210;
  gameSceneObj.addChild(demoFeedback);

  /** Myo "Status Events" Handler */

  Myo.on("status", (event) => {
    if (event.type === "battery_level") {
      console.log(Myo.myos[0].batteryLevel); // TODO: Display in HUD
    } else if (
      [
        "arm_synced",
        "arm_unsynced",
        "connected",
        "disconnected",
        "warmup_completed",
      ].includes(event.type)
    ) {
      state = myoHandling;
    }
  });

  /** Connection to Myo Connect app */

  Myo.onError = () => {
    alert(
      "ERROR: Couldn't start the game. Please run the Myo Connect application on your computer, and then reload this page."
    );
  };
  Myo.on("ready", () => {
    Myo.setLockingPolicy("none");
    gameLoop();
  });
  Myo.connect();

  /** DEV: Start game loop without Myo Connect */

  if (bypassMyo) gameLoop();
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  state();
}

function play() {
  // Toggle visibility of scenes
  myoSceneObj.visible = false;
  gameSceneObj.visible = true;

  if (basicTimer.visible) {
    basicTimer.clear();
    basicTimer.beginFill(0xffffff);
    basicTimer.drawRect(
      0,
      0,
      (100 * (Date.now() - timerStart)) / basicTimer.duration,
      10
    );
    basicTimer.endFill();
  }

  if (totalRemainingSets !== 0 && setsPivot !== 0) {
    if (onScreenExercises.length === 0) {
      for (const exercise in program) {
        if (exercise === previousExercise) {
          idleExercise = exercise;
          continue;
        }
        if (remainingSets[exercise] === setsPivot) {
          onScreenExercises.push(exercise);
          gameSceneObj.addChild(gems[exercise]);
        }
      }
    }
  } else {
    let result;
    if (
      potsContents[1].fist === 1 &&
      potsContents[1].wave_out === 1 &&
      potsContents[1].fingers_spread === 1
    ) {
      result = "GOOD";
    } else if (
      potsContents[2].fist === 1 &&
      potsContents[2].wave_out === 1 &&
      potsContents[2].fingers_spread === 1
    ) {
      result = "BAD";
    } else {
      result = "NEUTRAL";
    }
    endTextObj.text = `Level Completed!

Result: ${result}

Blue:    Used ${potsContents[0].fingers_spread} -- Stored: ${potsContents[1].fingers_spread} -- Destroyed: ${potsContents[2].fingers_spread}
Red:    Used ${potsContents[0].fist} -- Stored: ${potsContents[1].fist} -- Destroyed: ${potsContents[2].fist}
Green:    Used ${potsContents[0].double_tap} -- Stored: ${potsContents[1].double_tap} -- Destroyed: ${potsContents[2].double_tap}
Purple:    Used ${potsContents[0].wave_in} -- Stored: ${potsContents[1].wave_in} -- Destroyed: ${potsContents[2].wave_in}
Yellow:    Used ${potsContents[0].wave_out} -- Stored: ${potsContents[1].wave_out} -- Destroyed: ${potsContents[2].wave_out}`;
    endTextObj.position.set(
      app.renderer.view.width / 2 - endTextObj.width / 2,
      app.renderer.view.height / 2 - endTextObj.height / 2
    );
    state = end;
  }

  // DEV: Feedback for inner representations
  const text = `EX: ${currentExercise} - REP: ${currentRep}
SETS: ${totalRemainingSets} - PIVOT: ${setsPivot}
POT: ${potsMenu["potEnabled"]}`;
  demoFeedback.text = text;

  for (let i = 0; i < 3; i++) {
    potsContents[i][
      "text"
    ].text = `${potsProperties[i]["name"]}: ${potsContents[i]["total"]}/${potsContents[i]["capacity"]}

Blue: ${potsContents[i].fingers_spread}
Red: ${potsContents[i].fist}
Green: ${potsContents[i].double_tap}
Purple: ${potsContents[i].wave_in}
Yellow: ${potsContents[i].wave_out}`;
    potsContents[i]["text"].x =
      potsMenu[i].width / 2 - potsContents[i]["text"].width / 2;
  }
}

function myoHandling() {
  // Toggle visibility of scenes
  gameSceneObj.visible = false;
  myoSceneObj.visible = true;

  // DEV: Play without Myo
  if (bypassMyo) {
    state = play;
    return;
  }

  // Determine message's position and content
  myoTextObj.position.set(
    app.renderer.view.width / 2 - myoTextObj.width / 2,
    app.renderer.view.height / 2 - myoTextObj.height / 2
  );
  if (Myo.myos.length === 0 || !Myo.myos[0].connected) {
    myoTextObj.text = "Connect Myo to your computer.";
    return;
  }
  if (!Myo.myos[0].synced) {
    myoTextObj.text = "Perform the Sync Gesture: wave out and hold.";
    return;
  }
  if (Myo.myos[0].warmupState === "cold") {
    myoTextObj.text = "Relax your arm and wear Myo for a moment to warm it up.";
    return;
  }

  // If no action needed, change game state to "play"
  state = play;
}

function end() {
  gameSceneObj.visible = false;
  myoSceneObj.visible = false;
  endSceneObj.visible = true;
}

function keyboard(keyCode) {
  const key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  key.downHandler = function (event) {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) {
        key.press();
      }
      key.isDown = true;
      key.isUp = false;
    }
    event.preventDefault();
  };
  key.upHandler = function (event) {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) {
        key.release();
      }
      key.isDown = false;
      key.isUp = true;
    }
    event.preventDefault();
  };
  window.addEventListener("keydown", key.downHandler.bind(key), false);
  window.addEventListener("keyup", key.upHandler.bind(key), false);
  return key;
}

function drawPots(k) {
  potsMenu["potEnabled"] = k;

  for (let i = 0; i < 3; i++) {
    potsMenu[i].clear();

    if (i !== k) potsMenu[i].beginFill(0xdeb886);
    else potsMenu[i].beginFill(0xdc9432);

    potsMenu[i].lineStyle({ width: 10, color: 0x6f432a });
    potsMenu[i].drawRect(
      potsProperties[i].x,
      potsProperties[i].y,
      potsProperties[i].w,
      potsProperties[i].h
    );
    potsMenu[i].endFill();

    if (k !== -1) continue;

    potsContents[i]["text"] = new PIXI.Text(
      `${potsProperties[i]["name"]}: ${potsContents[i]["total"]}/${potsContents[i]["capacity"]}

Blue: ${potsProperties[i].fingers_spread}
Red: ${potsProperties[i].fist}
Green: ${potsProperties[i].double_tap}
Purple: ${potsProperties[i].wave_in}
Yellow: ${potsProperties[i].wave_out}`,
      { fontFamily: "helsinkiregular", fontSize: 18, align: "center" }
    );
    potsContents[i]["text"].x =
      potsMenu[i].width / 2 - potsContents[i]["text"].width / 2;
    potsContents[i]["text"].y = 30 + 200 * i;
    gameSceneObj.addChild(potsMenu[i]);
    gameSceneObj.addChild(potsContents[i]["text"]);
  }
}
