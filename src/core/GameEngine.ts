import * as THREE from 'three';
import { CarStats, GameMode, Difficulty, GameTelemetry, PerformanceStats } from '../types/game';
import { CARS_CATALOG } from '../data/cars';
import { CarFactory } from './CarFactory';
import { WorldManager } from './WorldManager';
import { TrafficManager } from './TrafficManager';
import { soundManager } from './SoundManager';
import { perfMonitor } from './PerformanceMonitor';

export interface GameEngineCallbacks {
  onTelemetry: (telemetry: GameTelemetry) => void;
  onPerformanceStats?: (stats: PerformanceStats) => void;
  onGameOver: (stats: { score: number; distance: number; maxSpeed: number; nearMisses: number; bestCombo: number }) => void;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // World and Traffic
  private worldManager!: WorldManager;
  private trafficManager!: TrafficManager;

  // Player Vehicle
  private playerCarStats: CarStats;
  private playerCarGroup!: THREE.Group;
  private playerWheels: THREE.Mesh[] = [];
  private playerUnderglow!: THREE.PointLight;
  private updateNitroFlames!: (active: boolean, delta: number) => void;

  // Physics & Movement
  private velocityMps: number = 0; // forward speed in meters per second
  private posX: number = 0; // lateral road position (-4.6 to 4.6)
  private posZ: number = 0; // forward distance (negative Z)
  private targetPosX: number = 0;
  private steerVelocity: number = 0;
  private nitroAmount: number = 100; // 0 - 100
  private isNitroEngaged: boolean = false;
  private nitroCooldown: number = 0;
  private boostKickDuration: number = 0;

  // Controls input
  public inputs = {
    accelerate: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    nitro: false,
  };

  // Camera settings: elevated third-person chase camera perfectly framing the car
  private baseCamOffset = new THREE.Vector3(0, 2.5, 5.8);
  private currentCamPos = new THREE.Vector3(0, 2.5, 5.8);
  private camLookTarget = new THREE.Vector3(0, 1.15, -24);
  private cameraShakeAmount: number = 0;

  // High-speed motion streaks
  private speedStreaks: THREE.Line[] = [];
  private streakMat!: THREE.LineBasicMaterial;

  // Gameplay state
  private mode: GameMode = 'endless';
  private difficulty: Difficulty = 'normal';
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isMenuMode: boolean = true;
  private isGarageMode: boolean = false;
  private garageOrbitAngle: number = 0;

  // Scoring & Stats
  private score: number = 0;
  private combo: number = 1;
  private comboTimer: number = 0;
  private maxSpeedAchievedKmh: number = 0;
  private nearMissCount: number = 0;
  private bestCombo: number = 1;
  private timeRemaining: number = 75; // For Time Attack
  private healthPercent: number = 100; // For Survival
  private distanceCoveredMeters: number = 0;

  // Notifications
  private alertCounter: number = 0;
  private nearMissAlert: { active: boolean; text: string; id: number } | null = null;
  private boostAlert: { active: boolean; text: string; id: number } | null = null;

  // Callbacks & Clock
  private callbacks: GameEngineCallbacks;
  private clock: THREE.Clock;
  private animFrameId: number | null = null;
  private fpsCounter: number = 60;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();
    this.playerCarStats = CARS_CATALOG[0];

    // Setup Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Setup Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.2, 800);
    this.camera.position.set(0, 3.4, 7.8);
    this.camera.lookAt(0, 1.2, -18);

    // Initialize Subsystems
    this.worldManager = new WorldManager(this.scene);
    this.trafficManager = new TrafficManager(this.scene);
    this.buildPlayerCar(this.playerCarStats);
    this.initSpeedStreaks();

    // Setup event listeners
    this.setupInputs();
    window.addEventListener('resize', this.onResize);

