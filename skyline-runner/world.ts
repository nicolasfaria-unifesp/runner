import type { Aabb, Checkpoint, GrappleAnchor, ParkourPlatform, Vec3 } from './types'

export interface SkylineBuilding extends ParkourPlatform {
  readonly name: string
  readonly color: string
  readonly roofColor: string
  readonly accent: string
  readonly sector: string
}

export interface RooftopProp {
  readonly id: string
  readonly kind: 'vent' | 'barrier' | 'crate' | 'solar' | 'antenna'
  readonly position: readonly [number, number, number]
  readonly size: readonly [number, number, number]
  readonly rotationY?: number
  readonly collider?: Aabb
}

function bounds(
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
): Aabb {
  return { min: { x: minX, y: minY, z: minZ }, max: { x: maxX, y: maxY, z: maxZ } }
}

// Street level sits at y = 0. Every building rises from a shared basement at
// y = -30 so the facades read as grounded towers, and the walkable ground slab
// (see GROUND_TILES) gives the runner a continuous surface to roam between them.
const GROUND_TOP = 0

/**
 * Open-world skyline city. Instead of a single corridor marching down -Z, the
 * towers are arranged as a plaza at the spawn ringed by four outer districts so
 * the runner can wander across both +X/-X and +Z/-Z. Growing this table scales
 * the rendered scene because SkylineWorld maps over it directly.
 */
