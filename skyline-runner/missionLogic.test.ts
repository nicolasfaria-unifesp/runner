import { describe, expect, it } from 'vitest'

import {
  SKYLINE_PRIME_CORE_VALUES,
  SKYLINE_SENTINEL_IDS,
  type SkylinePrimeCoreValue,
} from './missionData'
import {
  activateApexBeacon,
  canActivateApexBeacon,
  canDeliverPrimeCores,
  canReachApexSpire,
  collectPrimeCore,
  deliverPrimeCores,
  getNextSkylineObjective,
  hasAllPrimeCores,
  hasDefeatedAllSentinels,
  INITIAL_SKYLINE_MISSION_PROGRESS,
  isSkylineMissionComplete,
  reachApexSpire,
  recordNpcConversation,
  recordSentinelDefeat,
  type SkylineMissionProgress,
} from './missionLogic'

function collectAllCores(
  progress: SkylineMissionProgress,
): SkylineMissionProgress {
  return SKYLINE_PRIME_CORE_VALUES.reduce(
    (current, value) => collectPrimeCore(current, value),
    progress,
  )
}

function defeatAllSentinels(
  progress: SkylineMissionProgress,
): SkylineMissionProgress {
  return SKYLINE_SENTINEL_IDS.reduce(
    (current, sentinelId) => recordSentinelDefeat(current, sentinelId),
    progress,
  )
}

/** Brings progress to the fully-ready-for-extraction state. */
function secureCity(
  progress: SkylineMissionProgress,
): SkylineMissionProgress {
  let current = collectAllCores(progress)
  current = recordNpcConversation(current, 'nilo')
  current = deliverPrimeCores(current)
  current = defeatAllSentinels(current)
  return current
}

