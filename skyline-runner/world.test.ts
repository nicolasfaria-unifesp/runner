import { describe, expect, it } from 'vitest'

import { SKYLINE_PRIME_CORES, SKYLINE_PRIME_CORE_VALUES } from './missionData'
import { selectGrappleAnchor } from './parkourLogic'
import {
  PLAYER_SPAWN,
  SKYLINE_ANCHORS,
  SKYLINE_BUILDINGS,
  SKYLINE_COLLIDERS,
} from './world'

describe('skyline world', () => {
  it('places every prime core over a playable rooftop', () => {
    for (const value of SKYLINE_PRIME_CORE_VALUES) {
      const [x, y, z] = SKYLINE_PRIME_CORES[value].position
      expect(SKYLINE_BUILDINGS.some((building) => (
        x >= building.bounds.min.x
        && x <= building.bounds.max.x
        && z >= building.bounds.min.z
        && z <= building.bounds.max.z
        && Math.abs(y - (building.bounds.max.y + 1.1)) < .01
      ))).toBe(true)
    }
  })

  it('keeps the first grapple anchor visible from the initial roof', () => {
    const anchor = SKYLINE_ANCHORS[0]
    const origin = { ...PLAYER_SPAWN, y: PLAYER_SPAWN.y + .58 }
    const offset = {
      x: anchor.position.x - origin.x,
      y: anchor.position.y - origin.y,
      z: anchor.position.z - origin.z,
    }
    const length = Math.hypot(offset.x, offset.y, offset.z)
    const selection = selectGrappleAnchor({
      origin,
      viewDirection: { x: offset.x / length, y: offset.y / length, z: offset.z / length },
      anchors: SKYLINE_ANCHORS,
      obstacles: SKYLINE_COLLIDERS.map((platform) => platform.bounds),
      maxRange: 27,
      minimumAlignment: .54,
      lineOfSightPadding: .03,
    })
    expect(selection?.anchor.id).toBe('anchor-binary')
  })

  it('keeps every major grapple transfer visible along the critical route', () => {
    const route = [
      { origin: { x: 0, y: 1.1, z: 8 }, anchorId: 'anchor-binary' },
      { origin: { x: 22, y: 5.8, z: 3 }, anchorId: 'anchor-triad' },
      { origin: { x: 40, y: 11.5, z: 5 }, anchorId: 'anchor-east-spire' },
      { origin: { x: -28, y: 9.2, z: -3 }, anchorId: 'anchor-relay' },
      { origin: { x: -40, y: 8.1, z: 3 }, anchorId: 'anchor-west-cooler' },
      { origin: { x: -7, y: 7.2, z: -30 }, anchorId: 'anchor-four' },
      { origin: { x: 9, y: 8.7, z: -32 }, anchorId: 'anchor-six' },
      { origin: { x: -11, y: 10.3, z: -45 }, anchorId: 'anchor-nine' },
      { origin: { x: 11, y: 11.8, z: -47 }, anchorId: 'anchor-ten' },
      { origin: { x: 0, y: 11.8, z: -56 }, anchorId: 'anchor-apex' },
    ] as const

    for (const step of route) {
      const anchor = SKYLINE_ANCHORS.find(({ id }) => id === step.anchorId)
      expect(anchor).toBeDefined()
      if (!anchor) continue
      const origin = { ...step.origin, y: step.origin.y + .58 }
      const offset = {
        x: anchor.position.x - origin.x,
        y: anchor.position.y - origin.y,
        z: anchor.position.z - origin.z,
      }
      const length = Math.hypot(offset.x, offset.y, offset.z)
      const selection = selectGrappleAnchor({
        origin,
        viewDirection: { x: offset.x / length, y: offset.y / length, z: offset.z / length },
        anchors: SKYLINE_ANCHORS,
        obstacles: SKYLINE_COLLIDERS.map((platform) => platform.bounds),
        maxRange: 27,
        minimumAlignment: .54,
        lineOfSightPadding: .03,
      })
      expect(selection?.anchor.id, `from route step to ${step.anchorId}`).toBe(step.anchorId)
    }
  })

  it('uses unique ids for colliders and anchors', () => {
    expect(new Set(SKYLINE_COLLIDERS.map(({ id }) => id)).size).toBe(SKYLINE_COLLIDERS.length)
    expect(new Set(SKYLINE_ANCHORS.map(({ id }) => id)).size).toBe(SKYLINE_ANCHORS.length)
  })

  it('never lets two building footprints overlap in the X/Z plane', () => {
    for (let i = 0; i < SKYLINE_BUILDINGS.length; i += 1) {
      for (let j = i + 1; j < SKYLINE_BUILDINGS.length; j += 1) {
        const a = SKYLINE_BUILDINGS[i].bounds
        const b = SKYLINE_BUILDINGS[j].bounds
        const overlaps = a.min.x < b.max.x
          && a.max.x > b.min.x
          && a.min.z < b.max.z
          && a.max.z > b.min.z
        expect(
          overlaps,
          `${SKYLINE_BUILDINGS[i].id} overlaps ${SKYLINE_BUILDINGS[j].id}`,
        ).toBe(false)
      }
    }
  })
})
