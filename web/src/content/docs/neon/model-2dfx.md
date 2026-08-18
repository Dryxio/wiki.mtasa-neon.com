---
title: Model 2DFX effects
description: Read, edit, add and remove the 2DFX effects baked into GTA models, with per-resource ownership and rollback.
sidebar:
  order: 8
---

Every lamp post, neon sign and steam vent in San Andreas carries **2DFX**: small effect records baked into the model by RenderWare. They are what makes a streetlight glow and a manhole steam. MTA never exposed them.

Neon does, with 13 client functions that read, edit, add and remove those records.

<video controls muted loop playsinline preload="metadata"
       poster="/neon-media/2dfx-poster.jpg"
       style="width:100%;height:auto;border-radius:.5rem;">
  <source src="/neon-media/2dfx-showcase.mp4" type="video/mp4" />
  Your browser cannot play this clip. It shows a runway lined with ordinary GTA
  lamp posts running colour waves, blink patterns and corona pulses.
</video>

The clip runs `test-resources/2dfx-showcase`. There is **no custom DFF, TXD, shader or texture** in it. The lamp posts are stock model 1226 and every texture name comes from GTA itself; the whole show is native 2DFX types driven from Lua.

## The one thing to understand first

**This API is model-level, not object-level.** It matches GTA's RenderWare 2DFX plugin, where the effect belongs to the model rather than to a placed instance.

Change a light on model 1226 and *every* lamp post using model 1226 changes. That is not a limitation to work around, it is the lever: the showcase splits its lamp posts across twelve runtime models so one Lua call drives five real lamp posts at once, and the two sides can run opposite colour waves.

If you need per-object effects, give the objects their own runtime models first.

## The five effect types

| Type | What it is | Properties |
| --- | --- | --- |
| `light` | A corona, point light and shadow. The workhorse. | 15, listed below |
| `particle` | A named native particle emitter | `name` only |
| `roadsign` | Up to four lines of generated text on a board | `size`, `rotation`, `flags`, `color`, `text1` to `text4` |
| `escalator` | A moving escalator surface | `bottom`, `top`, `end`, `direction` |
| `sun_glare` | A sun glare sprite | none, position only |

### Light properties

All fifteen are required when adding a `light`:

| Property | Type | Notes |
| --- | --- | --- |
| `drawDistance` | float | Must be 0 or greater |
| `lightRange` | float | Point light radius, 0 or greater |
| `coronaSize` | float | 0 or greater |
| `shadowSize` | float | 0 or greater |
| `shadowMultiplier` | int | 0 to 255 |
| `showMode` | string | Blink behavior, see below |
| `coronaReflection` | bool | Wet-road reflection |
| `flareType` | int | 0 or 1 |
| `flags` | table | Effect flags |
| `shadowDistance` | int | -128 to 127 |
| `offset` | Vector3 | Each axis -128 to 127 |
| `color` | color | |
| `coronaName` | string | Texture name, cannot be empty |
| `shadowName` | string | Texture name, cannot be empty |

`showMode` accepts `default`, `on_off_at_5`, `warnlight`, `trafficlight`, `traincrosslight`, `random_flashing`, `random_at_wet_weather`, `at_rain_only` and `lines`. These are GTA's own blink modes, so a light can behave like a real traffic light without a Lua timer.

## Adding and removing

```lua
addModel2DFX(1337, 0, 0, 1.2, "light", {
    drawDistance = 100, lightRange = 12, coronaSize = 1.5, shadowSize = 4,
    shadowMultiplier = 200, showMode = "trafficlight", coronaReflection = true,
    flareType = 0, flags = {}, shadowDistance = 0, offset = { 0, 0, 0 },
    color = tocolor(255, 60, 60), coronaName = "coronastar", shadowName = "shad_exp",
})
```

| Function | Purpose |
| --- | --- |
| [`addModel2DFX`](/neon/functions/addModel2DFX) | Add a resource-owned effect to a model |
| [`removeModel2DFX`](/neon/functions/removeModel2DFX) | Remove an effect, including an original GTA one |
| [`restoreModel2DFX`](/neon/functions/restoreModel2DFX) | Put a removed original effect back |
| [`resetModel2DFXEffects`](/neon/functions/resetModel2DFXEffects) | Roll a model back to its original state |
| [`getModel2DFXCount`](/neon/functions/getModel2DFXCount) | Count effects, with or without custom ones |
| [`getModel2DFXType`](/neon/functions/getModel2DFXType) | Read one effect's type |
| [`getModel2DFXEffects`](/neon/functions/getModel2DFXEffects) | Dump every effect on a model |
| [`getModel2DFXPosition`](/neon/functions/getModel2DFXPosition) / [`setModel2DFXPosition`](/neon/functions/setModel2DFXPosition) / [`resetModel2DFXPosition`](/neon/functions/resetModel2DFXPosition) | Read, move and restore an effect's position |
| [`getModel2DFXProperty`](/neon/functions/getModel2DFXProperty) / [`setModel2DFXProperty`](/neon/functions/setModel2DFXProperty) / [`resetModel2DFXProperty`](/neon/functions/resetModel2DFXProperty) | Read, change and restore one property |

`getModel2DFXCount(model, false)` counts only the model's original effects, which is how a resource finds a native effect index to edit without tripping over its own additions.

## Ownership and rollback

Custom effects belong to the resource that created them. Overrides and removals of **original GTA** effects are stacked per resource, so two resources touching the same model do not silently clobber each other, and stopping one rolls back only its own layer.

Stopping a resource removes its custom effects and undoes its overrides. The regression harness proves this the honest way: it deliberately leaves effects alive on exit, and the next run starts by asserting the previous run's effects are gone.

## Restreaming, and why it matters

Adding or removing an effect changes the model, so already-streamed instances need to be rebuilt before the change is visible. A targeted model restream is cheap. `engineRestreamWorld()` is global and causes a **noticeable streaming hitch**.

The showcase never calls it during the recorded timeline, and the regression harness deliberately excludes it from its automatic run and puts it behind an explicit command instead. Treat it as a setup-time tool, not something to call while players are moving.

Issue additions in sequence rather than while a model is still being rebuilt.

## Limits

- **Client-side only.** No server element, no synchronization.
- Model IDs are 0 to 65535.
- Particle `name` holds 1 to 23 characters. Native storage is `char[24]`, so 24 characters would leave no room for the terminator.
- Roadsign lines are at most 16 characters each, across `text1` to `text4`.
- Light `offset` and `shadowDistance` are signed bytes, so -128 to 127.
- Effects are model-level, so there is no way to change one placed object without giving it its own model.

## Verification

`test-resources/2dfx-test` prints `PASS` / `FAIL` / `SKIP` in chat and to `outputDebugString`. It covers resource-stop cleanup from a previous run, rejecting a missing `flags` field without crashing, rejecting 24-character particle names, adding light, particle and roadsign effects, custom property set/get/reset, `getModel2DFXCount(model, false)` excluding custom effects, modifying and resetting a native light on model 1226, and removing then restoring a native effect while waiting for the targeted restream to settle.

`/2dfxrestream` and `/2dfxstress [count]` cover the global restream path explicitly, up to 50 cycles, verifying the custom count and type stay stable.

`test-resources/2dfx-showcase` is the cinematic: about 60 lamp posts, 12 independently controlled model groups, native blink modes, live colour and corona mutations, particle gates, generated roadsign text and a sun-glare cluster. Neither resource is auto-deployed; copy them into the server resources directory first.

Implementation: [`27e3972e7`](https://github.com/Dryxio/mtasa-neon/commit/27e3972e7).
