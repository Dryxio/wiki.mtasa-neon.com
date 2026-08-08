---
title: SkyGFX and PS2-style visuals
description: Enable Neon's selected SkyGFX effects, understand what each option changes, and see the current compatibility limits.
---

Neon can give San Andreas a more console-like image without asking players to install a separate ASI mod. The Windows client packages a controlled SkyGFX bridge and exposes the effects that have been integrated with MTA so far.

The integration is **off by default**. It changes only the local player's rendering and does not affect server logic, synchronization, or other players' settings.

<!-- MEDIA PLACEHOLDER: SkyGFX disabled/enabled comparison. Suggested files: /neon-media/skygfx-off.webp and /neon-media/skygfx-on.webp. Capture the same camera, time, weather, resolution, brightness, and display settings. A desktop two-column comparison should stack cleanly on mobile. -->

## Turn it on

1. Open **Settings** in the Neon client.
2. Select the **SkyGfx** tab.
3. Enable **SkyGfx**, then choose the effects you want.
4. Press **OK**. Changes apply immediately.

The status line reports whether the packaged bridge is active, missing, incompatible, or failed to initialize. A normal clean installation starts with the integration disabled even though its runtime is present.

## Available effects

| Option | What it changes |
| --- | --- |
| PS2 color filter | Replaces GTA's PC color-filter pass with the integrated PS2-style pass. |
| Soft color-filter blur | Adds the softer blur used by the selected console-style filter. |
| Adapt PC timecycle color values | Adjusts the PC timecycle values before the PS2-style filter so the result is not graded twice. |
| PS2 depth-bias precision | Uses the integrated PS2-style depth-bias behavior for affected rendering. |
| Console YCbCr color correction | Applies the selected console color-space correction as the final world post-effect. |
| PS2 radiosity glow | Replaces the compatible radiosity calls with the integrated PS2-style glow. |

Radiosity exposes four intensity presets — 24, 35, 48, and 64 — plus one to four blur and composite passes. Higher values are a visual preference, not a quality or performance guarantee.

<!-- MEDIA PLACEHOLDER: Radiosity intensity/passes. Suggested file: /neon-media/skygfx-radiosity.webp or a short WebM. Use a bright night scene or sunset where the difference is clear, and include the selected settings in the caption. -->

## Scope and compatibility

This is a selected MTA-compatible integration, not the complete SkyGFX renderer and not a claim of exact PS2 parity. Neon currently exposes the color filter, soft blur, PC-timecycle adaptation, depth-bias precision, radiosity, and YCbCr paths described above.

The bridge is Windows/Direct3D-specific. It uses API version 4 and refuses incompatible bridge builds. If another component has already modified one of the guarded GTA call sites, Neon leaves that effect disabled instead of overwriting an unknown owner. If a color-filter or radiosity dispatch fails during a frame, Neon falls back to GTA's vanilla pass for that frame; a failed YCbCr pass is skipped.

## Evidence

Commit [`6cbc7b4ec`](https://github.com/Dryxio/mtasa-neon/commit/6cbc7b4ec) introduced the selected PS2 color, blur, timecycle, depth-bias, and radiosity paths. Commit [`7ff70b729`](https://github.com/Dryxio/mtasa-neon/commit/7ff70b729) added YCbCr correction. The bridge and affected client projects built, and the color, radiosity, and later YCbCr paths were checked in game. This does not establish exhaustive parity across every weather, resolution, shader, or graphics mod.

Commit [`0464ee0c1`](https://github.com/Dryxio/mtasa-neon/commit/0464ee0c1) packages `skygfx_mta.dll` with public Windows installs, so players do not need a separate bridge download.

For Project2DFX, pool sizes, CULL zones, and renderer diagnostics, continue with [Rendering and limits](/neon/rendering-and-limits).
