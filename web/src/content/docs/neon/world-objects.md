---
title: Scriptable dynamic objects
description: GTA-owned dynamic world objects exposed to client Lua as worldobject elements, with live transforms, damage and break events, and GTA keeping physics ownership.
sidebar:
  order: 3
---

San Andreas is full of dynamic props that MTA has never exposed to scripts: cardboard boxes, crates, bins, street clutter, breakable furniture. They are created by GTA's own IPL/streaming path, simulated by GTA physics, and were invisible to Lua.

Neon publishes them as read/write client elements of type **`worldobject`**. GTA keeps physics ownership. Lua observes the real object and can react to it.

<video controls muted loop playsinline preload="metadata"
       poster="/neon-media/world-objects-poster.jpg"
       style="width:100%;height:auto;border-radius:.5rem;">
  <source src="/neon-media/world-objects-showcase.mp4" type="video/mp4" />
  Your browser cannot play this clip. It shows a cardboard box bound to a
  <code>worldobject</code> element, with live coordinates, damage feedback, and a push objective.
</video>

The clip runs `test-resources/world-object-scripting-harness`: a native box is bound to a `worldobject`, a halo and 3D label track it, the player and a vehicle push it, and damage/break events are logged. The object is never moved from Lua. GTA physics drives it while Lua reads the transform each frame.

## What a `worldobject` is

Nothing to place, spawn, or configure: every dynamic prop San Andreas already streams around the player is a `worldobject` the moment a resource looks for one. A single `getElementsByType` call reaches the map's whole existing prop population.

One element per **persistent** GTA object, not per streamed instance.

- Neon scans GTA's object pool every frame and adopts each entry that is a real world object: entity type object, an `OBJECT_GAME` type byte, and a linked persistent dummy.
- Element identity is the dummy, so the **same Lua element survives stream-out and stream-in**. GTA recycles object-pool addresses, and Neon only reuses a cached proxy when the dummy identity still matches.
- Objects created by MTA (`createObject`) are excluded. `CObject::Init` writes `OBJECT_GAME`, while MTA's own objects overwrite the same byte with `OBJECT_MISSION2`. Temporary and flying components are excluded by the same test.
- Every proxy is parented to the client root and is a **system entity**: `destroyElement` cannot remove it. GTA owns the lifetime.
- Proxies exist only while the game is actually playing. Leaving the playing state clears them.

## Reading the live transform

`getElementPosition`, `getElementRotation` and `getElementMatrix` read GTA's live matrix on every call, so values track physics without any Lua-side interpolation.

```lua
for _, object in ipairs(getElementsByType("worldobject")) do
    local x, y, z = getElementPosition(object)
    local rx, ry, rz = getElementRotation(object)
    outputDebugString(("worldobject at %.2f %.2f %.2f (rot %.1f %.1f %.1f)")
        :format(x, y, z, rx, ry, rz))
end
```

The element carries its model internally, but `getElementModel` does not currently accept a `worldobject` and returns `false`. Read the model from the `model` argument of the damage and break events instead.

When an object streams out, GTA's `ConvertToDummyObject` copies the final matrix back onto the persistent dummy. Neon then reads the dummy, so the element keeps reporting a truthful last-known transform instead of going stale or erroring.

Rotation uses the same ZXY decomposition as `CClientObject`, so a native object and an MTA object report orientation in one convention.

## Writing the transform

`setElementPosition`, `setElementRotation` and `setElementMatrix` write into GTA's matrix and refresh the RenderWare frame.

```lua
-- Rotate a native object 30 degrees around Z
local rx, ry, rz = getElementRotation(object)
setElementRotation(object, rx, ry, rz + 30)
```

This is a direct transform edit, not a physics impulse. GTA continues to simulate the object from its new transform on the next frame, so a moved object can immediately fall, settle, or roll. Let GTA move the object and read the result rather than fighting the solver from Lua every frame.

## Damage and break events

Both events are cancellable. Cancelling suppresses the native damage or break inside `CObject::ProcessDamage` / `CObject::ProcessBreak`.

```lua
addEventHandler("onClientWorldObjectDamage", root,
function(loss, attacker, model, x, y, z)
    -- source is the worldobject element
    outputChatBox(("hit %d for %.1f"):format(model, loss))

    -- Make one crate indestructible
    if model == 1230 then
        cancelEvent()
    end
end)

addEventHandler("onClientWorldObjectBreak", root,
function(attacker, model, x, y, z)
    createExplosion(x, y, z, 4)
end)
```

| Event | Parameters | Notes |
| --- | --- | --- |
| `onClientWorldObjectDamage` | `float loss, element attacker, int model, float x, float y, float z` | `attacker` is `nil` when GTA cannot resolve the damaging entity to an MTA element. Cancelling blocks the health loss. |
| `onClientWorldObjectBreak` | `element attacker, int model, float x, float y, float z` | Fires for the collision-damage effects GTA treats as breakable. Cancelling blocks the break. |

`onClientElementStreamIn` and `onClientElementStreamOut` also fire on the proxy when GTA creates or converts away the streamed object. They carry no extra arguments; the element is `source`.

Damage and break events are raised even for an object Neon has not adopted yet during a pool scan. The handler adopts it on demand, so the first hit on a freshly created object is not lost.

## A minimal gameplay example

The harness ships a small push objective, which is the shortest useful demonstration: place a goal, let GTA physics move the object, and win when the live transform enters the goal.

```lua
local target, goal = nil, nil

addEventHandler("onClientRender", root, function()
    if not target or not isElement(target) or not goal then return end

    local x, y, z = getElementPosition(target)
    if getDistanceBetweenPoints3D(x, y, z, goal.x, goal.y, goal.z) < 2.5 then
        outputChatBox("OBJECT DELIVERED!")
        goal = nil
    end
end)

function setObjective(object, gx, gy, gz)
    target, goal = object, { x = gx, y = gy, z = gz }
end
```

Nothing in that loop moves the object. The player pushes it on foot or with a vehicle, GTA resolves the physics, and Lua only reads the result.

## Before you build on it

Four things change how you write against `worldobject`:

- **It is client-side only.** There is no server element, no synchronization, and no server-side event. Two players see their own copies of the same native prop. Anything shared has to be relayed by your resource.
- **It is not an MTA `object`.** Functions that require a real `object` element reject it, and it cannot be destroyed, respawned, recreated, or attached.
- **Read/write covers the transform.** Object health, collision-damage effect, and break state are not properties yet. Damage is observed through the events instead.
- **`getElementModel` returns `false` for it.** The model reaches Lua through the `model` argument of the damage and break events.

## Verification

`test-resources/world-object-scripting-harness` is a client-only showcase and validation resource. It covers proxy discovery and listing, live transform tracking under player and vehicle pushes, damage and break feedback, matrix read/write, refusal of `destroyElement`, the push objective, and the lifetime test: select an object, stream it out by walking away, return, and confirm the same element reports `STREAM OUT … [TARGET PRESERVED]` then `STREAM IN … [SAME TARGET]`.

The resource is not auto-deployed. Copy it into the server resources directory before starting it.

Implementation: [`22e8a3a40`](https://github.com/Dryxio/mtasa-neon/commit/22e8a3a40).
