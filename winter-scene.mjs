// Winter scene module - imports and initializes the 3D environment
import * as THREE from '/vendor/three/three.module.js';

const sceneConfig = await import('/winter/quality.js');
const preferences = await import('/winter/preferences.js');
const walkStateModule = await import('/walk-state.mjs');
const snowModule = await import('/winter/snow.js');
const roadModule = await import('/winter/road.js');
const treesModule = await import('/winter/trees.js');
const lampsModule = await import('/winter/lamps.js');
const skyModule = await import('/winter/sky.js');

// Module-scoped variables
let config;
let walkState;
let snowfall, roadSurface, treeGroup, lampLeft, lampRight;
let skyDome;
let sceneRenderer;
let isInitialized = false;
let isPaused = true;

const WALK_X_POS = 1.55; // Eye level offset from road center

function createScene() {
  const container = document.getElementById('winter-scene-container');
  
  if (!container) return null;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#d7e3ef', config.fogNear, config.fogFar);

  // Camera - positioned for first-person view
  const camera = new THREE.PerspectiveCamera(
    50, window.innerWidth / window.innerHeight,
    config.fogNear * 1.2,
    config.fogFar * 2
  );
  camera.position.set(WALK_X_POS, 0.98, -PANEL_LENGTH / 2 + 10);

  // Renderer with anti-aliasing and shadows
  const renderer = new THREE.WebGLRenderer({ 
    antialias: config.antialias,
    powerPreference: 'high-performance',
    alpha: true,
    preserveDrawingBuffer: false
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(config.pixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Ground plane with snow texture
  const groundGroup = roadModule.buildGround(config.random);
  scene.add(groundGroup);

  // Road surface - asphalt texture for the path
  const roadSurfaceMesh = roadModule.buildRoadSurface(config.random);
  scene.add(roadSurfaceMesh);

  // Trees along the road sides
  const treeGroup = treesModule.createTreeRow(config.random, config.trees);
  scene.add(treeGroup);

  // Street lamps - light up in night mode
  lampLeft = new lampsModule.LampRow();
  lampRight = new lampsModule.LampRow();
  
  for (const row of [lampLeft, lampRight]) {
    const group = row.group;
    group.position.y = 0.5; // Slight offset from road
    scene.add(group);
  }

  // Sky dome with day/night transition support
  skyDome = new skyModule.Sky(scene, { fogNear: config.fogNear, fogFar: config.fogFar });

  return { scene, camera, renderer };
}

function initWalkState() {
  walkState = new walkStateModule.WinterWalk({ random: Math.random });
  
  // Bind pose updates to camera position
  const updatePose = () => {
    if (!walkState || !sceneConfig.scene) return;
    
    const pose = walkState.pose();
    sceneConfig.camera.position.set(
      WALK_X_POS + pose.bob * Math.cos(walkState.time * 5), // Gentle sway
      0.98 + pose.bob,
      -PANEL_LENGTH / 2 + sceneConfig.ROAD_WIDTH * 3 + pose.distance
    );
    
    sceneConfig.scene.rotation.y = walkState.pose().yaw;
  };

  requestAnimationFrame(updatePose);
}

function startSnowfall() {
  snowfall = new snowModule.Snowfall({
    count: config.snowflakes,
    pixelRatio: config.pixelRatio,
    fogNear: config.fogNear,
    fogFar: config.fogFar,
    random: Math.random
  });

  // Snow falls faster in night mode for visibility
  snowModule.setTheme(preferences.readTheme());
}

function setupTheme() {
  const theme = preferences.readTheme();
  
  skyDome.setNight(theme === 'night');
  lampLeft.setNight(theme === 'night');
  lampRight.setNight(theme === 'night');
  
  // Adjust snow color and glow for theme
  if (snowfall) {
    snowModule.setTheme(theme);
  }
}

function startAnimationLoop() {
  const animate = () => {
    requestAnimationFrame(animate);
    
    const dt = 1 / 60;
    const time = performance.now() * 0.001;

    // Update all modules with synchronized time
    if (snowfall) snowModule.update(time, [lampLeft.nearestAhead(5, 3), lampRight.nearestAhead(8, 2)]);
    
    skyDome.step(dt);
    
    for (const row of [lampLeft, lampRight]) {
      row.step(dt);
    }

    // Render with camera following walkState position
    if (!isPaused && sceneConfig.scene) {
      requestAnimationFrame(updatePose);
    }
    
    sceneConfig.renderer.render(sceneConfig.scene, sceneConfig.camera);
  };

  animate();
}

// Public API for app.js to control the scene
window.winterScene = {
  start() {
    if (isInitialized) return;
    
    // Initialize all components
    config = sceneConfig.sceneQuality();
    setupTheme();
    
    const { scene, camera, renderer } = createScene();
    sceneConfig.scene = scene;
    sceneConfig.camera = camera;
    sceneConfig.renderer = renderer;

    initWalkState();
    startSnowfall();
    startAnimationLoop();
    isInitialized = true;
  },

  pause() {
    isPaused = true;
  },

  resume() {
    isPaused = false;
    walkState?.replay();
  },

  interact() {
    if (!walkState) return false;
    const success = walkState.interact();
    if (success) winterScene.resume();
    return success;
  },

  skipIntro() {
    isPaused = false;
    walkState?.skip();
  }
};