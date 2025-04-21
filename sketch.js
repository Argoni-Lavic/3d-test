const povX = 60
const povY = 60
const canvasWidth = 600
const canvasHeight = 600

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  background(200);
}
  
function draw() {
  fill(255, 0, 0);
  quad(getCanvisPoint(0, 100, povX, canvasWidth), getCanvisPoint(0, 100, povY, canvasHeight), getCanvisPoint(50, 100, povX, canvasWidth), getCanvisPoint(0, 100, povY, canvasHeight), getCanvisPoint(50, 200, povX, canvasWidth), getCanvisPoint(50, 200, povY, canvasHeight), getCanvisPoint(0, 200, povX, canvasWidth), getCanvisPoint(50, 200, povY, canvasHeight))
}



function getCanvisPoint(cord, z, fovDeg, canvasSize) {
  if (z === 0) z = 0.0001;
  let angle = toDegrees(Math.atan(cord / z));
  if (Math.abs(angle) > fovDeg / 2) return null;
  let screenRatio = (angle + (fovDeg / 2)) / fovDeg;
  return screenRatio * canvasSize;
}

function toRadians(deg) {
  return deg * (Math.PI / 180);
}

function toDegrees(rad) {
  return rad * (180 / Math.PI);
}

function keyPressed() {
  console.log("Key pressed:", key);
}
  