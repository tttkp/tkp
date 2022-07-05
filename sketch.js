let numSegments = 10;
let direction = 'right';

const xStart = 0;
const yStart = 250;
const diff = 10;

let xCor = [];
let yCor = [];

let xFruit = 0;
let yFruit = 0;
let scoreElem;

const channelName = "snakeChannel";
var url = new URL(window.location.href);
var owner = url.searchParams.get("role") == '1';

createServer();

function setup() {
  scoreElem = createDiv('Score = 0');
  scoreElem.position(50, 10);
  scoreElem.id = 'score';
  scoreElem.style('color', 'white');

  createCanvas(500, 500);
  frameRate(10);
  stroke(255);
  strokeWeight(10);
  updateFruitCoordinates();

  if (owner) {
    for (let i = 0; i < numSegments; i++) {
      xCor.push(xStart + i * diff);
      yCor.push(yStart);
    }
  }

  // listen for messages coming through the subcription feed on this specific channel. 
  dataServer.addListener({ message: readIncoming });
  dataServer.subscribe({ channels: [channelName] });
}

function draw() {
  background(100, 20, 30);
  stroke(255)

  if (xCor.length > 0) {
    for (let i = 0; i < xCor.length - 1; i++) {
      line(xCor[i], yCor[i], xCor[i + 1], yCor[i + 1]);
    }
    updateSnakeCoordinates();
    checkGameStatus();
    checkForFruit();
  }

  if (owner) {
    sendTheMessage()
  }
}


function updateSnakeCoordinates() {
  for (let i = 0; i < numSegments - 1; i++) {
    xCor[i] = xCor[i + 1];
    yCor[i] = yCor[i + 1];
  }
  switch (direction) {
    case 'right':
      xCor[numSegments - 1] = xCor[numSegments - 2] + diff;
      yCor[numSegments - 1] = yCor[numSegments - 2];
      break;
    case 'up':
      xCor[numSegments - 1] = xCor[numSegments - 2];
      yCor[numSegments - 1] = yCor[numSegments - 2] - diff;
      break;
    case 'left':
      xCor[numSegments - 1] = xCor[numSegments - 2] - diff;
      yCor[numSegments - 1] = yCor[numSegments - 2];
      break;
    case 'down':
      xCor[numSegments - 1] = xCor[numSegments - 2];
      yCor[numSegments - 1] = yCor[numSegments - 2] + diff;
      break;
  }
}


function checkGameStatus() {
  if (
    xCor[xCor.length - 1] > width ||
    xCor[xCor.length - 1] < 0 ||
    yCor[yCor.length - 1] > height ||
    yCor[yCor.length - 1] < 0 ||
    checkSnakeCollision()
  ) {
    noLoop();
    const scoreVal = parseInt(scoreElem.html().substring(8));
    scoreElem.html('Game ended! Your score was : ' + scoreVal);
  }
}

function checkSnakeCollision() {
  const snakeHeadX = xCor[xCor.length - 1];
  const snakeHeadY = yCor[yCor.length - 1];
  for (let i = 0; i < xCor.length - 1; i++) {
    if (xCor[i] === snakeHeadX && yCor[i] === snakeHeadY) {
      return true;
    }
  }
}


function checkForFruit() {
  point(xFruit, yFruit);
  if (xCor[xCor.length - 1] === xFruit && yCor[yCor.length - 1] === yFruit) {
    const prevScore = parseInt(scoreElem.html().substring(8));
    scoreElem.html('Score = ' + (prevScore + 1));
    xCor.unshift(xCor[0]);
    yCor.unshift(yCor[0]);
    numSegments++;

    if (owner) {
      updateFruitCoordinates();
    }
  }
}

function updateFruitCoordinates() {
  xFruit = floor(random(10, (width - 100) / 10)) * 10;
  yFruit = floor(random(10, (height - 100) / 10)) * 10;
}

function keyPressed() {
  // changeDirection(keyCode)
  sendTheMessage(keyCode)
}

function changeDirection(kc) {
  switch (kc) {
    case 74:
      if (direction !== 'right') {
        direction = 'left';
      }
      break;
    case 76:
      if (direction !== 'left') {
        direction = 'right';
      }
      break;
    case 73:
      if (direction !== 'down') {
        direction = 'up';
      }
      break;
    case 75:
      if (direction !== 'up') {
        direction = 'down';
      }
      break;
  }
}


// PubNub logic below
function sendTheMessage(kc) {
  // Send Data to the server to draw it in all other canvases
  dataServer.publish({
    channel: channelName,
    message: {
      kc: kc, // keyCode
      xCor: xCor,
      yCor: yCor,
      xFruit,
      yFruit
    },
  });
}

function readIncoming(inMessage) {
  // when new data comes in it triggers this function,
  // we call this function in the setup

  /*since an App can have many channels, we ensure that we are listening
  to the correct channel */
  if (inMessage.channel == channelName) {

    let kc = inMessage.message.kc; // get the keyCode value from the server
    let xArray = inMessage.message.xCor;
    let yArray = inMessage.message.yCor;
    let who = inMessage.publisher; // who sent the message
    // console.log(inMessage); //logging for information

    if (!owner) {
      xCor = xArray
      yCor = yArray
      xFruit = inMessage.message.xFruit
      yFruit = inMessage.message.yFruit
    }

    if (kc) {
      changeDirection(kc)
    }

  }
}