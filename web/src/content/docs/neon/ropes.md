---
title: Managed ropes
description: GTA's own cranes, winches and rappel ropes exposed as synchronized rope elements, with more logical ropes than the engine has native slots.
sidebar:
  order: 11
---

San Andreas has ropes: the Vegas and quarry cranes, the dock crane, the wrecking ball, the helicopter winch magnet, the SWAT rappel line. They are a real solver in the engine, and nothing in MTA could reach them.

Neon exposes them as synchronized **`rope` elements**, and lets a resource keep more logical ropes alive than GTA has slots for.

<!-- MEDIA PLACEHOLDER: Managed rope showcase. Suggested file: /neon-media/rope-showcase.mp4 with /neon-media/rope-poster.jpg. The runway sequence separates wrecking ball, mini magnet and harness into three labelled demonstrations. -->

## The eight rope types

`type` selects which native rope GTA runs. They are the game's own, not styles:

| Name | ID | What it is |
| --- | --- | --- |
| `winchMagnet` | 1 | Helicopter winch magnet |
| `harness` | 2 | Lifting harness |
| `miniMagnet` | 3 | Small magnet |
| `dockCrane` | 4 | Dock crane |
| `wreckingBall` | 5 | Wrecking ball, with GTA's weighted ball hook |
| `quarryCrane` | 6 | Quarry crane |
| `vegasCrane` | 7 | Vegas crane |
| `swat` | 8 | SWAT rappel line, the default |

## Types 1 to 7 need a holder

This is the one rule that will crash your server if you ignore it.

GTA's `CRope::Update` **dereferences the rope holder** during its force pass, so every native type except `swat` requires a valid physical holder element. Neon now refuses a rope that would hit that path, and the harness carries a dedicated missing-holder regression test.

`swat` is the only type that anchors to the world on its own.

The showcase handles it the practical way: three invisible client-local physical objects act as holders, and moving a holder is what makes a wrecking ball swing.

## Creating one

```lua
local rope = createRope(x, y, z, {
    type = "wreckingBall",
    length = 14,
    holder = holderObject,      -- required for every type except swat
    holderOffset = { 0, 0, -1 },
    physics = true,
})
```

`createRope(x, y, z [, options])` returns a `rope` element. Server-created ropes are synchronized; the client can also create local ones.

## Controlling a rope

Twenty-six functions exist on **both sides**, so a rope can be driven from wherever makes sense.

| Area | Functions |
| --- | --- |
| Type | [`getRopeType`](/neon/functions/getRopeType) / [`setRopeType`](/neon/functions/setRopeType) |
| Lifetime | [`getRopeDuration`](/neon/functions/getRopeDuration) / [`setRopeDuration`](/neon/functions/setRopeDuration), [`getRopeRemainingTime`](/neon/functions/getRopeRemainingTime) / [`setRopeRemainingTime`](/neon/functions/setRopeRemainingTime) |
| Anchoring | [`getRopeHolder`](/neon/functions/getRopeHolder) / [`setRopeHolder`](/neon/functions/setRopeHolder), [`getRopeHolderOffset`](/neon/functions/getRopeHolderOffset) / [`setRopeHolderOffset`](/neon/functions/setRopeHolderOffset) |
| Geometry | [`getRopeLength`](/neon/functions/getRopeLength) / [`setRopeLength`](/neon/functions/setRopeLength), [`getRopeWinchHeight`](/neon/functions/getRopeWinchHeight) / [`setRopeWinchHeight`](/neon/functions/setRopeWinchHeight), [`getRopeFixedNode`](/neon/functions/getRopeFixedNode) / [`setRopeFixedNode`](/neon/functions/setRopeFixedNode) |
| Motion | [`getRopeTopVelocity`](/neon/functions/getRopeTopVelocity) / [`setRopeTopVelocity`](/neon/functions/setRopeTopVelocity), [`isRopePhysicsEnabled`](/neon/functions/isRopePhysicsEnabled) / [`setRopePhysicsEnabled`](/neon/functions/setRopePhysicsEnabled), [`isRopeOnGround`](/neon/functions/isRopeOnGround) / [`setRopeOnGround`](/neon/functions/setRopeOnGround) |
| Cargo | [`getRopeCarriedElement`](/neon/functions/getRopeCarriedElement), [`attachElementToRope`](/neon/functions/attachElementToRope), [`detachElementFromRope`](/neon/functions/detachElementFromRope) |

Two more are client-only, because they read the live solver: [`getRopePositionAt`](/neon/functions/getRopePositionAt) returns an interpolated point along the rope, and [`isRopeActive`](/neon/functions/isRopeActive) reports whether the rope currently holds a native slot.

**Shortening the rope is how you lift.** The showcase hoists a crate and a Bobcat by attaching them and then reducing `setRopeLength`, rather than moving them directly.

## More ropes than GTA has slots

GTA has **eight** native rope slots. Neon does not stop you at eight.

A resource creates as many logical `rope` elements as it wants, and Neon **leases the eight native slots** to the ropes that need them. The harness proves this directly: twelve logical ropes running with no more than eight native leases at any moment.

`isRopeActive` is how a client asks whether a given rope currently holds one of those leases.

## Working with cargo

Attach an element and the native solver takes ownership of its motion. Two practical rules come out of the showcase:

**Unfreeze before attaching.** A frozen element makes the rope solver fight MTA's frozen state. Keep a payload frozen while it is a static prop, then unfreeze it right before `attachElementToRope`.

**Set the length deliberately.** A wrecking ball with a default length can initialise below terrain. The showcase explicitly shortens it so the ball hangs above the runway.

## Limits

- A rope holds at most **32 nodes**, so `fixedNode` accepts 0 through 30.
- Eight native slots, leased. Logical ropes beyond that exist but are not natively simulated at that moment.
- Every type except `swat` requires a physical holder.
- There are no rope events. State is read through the getters.
- The legacy `createSWATRope` path still works and coexists with managed ropes.

## Verification

`test-resources/rope-test` prints explicit `PASS` and `FAIL` lines. `/ropetest all` covers synchronized creation and destruction, type, duration, remaining time, fixed node, ground, winch height and velocity state, client reception of authoritative rope data, native activation and `getRopePositionAt` interpolation, holder and local-offset tracking, object and vehicle cargo, client-local ropes, server expiry, **twelve logical ropes against no more than eight native leases**, and coexistence with `createSWATRope`.

The missing-holder regression is its own case, added after that path was found to crash.

`test-resources/rope-showcase` is the cinematic: wrecking ball, mini magnet and harness demonstrated separately on the runway. Neither resource is auto-deployed; copy them into the server resources directory first.

Implementation: [`32d6ac731`](https://github.com/Dryxio/mtasa-neon/commit/32d6ac731).
