---
title: SkyGFX, radar, and client visuals
description: Neon's integrated PS2-style effects, Definitive Edition radar profile, and resource-owned visual overrides.
---

Neon packages a controlled SkyGFX bridge and a configurable radar renderer directly in the Windows client. Players do not need a separate ASI install, and servers can request temporary visual profiles without overwriting the player's saved settings.

## First-run visual profile

New Neon installs use a lightweight PS2-style profile by default:

- SkyGFX integration: **enabled**;
- PS2 color filter: **enabled**;
- YCbCr correction: **enabled**;
- PS2 depth bias: **enabled**;
- soft color-filter blur: **disabled**;
- PS2 radiosity: **disabled**;
- GTA heat haze: **disabled**;
- GTA motion blur: **disabled**.

Players can change these options in **Settings → SkyGfx**. This is still a selected MTA-compatible integration, not full SkyGFX and not a claim of exact PS2 parity.

## Available SkyGFX effects

| Option | What it changes |
| --- | --- |
| PS2 color filter | Replaces GTA's compatible PC color-filter pass with the integrated PS2-style pass. |
| Soft color-filter blur | Adds the softer blur used by the selected console-style filter. |
| Adapt PC timecycle values | Adjusts PC timecycle values before the PS2-style filter. |
| PS2 depth bias | Uses the integrated PS2-style depth-bias behavior. |
| YCbCr correction | Applies the selected console color-space correction after world rendering. |
| PS2 radiosity | Uses the integrated PS2-style radiosity path with configurable intensity and passes. |

Radiosity intensity accepts 1–255 and its filter/render pass counts accept 1–4. Higher settings are a visual choice, not a quality guarantee.

## Fullscreen device resets

The current release bridge uses **API v5**. Neon releases SkyGFX-owned Direct3D default-pool resources before a D3D9 reset and recreates them afterward, fixing the exclusive-fullscreen Alt-Tab reset failure that could previously leave GTA unresponsive when radiosity was active.

API v4 remains accepted for compatible legacy color processing, but published Neon builds pin the tested v5 bridge with the device lifecycle callbacks.

## Vanilla or Definitive Edition radar

The Neon radar settings offer two renderers:

- **Vanilla** — the normal GTA radar presentation with Neon's configurable layout;
- **Definitive Edition** — a widescreen-safe renderer backed by the bundled 144-tile texture archive.

Players can change radar position, width, height, and widescreen-safe behavior from the Neon settings. The client reports the effective HUD geometry instead of assuming the stock 4:3 layout.

## Resource-owned visual overrides

Client resources can read and temporarily override an allowlisted set of radar and SkyGFX options with [`getNeonClientSetting`](/neon/functions/getNeonClientSetting), [`setNeonClientSetting`](/neon/functions/setNeonClientSetting), and [`resetNeonClientSettings`](/neon/functions/resetNeonClientSettings).

```lua
setNeonClientSetting("radar.style", "definitive")
```

Useful setting names include:

- `radar.style`, `radar.position_x`, `radar.position_y`, `radar.width`, `radar.height`, `radar.widescreen_safe`;
- `skygfx.enabled`, `skygfx.color_filter`, `skygfx.color_filter_blur`, `skygfx.pc_timecycle`, `skygfx.depth_bias`, `skygfx.ycbcr`, `skygfx.radiosity`;
- `skygfx.radiosity_intensity`, `skygfx.radiosity_filter_passes`, `skygfx.radiosity_render_passes`;
- read-only `skygfx.status`.

Overrides are session-scoped and owned by the calling resource. They stack in application order, do not replace the player's saved preferences, and are removed automatically when the resource stops. A managed setting is shown read-only in the native UI until the override disappears.

## Evidence and limits

Commit [`7322b1d71`](https://github.com/Dryxio/mtasa-neon/commit/7322b1d71) added the first-run profile, resource-scoped SkyGFX overrides, and API v5 device-reset lifecycle. Commit [`fb8ee02c4`](https://github.com/Dryxio/mtasa-neon/commit/fb8ee02c4) added the Definitive Edition radar, layout controls, and the general Neon visual-setting bridge.

The integrated effects and radar renderer were built and checked in game. The documented scope does not imply complete SkyGFX parity across every weather, resolution, graphics mod, or hardware configuration.

For Project2DFX, pool sizes, CULL zones, and renderer diagnostics, continue with [Rendering and limits](/neon/rendering-and-limits).
