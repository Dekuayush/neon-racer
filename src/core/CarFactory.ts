import * as THREE from 'three';
import { CarStats } from '../types/game';

export class CarFactory {
  /**
   * Builds an original futuristic 3D sports car for the player
   */
  public static createPlayerCar(stats: CarStats): {
    group: THREE.Group;
    wheels: THREE.Mesh[];
    exhausts: THREE.Mesh[];
    underglow: THREE.PointLight;
    nitroFlames: THREE.Group;
    bodyMesh: THREE.Mesh;
    updateNitro: (active: boolean, delta: number) => void;
  } {
    const group = new THREE.Group();

    const carColor = new THREE.Color(stats.bodyColor || '#0284c7');
    const neonColor = new THREE.Color(stats.neonColor || '#00f0ff');
    const accentColor = new THREE.Color(stats.accentColor || '#38bdf8');

    // Rich metallic paint with luminous emissive base to never get lost in darkness
    const bodyMat = new THREE.MeshStandardMaterial({
      color: carColor,
      metalness: 0.75,
      roughness: 0.18,
      emissive: carColor.clone().multiplyScalar(0.32), // Guaranteed vivid visibility against dark asphalt
    });

    const neonMat = new THREE.MeshBasicMaterial({
      color: neonColor,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      metalness: 0.8,
      roughness: 0.22,
      emissive: accentColor.clone().multiplyScalar(0.2),
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x06182c,
      metalness: 0.95,
      roughness: 0.06,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.15,
    });

    const darkCarbonMat = new THREE.MeshStandardMaterial({
      color: 0x182030,
      metalness: 0.8,
      roughness: 0.35,
    });

    // 1. Lower chassis / floor pan
    const floorGeo = new THREE.BoxGeometry(1.9, 0.2, 4.4);
    const floorMesh = new THREE.Mesh(floorGeo, darkCarbonMat);
    floorMesh.position.y = 0.22;
    floorMesh.castShadow = true;
    group.add(floorMesh);

    // 2. Main aerodynamic body wedge (tapered front, aggressive wide rear)
    const mainBodyGeo = new THREE.BoxGeometry(1.85, 0.44, 3.8);
    const mainBody = new THREE.Mesh(mainBodyGeo, bodyMat);
    mainBody.position.set(0, 0.46, 0.1);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    group.add(mainBody);

    // 3. Front hood slope / nose wedge
    const noseGeo = new THREE.CylinderGeometry(0.8, 0.92, 1.4, 4);
    noseGeo.rotateY(Math.PI / 4);
    noseGeo.scale(1.0, 0.3, 1.0);
    const noseMesh = new THREE.Mesh(noseGeo, bodyMat);
    noseMesh.position.set(0, 0.39, -1.8);
    noseMesh.castShadow = true;
    group.add(noseMesh);

    // 4. Front Splitter with Cyber Neon Edge
    const splitterGeo = new THREE.BoxGeometry(1.95, 0.06, 0.7);
    const splitter = new THREE.Mesh(splitterGeo, darkCarbonMat);
    splitter.position.set(0, 0.12, -2.1);
    group.add(splitter);

    const frontNeonGeo = new THREE.BoxGeometry(1.9, 0.05, 0.08);
    const frontNeon = new THREE.Mesh(frontNeonGeo, neonMat);
    frontNeon.position.set(0, 0.14, -2.44);
    group.add(frontNeon);

    // 5. Cockpit canopy / Glass cabin
    const canopyGeo = new THREE.CylinderGeometry(0.56, 0.82, 1.8, 4);
    canopyGeo.rotateY(Math.PI / 4);
    canopyGeo.scale(1.0, 0.46, 1.1);
    const canopy = new THREE.Mesh(canopyGeo, glassMat);
    canopy.position.set(0, 0.79, 0.1);
    canopy.castShadow = true;
    group.add(canopy);

    // Distinct Rear Windshield with Cyber Glow & Cockpit Frame
    const rearGlassGeo = new THREE.PlaneGeometry(1.25, 0.72);
    rearGlassGeo.rotateX(Math.PI / 4.4);
    const rearGlassMat = new THREE.MeshStandardMaterial({
      color: 0x082038,
      metalness: 0.95,
      roughness: 0.06,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.28,
    });
    const rearGlass = new THREE.Mesh(rearGlassGeo, rearGlassMat);
    rearGlass.position.set(0, 0.76, 0.94);
    group.add(rearGlass);

    // Dual Central Glowing Racing Stripes along the roof and hood
    const stripeGeo = new THREE.BoxGeometry(0.08, 0.02, 3.8);
    const leftStripe = new THREE.Mesh(stripeGeo, neonMat);
    leftStripe.position.set(-0.25, 0.7, -0.05);
    const rightStripe = new THREE.Mesh(stripeGeo, neonMat);
    rightStripe.position.set(0.25, 0.7, -0.05);
    group.add(leftStripe, rightStripe);

    // 6. Side air intakes / aerodynamic pontoons
    const podGeo = new THREE.BoxGeometry(0.32, 0.34, 1.8);
    const leftPod = new THREE.Mesh(podGeo, accentMat);
    leftPod.position.set(-0.95, 0.41, 0.3);
    const rightPod = new THREE.Mesh(podGeo, accentMat);
    rightPod.position.set(0.95, 0.41, 0.3);
    group.add(leftPod, rightPod);

    // Side Neon Strips along lower doors
    const sideNeonGeo = new THREE.BoxGeometry(0.05, 0.05, 2.2);
    const leftSideNeon = new THREE.Mesh(sideNeonGeo, neonMat);
    leftSideNeon.position.set(-1.03, 0.28, 0.1);
    const rightSideNeon = new THREE.Mesh(sideNeonGeo, neonMat);
    rightSideNeon.position.set(1.03, 0.28, 0.1);
    group.add(leftSideNeon, rightSideNeon);

    // 7. Rear Aerodynamic Cyber Wing & Diffuser
    const wingSupportGeo = new THREE.BoxGeometry(0.08, 0.38, 0.3);
    const leftSup = new THREE.Mesh(wingSupportGeo, darkCarbonMat);
    leftSup.position.set(-0.62, 0.82, 1.8);
    const rightSup = new THREE.Mesh(wingSupportGeo, darkCarbonMat);
    rightSup.position.set(0.62, 0.82, 1.8);
    group.add(leftSup, rightSup);

    const wingBladeGeo = new THREE.BoxGeometry(2.04, 0.07, 0.48);
    const wingBlade = new THREE.Mesh(wingBladeGeo, bodyMat);
    wingBlade.position.set(0, 1.02, 1.85);
    group.add(wingBlade);

    // Wing edge neon blade (super bright on trailing edge)
    const wingNeonGeo = new THREE.BoxGeometry(2.06, 0.04, 0.05);
    const wingNeon = new THREE.Mesh(wingNeonGeo, neonMat);
    wingNeon.position.set(0, 1.02, 2.1);
    group.add(wingNeon);

    // Rear diffuser fins
    const diffuserGeo = new THREE.BoxGeometry(1.65, 0.18, 0.5);
    const diffuser = new THREE.Mesh(diffuserGeo, darkCarbonMat);
    diffuser.position.set(0, 0.18, 2.05);
    group.add(diffuser);

    // Diffuser neon under-line
    const diffuserNeonGeo = new THREE.BoxGeometry(1.68, 0.03, 0.04);
    const diffuserNeon = new THREE.Mesh(diffuserNeonGeo, neonMat);
    diffuserNeon.position.set(0, 0.11, 2.3);
    group.add(diffuserNeon);

    // 8. Headlights (Angled bright cyan LED blades)
    const headlightGeo = new THREE.BoxGeometry(0.4, 0.06, 0.15);
    const leftHeadlight = new THREE.Mesh(headlightGeo, neonMat);
    leftHeadlight.position.set(-0.65, 0.42, -2.15);
    leftHeadlight.rotation.y = 0.15;
    const rightHeadlight = new THREE.Mesh(headlightGeo, neonMat);
    rightHeadlight.position.set(0.65, 0.42, -2.15);
    rightHeadlight.rotation.y = -0.15;
    group.add(leftHeadlight, rightHeadlight);

    // 9. Rear Taillight Bar & Cluster (High-Vibrancy Glowing Red/Cyan)
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const tailBarGeo = new THREE.BoxGeometry(1.72, 0.09, 0.06);
    const tailBar = new THREE.Mesh(tailBarGeo, tailMat);
    tailBar.position.set(0, 0.56, 2.02);
    group.add(tailBar);

    // Dual C-shaped rear taillight clusters on outer fenders
    const sideTailGeo = new THREE.BoxGeometry(0.24, 0.14, 0.06);
    const leftSideTail = new THREE.Mesh(sideTailGeo, tailMat);
    leftSideTail.position.set(-0.8, 0.56, 2.02);
    const rightSideTail = new THREE.Mesh(sideTailGeo, tailMat);
    rightSideTail.position.set(0.8, 0.56, 2.02);
    group.add(leftSideTail, rightSideTail);

    // 10. Dual Exhaust Thruster Ports
    const exhausts: THREE.Mesh[] = [];
    const exhaustGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.3, 14);
    exhaustGeo.rotateX(Math.PI / 2);

