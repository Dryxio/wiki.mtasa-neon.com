---
title: Managed fire
description: Fires that are real elements, synchronized by the server, kept alive with their own identity, and changed one at a time instead of being extinguished and recreated.
sidebar:
  order: 6
---

Standard MTA fire is fire and forget: `createFire` lights a native GTA fire on one client and returns a boolean. There is no handle, nothing to change afterwards, and nothing the server knows about.

Neon adds **managed fire**: a real `fire` element with a persistent identity, created from the server or the client, synchronized to every player, and mutable while it burns.

<video controls muted loop playsinline preload="metadata"
       poster="/neon-media/fire-poster.jpg"
       style="width:100%;height:auto;border-radius:.5rem;">
  <source src="/neon-media/fire-showcase.mp4" type="video/mp4" />
  Your browser cannot play this clip. It shows 68 managed fires forming a sign, a
  strength wave running across it, then one of those fires leaving the sign and
  following a moving car.
</video>

The clip runs `test-resources/fire-showcase`. The point is not that MTA can make fire. It is that **one specific fire** leaves the sign, keeps its identity, and is retargeted onto a moving car without ever being extinguished and recreated.

## Creating one

```lua
local fire = createFire(x, y, z, {
    duration = 10000,          -- ms, default 5000
    strength = 1.5,            -- default 1.0, minimum 0.1
    damage = true,             -- default true
    damageTargets = { players = true, peds = true, vehicles = false, objects = false },
    spread = false,            -- default false
    maxGenerations = 0,        -- 0 to 255, default 0
    source = somePlayer,       -- who is blamed for the damage
    target = nil,              -- element the fire follows
})
```

Passing a **table** as the fourth argument creates a managed fire and returns a `fire` element. Everything else keeps the old behavior:

| Call | Result |
| --- | --- |
| `createFire(x, y, z, optionsTable)` | Managed `fire` element, client or server |
| `createFire(x, y, z [, size])` on the client | The original native GTA fire, returns a boolean |
| `createFire(x, y, z, number)` on the server | Managed fire, the number is read as `strength` |

`extinguishFire(fire)` destroys one managed fire. The legacy radius and no-argument forms still work on native fires.

## Changing a fire while it burns

Every option has a getter and a setter, so a fire is adjusted in place rather than replaced.

| Property | Functions |
| --- | --- |
| Strength | [`getFireStrength`](/neon/functions/getFireStrength) / [`setFireStrength`](/neon/functions/setFireStrength) |
| Duration and remaining time | [`getFireDuration`](/neon/functions/getFireDuration) / [`setFireDuration`](/neon/functions/setFireDuration), [`getFireRemainingTime`](/neon/functions/getFireRemainingTime) / [`setFireRemainingTime`](/neon/functions/setFireRemainingTime) |
| Damage | [`isFireDamageEnabled`](/neon/functions/isFireDamageEnabled) / [`setFireDamageEnabled`](/neon/functions/setFireDamageEnabled), [`getFireDamageTargets`](/neon/functions/getFireDamageTargets) / [`setFireDamageTargets`](/neon/functions/setFireDamageTargets) |
| Spread | [`isFireSpreadEnabled`](/neon/functions/isFireSpreadEnabled) / [`setFireSpreadEnabled`](/neon/functions/setFireSpreadEnabled), [`getFireMaxGenerations`](/neon/functions/getFireMaxGenerations) / [`setFireMaxGenerations`](/neon/functions/setFireMaxGenerations) |
| Blame and targeting | [`getFireSource`](/neon/functions/getFireSource) / [`setFireSource`](/neon/functions/setFireSource), [`getFireTarget`](/neon/functions/getFireTarget) / [`setFireTarget`](/neon/functions/setFireTarget) |

The same twenty functions exist on both sides.

**Targeting is the interesting one.** [`setFireTarget`](/neon/functions/setFireTarget) attaches the fire to an element, and it follows that element wherever it goes:

```lua
setFireTarget(fire, theVehicle)   -- the fire now rides the car
```

`strength` around `1`, `2` and `3` visibly selects GTA's small, medium and large fire effects.

## Damage

`damageTargets` is a mask over `players`, `peds`, `vehicles` and `objects`, all enabled by default. `source` sets which element is blamed.

`onClientFireDamage` fires on the victim's client and **can be cancelled**:

```lua
addEventHandler("onClientFireDamage", root, function(victim, damage, responsibleElement)
    if getElementType(victim) == "player" and isPlayerFireproof(victim) then
        cancelEvent()
    end
end)
```

| Event | Parameters |
| --- | --- |
| `onClientFireDamage` | `element victim, float damage, element responsibleElement` |

## Lifetime and synchronization

Server-created fires are synchronized to every client. A player who joins while a fire is burning receives it with the **remaining** lifetime, not a restarted one, because the lifetime is tracked as relative remaining time rather than against a wall clock.

Fires respect dimension and interior, so one in another dimension is hidden until the contexts match. Stopping the owning resource removes its fires and leaves no effect behind.

## Beyond the native pool

GTA's own fire pool holds 60. Managed fires are not limited by it: the showcase resource places **68 at once**, and the harness verifies more than 60 simultaneous managed fires.

Ordinary GTA and Molotov fires keep using the native runtime and are unaffected by managed-fire settings.

## Verification

`test-resources/fire-test` is the harness. `/firetest all` covers managed element creation, duration and remaining time, live strength changes, damage target masks, source and target setters, client synchronization, server expiry, one-generation spread, more than 60 simultaneous fires, local damage-mask behavior, and cancelling `onClientFireDamage`. Results print as explicit `PASS` and `FAIL` lines.

`/firetest late` creates a 30-second fire so a second client can join mid-burn and confirm it receives the reduced remaining lifetime.

`test-resources/fire-showcase` is the cinematic used for the clip. Neither resource is auto-deployed; copy them into the server resources directory first.

Implementation: [`d82ce28aa`](https://github.com/Dryxio/mtasa-neon/commit/d82ce28aa).
