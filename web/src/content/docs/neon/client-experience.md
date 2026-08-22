---
title: Neon client experience
description: The GTA:SA-inspired menu, server discovery, connection flow, artwork, localization, and protocol handling added by Neon.
---

Neon includes its own GTA:SA-inspired client shell so players can discover and join servers without leaving the visual language of San Andreas. It sits above the existing MTA connection flow rather than replacing its protocol and validation rules.

![Neon main menu in the GTA:SA visual style, with browse servers, quick connect, map editor, settings, about and quit entries, and a Discord connected identity badge in the corner](/neon-media/neon-main-menu.jpg)

## Find and join a server

The server browser combines the public Neon registry with live ASE server data. Players can search and filter the list, keep favorites and recent servers, enter passwords, and follow join progress through cancellation, retry, and failure states.

Registry artwork and metadata are optional. Downloaded assets are validated, sanitized, cached, and replaced by normal fallback presentation when unavailable. Every listed server passed the registry source-IP and ASE publication flow; that is **not** a cryptographic attestation of the server binary or its resources.

![Neon server browser listing populated community servers with flags, ping and player counts, and a details panel with description, a copyable mtaneon:// server link, regions and languages](/neon-media/neon-server-browser.jpg)

## Publish or hide a server

A public ASE server publishes to the Neon registry by default with `<neon_registry>1</neon_registry>`. Set it to `0` to opt out. Server owners can add optional presentation fields in `mtaserver.conf`:

- `neon_registry_tagline` and `neon_registry_description`;
- `neon_registry_countries` and `neon_registry_languages`;
- `neon_registry_website` and `neon_registry_discord`;
- `neon_registry_logo`, `neon_registry_banner`, and a `#RRGGBB` `neon_registry_accent`.

Live player count, ping, game mode, map, and password state still come from ASE. Registry publication organizes discovery and optional presentation; it does not certify the server's binary or resources.

## GTA-style presentation with a fallback

The shell covers the offline menu, pause menu, GTA loading artwork, connection prompts, language controls, and the server list. Its UI text follows the selected client language. If the web shell cannot be used, Neon retains the existing CEGUI path rather than leaving the player without navigation.

The implemented flow has received build and targeted runtime work across startup, navigation, joining, localization, artwork, and cache behavior. The commits do not record one exhaustive clean-install matrix covering every DPI scale, aspect ratio, offline state, cache state, password outcome, and language combination.

## `mtaneon://` links

Neon owns the `mtaneon://` protocol registered by its Windows installer. Links are normalized through the client's existing validated connection parser, so they can open Neon and join a compatible endpoint. They do not replace official MTA's `mtasa://` links outside the Neon installation.

## Where it came from

Commit [`1ee69f008`](https://github.com/Dryxio/mtasa-neon/commit/1ee69f008) introduced the GTA-style shell, server browser, and public registry flow. Later commits refined startup and navigation, added localization, artwork and caching, and registered `mtaneon://` links. Those fixes support the workflow; they are not separate headline features.

For the optional account layer behind verified players and stronger bans, see [Neon Identity](/neon/identity). For installation and update behavior, see [Download and install](/neon/download).
