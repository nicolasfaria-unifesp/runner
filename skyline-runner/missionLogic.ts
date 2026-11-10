import {
  SKYLINE_MISSION_IDS,
  SKYLINE_MISSIONS,
  SKYLINE_NPCS,
  SKYLINE_OBJECTIVES,
  SKYLINE_PRIME_CORE_VALUES,
  SKYLINE_SENTINEL_IDS,
  SKYLINE_SENTINELS,
  type SkylineMissionId,
  type SkylineNpcId,
  type SkylineObjective,
  type SkylineObjectiveId,
  type SkylinePrimeCoreValue,
  type SkylineSentinelId,
} from './missionData'

export interface SkylineMissionProgress {
  readonly spokenNpcIds: readonly SkylineNpcId[]
  readonly collectedPrimeCores: readonly SkylinePrimeCoreValue[]
  readonly coresDeliveredToNilo: boolean
  readonly defeatedSentinelIds: readonly SkylineSentinelId[]
  readonly apexReached: boolean
  readonly beaconActivated: boolean
}

export const INITIAL_SKYLINE_MISSION_PROGRESS: SkylineMissionProgress = {
  spokenNpcIds: [],
  collectedPrimeCores: [],
  coresDeliveredToNilo: false,
  defeatedSentinelIds: [],
  apexReached: false,
  beaconActivated: false,
}

function includesAll<T>(values: readonly T[], required: readonly T[]): boolean {
  return required.every((value) => values.includes(value))
}

function isKnownNpcId(npcId: string): npcId is SkylineNpcId {
  return Object.prototype.hasOwnProperty.call(SKYLINE_NPCS, npcId)
}

function isPrimeCoreValue(value: number): value is SkylinePrimeCoreValue {
  return SKYLINE_PRIME_CORE_VALUES.some((candidate) => candidate === value)
}

function isKnownSentinelId(
  sentinelId: string,
): sentinelId is SkylineSentinelId {
  return Object.prototype.hasOwnProperty.call(SKYLINE_SENTINELS, sentinelId)
}

export function hasAllPrimeCores(progress: SkylineMissionProgress): boolean {
  return includesAll(
    progress.collectedPrimeCores,
    SKYLINE_PRIME_CORE_VALUES,
  )
}

export function hasDefeatedAllSentinels(
  progress: SkylineMissionProgress,
): boolean {
  return includesAll(
    progress.defeatedSentinelIds,
    SKYLINE_SENTINEL_IDS,
  )
}

/**
 * Records a conversation with any giver once. Missions are discovered by
 * roaming, so there is no global order between givers; only unknown ids and
 * repeat conversations are rejected (idempotent).
 */
export function recordNpcConversation(
  progress: SkylineMissionProgress,
  npcId: SkylineNpcId | string,
): SkylineMissionProgress {
  if (!isKnownNpcId(npcId) || progress.spokenNpcIds.includes(npcId)) {
    return progress
  }

  return {
    ...progress,
    spokenNpcIds: [...progress.spokenNpcIds, npcId],
  }
}

/**
 * Collects each prime core at most once. The cores can be found by exploring
 * the plaza pedestals independently of which givers have been met; delivering
 * the set to NILO seals the cache so no further pickups register.
 */
export function collectPrimeCore(
  progress: SkylineMissionProgress,
  value: SkylinePrimeCoreValue | number,
): SkylineMissionProgress {
  if (
    !isPrimeCoreValue(value)
    || progress.coresDeliveredToNilo
    || progress.collectedPrimeCores.includes(value)
  ) return progress

  return {
    ...progress,
    collectedPrimeCores: [...progress.collectedPrimeCores, value],
  }
}

/**
 * Delivery is the relay mission's own gate: it needs the complete 2/3/5 set and
 * a conversation with NILO. It does not depend on any other mission's state.
 */
export function canDeliverPrimeCores(
  progress: SkylineMissionProgress,
): boolean {
  return !progress.coresDeliveredToNilo
    && progress.spokenNpcIds.includes('nilo')
    && hasAllPrimeCores(progress)
}

/** Hands the complete 2/3/5 set to NILO; partial deliveries are ignored. */
export function deliverPrimeCores(
  progress: SkylineMissionProgress,
): SkylineMissionProgress {
  if (!canDeliverPrimeCores(progress)) return progress
  return { ...progress, coresDeliveredToNilo: true }
}

/**
 * Counts each known sentinel at most once. Sentinels belong to the quarantine
 * mission and can be cleared independently of the other quests; unknown ids and
 * repeats are rejected (idempotent).
 */
export function recordSentinelDefeat(
  progress: SkylineMissionProgress,
  sentinelId: SkylineSentinelId | string,
): SkylineMissionProgress {
  if (
    !isKnownSentinelId(sentinelId)
    || progress.defeatedSentinelIds.includes(sentinelId)
  ) return progress

  return {
    ...progress,
    defeatedSentinelIds: [...progress.defeatedSentinelIds, sentinelId],
  }
}

/**
 * The Apex mission's internal gate: the city must be secured first, i.e. the
 * cores delivered and every sentinel cleared. Those prerequisites can be
 * completed in any order while roaming.
 */
export function canReachApexSpire(
  progress: SkylineMissionProgress,
): boolean {
  return progress.coresDeliveredToNilo
    && hasDefeatedAllSentinels(progress)
}

