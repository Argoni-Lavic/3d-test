import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';


let scene, camera, cameraHolder, renderer, UIholder, key;
let keys = {};
let keyDown = false;

let velocity = new THREE.Vector3();
let moveSpeed = 0.5;
let pitch = 0;
let isFlying = false;
let yVelocity = 0;
let onGround = false;

let gridSize = 1000;
let chunkSize = 25;
let chunkMeshes = [];
let renderDistance = 5;

let elevation = 2; 
let terrainScale = 0.05;
let terrain = [];

let grassColor = 0x228B22;
let grassColorVariance = 0.1;

let minimumPlayerY = 0;
let playerHeight = 1.6;

let selectedSlotIndex = -1;
let hotbarSlots = [];
let slotGlows = [];

let placementGrid = [];

// Create a texture loader
const textureLoader = new THREE.TextureLoader();

// Use the URL link for the night sky image
let skyTexture = textureLoader.load('https://images.unsplash.com/photo-1570284613060-766c33850e00?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3');

function init() {

  // Scene and Renderer
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 100, 0);
  scene.add(light);

  createGround();

  // Camera, Holder, and sky
  // Create a large inverted sphere to act as the sky
  const skyGeometry = new THREE.SphereGeometry(gridSize * 1, 8, 8);
  const skyMaterial = new THREE.MeshBasicMaterial({
  map: skyTexture,        // Apply the night sky texture
  side: THREE.BackSide,   // Render the inside of the sphere
  opacity: 0.9,           // Optional: add slight transparency for better blending
  transparent: true       // Allow transparency if needed
});
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.position.set(gridSize / 2, 0, gridSize / 2);
  scene.add(sky);
  createUI();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, gridSize * 2.1);
  camera.position.y = playerHeight;
  cameraHolder = new THREE.Object3D();
  cameraHolder.add(camera);
  camera.add(UIholder);
  scene.add(cameraHolder);

  cameraHolder.position.x = gridSize / 2;
  cameraHolder.position.z = gridSize / 2;
  cameraHolder.position.y = getGroundLevel(cameraHolder.position.x, cameraHolder.position.y, cameraHolder.position.z) + playerHeight + 2
  cameraHolder.rotation.y = 180;

  // Pointer lock
  document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
  });
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  
    if (e.code === 'KeyF') {
      if (isFlying){
        cameraHolder.position.y = getGroundLevel(cameraHolder.position.x, cameraHolder.position.y, cameraHolder.position.z) + playerHeight;
      }
      isFlying = !isFlying;
      console.log('Fly mode:', isFlying ? 'ON' : 'OFF');
    }
    key = parseInt(e.key);
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

function createUI() {
  UIholder = new THREE.Object3D();
  const geometry = new THREE.CircleGeometry(0.05, 12);
  const glowGeometry = new THREE.CircleGeometry(0.06, 12); // slightly bigger

  const baseColor = 0x00d8e6;
  const slotPositions = [-0.35, -0.25, -0.15, -0.05, 0.05, 0.15, 0.25, 0.35];

  for (let i = 0; i < slotPositions.length; i++) {
    const material = new THREE.MeshBasicMaterial({ color: baseColor });
    const slot = new THREE.Mesh(geometry, material);
    slot.position.set(slotPositions[i], -0.6, -1);
    scene.add(slot);
    UIholder.add(slot);
    hotbarSlots.push(slot);

    // Create glow ring (transparent and dim)
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xbee9f7, transparent: true, opacity: 0 });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(slot.position);
    scene.add(glow);
    UIholder.add(glow);
    slotGlows.push(glow);
  }
}

