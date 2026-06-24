function getCode(left_gesture, right_gesture) {
  let code_array = {
    "thumb_up": 1,
    "point": 2,
    "ok": 3,
  };

  let left_code = code_array[left_gesture];
  let right_code = code_array[right_gesture];

  return String(left_code) + String(right_code);
}

let currentPage = 0;

function getCharacter(code) {

  const pages = [

    // Page 0
    {
      "11": "a",
      "12": "b",
      "13": "c",
      "21": "d",
      "22": "e",
      "23": "f",
      "31": "g",
      "32": "h"
    },

    // Page 1
    {
      "11": "i",
      "12": "j",
      "13": "k",
      "21": "l",
      "22": "m",
      "23": "n",
      "31": "o",
      "32": "p"
    },

    // Page 2
    {
      "11": "q",
      "12": "r",
      "13": "s",
      "21": "t",
      "22": "u",
      "23": "v",
      "31": "w",
      "32": "x"
    },

    // Page 3
    {
      "11": "y",
      "12": "z",
      "13": " ",
      "21": "backspace"
    }

  ];

  return pages[currentPage][code] || "";
}


// 入力サンプル文章 
let sample_texts = [
  "the quick brown fox jumps over the lazy dog",
];

let game_mode = {
  now: "notready",
  previous: "notready",
};

let game_start_time = 0;
let gestures_results;
let cam = null;
let p5canvas = null;

function setup() {
  p5canvas = createCanvas(320, 240);
  p5canvas.parent('#canvas');

  let lastChar = "";
  let lastCharTime = millis();

  gotGestures = function (results) {
    gestures_results = results;

    if (results.gestures.length == 2) {

      if (game_mode.now == "ready" && game_mode.previous == "notready") {
        game_mode.previous = game_mode.now;
        game_mode.now = "playing";
        document.querySelector('input').value = "";
        game_start_time = millis();
      }

      let left_gesture;
      let right_gesture;

      if (results.handednesses[0][0].categoryName == "Left") {
        left_gesture = results.gestures[0][0].categoryName;
        right_gesture = results.gestures[1][0].categoryName;
      } else {
        left_gesture = results.gestures[1][0].categoryName;
        right_gesture = results.gestures[0][0].categoryName;
      }

      let code = getCode(left_gesture, right_gesture);

      // =========================
      // ページ切替（33固定）
      // =========================
      if (code === "33") {
        let now = millis();

        if (now - lastCharTime > 1000) {
          currentPage = (currentPage + 1) % 4;
          console.log("Page:", currentPage);
          lastCharTime = now;
        }
        return;
      }

      let c = getCharacter(code);

      let now = millis();
      if (c === lastChar) {
        if (now - lastCharTime > 1000) {
          typeChar(c);
          lastCharTime = now;
        }
      } else {
        lastChar = c;
        lastCharTime = now;
      }
    }
  }
}


// =========================
// ここから下変更禁止領域
// =========================

function typeChar(c) {
  if (c === "") return;

  document.querySelector('input').focus();
  const input = document.querySelector('input');

  if (c === "backspace") {
    input.value = input.value.slice(0, -1);
  } else {
    input.value += c;
  }

  let inputValue = input.value;

  const messageElem = document.querySelector('#message');
  const target = messageElem.innerText;

  let matchLen = 0;

  for (let i = 0; i < Math.min(inputValue.length, target.length); i++) {
    if (inputValue[i] === target[i]) matchLen++;
    else break;
  }

  const matched = target.slice(0, matchLen);
  const unmatched = target.slice(matchLen);

  messageElem.innerHTML =
    `<span style="background-color:lightgreen">${matched}</span>` +
    `<span>${unmatched}</span>`;

  if (input.value == sample_texts[0]) {
    sample_texts.shift();

    if (sample_texts.length == 0) {
      game_mode.previous = game_mode.now;
      game_mode.now = "finished";

      document.querySelector('input').value = "";

      const elapsedSec = ((millis() - game_start_time) / 1000).toFixed(2);
      document.querySelector('#message').innerText = `Finished: ${elapsedSec} sec`;
    } else {
      document.querySelector('input').value = "";
      document.querySelector('#message').innerText = sample_texts[0];
    }
  }
}


function startWebcam() {
  if (window.setCameraStreamToMediaPipe) {
    cam = createCapture(VIDEO);
    cam.hide();

    cam.elt.onloadedmetadata = function () {
      window.setCameraStreamToMediaPipe(cam.elt);
    }

    p5canvas.style('width', '100%');
    p5canvas.style('height', 'auto');
  }

  if (game_mode.now == "notready") {
    game_mode.previous = game_mode.now;
    game_mode.now = "ready";
    document.querySelector('#message').innerText = sample_texts[0];
    game_start_time = millis();
  }
}


function draw() {
  background(127);

  if (cam) {
    image(cam, 0, 0, width, height);
  }

  if (gestures_results) {

    if (gestures_results.landmarks) {
      for (const landmarks of gestures_results.landmarks) {
        for (let landmark of landmarks) {
          noStroke();
          fill(100, 150, 210);
          circle(landmark.x * width, landmark.y * height, 10);
        }
      }
    }

    for (let i = 0; i < gestures_results.gestures.length; i++) {
      let name = gestures_results.gestures[i][0].categoryName;

      let pos = {
        x: gestures_results.landmarks[i][0].x * width,
        y: gestures_results.landmarks[i][0].y * height,
      };

      textSize(20);
      fill(0);
      textAlign(CENTER, CENTER);
      text(name, pos.x, pos.y);
    }
  }

  if (game_mode.now == "notready") {
    let msg = "Press start button";
    textSize(18);
    textAlign(CENTER, CENTER);
    text(msg, width / 2, height / 2);
  }

  else if (game_mode.now == "ready") {
    let msg = "Waiting gestures...";
    textSize(18);
    textAlign(CENTER, CENTER);
    text(msg, width / 2, height / 2);
  }

  else if (game_mode.now == "playing") {
    let elapsedSec = ((millis() - game_start_time) / 1000).toFixed(2);
    let msg = `${elapsedSec}s  Page:${currentPage}`;

    textSize(18);
    textAlign(CENTER, CENTER);
    text(msg, width / 2, 20);
  }

  else if (game_mode.now == "finished") {
    let msg = "Game finished!";
    textSize(18);
    textAlign(CENTER, CENTER);
    text(msg, width / 2, height / 2);
  }
}