import * as THREE from "https://esm.sh/three";
import { TeapotGeometry } from "https://esm.sh/three/examples/jsm/geometries/TeapotGeometry.js";

const GRID_SIZE = 20;
const BOUNDS = 400;
const PIPE_RADIUS = 8;
const SPEED = 20;
const MAX_PIPES = 1;
const RESET_TIME = 32000;
const FADE_DURATION = 1000;
const TEAPOT_CHANCE = 0.025;

const DIRECTIONS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];

const PALETTE = [
  0xff0000, 0x0000ff, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff,
  0xc0c0c0, 0x800000, 0x000080, 0x008000, 0x808000, 0x800080, 0x008080,
  0x808080, 0x404040,
];

/** @typedef {{
 *   color: number;
 *   material: THREE.MeshPhongMaterial;
 *   currentPos: THREE.Vector3;
 *   direction: THREE.Vector3;
 *   targetPos: THREE.Vector3;
 *   currentMesh: THREE.Mesh | null;
 *   distanceTraveled: number;
 *   targetDistance: number;
 *   segmentsCount: number;
 *   maxSegments: number;
 * }} Pipe */

const getPosKey = (v) =>
  `${Math.round(v.x)},${Math.round(v.y)},${Math.round(v.z)}`;

const getValidTurnDirections = (currentDir) =>
  DIRECTIONS.filter((dir) => {
    const isOppositeX = dir.x === -currentDir.x;
    const isOppositeY = dir.y === -currentDir.y;
    const isOppositeZ = dir.z === -currentDir.z;
    return !(isOppositeX && isOppositeY && isOppositeZ);
  });

const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
const randomFloat = (min, max) => random() * (max - min) + min;
const randomInt = (min, max) => Math.round(random() * (max - min) + min);
const randomAngle = () => randomFloat(-Math.PI / 4, Math.PI / 4);
const randomStartCoord = () =>
  Math.floor((random() * BOUNDS - BOUNDS / 2) / GRID_SIZE) * GRID_SIZE;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.rotation.y = randomAngle();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  2000
);
camera.position.set(0, 0, 800);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(0, 1, 1).normalize();
scene.add(dirLight);

const endPointGeo = new THREE.SphereGeometry(PIPE_RADIUS * 1.25, 32, 32);
const fadeGeo = new THREE.PlaneGeometry(2000, 2000);
const jointGeo = new THREE.SphereGeometry(PIPE_RADIUS, 32, 32);
const pipeGeo = new THREE.CylinderGeometry(PIPE_RADIUS, PIPE_RADIUS, 1, 32);
pipeGeo.translate(0, 0.5, 0);
pipeGeo.rotateX(Math.PI / 2);

const teapotGeo = new TeapotGeometry(PIPE_RADIUS * 2.5, 10);

const fadeMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0,
  depthWrite: false,
});
const fadeMesh = new THREE.Mesh(fadeGeo, fadeMat);

const updateFadeMeshPosition = () => {
  fadeMesh.position.set(0, 0, 790).applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    -scene.rotation.y
  );
  fadeMesh.rotation.y = -scene.rotation.y;
};
updateFadeMeshPosition();
scene.add(fadeMesh);

const occupiedPositions = new Set();

const addJointOrTeapot = (material, position, endCap = false) => {
  if (random() < TEAPOT_CHANCE) {
    const teapot = new THREE.Mesh(teapotGeo, material);
    teapot.position.copy(position);
    teapot.rotation.y = randomFloat(0, Math.PI * 2);
    scene.add(teapot);
    return;
  }

  const geo = endCap ? endPointGeo : jointGeo;
  const joint = new THREE.Mesh(geo, material);
  joint.position.copy(position);
  scene.add(joint);
};

const isPathClear = (start, dir, distance) => {
  const steps = distance / GRID_SIZE;
  for (let i = 1; i <= steps; i++) {
    const checkPos = start.clone().add(dir.clone().multiplyScalar(i * GRID_SIZE));
    if (
      Math.abs(checkPos.x) > BOUNDS ||
      Math.abs(checkPos.y) > BOUNDS ||
      Math.abs(checkPos.z) > BOUNDS
    ) {
      return false;
    }
    if (occupiedPositions.has(getPosKey(checkPos))) return false;
  }
  return true;
};

const reservePath = (start, dir, distance) => {
  const steps = distance / GRID_SIZE;
  for (let i = 1; i <= steps; i++) {
    const allocPos = start.clone().add(dir.clone().multiplyScalar(i * GRID_SIZE));
    occupiedPositions.add(getPosKey(allocPos));
  }
};

/** @type {Pipe[]} */
let pipes = [];
let animationFrameId = 0;
let lastReset = Date.now();

