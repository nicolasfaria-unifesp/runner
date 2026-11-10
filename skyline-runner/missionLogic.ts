import {
  SKYLINE_NPCS,
  SKYLINE_OBJECTIVES,
  SKYLINE_PRIME_CORE_VALUES,
  SKYLINE_SENTINEL_IDS,
  SKYLINE_SENTINELS,
  type SkylineNpcId,
  type SkylineObjective,
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
