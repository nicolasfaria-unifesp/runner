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
  // Central praça: real towers that FRAME an open plaza instead of filling it.
  // The plaza itself (roughly x[-10,10], z[-2,18]) stays clear so the camera at
  // the spawn looks down an open street toward the northern districts.
  {
    id: 'relay-base', name: 'Terminal Aurora', sector: 'PRAÇA // AURORA',
    bounds: bounds(-22, -30, 2, -13, 5.2, 13), wallRunnable: true,
    color: '#213745', roofColor: '#49626a', accent: '#6be4e7',
  },
  {
    id: 'binary-terrace', name: 'Terraço Binário', sector: 'PRAÇA // AURORA',
    bounds: bounds(13, -30, 2, 22, 6, 13), wallRunnable: true,
    color: '#273d48', roofColor: '#526d70', accent: '#f1a55a',
  },
  {
    id: 'praca-kiosk', name: 'Quiosque Central', sector: 'PRAÇA // AURORA',
    bounds: bounds(-23, -30, 18, -14, 4.6, 25), wallRunnable: true,
    color: '#223a44', roofColor: '#51696d', accent: '#6be4e7',
  },
  {
    id: 'praca-north-arch', name: 'Arco Norte', sector: 'PRAÇA // AURORA',
    bounds: bounds(-24, -30, -14, -13, 7.4, -3), wallRunnable: true,
    color: '#223642', roofColor: '#4f666b', accent: '#75eef0',
  },
  // Prime-core towers: pulled out of the walking plaza and given ascending
  // roofs so cores 2 < 3 < 5 climb northward toward the quarantine.
  {
    id: 'binary-pad', name: 'Pedestal Binário', sector: 'PRAÇA // AURORA',
    bounds: bounds(13, -30, -14, 21, 5, -4), wallRunnable: true,
    color: '#273d48', roofColor: '#526d70', accent: '#f1a55a',
  },
  {
    id: 'triad-pad', name: 'Pedestal Tríade', sector: 'PRAÇA // AURORA',
    bounds: bounds(-11, -30, -28, -2, 7.5, -18), wallRunnable: true,
    color: '#1d3442', roofColor: '#47636c', accent: '#65e8e9',
  },
  {
    id: 'penta-pad', name: 'Pedestal Pentagonal', sector: 'NORTE // QUARENTENA',
    bounds: bounds(2, -30, -28, 11, 10, -18), wallRunnable: true,
    color: '#263a43', roofColor: '#5e6d69', accent: '#e8ac5a',
  },

  // Distrito Leste (+X): mid-rise office blocks climbing eastward.
  {
    id: 'triad-fanway', name: 'Corredor Tríade', sector: 'LESTE // TRÍADE',
    bounds: bounds(26, -30, -6, 36, 5.8, 6), wallRunnable: true,
    color: '#1d3442', roofColor: '#47636c', accent: '#65e8e9',
  },
  {
    id: 'east-market', name: 'Mercado Leste', sector: 'LESTE // TRÍADE',
    bounds: bounds(26, -30, 10, 36, 7.2, 22), wallRunnable: true,
    color: '#263a43', roofColor: '#5e6d69', accent: '#e8ac5a',
  },
  {
    id: 'east-spire', name: 'Pináculo Leste', sector: 'LESTE // TRÍADE',
    bounds: bounds(40, -30, -2, 50, 11.5, 12), wallRunnable: true,
    color: '#223a47', roofColor: '#647471', accent: '#75eef0',
  },
  {
    id: 'east-annex', name: 'Anexo Leste', sector: 'LESTE // TRÍADE',
    bounds: bounds(26, -30, -24, 38, 6.6, -12), wallRunnable: true,
    color: '#243642', roofColor: '#53656a', accent: '#65e8e9',
  },

  // Distrito Oeste (-X): the Relay utility quarter.
  {
    id: 'nilo-relay', name: 'Torre de Nilo', sector: 'OESTE // RELAY',
    bounds: bounds(-38, -30, -10, -28, 9.2, 4), wallRunnable: true,
    color: '#263a43', roofColor: '#5e6d69', accent: '#e8ac5a',
  },
  {
    id: 'west-substation', name: 'Subestação Oeste', sector: 'OESTE // RELAY',
    bounds: bounds(-36, -30, 10, -26, 5.4, 22), wallRunnable: true,
    color: '#273d48', roofColor: '#526d70', accent: '#6be4e7',
  },
  {
    id: 'west-coolers', name: 'Torres de Resfriamento', sector: 'OESTE // RELAY',
    bounds: bounds(-50, -30, -4, -40, 8.1, 10), wallRunnable: true,
    color: '#223642', roofColor: '#4f666b', accent: '#e8ac5a',
  },
  {
    id: 'west-dock', name: 'Doca Oeste', sector: 'OESTE // RELAY',
    bounds: bounds(-38, -30, -26, -28, 6.8, -14), wallRunnable: true,
    color: '#1d3442', roofColor: '#47636c', accent: '#65e8e9',
  },

  // Distrito Norte (-Z): the quarantine courtyards, stepping higher.
  {
    id: 'sentinel-four-roof', name: 'Pátio Quatro', sector: 'NORTE // QUARENTENA',
    bounds: bounds(-12, -30, -42, -2, 7.2, -30), wallRunnable: true,
    color: '#243642', roofColor: '#53656a', accent: '#ed7c63',
  },
  {
    id: 'sentinel-six-roof', name: 'Pátio Seis', sector: 'NORTE // QUARENTENA',
    bounds: bounds(4, -30, -44, 14, 8.7, -32), wallRunnable: true,
    color: '#263846', roofColor: '#586c70', accent: '#ed7c63',
  },
  {
    id: 'sentinel-nine-roof', name: 'Pátio Nove', sector: 'NORTE // QUARENTENA',
    bounds: bounds(-16, -30, -56, -6, 10.3, -46), wallRunnable: true,
    color: '#233641', roofColor: '#51686b', accent: '#ed7c63',
  },
  {
    id: 'sentinel-ten-roof', name: 'Pátio Dez', sector: 'NORTE // QUARENTENA',
    bounds: bounds(6, -30, -58, 16, 11.8, -48), wallRunnable: true,
    color: '#273a46', roofColor: '#5c6f70', accent: '#ed7c63',
  },
  {
    id: 'north-gate', name: 'Portão Norte', sector: 'NORTE // QUARENTENA',
    bounds: bounds(-3, -30, -52, 3, 6.4, -46), wallRunnable: true,
    color: '#223a44', roofColor: '#51696d', accent: '#ed7c63',
  },

  // Distrito Sul (+Z): entry gardens behind the spawn.
  {
    id: 'south-garden', name: 'Jardim Sul', sector: 'SUL // JARDINS',
    bounds: bounds(-12, -30, 28, -3, 4.2, 38), wallRunnable: true,
    color: '#223642', roofColor: '#4f666b', accent: '#6be4e7',
  },
  {
    id: 'south-pavilion', name: 'Pavilhão Sul', sector: 'SUL // JARDINS',
    bounds: bounds(4, -30, 28, 14, 5.6, 38), wallRunnable: true,
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
// The arms are sized to OVERLAP the plaza's x[-26,26] / z edges rather than
// meet them flush, so the plaza-to-district seams stay continuous and leave no
// corner void a roaming player could fall through to killPlaneY. Tiles may
// overlap each other and extend under building footprints freely; they are
// floor only (wallRunnable:false, blocksGrapple:false).
const GROUND_TILES: readonly ParkourPlatform[] = [
  { id: 'ground-plaza', bounds: bounds(-26, -4, -20, 26, GROUND_TOP, 40), wallRunnable: false, blocksGrapple: false },
  { id: 'ground-east', bounds: bounds(26, -4, -28, 52, GROUND_TOP, 24), wallRunnable: false, blocksGrapple: false },
  { id: 'ground-west', bounds: bounds(-52, -4, -30, -26, GROUND_TOP, 24), wallRunnable: false, blocksGrapple: false },
  { id: 'ground-north', bounds: bounds(-26, -4, -78, 26, GROUND_TOP, -20), wallRunnable: false, blocksGrapple: false },
] as const

export const ROOFTOP_PROPS: readonly RooftopProp[] = [
  // Praça ring rooftops framing the plaza.
  { id: 'start-vent-a', kind: 'vent', position: [-17, 5.75, 7.5], size: [2.4, 1.1, 1.7], collider: bounds(-18.2, 5.2, 6.65, -15.8, 6.3, 8.35) },
  { id: 'start-barrier', kind: 'barrier', position: [17, 6.8, 9.5], size: [4.5, 1.6, .35], rotationY: -.08, collider: bounds(14.75, 6, 9.25, 19.25, 7.6, 9.75) },
  { id: 'praca-crate', kind: 'crate', position: [-18, 7.9, -8], size: [1.5, 1, 1.5], collider: bounds(-18.75, 7.4, -8.75, -17.25, 8.4, -7.25) },
  // Eastern district.
  { id: 'triad-fans', kind: 'vent', position: [31, 6.45, 0], size: [2.7, 1.3, 2.2], collider: bounds(29.65, 5.8, -1.1, 32.35, 7.1, 1.1) },
  { id: 'east-solar-a', kind: 'solar', position: [45, 11.6, 4], size: [3.2, .18, 2.1], rotationY: .28, collider: bounds(43.3, 11.5, 2.8, 46.7, 12.65, 5.2) },
  // Western Relay quarter.
  { id: 'relay-solar-b', kind: 'solar', position: [-33, 9.3, -3], size: [3.2, .18, 2.1], rotationY: .28, collider: bounds(-34.7, 9.2, -4.2, -31.3, 10.25, -1.8) },
  // Northern quarantine patios.
  { id: 'four-cover', kind: 'barrier', position: [-7, 7.95, -36], size: [3.6, 1.5, .35], collider: bounds(-8.8, 7.2, -36.2, -5.2, 8.7, -35.8) },
  { id: 'six-cover', kind: 'crate', position: [9, 9.35, -38], size: [1.6, 1.3, 1.6], collider: bounds(8.2, 8.7, -38.8, 9.8, 10, -37.2) },
  { id: 'nine-vent', kind: 'vent', position: [-11, 10.95, -51], size: [2.5, 1.3, 1.7], collider: bounds(-12.25, 10.3, -51.85, -9.75, 11.6, -50.15) },
  { id: 'ten-barrier', kind: 'barrier', position: [11, 12.55, -53], size: [3.3, 1.5, .3], collider: bounds(9.35, 11.8, -53.2, 12.65, 13.3, -52.8) },
  // The Apex needle.
  { id: 'apex-antenna', kind: 'antenna', position: [0, 17, -68], size: [.45, 7.8, .45], collider: bounds(-.3, 13, -68.3, .3, 20.8, -67.7) },
] as const

export const SKYLINE_COLLIDERS: readonly ParkourPlatform[] = [
  ...GROUND_TILES,
  ...SKYLINE_BUILDINGS,
  ...ROOFTOP_PROPS.flatMap((prop) => prop.collider ? [{ id: prop.id, bounds: prop.collider, wallRunnable: false }] : []),
]

export const SKYLINE_ANCHORS: readonly GrappleAnchor[] = [
  // Plaza approach: the first anchor a runner grabs looking north from spawn.
  { id: 'anchor-binary', position: { x: 0, y: 6.4, z: -6 } },
  // Eastern district transfers.
  { id: 'anchor-triad', position: { x: 31, y: 7.6, z: 3 } },
  { id: 'anchor-east-spire', position: { x: 45, y: 13, z: 5 } },
  // Western Relay quarter.
  { id: 'anchor-relay', position: { x: -33, y: 11, z: -3 } },
  { id: 'anchor-west-cooler', position: { x: -45, y: 10, z: 3 } },
  // Northern quarantine climb toward the Apex.
  { id: 'anchor-four', position: { x: -7, y: 9.2, z: -36 } },
  { id: 'anchor-six', position: { x: 9, y: 10.7, z: -38 } },
  { id: 'anchor-nine', position: { x: -11, y: 12.3, z: -51 } },
  { id: 'anchor-ten', position: { x: 11, y: 13.8, z: -53 } },
  { id: 'anchor-apex', position: { x: 3, y: 14.5, z: -64 } },
] as const

export const SKYLINE_CHECKPOINTS: readonly Checkpoint[] = [
  { id: 'plaza', order: 0, trigger: bounds(-16, .3, -2, 16, 3, 20), spawn: { x: 0, y: 1.1, z: 16 } },
  { id: 'east', order: 1, trigger: bounds(26, .3, -8, 52, 4, 24), spawn: { x: 34, y: 1.1, z: 8 } },
  { id: 'west', order: 2, trigger: bounds(-52, .3, -16, -26, 4, 24), spawn: { x: -33, y: 1.1, z: 8 } },
  { id: 'north', order: 3, trigger: bounds(-20, .3, -58, 20, 4, -24), spawn: { x: 0, y: 1.1, z: -24 } },
  { id: 'combat', order: 4, trigger: bounds(-16, 6.3, -58, 16, 12, -28), spawn: { x: -9, y: 8.3, z: -34 } },
  { id: 'apex', order: 5, trigger: bounds(-6, 12.2, -74, 6, 16, -62), spawn: { x: 0, y: 14.1, z: -66 } },
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
