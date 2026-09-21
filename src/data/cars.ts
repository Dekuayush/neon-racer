import { CarStats, ChallengeDef } from '../types/game';

export const CARS_CATALOG: CarStats[] = [
  {
    id: 'neon-x',
    name: 'NEON-X',
    tagline: 'Cyber-Aero Prototype // Balanced Circuit Runner',
    topSpeedKmh: 240,
    acceleration: 82,
    handling: 85,
    nitroMultiplier: 1.35,
    brakingPower: 88,
    bodyColor: '#0284c7', // Vivid Cyber Electric Blue
    neonColor: '#00f0ff', // Pure Bright Cyan
    accentColor: '#38bdf8', // Light Sky Cyan
    unlocked: true,
  },
  {
    id: 'volt-r',
    name: 'VOLT-R',
    tagline: 'Dual Flux Electric // Extreme Acceleration',
    topSpeedKmh: 270,
    acceleration: 95,
    handling: 92,
    nitroMultiplier: 1.45,
    brakingPower: 90,
    bodyColor: '#0369a1', // Deep Cobalt Cyan
    neonColor: '#00ffff', // Electric Cyan
    accentColor: '#22d3ee', // Bright Turquoise
    unlocked: true,
  },
  {
    id: 'phantom',
    name: 'PHANTOM',
    tagline: 'Dark Matter Interceptor // High-Speed Cruiser',
    topSpeedKmh: 305,
    acceleration: 88,
    handling: 78,
    nitroMultiplier: 1.5,
    brakingPower: 82,
    bodyColor: '#1d4ed8', // Royal Cyber Blue
    neonColor: '#38bdf8', // Neon Sky Glow
    accentColor: '#60a5fa', // Ice Blue
    unlocked: true,
  },
  {
    id: 'apex',
    name: 'APEX GT',
    tagline: 'Hyper-Grid Predator // Maximum Top Velocity',
    topSpeedKmh: 340,
    acceleration: 98,
    handling: 94,
    nitroMultiplier: 1.6,
    brakingPower: 96,
    bodyColor: '#0f766e', // Metallic Hyper Teal
    neonColor: '#00f0ff', // Ultra Cyan
    accentColor: '#2dd4bf', // Mint Cyan
    unlocked: false,
    unlockRequirement: 'Achieve 25,000 pts or Level 5',
  },
];

export const INITIAL_CHALLENGES: ChallengeDef[] = [
  {
    id: 'c1',
    title: 'Sound Barrier',
    description: 'Reach a top speed of 250 KM/H',
    targetType: 'speed',
    targetValue: 250,
    currentValue: 0,
    completed: false,
  },
  {
    id: 'c2',
    title: 'Split-Second Reflexes',
    description: 'Perform 10 Near Misses in a single run',
    targetType: 'near_miss',
    targetValue: 10,
    currentValue: 0,
    completed: false,
  },
  {
    id: 'c3',
    title: 'Neon Highway Marathon',
    description: 'Travel over 5,000 meters in Endless mode',
    targetType: 'distance',
    targetValue: 5000,
    currentValue: 0,
    completed: false,
  },
  {
    id: 'c4',
    title: 'Boost Enthusiast',
    description: 'Collect 12 Turbo Boost pads',
    targetType: 'boost_pads',
    targetValue: 12,
    currentValue: 0,
    completed: false,
  },
  {
    id: 'c5',
    title: 'Cyber Legend',
    description: 'Score 50,000 points in one session',
    targetType: 'score',
    targetValue: 50000,
    currentValue: 0,
    completed: false,
  },
];