export const SKYLINE_BUILDINGS: readonly SkylineBuilding[] = [
  // Central praça: short pedestals framing the spawn plaza.
  {
    id: 'relay-base', name: 'Terminal Aurora', sector: 'PRAÇA // AURORA',
    bounds: bounds(-11, -30, 2, -3, 2.4, 11), wallRunnable: true,
    color: '#213745', roofColor: '#49626a', accent: '#6be4e7',
  },
  {
    id: 'binary-terrace', name: 'Terraço Binário', sector: 'PRAÇA // AURORA',
    bounds: bounds(3, -30, 2, 11, 3.4, 11), wallRunnable: true,
    color: '#273d48', roofColor: '#526d70', accent: '#f1a55a',
  },
  {
    id: 'praca-kiosk', name: 'Quiosque Central', sector: 'PRAÇA // AURORA',
    bounds: bounds(-4.2, -30, -6, 4.2, 1.6, 0.4), wallRunnable: true,
    color: '#223a44', roofColor: '#51696d', accent: '#6be4e7',
  },
  {
    id: 'praca-north-arch', name: 'Arco Norte', sector: 'PRAÇA // AURORA',
    bounds: bounds(-9, -30, -16, 1, 4.4, -9), wallRunnable: true,
    color: '#223642', roofColor: '#4f666b', accent: '#75eef0',
  },
  // Low pads that host the opening prime cores just above the plaza floor.
  {
    id: 'binary-pad', name: 'Pedestal Binário', sector: 'PRAÇA // AURORA',
    bounds: bounds(2, -30, 0, 8, 1.6, 5), wallRunnable: true,
    color: '#273d48', roofColor: '#526d70', accent: '#f1a55a',
  },
  {
    id: 'triad-pad', name: 'Pedestal Tríade', sector: 'PRAÇA // AURORA',
    bounds: bounds(-8, -30, -11, -1, 3.8, -5), wallRunnable: true,
    color: '#1d3442', roofColor: '#47636c', accent: '#65e8e9',
  },
  {
    id: 'penta-pad', name: 'Pedestal Pentagonal', sector: 'NORTE // QUARENTENA',
    bounds: bounds(-1, -30, -24, 7, 6.1, -16), wallRunnable: true,
    color: '#263a43', roofColor: '#5e6d69', accent: '#e8ac5a',
  },

  // Distrito Leste (+X): mid-rise office blocks climbing eastward.
  {
    id: 'triad-fanway', name: 'Corredor Tríade', sector: 'LESTE // TRÍADE',
    bounds: bounds(16, -30, -6, 26, 5.8, 6), wallRunnable: true,
    color: '#1d3442', roofColor: '#47636c', accent: '#65e8e9',
  },
  {
    id: 'east-market', name: 'Mercado Leste', sector: 'LESTE // TRÍADE',
    bounds: bounds(18, -30, 10, 28, 7.2, 22), wallRunnable: true,
    color: '#263a43', roofColor: '#5e6d69', accent: '#e8ac5a',
  },
  {
    id: 'east-spire', name: 'Pináculo Leste', sector: 'LESTE // TRÍADE',
    bounds: bounds(30, -30, -2, 40, 11.5, 12), wallRunnable: true,
    color: '#223a47', roofColor: '#647471', accent: '#75eef0',
  },
  {
    id: 'east-annex', name: 'Anexo Leste', sector: 'LESTE // TRÍADE',
    bounds: bounds(20, -30, -22, 30, 6.6, -10), wallRunnable: true,
    color: '#243642', roofColor: '#53656a', accent: '#65e8e9',
  },

  // Distrito Oeste (-X): the Relay utility quarter.
  {
    id: 'nilo-relay', name: 'Torre de Nilo', sector: 'OESTE // RELAY',
    bounds: bounds(-30, -30, -10, -18, 9.2, 4), wallRunnable: true,
    color: '#263a43', roofColor: '#5e6d69', accent: '#e8ac5a',
  },
  {
    id: 'west-substation', name: 'Subestação Oeste', sector: 'OESTE // RELAY',
    bounds: bounds(-28, -30, 10, -16, 5.4, 22), wallRunnable: true,
    color: '#273d48', roofColor: '#526d70', accent: '#6be4e7',
  },
  {
    id: 'west-coolers', name: 'Torres de Resfriamento', sector: 'OESTE // RELAY',
    bounds: bounds(-42, -30, -4, -32, 8.1, 10), wallRunnable: true,
    color: '#223642', roofColor: '#4f666b', accent: '#e8ac5a',
  },
  {
    id: 'west-dock', name: 'Doca Oeste', sector: 'OESTE // RELAY',
    bounds: bounds(-30, -30, -26, -18, 6.8, -14), wallRunnable: true,
    color: '#1d3442', roofColor: '#47636c', accent: '#65e8e9',
  },

  // Distrito Norte (-Z): the quarantine courtyards, stepping higher.
  {
    id: 'sentinel-four-roof', name: 'Pátio Quatro', sector: 'NORTE // QUARENTENA',
    bounds: bounds(-10, -30, -40, 0, 7.2, -28), wallRunnable: true,
    color: '#243642', roofColor: '#53656a', accent: '#ed7c63',
  },
  {
    id: 'sentinel-six-roof', name: 'Pátio Seis', sector: 'NORTE // QUARENTENA',
    bounds: bounds(4, -30, -42, 14, 8.7, -30), wallRunnable: true,
    color: '#263846', roofColor: '#586c70', accent: '#ed7c63',
  },
  {
    id: 'sentinel-nine-roof', name: 'Pátio Nove', sector: 'NORTE // QUARENTENA',
    bounds: bounds(-16, -30, -54, -6, 10.3, -42), wallRunnable: true,
    color: '#233641', roofColor: '#51686b', accent: '#ed7c63',
  },
  {
    id: 'sentinel-ten-roof', name: 'Pátio Dez', sector: 'NORTE // QUARENTENA',
    bounds: bounds(6, -30, -56, 16, 11.8, -44), wallRunnable: true,
    color: '#273a46', roofColor: '#5c6f70', accent: '#ed7c63',
  },
  {
    id: 'north-gate', name: 'Portão Norte', sector: 'NORTE // QUARENTENA',
    bounds: bounds(-4, -30, -50, 4, 6.4, -40), wallRunnable: true,
    color: '#223a44', roofColor: '#51696d', accent: '#ed7c63',
  },

  // Distrito Sul (+Z): entry gardens behind the spawn.
  {
    id: 'south-garden', name: 'Jardim Sul', sector: 'SUL // JARDINS',
    bounds: bounds(-12, -30, 24, -2, 4.2, 34), wallRunnable: true,
    color: '#223642', roofColor: '#4f666b', accent: '#6be4e7',
  },
  {
    id: 'south-pavilion', name: 'Pavilhão Sul', sector: 'SUL // JARDINS',
    bounds: bounds(4, -30, 24, 14, 5.6, 36), wallRunnable: true,
    color: '#273d48', roofColor: '#526d70', accent: '#f1a55a',
  },

  // The Apex needle anchors the far north as the climactic landmark.
  {
    id: 'apex-spire', name: 'Agulha Apex', sector: 'APEX // FAROL',
    bounds: bounds(-6, -30, -74, 6, 13, -62), wallRunnable: true,
    color: '#223a47', roofColor: '#647471', accent: '#75eef0',
  },
] as const

