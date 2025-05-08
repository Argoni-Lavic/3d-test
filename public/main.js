//imports------------------------------------------------


import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';


//vars------------------------------------------------


let scene, camera, cameraHolder, renderer, UIholder, key, colideGroupMaster, placementOutline, inventoryHolder, inventoryPanel, tree;
let colideGroup = [];
let keys = {};
let keyDown = false;

let velocity = new THREE.Vector3();
let moveSpeed = 0.5;
let playerJumpVelocity = 0.3;
let pitch = 0;
let isFlying = false;
let yVelocity = 0;
let onGround = false;

let chunkSize = 25;
let chunkMeshes = [];
let gridSizeInChunks = 40;
let gridSize = gridSizeInChunks * chunkSize;
let renderDistance = 5;
let renderDistanceSquared = (renderDistance * chunkSize) ** 2;

const point = new THREE.Vector3();
const bbox = new THREE.Box3();
const tempCenter = new THREE.Vector3();
const tempVec = new THREE.Vector3();

let lightColor = 0x909090;
let lightStrenth = 1;

let elevation = 2; 
let terrainScale = 0.05;
let terrain = [];

let grassColor = 0x228B22;
let grassColorVariance = 0.1;

let foundationColor = 0xa9a9a9;
let foundationColorVariance = 0.2;

let treeTrunkColor = 0x8B4513;
let treeTrunkVariance = 0.1;
let treeLeafColor = 0x228B22;
let treeLeafVariance = 0.1;
let minTreeSize = 6;
let maxTreeSize = 12;
let treeSpawnRate = 2;
let minTreeGenHeight = 5;
let maxTreeGenHeight = 80;

let playerHeight = 1.6 * 2;

let selectedSlotIndex = -1;
let hotbarSlots = [];
let slotGlows = [];
let UIposition = -1
let inventoryOpen = true;

let interactionDistance = 5;
let placementCorectionOffset = -1;
let ledgeClimbDistance = playerHeight * 0.75;

// Create a texture loader
const textureLoader = new THREE.TextureLoader();

// Use the URL link for the night sky image
let skyTexture = textureLoader.load('https://images.unsplash.com/photo-1570284613060-766c33850e00?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3');


//main setup loop------------------------------------------------


function init() {

  // Scene and Renderer
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const light1 = new THREE.AmbientLight(lightColor, lightStrenth);
  light1.position.set(0, 100, 0);
  scene.add(light1);

  const light2 = new THREE.AmbientLight(lightColor, lightStrenth);
  light2.position.set(gridSize, 100, 0);
  scene.add(light2);

  const light3 = new THREE.AmbientLight(lightColor, lightStrenth);
  light3.position.set(gridSize, 100, gridSize);
  scene.add(light3);

  const light4 = new THREE.AmbientLight(lightColor, lightStrenth);
  light4.position.set(0, 100, gridSize);
  scene.add(light4);

  createGround();

  createColideGroup()

  // Add machines to the group (example with cubes representing machines)
  const machine1 = new THREE.Mesh(new THREE.BoxGeometry(50, 1, 50), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
  machine1.position.set(440, 5, 520);
  addToColideGroup(machine1);

  const machine2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
  addToColideGroup(machine2);

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
  createTrees();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, gridSize * 2.1);
  
  cameraHolder = new THREE.Object3D();
  cameraHolder.add(camera);

  camera.add(UIholder);
  scene.add(cameraHolder);

  const geometry = new THREE.BoxGeometry(2, 2, 2); // Example geometry for wireframe
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true
  });
  
  placementOutline = new THREE.Mesh(geometry, wireframeMaterial);
  scene.add( placementOutline );
  placementOutline.position.set(500, 20, 500); 
  placementOutline.visible = false;

  cameraHolder.position.x = gridSize / 2;
  cameraHolder.position.z = gridSize / 2;
  cameraHolder.position.y = getGroundLevel(cameraHolder.position.x, cameraHolder.position.y, cameraHolder.position.z, true) + 2
  cameraHolder.rotation.y = 180;


  //inputs------------------------------------------------


  document.body.addEventListener('click', () => {
    
  });
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
      if(!inventoryOpen){
        playerLeftClick();
      }
    } else if (event.button === 2) {
      if(!inventoryOpen){
        playerRightClick();
      }
    }
  });

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  
    if (e.code === 'KeyF') {
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
  if(!inventoryOpen){
    const sensitivity = 0.002;
    cameraHolder.rotation.y -= e.movementX * sensitivity;

    pitch -= e.movementY * sensitivity;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    camera.rotation.x = pitch;

  }
}


