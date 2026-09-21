import * as THREE from 'three';

export interface BoostPad {
  mesh: THREE.Group;
  lane: number;
  z: number;
  active: boolean;
}

export class WorldManager {
  public scene: THREE.Scene;
  private roadSegments: THREE.Group[] = [];
  private boostPads: BoostPad[] = [];
  private buildings: THREE.Group[] = [];
  private segmentLength: number = 40;
  private totalSegments: number = 18; // covers 720 units ahead and behind
  private roadWidth: number = 14.5;
  private asphaltMat!: THREE.MeshStandardMaterial;
  private wetReflectionPlane!: THREE.Mesh;
  private boostTexture!: THREE.CanvasTexture;
  private signTexture!: THREE.CanvasTexture;
  private dirLight!: THREE.DirectionalLight;
  private goldLight!: THREE.DirectionalLight;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.setupMaterials();
    this.createSkyAndFog();
    this.createRoadSegments();
    this.createSkyline();
  }

  private setupMaterials() {
    // Wet glossy dark asphalt texture generated procedurally
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#04070d';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle asphalt grain & wet glossy puddles
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const brightness = 12 + Math.random() * 22;
      ctx.fillStyle = `rgb(${brightness},${brightness + 2},${brightness + 6})`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 3);
    }

    // Wet reflective sheen patches
    for (let i = 0; i < 25; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const grad = ctx.createRadialGradient(px, py, 4, px, py, 35 + Math.random() * 40);
      grad.addColorStop(0, 'rgba(15, 28, 48, 0.45)');
      grad.addColorStop(1, 'rgba(4, 7, 13, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(px - 80, py - 80, 160, 160);
    }

    const asphaltTex = new THREE.CanvasTexture(canvas);
    asphaltTex.wrapS = THREE.RepeatWrapping;
    asphaltTex.wrapT = THREE.RepeatWrapping;
    asphaltTex.repeat.set(2, 8);

    this.asphaltMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      color: 0x141d2e,
      roughness: 0.25,
      metalness: 0.35,
      emissive: 0x050914,
    });

    // Create Boost Pad Chevron glowing texture
    const boostCanvas = document.createElement('canvas');
    boostCanvas.width = 256;
    boostCanvas.height = 256;
    const bctx = boostCanvas.getContext('2d')!;
    bctx.fillStyle = 'rgba(0,0,0,0)';
    bctx.clearRect(0, 0, 256, 256);

    // Draw glowing cyber chevrons
    bctx.strokeStyle = '#00f0ff';
    bctx.shadowColor = '#00f0ff';
    bctx.shadowBlur = 18;
    bctx.lineWidth = 14;
    bctx.lineCap = 'round';
    bctx.lineJoin = 'miter';

    for (let i = 0; i < 3; i++) {
      const yOffset = 50 + i * 65;
      bctx.beginPath();
      bctx.moveTo(45, yOffset + 35);
      bctx.lineTo(128, yOffset - 15);
      bctx.lineTo(211, yOffset + 35);
      bctx.stroke();
    }
    this.boostTexture = new THREE.CanvasTexture(boostCanvas);

    // Overhead Gantry Sign Texture
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sctx = signCanvas.getContext('2d')!;
    sctx.fillStyle = '#060d1a';
    sctx.fillRect(0, 0, 512, 128);

    // Cyan glowing border
    sctx.strokeStyle = '#00f0ff';
    sctx.lineWidth = 6;
    sctx.strokeRect(6, 6, 500, 116);

    // Glowing futuristic typography
    sctx.fillStyle = '#00f0ff';
    sctx.font = 'bold 36px Orbitron, sans-serif';
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.shadowColor = '#00f0ff';
    sctx.shadowBlur = 12;
    sctx.fillText('SPEEDWAY // SECTOR 07', 256, 50);

    sctx.fillStyle = '#ffb703';
    sctx.font = 'bold 20px Rajdhani, sans-serif';
    sctx.shadowColor = '#ffb703';
    sctx.shadowBlur = 8;
    sctx.fillText('⚡ HIGH SPEED ZONE • MERGE WITH CAUTION ⚡', 256, 92);

    this.signTexture = new THREE.CanvasTexture(signCanvas);
  }

  private createSkyAndFog() {
    this.scene.background = new THREE.Color(0x020409);
    this.scene.fog = new THREE.FogExp2(0x020409, 0.0048);

    // Ambient mood lighting (dark cyber blue)
    const ambientLight = new THREE.AmbientLight(0x0a1526, 1.4);
    this.scene.add(ambientLight);

    // Directional cyan key light from left sky
    this.dirLight = new THREE.DirectionalLight(0x00f0ff, 1.1);
    this.dirLight.position.set(-25, 45, -40);
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // Directional gold key light from right sky
    this.goldLight = new THREE.DirectionalLight(0xffb703, 0.85);
    this.goldLight.position.set(25, 35, -40);
    this.scene.add(this.goldLight);
    this.scene.add(this.goldLight.target);
  }

  private createRoadSegments() {
    // Pure bright white center dashed lane markings
    const laneLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x0e1726, metalness: 0.9, roughness: 0.2 });
    const cyanNeonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const goldNeonMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });

    // Wet road specular reflection strips (Cyan on left, Yellow/Gold on right)
    const cyanReflectionMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const goldReflectionMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < this.totalSegments; i++) {
      const segGroup = new THREE.Group();
      const zPos = -i * this.segmentLength;
      segGroup.position.z = zPos;

      // 1. Asphalt Road Plane
      const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength);
      roadGeo.rotateX(-Math.PI / 2);
      const roadMesh = new THREE.Mesh(roadGeo, this.asphaltMat);
      roadMesh.receiveShadow = true;
      segGroup.add(roadMesh);

      // 2. Wet Road Optical Light Reflection Sheen Planes (running along the road)
      const sheenGeoLeft = new THREE.PlaneGeometry(4.2, this.segmentLength);
      sheenGeoLeft.rotateX(-Math.PI / 2);
      const sheenLeft = new THREE.Mesh(sheenGeoLeft, cyanReflectionMat);
      sheenLeft.position.set(-4.0, 0.008, 0);
      segGroup.add(sheenLeft);

      const sheenGeoRight = new THREE.PlaneGeometry(4.2, this.segmentLength);
      sheenGeoRight.rotateX(-Math.PI / 2);
      const sheenRight = new THREE.Mesh(sheenGeoRight, goldReflectionMat);
      sheenRight.position.set(4.0, 0.008, 0);
      segGroup.add(sheenRight);

      // 3. Dashed Lane Markings (White dashes between Lane 1 & 2 at x=-2.3, and Lane 2 & 3 at x=+2.3)
      const dashGeo = new THREE.PlaneGeometry(0.22, 4.5);
      dashGeo.rotateX(-Math.PI / 2);

      for (let d = -this.segmentLength / 2 + 2; d < this.segmentLength / 2; d += 8) {
        const dash1 = new THREE.Mesh(dashGeo, laneLineMat);
        dash1.position.set(-2.3, 0.015, d);
        const dash2 = new THREE.Mesh(dashGeo, laneLineMat);
        dash2.position.set(2.3, 0.015, d);
        segGroup.add(dash1, dash2);
      }

      // 4. Outer solid boundary neon lines
      const edgeGeo = new THREE.PlaneGeometry(0.3, this.segmentLength);
      edgeGeo.rotateX(-Math.PI / 2);
      const leftEdge = new THREE.Mesh(edgeGeo, cyanNeonMat);
      leftEdge.position.set(-this.roadWidth / 2 + 0.35, 0.02, 0);
      const rightEdge = new THREE.Mesh(edgeGeo, goldNeonMat);
      rightEdge.position.set(this.roadWidth / 2 - 0.35, 0.02, 0);
      segGroup.add(leftEdge, rightEdge);

      // 5. Futuristic Side Barriers
      const barrierGeo = new THREE.BoxGeometry(0.65, 1.2, this.segmentLength);
      const leftBarrier = new THREE.Mesh(barrierGeo, barrierMat);
      leftBarrier.position.set(-this.roadWidth / 2 - 0.35, 0.6, 0);
      const rightBarrier = new THREE.Mesh(barrierGeo, barrierMat);
      rightBarrier.position.set(this.roadWidth / 2 + 0.35, 0.6, 0);
      segGroup.add(leftBarrier, rightBarrier);

      // Neon light strip on barriers (Cyan on left, Gold on right)
      const stripGeo = new THREE.BoxGeometry(0.1, 0.16, this.segmentLength);
      const leftStrip = new THREE.Mesh(stripGeo, cyanNeonMat);
      leftStrip.position.set(-this.roadWidth / 2 + 0.02, 0.9, 0);
      const rightStrip = new THREE.Mesh(stripGeo, goldNeonMat);
      rightStrip.position.set(this.roadWidth / 2 - 0.02, 0.9, 0);
      segGroup.add(leftStrip, rightStrip);

      // 6. Overhead Cyber Arch Gantry (Every 3rd segment)
      if (i % 3 === 0) {
        const arch = this.createOverheadArch();
        arch.position.set(0, 0, 0);
        segGroup.add(arch);
      }

      // 7. Roadside Cyber Light Poles
      const poleGeo = new THREE.CylinderGeometry(0.14, 0.18, 7.5, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x080f1d, metalness: 0.85 });
      const lampGeo = new THREE.BoxGeometry(2.0, 0.2, 0.5);

      const leftPole = new THREE.Mesh(poleGeo, poleMat);
      leftPole.position.set(-this.roadWidth / 2 - 2.0, 3.75, 0);
      const leftLamp = new THREE.Mesh(lampGeo, cyanNeonMat);
      leftLamp.position.set(-this.roadWidth / 2 - 1.2, 7.4, 0);

      const rightPole = new THREE.Mesh(poleGeo, poleMat);
      rightPole.position.set(this.roadWidth / 2 + 2.0, 3.75, 0);
      const rightLamp = new THREE.Mesh(lampGeo, goldNeonMat);
      rightLamp.position.set(this.roadWidth / 2 + 1.2, 7.4, 0);

      // Vertical neon light tubes running up the light poles
      const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 6.5, 6);
      const leftTube = new THREE.Mesh(tubeGeo, cyanNeonMat);
      leftTube.position.set(-this.roadWidth / 2 - 1.85, 3.75, 0);
      const rightTube = new THREE.Mesh(tubeGeo, goldNeonMat);
      rightTube.position.set(this.roadWidth / 2 + 1.85, 3.75, 0);

      segGroup.add(leftPole, leftLamp, leftTube, rightPole, rightLamp, rightTube);

      this.scene.add(segGroup);
      this.roadSegments.push(segGroup);
    }

    // Initialize Boost Pads pool
    this.initBoostPads();
  }

  private createOverheadArch(): THREE.Group {
    const arch = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.8, roughness: 0.3 });
    const neonCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonGold = new THREE.MeshBasicMaterial({ color: 0xffb703 });

    // Left pillar
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.5, 0.8), mat);
    p1.position.set(-this.roadWidth / 2 - 1.5, 4.25, 0);
    // Right pillar
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.5, 0.8), mat);
    p2.position.set(this.roadWidth / 2 + 1.5, 4.25, 0);
    // Crossbeam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 4, 1.2, 0.9), mat);
    beam.position.set(0, 8.2, 0);

    // Glowing Neon Hologram Signboard
    const signMat = new THREE.MeshBasicMaterial({
      map: this.signTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 2.25), signMat);
    sign.position.set(0, 7.8, -0.48);
    sign.rotation.y = Math.PI;

    // Glowing underside strips
    const underStrip = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 2, 0.1, 0.1), neonGold);
    underStrip.position.set(0, 7.55, 0);

    arch.add(p1, p2, beam, sign, underStrip);
    return arch;
  }

  private initBoostPads() {
    const boostMat = new THREE.MeshBasicMaterial({
      map: this.boostTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const padGeo = new THREE.PlaneGeometry(3.6, 7.2);
    padGeo.rotateX(-Math.PI / 2);

    const lanes = [-4.6, 0, 4.6];

    // Spawn 12 poolable boost pads along the highway
    for (let i = 0; i < 12; i++) {
      const padMesh = new THREE.Group();
      const plane = new THREE.Mesh(padGeo, boostMat);
      plane.position.y = 0.03;
      padMesh.add(plane);

      // Soft glow aura
      const auraGeo = new THREE.PlaneGeometry(4.2, 8.0);
      auraGeo.rotateX(-Math.PI / 2);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0xffb703,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.position.y = 0.02;
      padMesh.add(aura);

      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const z = -60 - i * 65 - Math.random() * 20;
      padMesh.position.set(lane, 0, z);

      this.scene.add(padMesh);
      this.boostPads.push({
        mesh: padMesh,
        lane,
        z,
        active: true,
      });
    }
  }

  private createSkyline() {
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x050811,
      roughness: 0.4,
      metalness: 0.9,
    });
    const windowMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const windowMatGold = new THREE.MeshBasicMaterial({ color: 0xffb703 });

    // Spawn futuristic towers on left and right sides
    for (let i = 0; i < 30; i++) {
      const bGroup = new THREE.Group();
      const side = i % 2 === 0 ? -1 : 1;
      const xDist = side * (this.roadWidth / 2 + 15 + Math.random() * 35);
      const zDist = -i * 28 - 20;
      const height = 40 + Math.random() * 70;
      const width = 12 + Math.random() * 14;

      const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, width), buildingMat);
      tower.position.set(0, height / 2, 0);
      bGroup.add(tower);

      // Neon crown / antenna on top
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.4, 15, 6),
        side === -1 ? windowMatCyan : windowMatGold
      );
      antenna.position.set(0, height + 7.5, 0);
      bGroup.add(antenna);

      // Neon vertical stripes along skyscraper corners
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, height * 0.7, 0.3),
        side === -1 ? windowMatCyan : windowMatGold
      );
      stripe.position.set(side * (width / 2), height * 0.5, width / 2);
      bGroup.add(stripe);

      bGroup.position.set(xDist, 0, zDist);
      this.scene.add(bGroup);
      this.buildings.push(bGroup);
    }
  }

  /**
   * Complete reset of all road segments, buildings, boost pads, and lighting
   * to align perfectly with player origin (default z=0).
   */
  public reset(playerZ: number = 0) {
    // 1. Reposition all road segments sequentially from player position forward
    for (let i = 0; i < this.roadSegments.length; i++) {
      this.roadSegments[i].position.set(0, 0, playerZ - i * this.segmentLength);
      this.roadSegments[i].visible = true;
    }

    // 2. Reposition all skyline buildings
    for (let i = 0; i < this.buildings.length; i++) {
      this.buildings[i].position.z = playerZ - i * 28 - 20;
      this.buildings[i].visible = true;
    }

    // 3. Reposition and re-activate boost pads
    const lanes = [-4.6, 0, 4.6];
    for (let i = 0; i < this.boostPads.length; i++) {
      const pad = this.boostPads[i];
      const targetZ = playerZ - 60 - i * 65 - (i % 2) * 20;
      pad.lane = lanes[i % lanes.length];
      pad.mesh.position.set(pad.lane, 0.02, targetZ);
      pad.z = targetZ;
      pad.active = true;
      pad.mesh.visible = true;
    }

    // 4. Align key directional lights with active player zone
    if (this.dirLight) {
      this.dirLight.position.set(-25, 45, playerZ - 40);
      this.dirLight.target.position.set(0, 0, playerZ);
    }
    if (this.goldLight) {
      this.goldLight.position.set(25, 35, playerZ - 40);
      this.goldLight.target.position.set(0, 0, playerZ);
    }
  }

  /**
   * Update road segments and boost pads relative to player forward position.
   * Uses bidirectional wrapping so road segments ALWAYS envelop the player
   * regardless of position jumps or game mode changes.
   */
  public update(playerZ: number, delta: number) {
    const span = this.totalSegments * this.segmentLength;
    const forwardMargin = this.segmentLength * 2; // 80 units

    // Bidirectional road recycling: guarantees segments ALWAYS envelop playerZ
    for (const seg of this.roadSegments) {
      while (seg.position.z > playerZ + forwardMargin) {
        seg.position.z -= span;
      }
      while (seg.position.z < playerZ + forwardMargin - span) {
        seg.position.z += span;
      }
    }

    // Bidirectional building recycling
    const buildingSpan = 30 * 28;
    for (const b of this.buildings) {
      while (b.position.z > playerZ + 40) {
        b.position.z -= buildingSpan;
      }
      while (b.position.z < playerZ + 40 - buildingSpan) {
        b.position.z += buildingSpan;
      }
    }

    // Pulse and recycle Boost Pads
    const lanes = [-4.6, 0, 4.6];
    for (const pad of this.boostPads) {
      if (pad.mesh.position.z > playerZ + 20 || pad.mesh.position.z < playerZ - 500) {
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        const farthestZ = Math.min(...this.boostPads.map(p => p.mesh.position.z));
        const targetZ = Math.min(playerZ - 50, farthestZ - 45 - Math.random() * 25);
        pad.mesh.position.set(lane, 0.02, targetZ);
        pad.lane = lane;
        pad.z = targetZ;
        pad.active = true;
        pad.mesh.visible = true;
      }

      // Subtle hover/pulse
      if (pad.mesh.visible) {
        pad.mesh.position.y = 0.02 + Math.sin(Date.now() * 0.006 + pad.z) * 0.01;
      }
    }

    // Keep directional lighting tracking the active player segment
    if (this.dirLight) {
      this.dirLight.position.z = playerZ - 40;
      this.dirLight.target.position.set(0, 0, playerZ);
    }
    if (this.goldLight) {
      this.goldLight.position.z = playerZ - 40;
      this.goldLight.target.position.set(0, 0, playerZ);
    }
  }

  public getBoostPads(): BoostPad[] {
    return this.boostPads;
  }
}
