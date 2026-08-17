---
title: Runtime collision generation
description: Build GTA collision models from a Lua table instead of a .col file, and rebuild them live on models that are already in the world.
sidebar:
  order: 4
---

MTA collision has always come from a `.col` file: author it in an external tool, ship it in the resource, load it with `engineLoadCOL`. Collision shapes were fixed at packaging time.

Neon lets a resource **describe collision as a Lua table** and have Neon serialize a real GTA collision model from it. The same table can be pushed again to rebuild the collision of a model that is already streamed into the world.

<video controls muted loop playsinline preload="metadata"
       poster="/neon-media/runtime-collision-poster.jpg"
       style="width:100%;height:auto;border-radius:.5rem;">
  <source src="/neon-media/runtime-collision-showcase.mp4" type="video/mp4" />
  Your browser cannot play this clip. It shows a wall drawn in game from
  runtime-generated collision, resized and turned into a ramp while the player
  stands on it, with the generated collision outline toggled on.
</video>

The clip runs `test-resources/runtime-collision-wall-demo`. The player draws a wall, jumps onto it, then extends and raises it while standing on it, and finally turns the same runtime model into a ramp and walks down. The cyan outline is the generated collision itself. Nothing is scaled: each edit regenerates the collision model.

## Two entry points

| Function | What it does |
| --- | --- |
| [`engineLoadCOL(table)`](/neon/functions/engineLoadCOL) | Builds a new `col` element from a collision table. Passing a string or file still uses the standard MTA path. |
| [`engineSetCOLData(col, table)`](/neon/functions/engineSetCOLData) | Rebuilds an existing `col` element's collision from a table, in place. |

`engineLoadCOL` is the standard MTA function with an added table overload, so existing resources are unaffected. The returned element is an ordinary `col` element: parent it, replace models with `engineReplaceCOL`, and destroy it as usual.

## The collision table

Three optional top-level keys. At least one shape must be present overall.

```lua
local collision = {
    spheres = {
        { position = { 0, 0, 1 }, radius = 0.5, material = 0 },
    },
    boxes = {
        -- position is the centre; size is the full extent, not half-extents
        { position = { 0, 0, 0 }, size = { 4, 0.4, 2.5 }, material = 0 },
    },
    meshes = {
        {
            -- flat xyz triplets
            vertices = { 0,0,0,  1,0,0,  0,1,0 },
            -- flat triangle triplets, zero-based into this mesh's vertices
            indices  = { 0, 1, 2 },
            material = 0,
        },
    },
}
```

- `material` is optional and defaults to `0`. Valid values are integers `0` through `178`, GTA's surface materials, which drive footstep sounds, particles, and vehicle handling response.
- `boxes[i].size` is the **full extent** centred on `position`. A `size` of `{4, 0.4, 2.5}` is a four-metre-wide, 40cm-thick, 2.5m-tall slab. Every component must be greater than zero.
- Sphere `radius` must be greater than zero.
- Mesh `indices` are zero-based within that mesh. Neon offsets them automatically when several meshes are combined into one model, so each mesh's indices stay local to its own vertex list.

Validation errors are raised as Lua errors naming the exact path, for example `spheres[2].radius must be finite` or `meshes[1].vertices must contain xyz triplets`, so a malformed table tells you which entry to fix.

## Rebuilding collision that is already in use

This is the part a `.col` file cannot do. `engineSetCOLData` rebuilds the collision model and re-applies it to **every model the `col` element was already replaced into**, so the change lands immediately on objects that are streamed in and being stood on.

```lua
local model = engineRequestModel("object", 980)
local col = engineLoadCOL({ boxes = { { position = {0,0,0}, size = {4, 0.4, 1} } } })
engineReplaceCOL(col, model)

local object = createObject(model, x, y, z)

-- Later: make the same wall taller. No new element, no reload.
engineSetCOLData(col, { boxes = { { position = {0,0,0}, size = {4, 0.4, 3} } } })
```

Regenerate only when the shape actually changes. The demo resource keeps a signature string of its current dimensions and skips the rebuild when a frame produces the same shape, which is the pattern to copy for anything driven by held keys or continuous input.

## Why not just scale the object?

Stretching an object to change its shape leaves you relying on non-uniform scaling for the physical result, which is exactly what this replaces. The demo resource makes the distinction explicit: the visible object has collision disabled, and a second invisible object on the same temporary model ID carries the generated collision, so every physical interaction comes from the generated shape rather than from a scaled model.

## Limits

- **Client-side.** These are client functions, like the rest of the `engine*` family. The server decides what a resource asks each client to build.
- **Mesh vertices must stay within about -256 to +256 on each axis** relative to the model origin, because GTA stores collision vertices internally in a compressed form. Spheres and boxes are not affected. A mesh vertex outside that range is rejected rather than silently wrapping.
- Per model: at most 65,535 spheres, 65,535 boxes, 65,536 combined mesh vertices, and 65,535 combined triangles.
- Materials are limited to GTA's real surface range `0`-`178`.
- Collision is generated, not authored. There is no lighting, piece, or brightness control per face, and no import of an existing `.col` back into a table.

## Verification

`Tests/client/CRuntimeColModel_Tests.cpp` covers serialization of mixed sphere, box and mesh models, index offsetting across several meshes, and rejection of missing geometry, out-of-range triangle indices, compressed-vertex overflow, and invalid primitive dimensions.

`test-resources/runtime-collision-wall-demo` is the interactive harness: draw a wall, extend and raise it while standing on it, toggle it between wall and ramp, show the generated collision outline, and drive a vehicle into it for an impact test. It is not auto-deployed; copy it into the server resources directory before starting it.

Implementation: [`aba2101e9`](https://github.com/Dryxio/mtasa-neon/commit/aba2101e9).