    const exRimMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    const leftEx = new THREE.Mesh(exhaustGeo, exRimMat);
    leftEx.position.set(-0.4, 0.32, 2.06);
    const rightEx = new THREE.Mesh(exhaustGeo, exRimMat);
    rightEx.position.set(0.4, 0.32, 2.06);
    group.add(leftEx, rightEx);
    exhausts.push(leftEx, rightEx);

    // 11. Multi-layered Animated Nitro Flame Jets
    const nitroFlames = new THREE.Group();
    // Outer cyan plasma flame
    const outerFlameGeo = new THREE.ConeGeometry(0.22, 1.4, 12);
    outerFlameGeo.rotateX(-Math.PI / 2);
    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const leftFlame = new THREE.Mesh(outerFlameGeo, outerFlameMat);
    leftFlame.position.set(-0.4, 0.32, 2.8);
    const rightFlame = new THREE.Mesh(outerFlameGeo, outerFlameMat);
    rightFlame.position.set(0.4, 0.32, 2.8);

    // Inner white-hot core flame
    const innerFlameGeo = new THREE.ConeGeometry(0.12, 0.9, 10);
    innerFlameGeo.rotateX(-Math.PI / 2);
    const innerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const leftCore = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    leftCore.position.set(-0.4, 0.32, 2.5);
    const rightCore = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    rightCore.position.set(0.4, 0.32, 2.5);

