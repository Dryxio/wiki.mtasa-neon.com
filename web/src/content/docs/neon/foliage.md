---
title: Custom foliage
description: Grow GTA's own grass and vegetation anywhere by handing its native plant manager a triangle, a surface and a density from Lua.
sidebar:
  order: 5
---

San Andreas grows grass and small vegetation from its native plant manager, which reads triangles out of the map and consults `plants.dat` to decide what grows on each surface. Resources could never touch it, so vegetation was whatever the shipped map happened to have.

Neon exposes it as a **`foliage`** element. A resource hands GTA a triangle, a surface type and a density, and GTA grows its own plants inside that triangle using its normal rendering, wind animation and fade behavior.

<video controls muted loop playsinline preload="metadata"
       poster="/neon-media/foliage-poster.jpg"
       style="width:100%;height:auto;border-radius:.5rem;">
  <source src="/neon-media/foliage-showcase.mp4" type="video/mp4" />
  Your browser cannot play this clip. It shows a triangle drawn in game with three
  clicks, filling with native grass, then the surface type and density being changed live.
</video>

The clip runs `test-resources/foliage-draw-demo`: three clicks place the triangle corners, grass appears inside it, and the arrow keys and mouse wheel change the surface type and density while the patch rebuilds. The capture is a night scene, so the grass reads better in motion than in the still frame.

## Creating a patch

```lua
local a = Vector3(2470, -1650, 12.5)
local b = Vector3(2480, -1650, 12.5)
local c = Vector3(2475, -1640, 12.5)

local patch = createFoliage(a, b, c, 10, 1.5)
```

`createFoliage(v1, v2, v3, surface [, density = 1.0])` returns a `foliage` element, or `false` when the triangle, surface or density is rejected.

The OOP form is available too, since the element is registered as a `Foliage` class extending `Element`:

```lua
local patch = Foliage.create(a, b, c, 10, 1.5)
patch.density = 2.0
patch.surface = 11
```

## The three inputs

**The triangle** is three world-space vertices. It must be finite and non-degenerate, so three collinear points or a zero-area triangle are rejected rather than silently accepted.

**The surface** is a GTA surface ID from `0` to `255`. It is not a free-form style parameter: Neon asks GTA whether that surface has plant properties defined, and a surface with no entry grows nothing and is rejected. Which surfaces are useful therefore depends on the loaded `plants.dat` rather than on Neon. The reference resources probe surfaces at runtime instead of hardcoding one, and the draw demo cycles through `3`, `9`, `10` and `11`.

**The density** is a multiplier from `0.0` to `10.0`. `1.0` is the native density for that surface, `0.0` produces an empty patch that still exists as an element, and values above `1.0` thicken it. Anything negative, above `10.0`, or non-finite is rejected.

## Changing a patch after creation

| Function | OOP | Description |
| --- | --- | --- |
| [`getFoliageVertices`](/neon/functions/getFoliageVertices) / [`setFoliageVertices`](/neon/functions/setFoliageVertices) | `:getVertices()` / `:setVertices()` | Read or replace the three corners. |
| [`getFoliageSurface`](/neon/functions/getFoliageSurface) / [`setFoliageSurface`](/neon/functions/setFoliageSurface) | `.surface` | Read or replace the surface type. |
| [`getFoliageDensity`](/neon/functions/getFoliageDensity) / [`setFoliageDensity`](/neon/functions/setFoliageDensity) | `.density` | Read or replace the density multiplier. |

Every setter rebuilds the native triangle, and the rebuild is **atomic**. If the new combination is rejected, the element keeps its previous vertices, surface and density and the call returns `false`, so a failed edit never leaves a patch in a half-applied state.

`setElementPosition` also works: it translates the triangle and rebuilds it in place.

`getFoliageVertices` returns three `Vector3` values, not a table:

```lua
local v1, v2, v3 = getFoliageVertices(patch)
```

## Lifetime and dimensions

A `foliage` element is a normal client element. It belongs to the resource that created it and joins its element group, so **stopping the resource removes its patches** without any explicit cleanup. `destroyElement` works as usual.

Patches respect element dimensions, so a patch in another dimension is not rendered and reappears when the dimension matches again.

## Limits

- **64 custom foliage elements** at a time. That budget is Neon's own; GTA's shared plant pool is separate, so a creation can still fail earlier if the map's own vegetation already has the native pool under pressure.
- **Client-side only.** There is no server element and no synchronization. Each client builds its own patches, so shared vegetation has to be driven by a resource on both sides.
- A surface only works if the loaded `plants.dat` defines plant properties for it. Neon does not add plant types; it places triangles for the ones GTA already knows.
- Rendered plant counts are owned by GTA. Lua can read back the element's vertices, surface and density, but not how many plants ended up drawn.

## Verification

`test-resources/foliage-test` is the regression and showcase harness. `/foliage_test` covers registration of all seven functions, runtime surface probing, element typing, getter round-trips, the accepted density values `0`, `0.5`, `1`, `2` and `10`, rejection of negative and above-`10` densities, `setElementPosition` rebuild, vertex and surface replacement, out-of-range surface rejection, dimension change and restore, the OOP `density` property and `Foliage.create`, degenerate-triangle rejection, and destruction invalidating the handle.

`/foliage_test_all` adds the cap test, which attempts 65 simultaneous elements and expects the 65th to fail when the harness owns all 64 slots. Stopping fewer than 64 is reported as a warning rather than a failure, because vanilla map vegetation may already occupy native capacity. `/foliage_stress 32 5` runs five create/destroy cycles of 32 elements.

`/foliage_lifetime` creates one patch and deliberately does not clean it up on stop, so restarting the resource proves the element-group teardown path.

`test-resources/foliage-draw-demo` is the interactive version used for the clip. Neither resource is auto-deployed; copy them into the server resources directory first.

Implementation: [`29e4398be`](https://github.com/Dryxio/mtasa-neon/commit/29e4398be).
