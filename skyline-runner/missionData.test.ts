import { describe, expect, it } from 'vitest'

import {
  SKYLINE_DIALOGUES,
  SKYLINE_MISSION,
  SKYLINE_MISSION_IDS,
  SKYLINE_MISSIONS,
  SKYLINE_NPCS,
  SKYLINE_OBJECTIVE_ORDER,
  SKYLINE_OBJECTIVES,
  SKYLINE_PRIME_CORES,
  SKYLINE_PRIME_CORE_VALUES,
  SKYLINE_SENTINELS,
  SKYLINE_SENTINEL_IDS,
  type SkylineObjectiveId,
  type SkylinePosition3D,
} from './missionData'

function expectCityPosition(position: SkylinePosition3D): void {
  expect(position).toHaveLength(3)
  for (const coordinate of position) expect(Number.isFinite(coordinate)).toBe(true)
  // The open city spans both X axes and both Z axes around the plaza spawn.
  expect(position[0]).toBeGreaterThanOrEqual(-50)
  expect(position[0]).toBeLessThanOrEqual(50)
  expect(position[1]).toBeGreaterThanOrEqual(0)
  expect(position[2]).toBeGreaterThanOrEqual(-90)
  expect(position[2]).toBeLessThanOrEqual(45)
}

describe('Prime Runner mission data', () => {
  it('splits the protocol into several roam-and-find missions with distinct givers and locations', () => {
    expect(SKYLINE_MISSION.title).toBe('Prime Runner: Skyline Protocol')

    const missions = SKYLINE_MISSION_IDS.map((id) => SKYLINE_MISSIONS[id])
    expect(missions.length).toBeGreaterThanOrEqual(3)
    expect(missions.length).toBeLessThanOrEqual(5)

    // Distinct givers at distinct map locations: this is the open-world hook.
    const givers = missions.map((mission) => mission.giver)
    expect(new Set(givers).size).toBe(missions.length)
    const locationKeys = missions.map((mission) => mission.location.join(','))
    expect(new Set(locationKeys).size).toBe(missions.length)
    const districts = missions.map((mission) => mission.district)
    expect(new Set(districts).size).toBe(missions.length)

    for (const mission of missions) {
      expect(mission.title.trim()).not.toBe('')
      expect(mission.summary.trim()).not.toBe('')
      expect(SKYLINE_NPCS[mission.giver]).toBeDefined()
      // A mission's advertised location matches where its giver actually stands.
      expect(mission.location).toEqual(SKYLINE_NPCS[mission.giver].position)
      expect(mission.objectiveIds.length).toBeGreaterThanOrEqual(1)
      for (const objectiveId of mission.objectiveIds) {
        expect(SKYLINE_OBJECTIVES[objectiveId]).toBeDefined()
      }
    }
  })

  it('covers every campaign objective exactly once across the mission set', () => {
    const assigned = SKYLINE_MISSION_IDS.flatMap(
      (id) => SKYLINE_MISSIONS[id].objectiveIds,
    )
    expect(new Set(assigned).size).toBe(assigned.length)
    expect([...assigned].sort()).toEqual([...SKYLINE_OBJECTIVE_ORDER].sort())
  })

  it('keeps every ordered objective well-formed and on the map', () => {
    expect(SKYLINE_OBJECTIVE_ORDER).toEqual([
      'talk-to-lia',
      'collect-prime-cores',
      'deliver-cores-to-nilo',
      'defeat-composite-sentinels',
      'reach-apex-spire',
      'activate-apex-beacon',
    ])
    expect(SKYLINE_MISSION.finalObjectiveId).toBe('activate-apex-beacon')

    const ids: readonly SkylineObjectiveId[] = [
      ...SKYLINE_OBJECTIVE_ORDER,
      'mission-complete',
    ]
    for (const objectiveId of ids) {
      const objective = SKYLINE_OBJECTIVES[objectiveId]
      expect(objective.id).toBe(objectiveId)
      expect(objective.title.trim()).not.toBe('')
      expect(objective.detail.trim()).not.toBe('')
      expect(objective.targetPositions).toHaveLength(objective.requiredCount)
      objective.targetPositions.forEach(expectCityPosition)
    }
  })

  it('places the giver NPCs across different districts of the open city', () => {
    // The two original givers remain so the store/HUD/experience keep compiling.
    expect(SKYLINE_NPCS.lia).toMatchObject({ name: 'LIA' })
    expect(SKYLINE_NPCS.nilo).toMatchObject({ name: 'NILO' })

    const ids = Object.keys(SKYLINE_NPCS)
    expect(ids).toContain('lia')
    expect(ids).toContain('nilo')
    expect(ids.length).toBeGreaterThanOrEqual(3)

    const positions = ids.map((id) => SKYLINE_NPCS[id as keyof typeof SKYLINE_NPCS].position)
    // Givers are genuinely spread out: cover positive and negative X.
    expect(positions.some((position) => position[0] > 5)).toBe(true)
    expect(positions.some((position) => position[0] < -5)).toBe(true)
    for (const id of ids) {
      const npc = SKYLINE_NPCS[id as keyof typeof SKYLINE_NPCS]
      expect(npc.role.trim()).not.toBe('')
      expectCityPosition(npc.position)
    }
  })

  it('uses the unique prime cores 2, 3 and 5 over an ascending route', () => {
    expect(SKYLINE_PRIME_CORE_VALUES).toEqual([2, 3, 5])
    const cores = SKYLINE_PRIME_CORE_VALUES.map(
      (value) => SKYLINE_PRIME_CORES[value],
    )
    expect(new Set(cores.map((core) => core.value)).size).toBe(3)

    for (const core of cores) {
      const divisors = Array.from(
        { length: core.value },
        (_, index) => index + 1,
      ).filter((candidate) => core.value % candidate === 0)
      expect(divisors).toEqual([1, core.value])
      expect(core.clue.trim()).not.toBe('')
      expectCityPosition(core.position)
    }

    expect(cores.map((core) => core.position[1])).toEqual(
      [...cores].map((core) => core.position[1]).sort((a, b) => a - b),
    )
  })

  it('defines four distinct composite sentinels with correct factors', () => {
    expect(SKYLINE_SENTINEL_IDS).toHaveLength(4)
    expect(new Set(SKYLINE_SENTINEL_IDS).size).toBe(4)

    for (const sentinelId of SKYLINE_SENTINEL_IDS) {
      const sentinel = SKYLINE_SENTINELS[sentinelId]
      expect(sentinel.id).toBe(sentinelId)
      expect(
        sentinel.primeFactors.reduce((product, factor) => product * factor, 1),
      ).toBe(sentinel.compositeNumber)
      expect(sentinel.primeFactors.length).toBeGreaterThan(1)
      for (const factor of sentinel.primeFactors) {
        expect(SKYLINE_PRIME_CORE_VALUES).toContain(factor)
      }
      expectCityPosition(sentinel.position)
    }
  })

  it('keeps dialogue concise, identified and tied to known speakers', () => {
    const knownSpeakers = new Set<string>([...Object.keys(SKYLINE_NPCS), 'runner'])
    const lines = Object.values(SKYLINE_DIALOGUES).flatMap(
      (dialogue) => dialogue.lines,
    )
    expect(new Set(lines.map((line) => line.id)).size).toBe(lines.length)

    for (const dialogue of Object.values(SKYLINE_DIALOGUES)) {
      expect(dialogue.lines.length).toBeGreaterThanOrEqual(2)
      for (const line of dialogue.lines) {
        expect(knownSpeakers.has(line.speaker)).toBe(true)
        expect(line.text).toBe(line.text.trim())
        expect(line.text.length).toBeLessThanOrEqual(110)
      }
    }
  })

  it('wires each giver to at least one dialogue it can speak', () => {
    for (const id of Object.keys(SKYLINE_NPCS)) {
      const npc = SKYLINE_NPCS[id as keyof typeof SKYLINE_NPCS]
      expect(npc.dialogueIds.length).toBeGreaterThanOrEqual(1)
      const speaksSomewhere = npc.dialogueIds.some((dialogueId) =>
        SKYLINE_DIALOGUES[dialogueId].lines.some((line) => line.speaker === npc.id),
      )
      expect(speaksSomewhere).toBe(true)
    }
  })
})