describe('Prime Runner mission logic', () => {
  it('surfaces the earliest unmet objective for the HUD through victory', () => {
    let progress = INITIAL_SKYLINE_MISSION_PROGRESS
    expect(getNextSkylineObjective(progress).id).toBe('talk-to-lia')

    progress = recordNpcConversation(progress, 'lia')
    expect(getNextSkylineObjective(progress).id).toBe('collect-prime-cores')

    progress = collectAllCores(progress)
    expect(getNextSkylineObjective(progress).id).toBe('deliver-cores-to-nilo')

    progress = recordNpcConversation(progress, 'nilo')
    progress = deliverPrimeCores(progress)
    expect(getNextSkylineObjective(progress).id).toBe(
      'defeat-composite-sentinels',
    )

    progress = defeatAllSentinels(progress)
    expect(getNextSkylineObjective(progress).id).toBe('reach-apex-spire')

    progress = reachApexSpire(progress)
    expect(getNextSkylineObjective(progress).id).toBe('activate-apex-beacon')

    progress = activateApexBeacon(progress)
    expect(getNextSkylineObjective(progress).id).toBe('mission-complete')
    expect(isSkylineMissionComplete(progress)).toBe(true)
  })

  it('lets missions start in any order by roaming between givers', () => {
    const initial = INITIAL_SKYLINE_MISSION_PROGRESS

    // No global chain: a player can meet DRAX or NILO before ever meeting LIA.
    const metDrax = recordNpcConversation(initial, 'drax')
    expect(metDrax.spokenNpcIds).toEqual(['drax'])
    const metNiloFirst = recordNpcConversation(metDrax, 'nilo')
    expect(metNiloFirst.spokenNpcIds).toEqual(['drax', 'nilo'])

    // Conversations stay idempotent and unknown givers are rejected.
    expect(recordNpcConversation(metNiloFirst, 'nilo')).toBe(metNiloFirst)
    expect(recordNpcConversation(metNiloFirst, 'ghost')).toBe(metNiloFirst)
    expect(initial.spokenNpcIds).toEqual([])
  })

  it('collects cores by exploring without needing LIA first', () => {
    const initial = INITIAL_SKYLINE_MISSION_PROGRESS

    // Cores can be grabbed straight away while roaming the plaza pedestals.
    const withTwo = collectPrimeCore(initial, 2)
    expect(withTwo.collectedPrimeCores).toEqual([2])
    expect(initial.collectedPrimeCores).toEqual([])
    expect(collectPrimeCore(withTwo, 2)).toBe(withTwo)
    expect(collectPrimeCore(withTwo, 7 as SkylinePrimeCoreValue)).toBe(withTwo)

    const complete = collectAllCores(initial)
    expect(hasAllPrimeCores(complete)).toBe(true)
    expect(new Set(complete.collectedPrimeCores)).toEqual(new Set([2, 3, 5]))
  })

  it('requires the full set and a NILO conversation for the relay handoff only', () => {
    const partial = collectPrimeCore(INITIAL_SKYLINE_MISSION_PROGRESS, 2)
    // Delivery is the relay mission's own gate, independent of other quests.
    expect(canDeliverPrimeCores(partial)).toBe(false)
    expect(deliverPrimeCores(recordNpcConversation(partial, 'nilo'))).toBe(
      recordNpcConversation(partial, 'nilo'),
    )

    const complete = collectAllCores(INITIAL_SKYLINE_MISSION_PROGRESS)
    expect(canDeliverPrimeCores(complete)).toBe(false)
    const metNilo = recordNpcConversation(complete, 'nilo')
    expect(canDeliverPrimeCores(metNilo)).toBe(true)
    const delivered = deliverPrimeCores(metNilo)
    expect(delivered.coresDeliveredToNilo).toBe(true)
    expect(deliverPrimeCores(delivered)).toBe(delivered)
    // Once sealed, no stray pickups register.
    expect(collectPrimeCore(delivered, 2)).toBe(delivered)
  })

  it('clears sentinels independently and idempotently, rejecting unknown ids', () => {
    const initial = INITIAL_SKYLINE_MISSION_PROGRESS

    // The quarantine purge no longer waits on a global predecessor.
    const firstKill = recordSentinelDefeat(initial, 'sentinel-four')
    expect(firstKill.defeatedSentinelIds).toEqual(['sentinel-four'])
    expect(recordSentinelDefeat(firstKill, 'sentinel-four')).toBe(firstKill)
    expect(recordSentinelDefeat(firstKill, 'missing-sentinel')).toBe(firstKill)
    expect(initial.defeatedSentinelIds).toEqual([])

    const cleared = defeatAllSentinels(initial)
    expect(hasDefeatedAllSentinels(cleared)).toBe(true)
    expect(cleared.defeatedSentinelIds).toHaveLength(4)
  })

  it('still gates the Apex mission behind a secured city, in any order', () => {
    const initial = INITIAL_SKYLINE_MISSION_PROGRESS
    expect(canReachApexSpire(initial)).toBe(false)
    expect(reachApexSpire(initial)).toBe(initial)
    expect(canActivateApexBeacon(initial)).toBe(false)
    expect(activateApexBeacon(initial)).toBe(initial)
    expect(isSkylineMissionComplete(initial)).toBe(false)

    // Clearing sentinels first then handling the cores still unlocks the Apex.
    let roamed = defeatAllSentinels(initial)
    expect(canReachApexSpire(roamed)).toBe(false)
    roamed = secureCity(roamed)
    expect(canReachApexSpire(roamed)).toBe(true)

    const atApex = reachApexSpire(roamed)
    expect(reachApexSpire(atApex)).toBe(atApex)
    expect(canActivateApexBeacon(atApex)).toBe(true)

    const complete = activateApexBeacon(atApex)
    expect(activateApexBeacon(complete)).toBe(complete)
    expect(isSkylineMissionComplete(complete)).toBe(true)
  })

  it('reaches completion regardless of which order the givers were met', () => {
    // Meet VERA and DRAX before LIA, collect cores late: still completable.
    let progress = recordNpcConversation(INITIAL_SKYLINE_MISSION_PROGRESS, 'vera')
    progress = recordNpcConversation(progress, 'drax')
    progress = defeatAllSentinels(progress)
    progress = collectAllCores(progress)
    progress = recordNpcConversation(progress, 'nilo')
    progress = deliverPrimeCores(progress)
    progress = recordNpcConversation(progress, 'lia')
    progress = reachApexSpire(progress)
    progress = activateApexBeacon(progress)
    expect(isSkylineMissionComplete(progress)).toBe(true)
  })
})
