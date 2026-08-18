---
title: Scriptable birds
description: Managed bird elements with their own renderer, flight control and hit testing, well past GTA's six native ambient bird slots.
sidebar:
  order: 7
---

San Andreas has ambient birds, but they are decoration: GTA owns six slots, picks the models, and nothing in MTA could touch them.

Neon adds a **`bird` element** with its own renderer and flight control. A resource creates as many as it wants, steers them, restyles them, and can make them shootable.

<video controls muted loop playsinline preload="metadata"
       poster="/neon-media/bird-poster.jpg"
       style="width:100%;height:auto;border-radius:.5rem;">
  <source src="/neon-media/bird-showcase.mp4" type="video/mp4" />
  Your browser cannot play this clip. It shows a large Lua-controlled flock
  sweeping over the desert, then a bird being shot down at street level.
</video>

The clip runs `test-resources/bird-showcase` and `bird-test`. No custom model, texture or shader is involved: everything is the managed bird renderer driven from Lua.

## Creating one

```lua
local bird = createBird(x, y, z, {
    preset = "desert",              -- normal, water or desert
    speed = 12.0,
    size = 1.5,
    renderDistance = 250.0,
    wingBeatTime = 0.35,
    curvedFlight = true,
    shootable = true,
    movementEnabled = true,
    bodyColor = tocolor(220, 220, 220),
    wingColor = tocolor(255, 255, 255),
    velocity = { 1, 0, 0 },
})
```

Every field is optional. The OOP form is available too, since the element is registered as a `Bird` class extending `Element`:

```lua
local bird = Bird.create(x, y, z, { preset = "water" })
bird.size = 2.0
bird.shootable = true
```

## Steering a flock

`setBirdVelocity` moves a bird now. [`setBirdTargetVelocity`](/neon/functions/setBirdTargetVelocity) sets where it should be heading and lets the bird ease toward it, which is what makes a flock turn as a group instead of snapping.

| Property | Functions | OOP |
| --- | --- | --- |
| Velocity | [`getBirdVelocity`](/neon/functions/getBirdVelocity) / [`setBirdVelocity`](/neon/functions/setBirdVelocity) | `:getVelocity()` / `:setVelocity()` |
| Target velocity | [`getBirdTargetVelocity`](/neon/functions/getBirdTargetVelocity) / [`setBirdTargetVelocity`](/neon/functions/setBirdTargetVelocity) | `:getTargetVelocity()` / `:setTargetVelocity()` |
| Size | [`getBirdSize`](/neon/functions/getBirdSize) / [`setBirdSize`](/neon/functions/setBirdSize) | `.size` |
| Colors | [`getBirdColors`](/neon/functions/getBirdColors) / [`setBirdColors`](/neon/functions/setBirdColors) | `:getColors()` / `:setColors()` |
| Wing beat | [`getBirdWingBeatTime`](/neon/functions/getBirdWingBeatTime) / [`setBirdWingBeatTime`](/neon/functions/setBirdWingBeatTime) | `.wingBeatTime` |
| Render distance | [`getBirdRenderDistance`](/neon/functions/getBirdRenderDistance) / [`setBirdRenderDistance`](/neon/functions/setBirdRenderDistance) | `.renderDistance` |
| Curved flight | [`isBirdCurvedFlightEnabled`](/neon/functions/isBirdCurvedFlightEnabled) / [`setBirdCurvedFlightEnabled`](/neon/functions/setBirdCurvedFlightEnabled) | `.curvedFlight` |
| Shootable | [`isBirdShootable`](/neon/functions/isBirdShootable) / [`setBirdShootable`](/neon/functions/setBirdShootable) | `.shootable` |
| Movement | [`isBirdMovementEnabled`](/neon/functions/isBirdMovementEnabled) / [`setBirdMovementEnabled`](/neon/functions/setBirdMovementEnabled) | `.movementEnabled` |

Turning movement off freezes a bird in place while the rest of the flock keeps flying, which is how the showcase pulls one bird out of formation without disturbing the others.

## Shooting them

A shootable bird raises `onClientBirdShot`, and the event **can be cancelled** to keep the bird alive:

```lua
addEventHandler("onClientBirdShot", root, function(attacker, weapon, hitX, hitY, hitZ)
    if weapon == 23 then      -- silenced pistol does not count
        cancelEvent()
    end
end)
```

| Event | Parameters |
| --- | --- |
| `onClientBirdShot` | `element attacker, int weapon, float hitX, float hitY, float hitZ` |

[`processBirdGunShot`](/neon/functions/processBirdGunShot) exposes the same hit test directly, so a custom weapon or bullet system can feed its own traces into managed-bird hit detection instead of reimplementing it.

## Limits

- **Client-side only.** There is no server element and no synchronization; each client builds its own birds.
- Birds fade out near their render distance rather than being destroyed, so the element survives even when nothing is drawn.
- Dimension and interior are respected: a mismatch hides the bird while keeping its identity.
- Stopping the owning resource removes its birds.
- GTA's own ambient birds keep spawning and behaving independently. Managed birds do not replace them.

## Verification

`test-resources/bird-test` prints explicit `PASS` and `FAIL` lines. `/birdtest all` covers creation and type identity, property round-trips, movement and freeze behavior, invalid inputs, and **128 simultaneous managed birds**, well past GTA's six native ambient slots.

`/birdtest shoot` creates one large red stationary bird to confirm `onClientBirdShot` fires and the element is destroyed; `/birdtest shootcancel` repeats it with a blue bird and cancels the event, so the same element must survive. The harness routes `onClientPlayerWeaponFire` traces through `processBirdGunShot`.

Manual checks cover the three presets looking visibly distinct, render-distance fading, dimension hiding, and resource cleanup.

`test-resources/bird-showcase` is the cinematic. Neither resource is auto-deployed; copy them into the server resources directory first.

Implementation: [`23fedfbc9`](https://github.com/Dryxio/mtasa-neon/commit/23fedfbc9).
