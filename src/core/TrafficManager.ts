import * as THREE from 'three';
import { CarFactory } from './CarFactory';
import { Difficulty } from '../types/game';

export interface TrafficCarInstance {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  lane: number;
  z: number;
  speedMps: number;
  width: number;
  length: number;
  active: boolean;
  nearMissChecked: boolean;
}

export class TrafficManager {
  private scene: THREE.Scene;
  private trafficPool: TrafficCarInstance[] = [];
  private lanes: number[] = [-4.6, 0, 4.6];
  private maxTraffic: number = 16;
  private difficulty: Difficulty = 'normal';
  private frameCount: number = 0;
  private updateInterval: number = 1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initPool();
  }

  public setDifficulty(diff: Difficulty) {
    this.difficulty = diff;
    if (diff === 'easy') this.maxTraffic = 10;
    else if (diff === 'normal') this.maxTraffic = 15;
    else if (diff === 'hard') this.maxTraffic = 20;
  }

  public setMaxTraffic(count: number, updateInterval: number = 1) {
    this.maxTraffic = Math.min(24, Math.max(8, count));
    this.updateInterval = updateInterval;
  }

  private initPool() {
    for (let i = 0; i < 24; i++) {
      const { group, wheels } = CarFactory.createTrafficCar(i);
      group.visible = false;
      this.scene.add(group);

      this.trafficPool.push({
        group,
        wheels,
        lane: 0,
        z: 0,
        speedMps: 25,
        width: 2.1,
        length: 4.4,
        active: false,
        nearMissChecked: false,
      });
    }
  }

  public reset(playerZ: number) {
    for (let i = 0; i < this.trafficPool.length; i++) {
      const car = this.trafficPool[i];
      if (i < this.maxTraffic) {
        this.spawnCar(car, playerZ - 80 - i * 45 - Math.random() * 25);
      } else {
        car.active = false;
        car.group.visible = false;
      }
    }
  }

  private spawnCar(car: TrafficCarInstance, targetZ: number) {
    const lane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
    car.lane = lane;
    car.z = targetZ;
    car.group.position.set(lane, 0, targetZ);
    car.group.rotation.set(0, 0, 0);

    const baseSpeed = this.difficulty === 'hard' ? 32 : 26;
    car.speedMps = baseSpeed + (Math.random() * 10 - 5);

    car.active = true;
    car.nearMissChecked = false;
    car.group.visible = true;
  }

  public update(delta: number, playerZ: number, _playerSpeedMps: number) {
    this.frameCount++;
    let activeCount = 0;

    for (const car of this.trafficPool) {
      if (!car.active) continue;
      activeCount++;

      // Traffic moves in the forward direction (-Z)
      car.z -= car.speedMps * delta;
      car.group.position.z = car.z;

      // Distance from player to calculate LOD
      const distToPlayer = Math.abs(car.z - playerZ);

      // LOD: Rotate wheels only when close to camera (< 110 units) to save matrix transforms
      if (distToPlayer < 110) {
        const wheelRot = (car.speedMps * delta) / 0.35;
        for (let w = 0; w < car.wheels.length; w++) {
          car.wheels[w].rotation.x += wheelRot;
        }
      }

      // Recycle when fallen far behind player
      if (car.z > playerZ + 32) {
        let farthestZ = playerZ - 130;
        for (const other of this.trafficPool) {
          if (other.active && other.z < farthestZ) {
            farthestZ = other.z;
          }
        }
        this.spawnCar(car, farthestZ - 40 - Math.random() * 30);
      }
    }

    // Maintain target active count
    if (activeCount < this.maxTraffic) {
      for (const car of this.trafficPool) {
        if (!car.active) {
          let farthestZ = playerZ - 120;
          for (const other of this.trafficPool) {
            if (other.active && other.z < farthestZ) farthestZ = other.z;
          }
          this.spawnCar(car, farthestZ - 45 - Math.random() * 30);
          break;
        }
      }
    }
  }

  public getActiveCars(): TrafficCarInstance[] {
    return this.trafficPool.filter((c) => c.active);
  }

  public getActiveCount(): number {
    let count = 0;
    for (let i = 0; i < this.trafficPool.length; i++) {
      if (this.trafficPool[i].active) count++;
    }
    return count;
  }
}