export function reachApexSpire(
  progress: SkylineMissionProgress,
): SkylineMissionProgress {
  if (progress.apexReached || !canReachApexSpire(progress)) return progress
  return { ...progress, apexReached: true }
}

export function canActivateApexBeacon(
  progress: SkylineMissionProgress,
): boolean {
  return progress.apexReached
    && hasAllPrimeCores(progress)
    && hasDefeatedAllSentinels(progress)
}

/** Activating the Apex beacon also completes the extraction. */
export function activateApexBeacon(
  progress: SkylineMissionProgress,
): SkylineMissionProgress {
  if (
    progress.beaconActivated
    || !canActivateApexBeacon(progress)
  ) return progress

  return { ...progress, beaconActivated: true }
}

export function isSkylineMissionComplete(
  progress: SkylineMissionProgress,
): boolean {
  return progress.beaconActivated
    && canActivateApexBeacon(progress)
}

/**
 * Surfaces a single "next" objective for the legacy HUD track. It scans the
 * protocol objectives in display order and returns the first one still
 * outstanding, then the terminal victory objective. Because the progress model
 * is no longer a forced chain, several of these can already be satisfiable at
 * once; this simply picks the earliest unmet one to show.
 */
export function getNextSkylineObjective(
  progress: SkylineMissionProgress,
): SkylineObjective {
  if (!progress.spokenNpcIds.includes('lia')) {
    return SKYLINE_OBJECTIVES['talk-to-lia']
  }
  if (!hasAllPrimeCores(progress)) {
    return SKYLINE_OBJECTIVES['collect-prime-cores']
  }
  if (!progress.coresDeliveredToNilo) {
    return SKYLINE_OBJECTIVES['deliver-cores-to-nilo']
  }
  if (!hasDefeatedAllSentinels(progress)) {
    return SKYLINE_OBJECTIVES['defeat-composite-sentinels']
  }
  if (!progress.apexReached) {
    return SKYLINE_OBJECTIVES['reach-apex-spire']
  }
  if (!progress.beaconActivated) {
    return SKYLINE_OBJECTIVES['activate-apex-beacon']
  }
  return SKYLINE_OBJECTIVES['mission-complete']
}

/**
 * How far a single objective has advanced, independent of the global track.
 * Used by the HUD to count steps within each mission.
 */
export function getObjectiveCompletion(
  progress: SkylineMissionProgress,
  objectiveId: SkylineObjectiveId,
): { readonly current: number; readonly required: number; readonly done: boolean } {
  const required = SKYLINE_OBJECTIVES[objectiveId].requiredCount
  let current = 0
  switch (objectiveId) {
    case 'talk-to-lia':
      current = progress.spokenNpcIds.includes('lia') ? 1 : 0
      break
    case 'collect-prime-cores':
      current = progress.collectedPrimeCores.length
      break
    case 'deliver-cores-to-nilo':
      current = progress.coresDeliveredToNilo ? 1 : 0
      break
    case 'defeat-composite-sentinels':
      current = progress.defeatedSentinelIds.length
      break
    case 'reach-apex-spire':
      current = progress.apexReached ? 1 : 0
      break
    case 'activate-apex-beacon':
      current = progress.beaconActivated ? 1 : 0
      break
    case 'mission-complete':
      current = 0
      break
  }
  const cappedCurrent = Math.min(current, required)
  return { current: cappedCurrent, required, done: required === 0 || cappedCurrent >= required }
}

export interface SkylineMissionState {
  readonly id: SkylineMissionId
  readonly title: string
  readonly summary: string
  readonly giver: SkylineNpcId
  readonly district: string
  /** Completed objective steps within this mission. */
  readonly completedSteps: number
  readonly totalSteps: number
  readonly complete: boolean
  /** True once the player has engaged the mission (any step started). */
  readonly started: boolean
}

/**
 * Projects the flat progress model onto the four discrete missions so the HUD
 * can list them with per-mission step counts. A mission is "started" once any
 * of its objectives has registered progress, and "complete" when all are met.
 */
export function getSkylineMissionStates(
  progress: SkylineMissionProgress,
): readonly SkylineMissionState[] {
  return SKYLINE_MISSION_IDS.map((missionId) => {
    const mission = SKYLINE_MISSIONS[missionId]
    let completedSteps = 0
    let anyProgress = false
    for (const objectiveId of mission.objectiveIds) {
      const completion = getObjectiveCompletion(progress, objectiveId)
      if (completion.done) completedSteps += 1
      if (completion.current > 0) anyProgress = true
    }
    const totalSteps = mission.objectiveIds.length
    const complete = completedSteps >= totalSteps
    return {
      id: mission.id,
      title: mission.title,
      summary: mission.summary,
      giver: mission.giver,
      district: mission.district,
      completedSteps,
      totalSteps,
      complete,
      started: anyProgress || complete,
    }
  })
}

/**
 * The mission that owns the currently-tracked objective, so the HUD can show a
 * focused "active mission" header alongside the full list.
 */
export function getActiveSkylineMission(
  progress: SkylineMissionProgress,
): SkylineMissionState | null {
  const objective = getNextSkylineObjective(progress)
  const states = getSkylineMissionStates(progress)
  if (objective.id === 'mission-complete') {
    return states.find((state) => !state.complete) ?? null
  }
  const owner = SKYLINE_MISSION_IDS.find((missionId) =>
    SKYLINE_MISSIONS[missionId].objectiveIds.includes(objective.id),
  )
  return owner ? states.find((state) => state.id === owner) ?? null : null
}