// Walkable street-level ground. A central slab plus four arms reach under each
// district so the runner always has solid floor beneath the plaza and streets.
const GROUND_TILES: readonly ParkourPlatform[] = [
  { id: 'ground-plaza', bounds: bounds(-16, -4, -20, 16, GROUND_TOP, 40), wallRunnable: false, blocksGrapple: false },
  { id: 'ground-east', bounds: bounds(16, -4, -28, 44, GROUND_TOP, 28), wallRunnable: false, blocksGrapple: false },
  { id: 'ground-west', bounds: bounds(-46, -4, -32, -16, GROUND_TOP, 28), wallRunnable: false, blocksGrapple: false },
  { id: 'ground-north', bounds: bounds(-20, -4, -78, 20, GROUND_TOP, -20), wallRunnable: false, blocksGrapple: false },
] as const

export const ROOFTOP_PROPS: readonly RooftopProp[] = [
  { id: 'start-vent-a', kind: 'vent', position: [-7, 2.95, 7.5], size: [2.4, 1.1, 1.7], collider: bounds(-8.2, 2.4, 6.65, -5.8, 3.5, 8.35) },
  { id: 'start-barrier', kind: 'barrier', position: [7, 3.8, 9.5], size: [4.5, 1.6, .35], rotationY: -.08, collider: bounds(4.75, 3.4, 9.25, 9.25, 5, 9.75) },
  { id: 'praca-crate', kind: 'crate', position: [0, 2.1, -3], size: [1.5, 1, 1.5], collider: bounds(-.75, 1.6, -3.75, .75, 2.6, -2.25) },
  { id: 'triad-fans', kind: 'vent', position: [21, 6.45, 0], size: [2.7, 1.3, 2.2], collider: bounds(19.65, 5.8, -1.1, 22.35, 7.1, 1.1) },
  { id: 'east-solar-a', kind: 'solar', position: [34, 12.1, 4], size: [3.2, .18, 2.1], rotationY: .28, collider: bounds(32.3, 11.5, 2.8, 35.7, 12.55, 5.2) },
  { id: 'relay-solar-b', kind: 'solar', position: [-24, 9.9, -2], size: [3.2, .18, 2.1], rotationY: .28, collider: bounds(-25.7, 9.2, -3.2, -22.3, 10.25, -0.8) },
  { id: 'four-cover', kind: 'barrier', position: [-5, 7.95, -31], size: [3.6, 1.5, .35], collider: bounds(-6.8, 7.2, -31.2, -3.2, 8.7, -30.8) },
  { id: 'six-cover', kind: 'crate', position: [11, 9.35, -34], size: [1.6, 1.3, 1.6], collider: bounds(10.2, 8.7, -34.8, 11.8, 10, -33.2) },
  { id: 'nine-vent', kind: 'vent', position: [-11, 10.95, -47], size: [2.5, 1.3, 1.7], collider: bounds(-12.25, 10.3, -47.85, -9.75, 11.6, -46.15) },
  { id: 'ten-barrier', kind: 'barrier', position: [11, 12.55, -50], size: [3.3, 1.5, .3], collider: bounds(9.35, 11.8, -50.2, 12.65, 13.3, -49.8) },
  { id: 'apex-antenna', kind: 'antenna', position: [0, 17, -68], size: [.45, 7.8, .45], collider: bounds(-.3, 13, -68.3, .3, 20.8, -67.7) },
] as const

