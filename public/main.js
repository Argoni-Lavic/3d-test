import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

let scene, camera, cameraHolder, renderer;
let keys = {};
let velocity = new THREE.Vector3();
let moveSpeed = 0.1;
let pitch = 0;

function init() {
  // Scene and Renderer
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5);
  scene.add(light);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Camera + Holder
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.y = 1.6;
  cameraHolder = new THREE.Object3D();
  cameraHolder.add(camera);
  scene.add(cameraHolder);

  // Pointer lock
  document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
  });
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', (e) => keys[e.code] = true);
  document.addEventListener('keyup', (e) => keys[e.code] = false);

  animate();
}

function onMouseMove(e) {
  const sensitivity = 0.002;
  cameraHolder.rotation.y -= e.movementX * sensitivity;

  pitch -= e.movementY * sensitivity;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
  camera.rotation.x = pitch;
}

function animate() {
  requestAnimationFrame(animate);

  // Movement
  velocity.set(0, 0, 0);
  if (keys['KeyW']) velocity.z += 1;
  if (keys['KeyS']) velocity.z -= 1;
  if (keys['KeyA']) velocity.x += 1;
  if (keys['KeyD']) velocity.x -= 1;

  velocity.normalize().multiplyScalar(moveSpeed);

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();

  const strafe = new THREE.Vector3().crossVectors(camera.up, direction).normalize();

  cameraHolder.position.add(direction.multiplyScalar(velocity.z));
  cameraHolder.position.add(strafe.multiplyScalar(velocity.x));

  renderer.render(scene, camera);
}

init();
