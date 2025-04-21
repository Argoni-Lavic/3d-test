import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

let scene, camera, renderer, clock, world;
let player, velocity = new THREE.Vector3();
let keys = { W: false, A: false, S: false, D: false, SPACE: false, SHIFT: false };

let mouseX = 0, mouseY = 0;

function init() {
  // Setup scene and renderer
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 5); // Eye level height (1.6m)

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Add lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 2, 2);
  scene.add(light);

  // Basic ground (optional)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  scene.add(ground);

  // Setup the physics world (Cannon.js)
  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);

  // Create the player body (basic capsule shape for movement)
  player = new CANNON.Body({ mass: 1, position: new CANNON.Vec3(0, 1.6, 5) });
  player.addShape(new CANNON.Sphere(0.5)); // Add spherical body to represent player
  world.addBody(player);

  // Enable mouse controls for looking around
  document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
  document.addEventListener('click', () => document.body.requestPointerLock(), false);
  document.addEventListener('mousemove', (e) => onMouseMove(e), false);

  // Key event listeners for movement
  document.addEventListener('keydown', (e) => onKeyDown(e));
  document.addEventListener('keyup', (e) => onKeyUp(e));

  clock = new THREE.Clock();

  animate();
}

function onKeyDown(e) {
  if (e.key === 'w' || e.key === 'W') keys.W = true;
  if (e.key === 'a' || e.key === 'A') keys.A = true;
  if (e.key === 's' || e.key === 'S') keys.S = true;
  if (e.key === 'd' || e.key === 'D') keys.D = true;
  if (e.key === ' ' || e.key === 'Space') keys.SPACE = true;
  if (e.key === 'Shift') keys.SHIFT = true;
}

function onKeyUp(e) {
  if (e.key === 'w' || e.key === 'W') keys.W = false;
  if (e.key === 'a' || e.key === 'A') keys.A = false;
  if (e.key === 's' || e.key === 'S') keys.S = false;
  if (e.key === 'd' || e.key === 'D') keys.D = false;
  if (e.key === ' ' || e.key === 'Space') keys.SPACE = false;
  if (e.key === 'Shift') keys.SHIFT = false;
}

function onMouseMove(event) {
  // Adjust the camera rotation based on mouse movement
  const sensitivity = 0.1; // Mouse sensitivity
  const deltaX = event.movementX * sensitivity;
  const deltaY = event.movementY * sensitivity;

  mouseX += deltaX;
  mouseY += deltaY;

  // Apply camera rotation
  camera.rotation.y -= deltaX * Math.PI / 180;
  camera.rotation.x -= deltaY * Math.PI / 180;

  // Prevent flipping the camera
  camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

function movePlayer(deltaTime) {
  const moveSpeed = 5; // Speed in units per second
  const jumpHeight = 5; // Jump height

  // Move forward/backward (W/S)
  if (keys.W) velocity.z = -moveSpeed;
  else if (keys.S) velocity.z = moveSpeed;
  else velocity.z = 0;

  // Move left/right (A/D)
  if (keys.A) velocity.x = -moveSpeed;
  else if (keys.D) velocity.x = moveSpeed;
  else velocity.x = 0;

  // Apply gravity if player is above the ground
  if (player.position.y <= 1.6) {
    if (keys.SPACE) {
      player.velocity.y = jumpHeight;
    }
  }

  // Apply movement to the physics body
  player.velocity.x = velocity.x;
  player.velocity.z = velocity.z;

  // Update physics world
  world.step(1 / 60);
  player.position.copy(camera.position);
}

function animate() {
  requestAnimationFrame(animate);

  // Update the player position based on the controls
  const deltaTime = clock.getDelta();
  movePlayer(deltaTime);

  // Sync Three.js camera with the player's physics body
  camera.position.copy(player.position);

  // Render the scene
  renderer.render(scene, camera);
}

init();
