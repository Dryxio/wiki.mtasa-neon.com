---
title: Dynamic object physics
description: Opt an MTA object into GTA's own rigid-body physics, with position, rotation and both velocities synchronized across clients.
sidebar:
  order: 10
---

An MTA object normally sits where you put it. GTA has a full rigid-body simulation for its own physical objects, but `createObject` never used it.

Neon lets a server **opt an object into that native physics**. It falls, collides, rebounds, rolls down slopes and keeps spinning, and the resulting motion is synchronized rather than being flattened by object sync.

<video controls muted loop playsinline preload="metadata"
       poster="/neon-media/object-physics-poster.jpg"
       style="width:100%;height:auto;border-radius:.5rem;">
  <source src="/neon-media/object-physics-showcase.mp4" type="video/mp4" />
  Your browser cannot play this clip. It shows basketballs bouncing off walls,
  rolling down slopes and scattering across a street under GTA's own physics.
</video>

## Turning it on

```lua
-- server
local ball = createObject(2114, x, y, z)
setObjectDynamicPhysics(ball, true)

setElementVelocity(ball, 12, 0, 3)
setElementAngularVelocity(ball, 0, 0.4, 0)
```

Two functions, both server-side:

| Function | Purpose |
| --- | --- |
| [`setObjectDynamicPhysics`](/neon/functions/setObjectDynamicPhysics) | Opt an object into or out of native physics |
| [`isObjectDynamicPhysics`](/neon/functions/isObjectDynamicPhysics) | Report whether an object is currently physical |

The OOP form is `object:setDynamicPhysics(true)`, `object:isDynamicPhysics()` and the `object.dynamicPhysics` property.

Once physics is on, `setElementVelocity` and `setElementAngularVelocity` set real motion instead of being overwritten on the next sync tick.

## Tuning the feel

There is no separate physics-tuning API. A physical object uses **GTA's own object properties**, so the existing `setObjectProperty` surface applies: mass, turn mass, air resistance and elasticity are what change how a ball bounces versus how a crate slides.

That is deliberate. The object behaves like a native GTA physical object because it *is* one, so its tuning knobs are the ones GTA already has.

## What gets synchronized

The syncer sends position, rotation, **linear velocity and angular velocity**. That last pair is the point: a spinning, rolling object keeps its motion when ownership moves to another client, instead of snapping to a resting position and starting again.

The harness checks this directly: with two clients watching the same object, a syncer change should produce no visible reset, and streaming an object out and back in should preserve position, velocity and the physics flag.

## Collision is your responsibility

**Dynamic physics does not generate collision.** It simulates whatever collision the model already has.

A model with no useful collision will not behave, and the reference harness makes this explicit: it replaces model 2114's collision with one explicit sphere before enabling physics, because a sphere is what makes a ball roll correctly.

That pairs naturally with [runtime collision generation](/neon/runtime-collision), which builds the collision shape from a Lua table.

## Limits

- **The switch is server-side.** Clients simulate, but a resource enables physics from the server.
- No collision is generated for you. See above.
- Physics applies to MTA-owned objects created with `createObject`. GTA's own props are a different system, covered by [scriptable dynamic objects](/neon/world-objects).

## Verification

`test-resources/dynamic-object-physics-harness` covers the low-level behavior. `/dophys` spawns a ball that must fall, collide, rebound and settle. `/dothrow [speed] [up]` relaunches it with linear and angular velocity, which must stay live rather than being overwritten by object sync. `/dostatus` prints server-side physics and velocity state to compare against the client overlay.

The manual checks that matter most are the two sync ones: walking or driving into the object should produce a physical reaction, and with two clients the syncer change should transfer position, rotation and both velocities without a visible reset.

Implementation: [`d3d1f2bdc`](https://github.com/Dryxio/mtasa-neon/commit/d3d1f2bdc).