export const SKYLINE_COLLIDERS: readonly ParkourPlatform[] = [
  ...GROUND_TILES,
  ...SKYLINE_BUILDINGS,
  ...ROOFTOP_PROPS.flatMap((prop) => prop.collider ? [{ id: prop.id, bounds: prop.collider, wallRunnable: false }] : []),
]

export const SKYLINE_ANCHORS: readonly GrappleAnchor[] = [
  // Plaza approach: reachable looking north from the spawn.
  { id: 'anchor-binary', position: { x: 0, y: 6.4, z: -9 } },
  // Eastern district transfers.
  { id: 'anchor-triad', position: { x: 21, y: 9.5, z: 0 } },
  { id: 'anchor-east-spire', position: { x: 35, y: 15, z: 5 } },
  // Western Relay quarter.
  { id: 'anchor-relay', position: { x: -24, y: 12.8, z: -3 } },
  { id: 'anchor-west-cooler', position: { x: -37, y: 11.6, z: 3 } },
  // Northern quarantine climb toward the Apex.
  { id: 'anchor-four', position: { x: -5, y: 10.6, z: -34 } },
  { id: 'anchor-six', position: { x: 9, y: 12.1, z: -36 } },
  { id: 'anchor-nine', position: { x: -11, y: 13.7, z: -48 } },
  { id: 'anchor-ten', position: { x: 11, y: 15.2, z: -50 } },
  { id: 'anchor-apex', position: { x: 3, y: 16, z: -64 } },
] as const

export const SKYLINE_CHECKPOINTS: readonly Checkpoint[] = [
  { id: 'plaza', order: 0, trigger: bounds(-16, .3, -2, 16, 3, 20), spawn: { x: 0, y: 1.1, z: 16 } },
  { id: 'east', order: 1, trigger: bounds(16, .3, -8, 44, 4, 24), spawn: { x: 24, y: 1.1, z: 8 } },
  { id: 'west', order: 2, trigger: bounds(-46, .3, -16, -16, 4, 24), spawn: { x: -24, y: 1.1, z: 8 } },
  { id: 'north', order: 3, trigger: bounds(-20, .3, -58, 20, 4, -24), spawn: { x: 0, y: 1.1, z: -24 } },
  { id: 'combat', order: 4, trigger: bounds(-16, 6.3, -56, 16, 12, -28), spawn: { x: -5, y: 8.3, z: -34 } },
  { id: 'apex', order: 5, trigger: bounds(-6, 12.2, -74, 6, 16, -62), spawn: { x: 3, y: 14.1, z: -66 } },
] as const

export const PLAYER_SPAWN: Vec3 = { x: 0, y: 1.1, z: 16 }

export const SKYLINE_WORLD_BOUNDS = {
  killPlaneY: -8,
  finishRadius: 2.3,
  npcInteractionRadius: 3,
  coreCollectionRadius: 1.55,
  attackRange: 4.5,
} as const

export function aabbCenter(aabb: Aabb): readonly [number, number, number] {
  return [
    (aabb.min.x + aabb.max.x) / 2,
    (aabb.min.y + aabb.max.y) / 2,
    (aabb.min.z + aabb.max.z) / 2,
  ]
}

export function aabbSize(aabb: Aabb): readonly [number, number, number] {
  return [
    aabb.max.x - aabb.min.x,
    aabb.max.y - aabb.min.y,
    aabb.max.z - aabb.min.z,
  ]
}

export function distanceBetween(position: Vec3, target: readonly [number, number, number]): number {
  return Math.hypot(position.x - target[0], position.y - target[1], position.z - target[2])
}