    // Start Main Render Loop
    this.animate = this.animate.bind(this);
    this.animFrameId = requestAnimationFrame(this.animate);
  }

  public setCar(carStats: CarStats) {
    this.playerCarStats = carStats;
    this.buildPlayerCar(carStats);
  }

  private buildPlayerCar(stats: CarStats) {
    if (this.playerCarGroup) {
      this.scene.remove(this.playerCarGroup);
    }
    const built = CarFactory.createPlayerCar(stats);
    this.playerCarGroup = built.group;
    this.playerWheels = built.wheels;
    this.playerUnderglow = built.underglow;
    this.updateNitroFlames = built.updateNitro;

    this.playerCarGroup.position.set(this.posX, 0, this.posZ);
    this.scene.add(this.playerCarGroup);
  }

  public setScreenState(screen: 'menu' | 'garage' | 'racing' | 'paused') {
    this.isMenuMode = screen === 'menu';
    this.isGarageMode = screen === 'garage';
    this.isPaused = screen === 'paused';

    if (screen === 'racing') {
      this.isRunning = true;
      soundManager.startEngine();
    } else {
      this.isRunning = false;
      soundManager.stopEngine();
      soundManager.playNitroSound(false);
    }

    // When transitioning to menu or garage, cleanly reset scene positioning
    if (screen === 'menu' || screen === 'garage') {
      this.posZ = 0;
      this.posX = 0;
      this.targetPosX = 0;
      this.velocityMps = 0;
      if (this.playerCarGroup) {
        this.playerCarGroup.position.set(0, 0, 0);
        this.playerCarGroup.rotation.set(0, 0, 0);
      }
      this.worldManager.reset(0);
      this.trafficManager.reset(0);
      this.resetSpeedStreaks();
    }
  }

  public setDifficulty(difficulty: Difficulty) {
    this.difficulty = difficulty;
    this.trafficManager.setDifficulty(difficulty);
  }

  public setMode(mode: GameMode) {
    this.mode = mode;
  }

  public startRace(mode: GameMode, difficulty: Difficulty, car: CarStats) {
    this.mode = mode;
    this.difficulty = difficulty;
    this.trafficManager.setDifficulty(difficulty);
    this.setCar(car);

    // Reset physics and run state
    this.velocityMps = 15; // Initial roll
    this.posX = 0;
    this.targetPosX = 0;
    this.posZ = 0;
    this.nitroAmount = 100;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxSpeedAchievedKmh = 0;
    this.nearMissCount = 0;
    this.bestCombo = 1;
    this.distanceCoveredMeters = 0;
    this.timeRemaining = mode === 'time_attack' ? 75 : 999;
    this.healthPercent = 100;
    this.cameraShakeAmount = 0;

    this.playerCarGroup.position.set(0, 0, 0);
    this.playerCarGroup.rotation.set(0, 0, 0);

    // Completely reset world road segments and traffic to origin
    this.worldManager.reset(0);
    this.trafficManager.reset(0);

    // Cleanly reset camera to race starting perspective
    this.currentCamPos.set(0, 2.95, 7.3);
    this.camera.position.set(0, 2.95, 7.3);
    this.camera.fov = 62;
    this.camera.updateProjectionMatrix();
    this.camLookTarget.set(0, 0.95, -32);
    this.camera.lookAt(this.camLookTarget);

    // Reset speed streak particle lines
    this.resetSpeedStreaks();

    this.setScreenState('racing');
  }

  private resetSpeedStreaks() {
    if (this.streakMat) {
      this.streakMat.opacity = 0;
    }
    for (const streak of this.speedStreaks) {
      const x = (Math.random() - 0.5) * 16;
      const y = 0.35 + Math.random() * 4.5;
      const z = this.posZ - 20 - Math.random() * 120;
      streak.position.set(x, y, z);
    }
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.inputs.accelerate = true;
      if (code === 'KeyS' || code === 'ArrowDown') this.inputs.brake = true;
      if (code === 'KeyA' || code === 'ArrowLeft') this.inputs.steerLeft = true;
      if (code === 'KeyD' || code === 'ArrowRight') this.inputs.steerRight = true;
      if (code === 'Space') this.inputs.nitro = true;
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.inputs.accelerate = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.inputs.brake = false;
      if (code === 'KeyA' || code === 'ArrowLeft') this.inputs.steerLeft = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.inputs.steerRight = false;
      if (code === 'Space') this.inputs.nitro = false;
    });
  }

  private onResize = () => {
    if (!this.canvas) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private animate() {
    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const now = performance.now();

    // Update PerformanceMonitor & Adapt Quality
    const settingsChanged = perfMonitor.update(now, delta);
    if (settingsChanged) {
      const settings = perfMonitor.getSettings();
      // Apply dynamic resolution scaling without altering visual identity
      this.renderer.setPixelRatio(settings.pixelRatio * settings.renderScale);
      this.trafficManager.setMaxTraffic(settings.maxTraffic, settings.trafficUpdateInterval);
    }

    if (this.isMenuMode) {
      this.updateMenuAnimation(delta);
    } else if (this.isGarageMode) {
      this.updateGarageAnimation(delta);
    } else if (this.isRunning && !this.isPaused) {
      this.updateRacing(delta);
    }

    this.renderer.render(this.scene, this.camera);

    // Sync three.js draw calls and triangle metrics for F3 dev panel
    perfMonitor.drawCalls = this.renderer.info.render.calls;
    perfMonitor.triangles = this.renderer.info.render.triangles;
    perfMonitor.activeTraffic = this.trafficManager.getActiveCount();

    if (this.callbacks.onPerformanceStats) {
      this.callbacks.onPerformanceStats(perfMonitor.getStats());
    }
  }

  private updateMenuAnimation(delta: number) {
    this.garageOrbitAngle += delta * 0.4;
    // Dramatic slow orbit around the sports car on the wet highway
    const radius = 6.5;
    this.camera.position.set(
      Math.sin(this.garageOrbitAngle) * radius,
      2.5 + Math.sin(this.garageOrbitAngle * 0.5) * 0.4,
      Math.cos(this.garageOrbitAngle) * radius
    );
    this.camera.lookAt(0, 0.7, 0);

    // Idle car pulse
    if (this.playerCarGroup) {
      this.playerCarGroup.position.set(0, 0, 0);
      this.playerCarGroup.rotation.y = 0;
      this.updateNitroFlames(false, delta);
    }
  }

  private updateGarageAnimation(delta: number) {
    this.garageOrbitAngle += delta * 0.5;
    const radius = 6.2;
    this.camera.position.set(
      Math.sin(this.garageOrbitAngle) * radius,
      2.2,
      Math.cos(this.garageOrbitAngle) * radius
    );
    this.camera.lookAt(0, 0.6, 0);

    if (this.playerCarGroup) {
      this.playerCarGroup.position.set(0, 0, 0);
      this.playerCarGroup.rotation.y = this.garageOrbitAngle * 0.2;
    }
  }

  private updateRacing(delta: number) {
    // 1. Vehicle Movement & Acceleration Physics
    const topSpeedMps = this.playerCarStats.topSpeedKmh / 3.6; // e.g. 240 km/h = 66.6 m/s
    const accelRate = (this.playerCarStats.acceleration / 100) * 22; // m/s^2
    const brakeRate = (this.playerCarStats.brakingPower / 100) * 38; // m/s^2

    // Nitro handling
    const wantsNitro = this.inputs.nitro && this.nitroAmount > 5;
    if (wantsNitro) {
      this.isNitroEngaged = true;
      this.nitroAmount = Math.max(0, this.nitroAmount - delta * 32);
      soundManager.playNitroSound(true);
    } else {
      this.isNitroEngaged = false;
      soundManager.playNitroSound(false);
      // Slow passive nitro regeneration
      this.nitroAmount = Math.min(100, this.nitroAmount + delta * 6);
    }

    this.updateNitroFlames(this.isNitroEngaged, delta);

    // Calculate effective top speed & acceleration
    let effectiveTopSpeed = topSpeedMps;
    let effectiveAccel = accelRate;

    if (this.isNitroEngaged) {
      effectiveTopSpeed *= this.playerCarStats.nitroMultiplier; // e.g. up to 340+ km/h
      effectiveAccel *= 1.8;
    }

    if (this.boostKickDuration > 0) {
      this.boostKickDuration -= delta;
      effectiveTopSpeed *= 1.3;
      effectiveAccel *= 2.2;
    }

    // Accelerate / Brake / Coast
    if (this.inputs.accelerate) {
      if (this.velocityMps < effectiveTopSpeed) {
        this.velocityMps += effectiveAccel * delta;
      }
    } else if (this.inputs.brake) {
      this.velocityMps = Math.max(0, this.velocityMps - brakeRate * delta);
    } else {
      // Natural aerodynamic drag and rolling friction
      this.velocityMps = Math.max(0, this.velocityMps - (4.5 + this.velocityMps * 0.04) * delta);
    }

    // 2. Real velocity conversion to KM/H
    const currentSpeedKmh = this.velocityMps * 3.6;
    if (currentSpeedKmh > this.maxSpeedAchievedKmh) {
      this.maxSpeedAchievedKmh = Math.floor(currentSpeedKmh);
    }

    // 3. Forward progress (Negative Z in Three.js)
    this.posZ -= this.velocityMps * delta;
    this.distanceCoveredMeters += this.velocityMps * delta;

    // 4. Lateral Steering Movement
    const handlingAgility = (this.playerCarStats.handling / 100) * 16.5; // lateral units per second
    if (this.inputs.steerLeft) {
      this.targetPosX = Math.max(-5.2, this.targetPosX - handlingAgility * delta);
    }
    if (this.inputs.steerRight) {
      this.targetPosX = Math.min(5.2, this.targetPosX + handlingAgility * delta);
    }

    // Smooth lateral interpolation
    const steerDelta = (this.targetPosX - this.posX) * Math.min(1, delta * 12);
    this.posX += steerDelta;

    // Update Player Car 3D Transform
    this.playerCarGroup.position.set(this.posX, 0, this.posZ);

    // Dynamic vehicle body lean and steering yaw
    const steerAngle = -steerDelta * 1.8;
    const bodyRoll = steerDelta * 0.9;
    this.playerCarGroup.rotation.y = steerAngle;
    this.playerCarGroup.rotation.z = bodyRoll;

    // Rotate player wheels based on forward velocity
    const wheelRoll = (this.velocityMps * delta) / 0.36;
    this.playerWheels.forEach(w => (w.rotation.x += wheelRoll));

    // 5. Update World & Traffic
    this.worldManager.update(this.posZ, delta);
    this.trafficManager.update(delta, this.posZ, this.velocityMps);

    // 6. Check Boost Pad Collisions
    const pads = this.worldManager.getBoostPads();
    for (const pad of pads) {
      if (!pad.active) continue;
      const dz = Math.abs(pad.mesh.position.z - this.posZ);
      const dx = Math.abs(pad.mesh.position.x - this.posX);

      if (dz < 3.2 && dx < 1.6) {
        // Boost collected!
        pad.active = false;
        pad.mesh.visible = false;
        this.boostKickDuration = 1.6;
        this.velocityMps = Math.max(this.velocityMps + 12, effectiveTopSpeed * 1.08);
        this.nitroAmount = Math.min(100, this.nitroAmount + 30);
        this.score += 1500 * this.combo;
        this.cameraShakeAmount = 0.35;
        soundManager.playBoostSound();
        this.triggerBoostAlert('TURBO BOOST +1,500');
        break;
      }
    }

    // 7. Check Traffic Collisions & Near Misses
    const traffic = this.trafficManager.getActiveCars();
    for (const car of traffic) {
      const dz = car.z - this.posZ; // positive means car is behind player, negative ahead
      const dx = Math.abs(car.group.position.x - this.posX);

      // A. Collision Check
      if (Math.abs(dz) < 3.4 && dx < 1.85) {
        this.handleCollision(car);
        break;
      }

      // B. Near Miss Check (Overtaking closely at high relative speed without crashing)
      if (!car.nearMissChecked && Math.abs(dz) < 2.8 && dx >= 1.95 && dx <= 3.2) {
        if (this.velocityMps > car.speedMps + 12) {
          car.nearMissChecked = true;
          this.handleNearMiss(dx);
        }
      }
    }

    // 8. Barrier Side Collision Check
    if (Math.abs(this.posX) >= 5.15) {
      this.posX = Math.sign(this.posX) * 5.1;
      this.targetPosX = this.posX;
      this.velocityMps *= 0.85;
      this.cameraShakeAmount = 0.22;
      soundManager.playCollisionSound();
    }

    // 9. Scoring and Combo Multiplier
    if (this.velocityMps > 10) {
      this.score += Math.floor((currentSpeedKmh * 0.05 + this.combo * 2) * (delta * 60));
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }

    // 10. Mode-specific updates
    if (this.mode === 'time_attack') {
      this.timeRemaining -= delta;
      if (this.timeRemaining <= 0) {
        this.endRace();
      }
    }

    if (this.mode === 'survival' && this.healthPercent <= 0) {
      this.endRace();
    }

    // 11. Engine Sound modulation
    const gear = Math.min(6, Math.max(1, Math.floor(currentSpeedKmh / 50) + 1));
    const speedInGear = (currentSpeedKmh % 50) / 50;
    soundManager.updateEngineSound(speedInGear, currentSpeedKmh, this.inputs.accelerate || this.isNitroEngaged);

    // 12. Camera Follow & Dynamic Effects
    this.updateCamera(delta, currentSpeedKmh);
    this.updateSpeedStreaks(delta, currentSpeedKmh);

    // 13. Dispatch Telemetry to HUD
    this.callbacks.onTelemetry({
      speedKmh: Math.round(currentSpeedKmh),
      rpmRatio: speedInGear,
      gear,
      nitroPercent: Math.round(this.nitroAmount),
      isNitroActive: this.isNitroEngaged,
      score: this.score,
      combo: this.combo,
      distanceMeters: Math.round(this.distanceCoveredMeters),
      timeRemainingSeconds: this.mode === 'time_attack' ? Math.max(0, Math.ceil(this.timeRemaining)) : undefined,
      healthPercent: this.mode === 'survival' ? Math.round(this.healthPercent) : undefined,
      nearMissAlert: this.nearMissAlert,
      boostAlert: this.boostAlert,
      fps: this.fpsCounter,
    });
  }

  private handleCollision(trafficCar: { z: number; speedMps: number }) {
    soundManager.playCollisionSound();
    this.cameraShakeAmount = 0.55;
    this.velocityMps = Math.max(10, this.velocityMps * 0.45);
    this.combo = 1;
    this.comboTimer = 0;

    if (this.mode === 'survival') {
      this.healthPercent = Math.max(0, this.healthPercent - 35);
      if (this.healthPercent <= 0) {
        this.endRace();
        return;
      }
    }

    // Recoil traffic car forward
    trafficCar.speedMps += 15;
  }

  private handleNearMiss(dx: number) {
    this.nearMissCount++;
    this.combo = Math.min(10, this.combo + 1);
    this.comboTimer = 5.0; // 5s combo sustain
    if (this.combo > this.bestCombo) {
      this.bestCombo = this.combo;
    }

    // Closer dodge = bigger bonus
    const closenessBonus = Math.floor((3.4 - dx) * 400);
    const earned = 500 + closenessBonus;
    this.score += earned * this.combo;
    this.nitroAmount = Math.min(100, this.nitroAmount + 18);

    soundManager.playNearMissSound();
    this.triggerNearMissAlert(`NEAR MISS +${earned} [x${this.combo}]`);
  }

  private triggerNearMissAlert(text: string) {
    this.alertCounter++;
    const id = this.alertCounter;
    this.nearMissAlert = { active: true, text, id };
    setTimeout(() => {
      if (this.nearMissAlert?.id === id) {
        this.nearMissAlert = null;
      }
    }, 1200);
  }

  private triggerBoostAlert(text: string) {
    this.alertCounter++;
    const id = this.alertCounter;
    this.boostAlert = { active: true, text, id };
    setTimeout(() => {
      if (this.boostAlert?.id === id) {
        this.boostAlert = null;
      }
    }, 1400);
  }

  private initSpeedStreaks() {
    this.streakMat = new THREE.LineBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    const streakCount = 65;
    for (let i = 0; i < streakCount; i++) {
      const length = 4.0 + Math.random() * 7.0;
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, length),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, this.streakMat);

      const x = (Math.random() - 0.5) * 16;
      const y = 0.35 + Math.random() * 4.5;
      const z = -20 - Math.random() * 120;
      line.position.set(x, y, z);

      this.scene.add(line);
      this.speedStreaks.push(line);
    }
  }

  private updateSpeedStreaks(delta: number, speedKmh: number) {
    const targetOpacity = this.isNitroEngaged
      ? 0.8
      : speedKmh > 140
      ? Math.min(0.55, (speedKmh - 130) / 160)
      : 0;
    this.streakMat.opacity = THREE.MathUtils.lerp(this.streakMat.opacity, targetOpacity, delta * 8);

    if (this.streakMat.opacity <= 0.01) return;

    const rushSpeed = (this.velocityMps * 1.5 + 45) * delta;
    for (const streak of this.speedStreaks) {
      streak.position.z += rushSpeed;
      // If streak moved behind the player camera, recycle far ahead
      if (streak.position.z > this.posZ + 12) {
        streak.position.z = this.posZ - 70 - Math.random() * 90;
        streak.position.x = this.posX + (Math.random() - 0.5) * 16;
        streak.position.y = 0.35 + Math.random() * 4.5;
      }
    }
  }

  private updateCamera(delta: number, speedKmh: number) {
    // Dynamic FOV (speed stretch sensation)
    const targetFov = 62 + (speedKmh / 320) * 15 + (this.isNitroEngaged ? 9 : 0);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 6);
    this.camera.updateProjectionMatrix();

    // Camera follow position: elevated, looking downward toward road
    // Perfectly frame the vehicle in the lower-center of the viewport
    const targetCamX = this.posX * 0.72;
    const targetCamY = 2.95 + (speedKmh / 350) * 0.35 + (this.isNitroEngaged ? 0.2 : 0);
    const targetCamZ = this.posZ + 7.3 + (speedKmh / 350) * 1.4;

    this.currentCamPos.x = THREE.MathUtils.lerp(this.currentCamPos.x, targetCamX, delta * 12);
    this.currentCamPos.y = THREE.MathUtils.lerp(this.currentCamPos.y, targetCamY, delta * 10);
    this.currentCamPos.z = THREE.MathUtils.lerp(this.currentCamPos.z, targetCamZ, delta * 18);

    // Apply Camera Shake (extra during nitro or collision)
    let shakeX = 0;
    let shakeY = 0;
    const nitroShake = this.isNitroEngaged ? 0.06 : 0;
    const totalShake = this.cameraShakeAmount + nitroShake;

    if (totalShake > 0) {
      shakeX = (Math.random() - 0.5) * totalShake * 1.2;
      shakeY = (Math.random() - 0.5) * totalShake * 1.2;
      this.cameraShakeAmount = Math.max(0, this.cameraShakeAmount - delta * 1.8);
    }

    this.camera.position.set(
      this.currentCamPos.x + shakeX,
      this.currentCamPos.y + shakeY,
      this.currentCamPos.z
    );

    // Camera looks down the highway ahead of the player toward the horizon
    this.camLookTarget.set(this.posX * 0.25, 0.95, this.posZ - 32);
    this.camera.lookAt(this.camLookTarget);
  }

  public endRace() {
    this.isRunning = false;
    soundManager.stopEngine();
    soundManager.playNitroSound(false);

    this.callbacks.onGameOver({
      score: this.score,
      distance: Math.round(this.distanceCoveredMeters),
      maxSpeed: this.maxSpeedAchievedKmh,
      nearMisses: this.nearMissCount,
      bestCombo: this.bestCombo,
    });
  }

  public destroy() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    soundManager.stopEngine();
    this.renderer.dispose();
  }
}
