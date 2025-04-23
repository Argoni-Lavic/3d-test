import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';


let scene, camera, cameraHolder, renderer;
let keys = {};
let velocity = new THREE.Vector3();
let moveSpeed = 0.1;
let pitch = 0;
let isFlying = true;
let yVelocity = 0;
let onGround = true;
let gridSize = 20; 
let elevation = 1; 
let terrain = [];
let grassColor = randomizeColor(0x228B22, 0.1);
let grassColorVariance = 0.1

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

  createGround();

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

function createGround(){
  for (let x = 0; x < gridSize; x++) {
    terrain[x] = [];
    for (let z = 0; z < gridSize; z++) {
      // Generate noise value at (x, z)
      const noiseValue = pseudoNoise(x, z);
      // Normalize the noise to the range [0, 1], then scale to desired height
      terrain[x][z] = Math.floor(pseudoNoise(x, z) * elevation);
    }
  }
  
  for (let x = 0; x < (gridSize - 1); x++) {
    for (let z = 0; z < (gridSize - 1); z++) {
      const points = [
        new THREE.Vector3(x, terrain[x][z], z),
        new THREE.Vector3(x + 1, terrain[x + 1][z], z),
        new THREE.Vector3(x + 1, terrain[x + 1][z + 1], z + 1),
        new THREE.Vector3(x, terrain[x][z + 1], z + 1),
      ];
      
      const plane = createPlaneFromPoints(points, randomizeColor(grassColor, grassColorVariance));
      scene.add(plane);
    }
  }
}

function randomizeColor(hex, variance = 0.1) {
  const base = new THREE.Color(hex);
  const hsl = {};
  base.getHSL(hsl);
  hsl.h += (Math.random() - 0.5) * variance;
  hsl.s += (Math.random() - 0.5) * variance;
  hsl.l += (Math.random() - 0.5) * variance;
  return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
}

function pseudoNoise(x, z) {
  return Math.sin(x * 0.1 + z * 0.1) * Math.cos(z * 0.1) * 5;
}

function createPlaneFromPoints(points, color) {
  if (points.length < 3) {
    console.error("At least 3 points are needed to form a plane.");
    return;
  }

  // Check if it's a simple quadrilateral (4 points), if so, split into 2 triangles
  if (points.length === 4) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // First triangle
      ...points[0].toArray(),
      ...points[1].toArray(),
      ...points[2].toArray(),
      
      // Second triangle
      ...points[0].toArray(),
      ...points[2].toArray(),
      ...points[3].toArray(),
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    return new THREE.Mesh(geometry, material);
  }

  // If it's a convex shape (can handle more than 4 points), use ConvexGeometry
  const geometry = new THREE.ConvexGeometry(points);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
  return new THREE.Mesh(geometry, material);
}

function animate() {
  requestAnimationFrame(animate);

  velocity.set(0, 0, 0);

  if (keys['KeyW']) velocity.z += 1;
  if (keys['KeyS']) velocity.z -= 1;
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
    //const groundLevel = getGroundLevel(cameraHolder.position.x, cameraHolder.position.y, cameraHolder.position.z);
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

function getGroundHeight(x, y, z) {
  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const z0 = Math.floor(z);
  const z1 = z0 + 1;

  if (
    x0 < 0 || x1 >= terrain.length ||
    z0 < 0 || z1 >= terrain[0].length
  ) {
    return -Infinity; // Out of bounds
  }

  const sx = x - x0;
  const sz = z - z0;

  const h00 = terrain[x0][z0];
  const h10 = terrain[x1][z0];
  const h01 = terrain[x0][z1];
  const h11 = terrain[x1][z1];

  const h0 = h00 * (1 - sx) + h10 * sx;
  const h1 = h01 * (1 - sx) + h11 * sx;

  return h0 * (1 - sz) + h1 * sz;
}

init();