const createPipe = () => {
  let startPos = new THREE.Vector3();
  let foundStart = false;

  for (let attempts = 0; attempts < 100; attempts++) {
    startPos.set(randomStartCoord(), randomStartCoord(), randomStartCoord());
    if (!occupiedPositions.has(getPosKey(startPos))) {
      foundStart = true;
      break;
    }
  }

  if (!foundStart) return null;

  const shuffledDirs = [...DIRECTIONS];
  shuffledDirs.sort(() => random() - 0.5);

  let chosenDir = null;
  let chosenDist = 0;

  for (const dir of shuffledDirs) {
    const targetDist = Math.floor(random() * 5 + 2) * GRID_SIZE;
    if (isPathClear(startPos, dir, targetDist)) {
      chosenDir = dir;
      chosenDist = targetDist;
      break;
    }
  }

  if (!chosenDir) return null;

  occupiedPositions.add(getPosKey(startPos));
  reservePath(startPos, chosenDir, chosenDist);

  const color = PALETTE[Math.floor(random() * PALETTE.length)];
  const material = new THREE.MeshPhongMaterial({
    color,
    shininess: 30,
    specular: 0x3f3f3f,
    transparent: false,
  });
  addJointOrTeapot(material, startPos, true);

  const targetPos = startPos.clone().add(chosenDir.clone().multiplyScalar(chosenDist));

  return {
    color,
    material,
    currentPos: startPos,
    direction: chosenDir,
    targetPos,
    currentMesh: null,
    distanceTraveled: 0,
    targetDistance: chosenDist,
    segmentsCount: 0,
    maxSegments: randomInt(40, 120),
  };
};

const initializePipeMesh = (pipe) => {
  if (pipe.currentMesh) return;

  pipe.currentMesh = new THREE.Mesh(pipeGeo, pipe.material);
  pipe.currentMesh.position.copy(pipe.currentPos);
  pipe.currentMesh.lookAt(pipe.currentPos.clone().add(pipe.direction));
  scene.add(pipe.currentMesh);
};

const tryChooseNextMove = (pipe) => {
  if (pipe.segmentsCount >= pipe.maxSegments) return false;

  const validDirs = getValidTurnDirections(pipe.direction);
  const shuffledDirs = [...validDirs];
  shuffledDirs.sort(() => random() - 0.5);

  for (const nextDir of shuffledDirs) {
    const nextDist = Math.floor(random() * 5 + 2) * GRID_SIZE;
    if (isPathClear(pipe.currentPos, nextDir, nextDist)) {
      addJointOrTeapot(pipe.material, pipe.currentPos);
      pipe.direction = nextDir;
      pipe.targetDistance = nextDist;
      pipe.targetPos = pipe.currentPos
        .clone()
        .add(nextDir.clone().multiplyScalar(nextDist));
      reservePath(pipe.currentPos, pipe.direction, pipe.targetDistance);
      pipe.distanceTraveled = 0;
      pipe.currentMesh = null;
      return true;
    }
  }

  return false;
};

const handlePipeCapAndRespawn = (pipe) => {
  addJointOrTeapot(pipe.material, pipe.currentPos, true);

  let newPipe = null;
  for (let attempts = 0; attempts < 100; attempts++) {
    newPipe = createPipe();
    if (newPipe) break;
  }

  if (newPipe) {
    Object.assign(pipe, newPipe);
  } else {
    pipe.distanceTraveled = 0;
    pipe.targetDistance = 0;
    pipe.currentMesh = null;
  }
};

const updatePipeProgress = (pipe) => {
  pipe.distanceTraveled += SPEED;

  if (pipe.distanceTraveled >= pipe.targetDistance) {
    if (pipe.currentMesh) {
      pipe.currentMesh.scale.z = pipe.targetDistance;
    }

    pipe.currentPos.copy(pipe.targetPos);
    pipe.segmentsCount++;

    if (!tryChooseNextMove(pipe)) {
      handlePipeCapAndRespawn(pipe);
    }
  } else if (pipe.currentMesh) {
    pipe.currentMesh.scale.z = pipe.distanceTraveled;
  }
};

const animate = () => {
  animationFrameId = requestAnimationFrame(animate);

  const elapsed = Date.now() - lastReset;

  if (elapsed > RESET_TIME) {
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    scene.add(ambientLight);
    scene.add(dirLight);
    scene.add(fadeMesh);

    fadeMat.opacity = 0;
    occupiedPositions.clear();
    pipes = [];

    for (let i = 0; i < MAX_PIPES; i++) {
      const p = createPipe();
      if (p) pipes.push(p);
    }

    lastReset = Date.now();
    scene.rotation.y = randomAngle();
    updateFadeMeshPosition();
  } else if (RESET_TIME - elapsed <= FADE_DURATION) {
    const remainingTime = RESET_TIME - elapsed;
    fadeMat.opacity = 1 - Math.max(0, remainingTime / FADE_DURATION);
  } else {
    if (fadeMat.opacity !== 0) fadeMat.opacity = 0;

    pipes.forEach((pipe) => {
      initializePipeMesh(pipe);
      updatePipeProgress(pipe);
    });
  }

  renderer.render(scene, camera);
};

for (let i = 0; i < MAX_PIPES; i++) {
  const p = createPipe();
  if (p) pipes.push(p);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