function setPlaceOutline(x, y, z, rotationx, rotationy, target) {
  const dir = new THREE.Vector3();
  dir.setFromSphericalCoords(
    interactionDistance,
    Math.PI / 2 - rotationx, // polar angle (theta)
    rotationy               // azimuthal angle (phi)
  );
  target.position.x = Math.round(x + dir.x * -1);
  target.position.z = Math.round(z + dir.z * -1);
  const groundLevel = Math.round(getGroundLevel(target.position.x, y, target.position.z, false));
  const calcY = Math.round(y + dir.y) + 1;
  if (groundLevel < calcY){
    target.position.y = calcY;
  }else{
    target.position.y = groundLevel + 1;
  }
  
}


//object creators------------------------------------------------


function createUI() {
  UIholder = new THREE.Object3D();
  const geometry = new THREE.CircleGeometry(0.05, 12);
  const glowGeometry = new THREE.CircleGeometry(0.06, 12); // slightly bigger

  const baseColor = 0x00d8e6;
  const slotPositions = [-0.35, -0.25, -0.15, -0.05, 0.05, 0.15, 0.25, 0.35];

  for (let i = 0; i < slotPositions.length; i++) {
    const material = new THREE.MeshBasicMaterial({ color: baseColor });
    const slot = new THREE.Mesh(geometry, material);
    slot.position.set(slotPositions[i], -0.6, UIposition);
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

  const hologramMaterial = new THREE.MeshBasicMaterial({
    color: 0x3498db,         // Cyan or neon blue
    transparent: true,
    opacity: 0.5,            // Almost see-through
    emissive: 0x00ffff,      // Makes it "glow"
    emissiveIntensity: 1.5,  // Strong glow
    metalness: 0.8,          // Reflective shimmer
    roughness: 0.2,          // Smoother surface
    depthWrite: false        // Prevent z-buffer issues with transparency
  });
  
  inventoryHolder = new THREE.Object3D();

  inventoryPanel = createRoundedRect(2, 1, 0.1, 0.1, hologramMaterial);
  inventoryPanel.position.set(0, 0, UIposition);
  inventoryHolder.add(inventoryPanel);
  UIholder.add(inventoryHolder);
  //inventoryHolder.material.opacity = 0;
}

function createTrees(){
  for (let x = 0; x < gridSize; x++){
    for (let z = 0; z < gridSize; z++){
      if (randomBetween(0, 1000) <= treeSpawnRate){
        const y = getGroundLevel(x, 100, z);
        if (y > minTreeGenHeight && y < maxTreeGenHeight){
          tree = createTree(x, y, z, randomBetween(minTreeSize, maxTreeSize));
          scene.add(tree);
          addToColideGroup(tree);
        }
      }
    }
  }
}

function createTree(x, y, z, size = 1) {
  const trunkHeight = 2 * size;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2 * size, 0.2 * size, trunkHeight),
    new THREE.MeshStandardMaterial({ color: randomizeColor(treeTrunkColor, treeTrunkVariance) })
  );
  trunk.position.y = trunkHeight / 2;

  const tree = new THREE.Group();
  tree.add(trunk);

  // Add 3 layered cones for leaves
  for (let i = 0; i < 3; i++) {
    const coneHeight = 1 * size;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry((1.5 - i * 0.3) * size, coneHeight, 8),
      new THREE.MeshStandardMaterial({ color: randomizeColor(treeLeafColor, treeLeafVariance) })
    );
    cone.position.y = trunkHeight + i * coneHeight * 0.6;
    cone.userData.shape = 'cone';
    tree.add(cone);
  }

  // Move entire tree to (x, y, z)
  tree.position.set(x + 0.5, y, z + 0.5);
  return tree;
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

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
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

