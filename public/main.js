import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

let scene, camera, cameraHolder, renderer;
let keys = {};
let velocity = new THREE.Vector3();
let moveSpeed = 0.1;
let pitch = 0;
let isFlying = false;
let yVelocity = 0;
let onGround = true;


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
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  
    if (e.code === 'KeyF') {
      isFlying = !isFlying;
      console.log('Fly mode:', isFlying ? 'ON' : 'OFF');
    }
  });
  
  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  

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

  velocity.set(0, 0, 0);

  if (keys['KeyW']) velocity.z -= 1;
  if (keys['KeyS']) velocity.z += 1;
  if (keys['KeyA']) velocity.x -= 1;
  if (keys['KeyD']) velocity.x += 1;

  if (isFlying) {
    if (keys['Space']) velocity.y += 1;
    if (keys['ShiftLeft'] || keys['ShiftRight']) velocity.y -= 1;
  }

  velocity.normalize().multiplyScalar(moveSpeed);

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const up = new THREE.Vector3(0, 1, 0);

  // Movement
  cameraHolder.position.add(forward.multiplyScalar(velocity.z));
  cameraHolder.position.add(right.multiplyScalar(velocity.x));

  if (isFlying) {
    cameraHolder.position.add(up.multiplyScalar(velocity.y));
  } else {
    // Gravity and jump
    const groundLevel = 0;
    if (cameraHolder.position.y > groundLevel + 1.6) {
      yVelocity -= 0.01; // gravity
      onGround = false;
    } else {
      yVelocity = 0;
      onGround = true;
      cameraHolder.position.y = groundLevel + 1.6;
    }

    if (keys['Space'] && onGround) {
      yVelocity = 0.2; // jump
      onGround = false;
    }

    cameraHolder.position.y += yVelocity;
  }

  renderer.render(scene, camera);
}


init();