function createGround() {
  // Generate terrain heights
  for (let x = 0; x < gridSize; x++) {
    terrain[x] = [];
    for (let z = 0; z < gridSize; z++) {
      terrain[x][z] = pseudoNoise(x, z);
    }
  }

  
  for (let chunkX = 0; chunkX < gridSize; chunkX += chunkSize) {
    for (let chunkZ = 0; chunkZ < gridSize; chunkZ += chunkSize) {
      const positions = [];
      const indices = [];
      const colors = [];
      let vertexIndex = 0;

      for (let x = chunkX; x < Math.min(chunkX + chunkSize, gridSize - 1); x++) {
        for (let z = chunkZ; z < Math.min(chunkZ + chunkSize, gridSize - 1); z++) {
          const v0 = [x, terrain[x][z], z];
          const v1 = [x + 1, terrain[x + 1][z], z];
          const v2 = [x + 1, terrain[x + 1][z + 1], z + 1];
          const v3 = [x, terrain[x][z + 1], z + 1];

          positions.push(...v0, ...v1, ...v2, ...v3);

          const quadColor = randomizeColor(grassColor, grassColorVariance);
          for (let i = 0; i < 4; i++) {
            colors.push(quadColor.r, quadColor.g, quadColor.b);
          }

          indices.push(
            vertexIndex, vertexIndex + 1, vertexIndex + 2,
            vertexIndex + 2, vertexIndex + 3, vertexIndex
          );

          vertexIndex += 4;
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: false,
        side: THREE.DoubleSide
      });

      const chunkMesh = new THREE.Mesh(geometry, material);
      chunkMesh.position.set(chunkX, 0, chunkZ); // ⬅️ key fix
      geometry.translate(-chunkX, 0, -chunkZ);   // ⬅️ correct for local-space vertices

      scene.add(chunkMesh);
      chunkMeshes.push(chunkMesh);

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

function randGrid(x, z) {
  // Coherent random grid value
  return Math.sin(x * 157.5 + z * 311.7) * 43758.5453123 % 1;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function fade(t) {
  // Smoother interpolation curve
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function interpolatedNoise(x, z, scale) {
  x *= scale;
  z *= scale;

  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const x1 = x0 + 1;
  const z1 = z0 + 1;

  const sx = fade(x - x0);
  const sz = fade(z - z0);

  const n00 = randGrid(x0, z0);
  const n10 = randGrid(x1, z0);
  const n01 = randGrid(x0, z1);
  const n11 = randGrid(x1, z1);

  const ix0 = lerp(n00, n10, sx);
  const ix1 = lerp(n01, n11, sx);
  const value = lerp(ix0, ix1, sz);

  return value * elevation;
}

function pseudoNoise(x, z) {
  return( 
    interpolatedNoise(x, z, terrainScale / 3) * elevation -
    interpolatedNoise(z, x, terrainScale / 100) * elevation +
    interpolatedNoise(x, z, terrainScale / 10) * elevation * 10 -
    interpolatedNoise(x, z, terrainScale / 1000) * elevation * 100
  ); // adjust 40 for terrain height
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
  player()
  
  updateChunkVisibility();

  renderer.render(scene, camera);
}

function player(){

  if (key >= 1 && key <= 8) {
    selectSlot(key - 1);
  }

  velocity.set(0, 0, 0);

  if (keys['KeyW']) {
    velocity.z += 1;
  } 
  if(keys['KeyS']){ 
    velocity.z -= 1;
  } 
  if (keys['KeyA']){ 
    velocity.x -= 1;
  } 
  if (keys['KeyD']){ 
    velocity.x += 1;
  } 
  if (isFlying) {
    if (keys['Space']) velocity.y += 1;
    if (keys['ShiftLeft'] || keys['ShiftRight']) velocity.y -= 1;
  } 
  if (!anyKeyPressed() && onGround){
    return;
  }
  

  velocity.normalize().multiplyScalar(moveSpeed);

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const up = new THREE.Vector3(0, 1, 0);

  const prevX = cameraHolder.position.x;
  const prevZ = cameraHolder.position.z;
  const prevY = cameraHolder.position.y - playerHeight;
  const prevOnGround = onGround

  // Movement
  cameraHolder.position.add(forward.multiplyScalar(velocity.z));
  cameraHolder.position.add(right.multiplyScalar(velocity.x));

  if (isFlying) {
    cameraHolder.position.add(up.multiplyScalar(velocity.y));
    onGround = false;
  } else {
    // Gravity and jump
    const groundLevel = getGroundLevel(cameraHolder.position.x, cameraHolder.position.y, cameraHolder.position.z);
    //const groundLevel = 0;
    if (cameraHolder.position.y > groundLevel + playerHeight && cameraHolder.position.y > minimumPlayerY + playerHeight) {
      yVelocity -= 0.01; // gravity
      onGround = false;
    } else {
      yVelocity = 0;
      onGround = true;
      cameraHolder.position.y = groundLevel + playerHeight;
    }
    if (keys['Space'] && onGround) {
      yVelocity = 0.2; // jump
      onGround = false;
    }
    
    if (onGround && prevOnGround) {
      const newGroundLevel = getGroundLevel(cameraHolder.position.x, cameraHolder.position.y, cameraHolder.position.z);
      const prevGroundLevel = getGroundLevel(prevX, 0, prevZ);
    
      const dx = cameraHolder.position.x - prevX;
      const dz = cameraHolder.position.z - prevZ;
      const dy = newGroundLevel - prevGroundLevel;
    
      const horizontalDist = Math.sqrt(dx * dx + dz * dz);
      if (horizontalDist === 0) {
        horizontalDist = 0.000001;
      }
    
      const slopeAngle = Math.atan2(Math.abs(dy), horizontalDist) * (180 / Math.PI);

      if (dy < 0){
      }else{
        if (slopeAngle > 30 && slopeAngle <= 70) {
          // Revert movement on steep slope
          cameraHolder.position.x = prevX;
          cameraHolder.position.z = prevZ;
  
          cameraHolder.position.add(forward.clone().multiplyScalar(velocity.z / ((slopeAngle - 29) / 5)));
          cameraHolder.position.add(right.clone().multiplyScalar(velocity.x / ((slopeAngle - 29) / 5)));
      
          // Clamp to previous terrain height
          cameraHolder.position.y = getGroundLevel(cameraHolder.position.x, cameraHolder.position.y, cameraHolder.position.z) + playerHeight;
        }else if(slopeAngle > 70){
          cameraHolder.position.x = prevX;
          cameraHolder.position.z = prevZ;
          cameraHolder.position.y = prevY + playerHeight;
        }
      }  
    }
    if(cameraHolder.position.x < 0.5){
      cameraHolder.position.x = 0.5;
    }else if (cameraHolder.position.x > gridSize - 1.5){
      cameraHolder.position.x = gridSize - 1.5;
    }else if (cameraHolder.position.z < 0.5){
      cameraHolder.position.z = 0.5;
    }else if (cameraHolder.position.z > gridSize - 1.5){
      cameraHolder.position.z = gridSize - 1.5;
    }else{
      cameraHolder.position.y += yVelocity;
      return;
    }
    yVelocity = 0;
    return;
  }
}

function getGroundLevel(x, y, z) {
  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const z0 = Math.floor(z);
  const z1 = z0 + 1;

  if (
    x0 < 0 || x1 >= terrain.length ||
    z0 < 0 || z1 >= terrain[0].length
  ) {
    return 0; // Out of bounds
  }

  const sx = x - x0;
  const sz = z - z0;

  const h00 = terrain[x0][z0];
  const h10 = terrain[x1][z0];
  const h01 = terrain[x0][z1];
  const h11 = terrain[x1][z1];

  const h0 = h00 * (1 - sx) + h10 * sx;
  const h1 = h01 * (1 - sx) + h11 * sx;

  const terainHeight = h0 * (1 - sz) + h1 * sz;
  return terainHeight; // add more logic soon for macine placement
}

function updateChunkVisibility() {
  const playerPos = cameraHolder.position;

  for (const chunk of chunkMeshes) {
    const chunkCenter = new THREE.Vector3();
    chunk.geometry.boundingSphere || chunk.geometry.computeBoundingSphere();
    chunkCenter.copy(chunk.geometry.boundingSphere.center).add(chunk.position);

    chunk.visible = chunkCenter.distanceTo(playerPos) < (renderDistance * chunkSize);
  }
}

function selectSlot(index) {
  // Reset previous slot
  if (selectedSlotIndex !== -1) {
    hotbarSlots[selectedSlotIndex].scale.set(1, 1, 1);
    slotGlows[selectedSlotIndex].material.opacity = 0;
    hotbarSlots[selectedSlotIndex].position.y -= 0.01;
    slotGlows[selectedSlotIndex].position.y -= 0.01;
  }

  // Apply highlight to selected
  hotbarSlots[index].scale.set(1.2, 1.2, 1.2); // scale up
  slotGlows[index].material.opacity = 0.5;     // show glow
  hotbarSlots[index].position.y += 0.01;
  slotGlows[index].position.y += 0.01;
  selectedSlotIndex = index;
}

function anyKeyPressed() {
  for (let key in keys) {
    if (keys[key]) {
      return true;
    }
  }
  return false;
}

init();