function createRoundedRect(width, height, radius, depth = 0.1, material) {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  const r = radius;

  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function createColideGroup(){
  colideGroupMaster = new THREE.Group();
  for (let x = 0; x < gridSizeInChunks; x++) {
    colideGroup[x] = [];
    for (let y = 0; y < gridSizeInChunks; y++) {
      colideGroup[x][y] = new THREE.Group();
      colideGroupMaster.add(colideGroup[x][y]);
    }
  }
  scene.add(colideGroupMaster);
}

//main rendering loop------------------------------------------------


function animate() {
  requestAnimationFrame(animate);
  setPlaceOutline(cameraHolder.position.x, cameraHolder.position.y, cameraHolder.position.z, camera.rotation.x, cameraHolder.rotation.y, placementOutline);
  player()
  
  updateChunkVisibility();

  renderer.render(scene, camera);
}

function player(){

  if (key >= 1 && key <= 8) {
    selectSlot(key - 1);
  }
  if (keys['KeyX']){
    if(placementOutline.visible == true){
      placementOutline.visible = false;
    }else{
      placementOutline.visible = true;
    }
    keys['KeyX'] = false;
  }
  if (keys['KeyE']){
    if(!inventoryOpen){
      showInventory();
    }else{
      hideInventory();
    }
    inventoryOpen = !inventoryOpen;
    keys['KeyE'] = false;
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
    const groundLevel = getGroundLevel(cameraHolder.position.x, cameraHolder.position.y - playerHeight, cameraHolder.position.z, true);
    if (cameraHolder.position.y > groundLevel + playerHeight) {
      if (!yVelocity >= -53.8){ //player terminal velocity
        yVelocity -= 0.01; // gravity
      }

      onGround = false;
    } else {
      yVelocity = 0;
      onGround = true;
      cameraHolder.position.y = groundLevel + playerHeight;
    }
    if (keys['Space'] && onGround) {
      yVelocity = playerJumpVelocity; // jump
      onGround = false;
    }
    
    if (velocity.x !== 0 || velocity.z !== 0) {
      const prevGroundLevel = getGroundLevel(prevX, prevY, prevZ, true);
    
      const dx = cameraHolder.position.x - prevX;
      const dz = cameraHolder.position.z - prevZ;
      const dy = groundLevel - prevGroundLevel;
    
      let horizontalDist = Math.sqrt(dx * dx + dz * dz);
      if (horizontalDist === 0) horizontalDist = 0.000001;
    
      const slopeAngle = Math.atan2(Math.abs(dy), horizontalDist) * (180 / Math.PI);
    
      if (dy > ledgeClimbDistance) {
        const forwardSlope = new THREE.Vector3();
        camera.getWorldDirection(forwardSlope);
        forwardSlope.y = 0;
        forwardSlope.normalize();
    
        const rightSlope = new THREE.Vector3().crossVectors(forwardSlope, camera.up).normalize();
    
        if (slopeAngle > 15 && slopeAngle <= 70) {
          cameraHolder.position.x = prevX;
          cameraHolder.position.z = prevZ;
          cameraHolder.position.add(forwardSlope.multiplyScalar(velocity.z / ((slopeAngle - 10) / 5)));
          cameraHolder.position.add(rightSlope.multiplyScalar(velocity.x / ((slopeAngle - 10) / 5)));
          //cameraHolder.position.y = getGroundLevel(cameraHolder.position.x, cameraHolder.position.y - (playerHeight / 0.75), cameraHolder.position.z, true) + playerHeight;
        } else if (slopeAngle > 70) {
          cameraHolder.position.x = prevX;
          cameraHolder.position.z = prevZ;
          cameraHolder.position.y = prevY + playerHeight;
          return;
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

function getGroundLevel(x, y, z, colideWithOtherObjects = false) {
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
  
  if (colideWithOtherObjects){
    const object = getHighestObjectBelowY(x, y, z, 0.6, colideGroup);

    if (terainHeight < object && object != null){
      return object;
    }else{
      return terainHeight;
    }
  }else{
    return terainHeight;
  }
}

function getHighestObjectBelowY(x, maxY, z, tolerance = 0.1, group) {
  let highestY = -Infinity;
  let highestObject = null;

  const nearbyObjects = getNearbyObjects(x, z);

  nearbyObjects.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.children.length > 0 || !object.geometry) return;

    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();

    bbox.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld);

    if (bbox.min.y > maxY) return;

    const cx = (bbox.min.x + bbox.max.x) / 2;
    const cz = (bbox.min.z + bbox.max.z) / 2;
    const hx = (bbox.max.x - bbox.min.x) / 2;
    const hz = (bbox.max.z - bbox.min.z) / 2;

    if (
      Math.abs(cx - x) < hx + tolerance &&
      Math.abs(cz - z) < hz + tolerance &&
      bbox.max.y > highestY
    ) {

      if (object.userData.shape === 'cone') {
        const height = bbox.max.y - bbox.min.y;
        const radius = (bbox.max.x - bbox.min.x) / 2;
        const yFromTip = bbox.max.y - maxY;
        if (yFromTip < 0 || yFromTip > height) return;

        const effectiveRadius = (yFromTip / height) * radius;

        object.getWorldPosition(tempVec);
        const dx = x - tempVec.x;
        const dz = z - tempVec.z;
        const distXZ = Math.sqrt(dx * dx + dz * dz);

        if (distXZ <= effectiveRadius + tolerance) {
          const surfaceHeight = (1 - distXZ / radius) * height;
          const surfaceY = bbox.min.y + surfaceHeight;
          if (surfaceY > highestY) {
            highestY = surfaceY;
            highestObject = object;
          }
        }
      } else {
        highestY = bbox.max.y;
        highestObject = object;
      }
    }
  });

  return highestObject ? highestY : -Infinity;
}

function updateChunkVisibility() {
  const playerPos = cameraHolder.position;

  for (const chunk of chunkMeshes) {
    const geom = chunk.geometry;
    if (!geom.boundingSphere) geom.computeBoundingSphere();

    const chunkCenter = geom.boundingSphere.center.clone().add(chunk.position);
    chunk.visible = chunkCenter.distanceToSquared(playerPos) < renderDistanceSquared;
  }

  for (let x = 0; x < gridSizeInChunks; x++) {
    for (let y = 0; y < gridSizeInChunks; y++) {
      colideGroup[x][y].children.forEach((object) => {
        if (!(object instanceof THREE.Mesh) || !object.geometry) return;

        const geom = object.geometry;
        if (!geom.boundingSphere) geom.computeBoundingSphere();

        const center = geom.boundingSphere.center.clone();
        object.localToWorld(center);

        object.visible = center.distanceToSquared(playerPos) < renderDistanceSquared;
      });
    }
  }
}

function checkForBlockAt(x, y, z, tolerance = 0.1) {
  let found = false;
  point.set(x, y, z);

  const nearbyObjects = getNearbyObjects(x, z);

  nearbyObjects.traverse((obj) => {
    if (found) return;

    if (obj instanceof THREE.Mesh && obj.geometry && obj.children.length === 0) {
      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();

      bbox.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
      bbox.expandByScalar(tolerance);

      if (bbox.containsPoint(point)) {
        bbox.expandByScalar(-tolerance); 

        if (obj.userData.shape === 'cone') {
          const height = bbox.max.y - bbox.min.y;
          const radius = (bbox.max.x - bbox.min.x) / 2;
          const coneTipY = bbox.max.y;
          const yFromTip = coneTipY - point.y;

          if (yFromTip < 0 || yFromTip > height) return;

          const effectiveRadius = (yFromTip / height) * radius;
          obj.getWorldPosition(tempCenter);

          const dx = x - tempCenter.x;
          const dz = z - tempCenter.z;
          const distXZ = Math.sqrt(dx * dx + dz * dz);

          if (distXZ <= effectiveRadius + tolerance) {
            found = true;
          }

        } else {
          found = true;
        }
      }
    }
  });

  return found;
}

function getGridCoords(position) {
  const x = Math.floor(position.x / chunkSize) + Math.floor(gridSizeInChunks / 2);
  const y = Math.floor(position.y / chunkSize) + Math.floor(gridSizeInChunks / 2);
  return [x, y];
}

function addToColideGroup(object){
  const [x, y] = getGridCoords(object.position);

  // Check boundaries to prevent errors
  if (x >= 0 && x < numCells && y >= 0 && y < numCells) {
    colideGroup[x][y].add(object);
    object.gridCoords = [x, y];  // Store the object's current cell
  }
}

function updateObjectInColideGroup(object) {
  const [oldX, oldY] = object.gridCoords;
  const [newX, newY] = getGridCoords(object.position);

  // Move the object only if it changes cells
  if (newX !== oldX || newY !== oldY) {
    // Remove from old subgroup
    colideGroup[oldX][oldY].remove(object);

    // Add to new subgroup
    addToColideGroup(object);
  }
}

function removeFromColideGroup(object){
  const [x, y] = getGridCoords(object.position);
  
  // Check boundaries to prevent errors
  if (x >= 0 && x < numCells && y >= 0 && y < numCells) {
    colideGroup[x][y].remove(object);
  }
}

function getNearbyObjects(x, z) {
  const [gridX, gridY] = getGridCoords({ x, y: 0, z });
  const nearby = [];

  // Check the current cell and adjacent cells
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const nx = gridX + dx;
      const nz = gridY + dz;

      if (nx >= 0 && nx < gridSizeInChunks && nz >= 0 && nz < numCells) {
        nearby.push(...colideGroup[nx][nz].children);
      }
    }
  }
  return nearby;
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

function showInventory(){
  document.exitPointerLock();
  inventoryPanel.material.opacity = 0.5;
}

function hideInventory(){
  document.body.requestPointerLock();
  inventoryPanel.material.opacity = 0;
}

function anyKeyPressed() {
  for (let key in keys) {
    if (keys[key]) {
      return true;
    }
  }
  return false;
}

function playerRightClick(){
  playerBreak(placementOutline.position.x, placementOutline.position.y, placementOutline.position.z);
}

function playerLeftClick() {
  const origin = placementOutline.position.clone();
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);

  // Snap direction to the nearest axis for block grid alignment
  const step = new THREE.Vector3(
    Math.round(dir.x),
    Math.round(dir.y),
    Math.round(dir.z)
  );

  // If camera is angled between axes (e.g., diagonals), snap to the dominant axis
  if (Math.abs(step.x) >= Math.abs(step.y) && Math.abs(step.x) >= Math.abs(step.z)) {
    step.set(Math.sign(step.x), 0, 0);
  } else if (Math.abs(step.y) >= Math.abs(step.x) && Math.abs(step.y) >= Math.abs(step.z)) {
    step.set(0, Math.sign(step.y), 0);
  } else {
    step.set(0, 0, Math.sign(step.z));
  }

  step.multiplyScalar(placementCorectionOffset);

  // Walk along the direction until a free space is found
  const maxSteps = 5;
  let placement = origin.clone();
  let steps = 0;

  while (checkForBlockAt(placement.x, placement.y, placement.z) && steps < maxSteps) {
    placement.add(step);
    steps++;
  }

  // Optionally align to ground level
  const groundLevel = Math.round(getGroundLevel(placement.x, placement.y, placement.z));
  if (groundLevel > placement.y) {
    placement.y = groundLevel;
  }

  if (!checkForBlockAt(placement.x, placement.y, placement.z)){
    playerPlace(placement.x, placement.y, placement.z);
  }
}

function playerBreak(x, y, z){
  const tolerance = 1; // helps with floating-point precision

  // Search for matching object in the collision group
  for (let i = colideGroup.children.length - 1; i >= 0; i--) {
    const obj = colideGroup.children[i];
    const pos = obj.position;

    if (
      Math.abs(pos.x - x) <= tolerance &&
      Math.abs(pos.y - y) <= tolerance &&
      Math.abs(pos.z - z) <= tolerance
    ) {
      scene.remove(obj);            // Remove from scene
      removeFromColideGroup(obj);      // Remove from collision group
      break; // Stop after removing one
    }
  }
}

function playerPlace(x, y, z) {
  const machine = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshStandardMaterial({ color: randomizeColor(foundationColor, foundationColorVariance) })
  );

  machine.position.x = x;
  machine.position.y = y;
  machine.position.z = z;
  scene.add(machine);
  addToColideGroup(machine);
}


init();
