---
title: Object fracture effects
description: Break any streamed object into fragments generated from its own geometry, without a breakable DFF or any fracture metadata.
sidebar:
  order: 9
---

GTA has breakable objects, but only the ones Rockstar prepared: the model needs the DFF breakable plugin, and MTA's `breakObject` only works on that fixed set.

Neon fractures **any** streamed object. Fragments are generated from the object's live RenderWare geometry at runtime, so no custom DFF, TXD, shader or fracture metadata is involved, and the pieces keep the source UV and material data.

<video controls muted loop playsinline preload="metadata"
       poster="/neon-media/break-poster.jpg"
       style="width:100%;height:auto;border-radius:.5rem;">
  <source src="/neon-media/break-showcase.mp4" type="video/mp4" />
  Your browser cannot play this clip. It shows ordinary GTA props being shot and
  breaking apart into fragments cut from their own meshes.
</video>

The clip runs `test-resources/break-showcase`. The props are ordinary GTA models with no breakable plugin.

## Two ways in

**Fracture it now**, explicitly:

```lua
local effect = createObjectBreakEffect(theObject, {
    fragments = 24,
    force = 4,
    randomness = 0.8,
})
```

**Or arm the object and let normal damage do it.** [`setObjectBreakProfile`](/neon/functions/setObjectBreakProfile) gives an object durability, and Neon consumes GTA's native per-impact object damage until it runs out:

```lua
setObjectBreakProfile(theObject, {
    health = 500,
    instantBreakThreshold = 200,   -- one big hit breaks it outright
    fragments = 24,
})
```

Then shoot it, ram it, blow it up. When health reaches zero, or a single hit exceeds the threshold, the fracture happens on its own.

This is deliberately **separate from `breakObject`**. The legacy function keeps GTA's native break semantics and its DFF requirement; a profiled object uses ordinary runtime geometry instead.

## Explosions break them too

A profiled object also takes damage from **real GTA explosions**, not just bullets and impacts. A rocket, a tank shell or a scripted `createExplosion` all feed the same durability.

Damage follows GTA's own radial falloff, so distance matters:

```text
min(1, 2 * (radius - distance) / radius) * 300
```

with the weak rocket variant scaling that by `0.2`. An explosion outside the radius does nothing, and one strong enough drives health to zero and fractures the object like any other hit.

This works **even on models whose vanilla object data would make them explosion-proof**, since the durability is Neon's rather than GTA's.

## Options

Both functions accept the same fracture options, and profiles add durability ones.

| Group | Keys |
| --- | --- |
| Durability | `health`, `native`, `damageMultiplier`, `instantBreakThreshold` |
| Fragments | `fragments`, `force`, `randomness`, `seed`, `velocity` |
| Physics | `gravity`, `bounce`, `drag`, `lifetime` |
| Presentation | `renderDistance`, `hideOriginal`, `disableOriginalCollision` |

`seed` makes a fracture reproducible: the same seed cuts the same pieces, which matters if two clients should see a prop break the same way.

## Reading an effect

`createObjectBreakEffect` returns a `break-effect` element you can inspect and pause.

| Function | Returns |
| --- | --- |
| [`getBreakEffectFragmentCount`](/neon/functions/getBreakEffectFragmentCount) | How many pieces the object became |
| [`getBreakEffectSourceTriangleCount`](/neon/functions/getBreakEffectSourceTriangleCount) | Triangles in the source mesh it was cut from |
| [`getBreakEffectSleepingFragmentCount`](/neon/functions/getBreakEffectSleepingFragmentCount) | Pieces that have settled and stopped simulating |
| [`getBreakEffectCacheHit`](/neon/functions/getBreakEffectCacheHit) | Whether this fracture reused cached geometry |
| [`isBreakEffectPaused`](/neon/functions/isBreakEffectPaused) / [`setBreakEffectPaused`](/neon/functions/setBreakEffectPaused) | Freeze the debris mid-air |

The sleeping count is the useful one for performance: fragments stop costing simulation once they settle.

## The geometry cache

Cutting a mesh into fragments is the expensive part, so Neon caches the result per model. Breaking the second crate of the same model reuses the first one's computed geometry, which `getBreakEffectCacheHit` reports.

[`getBreakEffectCacheSize`](/neon/functions/getBreakEffectCacheSize) reports how many entries are held and [`clearBreakEffectCache`](/neon/functions/clearBreakEffectCache) drops them, which is worth doing after a scene that fractured many different models.

## Managing durability

| Function | Purpose |
| --- | --- |
| [`setObjectBreakProfile`](/neon/functions/setObjectBreakProfile) / [`getObjectBreakProfile`](/neon/functions/getObjectBreakProfile) / [`clearObjectBreakProfile`](/neon/functions/clearObjectBreakProfile) | Arm, inspect and disarm an object |
| [`getObjectBreakHealth`](/neon/functions/getObjectBreakHealth) / [`setObjectBreakHealth`](/neon/functions/setObjectBreakHealth) / [`resetObjectBreakHealth`](/neon/functions/resetObjectBreakHealth) | Read, set and restore remaining durability |

## Limits

- **Client-side only.** No server element and no synchronization. Two clients fracturing the same prop need the same `seed` to see the same pieces, and the resource has to relay it.
- The object must be **streamed in** and carry valid static RenderWare geometry. Fracturing something that is not streamed fails with a warning rather than silently doing nothing.
- Effects belong to the resource that created them and are removed when it stops.
- This does not replace `breakObject`, which keeps GTA's native semantics for models that ship the breakable plugin.

## Verification

`test-resources/break-test` runs `/breaktest all` and covers fracture creation from streamed geometry, managed element identity, fragment and triangle introspection, pause state, deterministic cache reuse, durability profiles, invalid arguments, several simultaneous effects and cleanup. The `profile` case specifically covers arming an object, health get/set/reset, profile introspection and the zero-health transition into a fracture.

`test-resources/break-showcase` has both the recorded runway sequence and an interactive playground: `/breakspawn <model> health=500 fragments=24 force=4` spawns any GTA model, grounds it, arms it, and lets you shoot it. Neither resource is auto-deployed; copy them into the server resources directory first.

Implementation: [`418f250d6`](https://github.com/Dryxio/mtasa-neon/commit/418f250d6).