    nitroFlames.add(leftFlame, rightFlame, leftCore, rightCore);
    nitroFlames.visible = false;
    group.add(nitroFlames);

    // 12. 4 Detailed Cyber Wheels
    const wheels: THREE.Mesh[] = [];
    const wheelPositions = [
      { x: -0.98, y: 0.35, z: -1.35 }, // Front-Left
      { x: 0.98, y: 0.35, z: -1.35 },  // Front-Right
      { x: -1.0, y: 0.37, z: 1.35 },   // Rear-Left
      { x: 1.0, y: 0.37, z: 1.35 },    // Rear-Right
    ];

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x0e131d,
      roughness: 0.6,
      metalness: 0.3,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x22324d,
      metalness: 0.9,
      roughness: 0.2,
    });

    wheelPositions.forEach(pos => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);

      const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 16);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, tireMat);
      tireMesh.castShadow = true;
      wheelGroup.add(tireMesh);

      // Rim Disc with Neon accent center
      const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.27, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      wheelGroup.add(rimMesh);

      const rimLightGeo = new THREE.RingGeometry(0.14, 0.18, 12);
      rimLightGeo.rotateY(pos.x > 0 ? Math.PI / 2 : -Math.PI / 2);
      const rimLight = new THREE.Mesh(rimLightGeo, neonMat);
      rimLight.position.x = pos.x > 0 ? 0.14 : -0.14;
      wheelGroup.add(rimLight);

      group.add(wheelGroup);
      wheels.push(tireMesh);
    });

    // 13. Dedicated Overhead Key / Rim Spotlight (Follows Car, Lights Silhouette)
    const carRimLight = new THREE.DirectionalLight(0xa5f3fc, 2.6);
    carRimLight.position.set(0, 4.5, 1.8);
    carRimLight.target.position.set(0, 0.4, 0);
    group.add(carRimLight);
    group.add(carRimLight.target);

    // Rear Fill / Taillight Point Light
    const rearFillLight = new THREE.PointLight(0x00f0ff, 2.0, 6.0);
    rearFillLight.position.set(0, 0.8, 2.3);
    group.add(rearFillLight);

    // 14. Neon Underglow (PointLight + Ground Pool Glow Plane)
    const underglow = new THREE.PointLight(neonColor, 3.2, 8);
    underglow.position.set(0, 0.18, 0);
    group.add(underglow);

    const underglowPlaneGeo = new THREE.PlaneGeometry(2.6, 4.6);
    underglowPlaneGeo.rotateX(-Math.PI / 2);
    const underglowPlaneMat = new THREE.MeshBasicMaterial({
      color: neonColor,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const underglowPlane = new THREE.Mesh(underglowPlaneGeo, underglowPlaneMat);
    underglowPlane.position.set(0, 0.02, 0);
    group.add(underglowPlane);

    let flameTime = 0;
    const updateNitro = (active: boolean, delta: number) => {
      nitroFlames.visible = active;
      if (active) {
        flameTime += delta * 30;
        const pulse = 1.0 + Math.sin(flameTime) * 0.28;
        const lengthMod = 1.3 + Math.random() * 0.4;
        leftFlame.scale.set(pulse, pulse, lengthMod);
        rightFlame.scale.set(pulse, pulse, lengthMod);
        leftCore.scale.set(pulse * 0.9, pulse * 0.9, lengthMod * 0.8);
        rightCore.scale.set(pulse * 0.9, pulse * 0.9, lengthMod * 0.8);

        underglow.intensity = 6.0;
        underglowPlaneMat.opacity = 0.85;
        carRimLight.intensity = 4.2;
        rearFillLight.intensity = 3.8;
      } else {
        underglow.intensity = 3.2;
        underglowPlaneMat.opacity = 0.5;
        carRimLight.intensity = 2.6;
        rearFillLight.intensity = 2.0;
      }
    };

    return {
      group,
      wheels,
      exhausts,
      underglow,
      nitroFlames,
      bodyMesh: mainBody,
      updateNitro,
    };
  }

  /**
   * Creates an original 3D traffic vehicle (red, orange, or dark industrial styling)
   */
  public static createTrafficCar(typeIndex: number): {
    group: THREE.Group;
    wheels: THREE.Mesh[];
  } {
    const group = new THREE.Group();
    const wheels: THREE.Mesh[] = [];

    // Hues: Crimson, Cyber Orange, Dark Plum
    const palette = [
      { body: 0x991b1b, neon: 0xff3b30, tail: 0xff1e00 }, // Red Cruiser
      { body: 0xc2410c, neon: 0xf97316, tail: 0xff4500 }, // Orange Speeder
      { body: 0x3f3f46, neon: 0xe11d48, tail: 0xff0040 }, // Dark Cyber Hauler
    ];
    const colorTheme = palette[typeIndex % palette.length];

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorTheme.body,
      metalness: 0.7,
      roughness: 0.3,
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.8,
      roughness: 0.4,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.9,
      roughness: 0.1,
    });

    const tailMat = new THREE.MeshBasicMaterial({ color: colorTheme.tail });
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });

    if (typeIndex % 3 === 2) {
      // Hauler / Cyber Van
      const chassisGeo = new THREE.BoxGeometry(2.1, 0.9, 4.8);
      const chassis = new THREE.Mesh(chassisGeo, bodyMat);
      chassis.position.y = 0.8;
      chassis.castShadow = true;
      group.add(chassis);

      const cabGeo = new THREE.BoxGeometry(1.9, 0.7, 1.8);
      const cab = new THREE.Mesh(cabGeo, glassMat);
      cab.position.set(0, 1.4, -1.2);
      group.add(cab);

      // Taillights
      const tailGeo = new THREE.BoxGeometry(1.8, 0.12, 0.08);
      const tail = new THREE.Mesh(tailGeo, tailMat);
      tail.position.set(0, 0.85, 2.42);
      group.add(tail);

      // Headlights
      const headGeo = new THREE.BoxGeometry(1.8, 0.1, 0.08);
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, 0.6, -2.42);
      group.add(head);
    } else {
      // Coupe / Cruiser
      const mainGeo = new THREE.BoxGeometry(1.8, 0.38, 4.0);
      const main = new THREE.Mesh(mainGeo, bodyMat);
      main.position.y = 0.42;
      main.castShadow = true;
      group.add(main);

      const roofGeo = new THREE.BoxGeometry(1.3, 0.36, 2.0);
      const roof = new THREE.Mesh(roofGeo, glassMat);
      roof.position.set(0, 0.72, 0.2);
      group.add(roof);

      const bumperFrontGeo = new THREE.BoxGeometry(1.82, 0.22, 0.3);
      const bumperFront = new THREE.Mesh(bumperFrontGeo, darkMat);
      bumperFront.position.set(0, 0.28, -2.0);
      group.add(bumperFront);

      // Taillights
      const tailGeo = new THREE.BoxGeometry(1.5, 0.08, 0.06);
      const tail = new THREE.Mesh(tailGeo, tailMat);
      tail.position.set(0, 0.48, 2.02);
      group.add(tail);

      // Headlights
      const headGeo = new THREE.BoxGeometry(0.35, 0.08, 0.06);
      const leftHead = new THREE.Mesh(headGeo, headMat);
      leftHead.position.set(-0.6, 0.38, -2.02);
      const rightHead = new THREE.Mesh(headGeo, headMat);
      rightHead.position.set(0.6, 0.38, -2.02);
      group.add(leftHead, rightHead);
    }

    // Wheels
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.8 });
    const wheelPositions = [
      { x: -0.92, y: 0.32, z: -1.3 },
      { x: 0.92, y: 0.32, z: -1.3 },
      { x: -0.92, y: 0.34, z: 1.3 },
      { x: 0.92, y: 0.34, z: 1.3 },
    ];
    wheelPositions.forEach(p => {
      const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(p.x, p.y, p.z);
      group.add(wheel);
      wheels.push(wheel);
    });

    return { group, wheels };
  }
}
