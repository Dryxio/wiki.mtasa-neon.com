---
title: Download and install
description: Download the latest matching MTA:SA Neon client and server builds.
---

The public packages below come from the latest Neon release that a maintainer explicitly published from `master`. Ordinary pushes and successful CI builds do not replace these downloads. Neon is experimental and is not affiliated with or endorsed by the Multi Theft Auto team.

## Choose the package you need

| You want to… | Download |
| --- | --- |
| Play on Windows | [MTA-Neon-Setup.exe](https://github.com/Dryxio/mtasa-neon/releases/latest/download/MTA-Neon-Setup.exe) |
| Host on Windows x64 | [MTA-Neon-Server-Windows-x64.zip](https://github.com/Dryxio/mtasa-neon/releases/latest/download/MTA-Neon-Server-Windows-x64.zip) |
| Host on Linux x64 | [MTA-Neon-Linux-Server-x64.tar.gz](https://github.com/Dryxio/mtasa-neon/releases/latest/download/MTA-Neon-Linux-Server-x64.tar.gz) |
| Host on Linux ARM64 | [MTA-Neon-Linux-Server-arm64.tar.gz](https://github.com/Dryxio/mtasa-neon/releases/latest/download/MTA-Neon-Linux-Server-arm64.tar.gz) |

[Open the latest release](https://github.com/Dryxio/mtasa-neon/releases/latest) to see its source commit, build run, publication time, and SHA-256 checksums.

## Install the Windows client

1. Download and run `MTA-Neon-Setup.exe`.
2. Select your existing Grand Theft Auto: San Andreas directory when asked.
3. Finish the wizard and start **MTA Neon** from its shortcut.

The installer contains the complete client payload and keeps Neon's install directory, shortcuts, protocol registration, and uninstall state separate from an official MTA installation. Run a newer installer over an existing Neon installation to update it while preserving its settings.

The CI workflow does not currently add a Neon Authenticode signature. Windows may therefore show an unknown-publisher or SmartScreen warning even when the file came from the release link above. Compare the download with `SHA256SUMS.txt` on the release page when you need to verify it.

The current Windows package includes the SkyGFX bridge and the x86 FMOD runtime used by Neon's optional rendering and vehicle-audio features. A player does not need to fetch those runtimes separately.

## Updates after installation

On a normal launch, Neon checks the latest explicitly published release through a signed manifest. If a newer version is available, the player can accept or postpone the update. An accepted update is downloaded, checked against the manifest's expected URL, size, tag, and SHA-256 hash, then opened after Neon closes cleanly.

The manifest uses an embedded Ed25519 public key. Ordinary pushes and pull requests still build for diagnostics, but they do not publish a player update; a maintainer must run the release workflow from `master` with publication enabled.

The updater implementation and endpoint query were checked during development. The recorded evidence does not cover one complete public install-and-upgrade run across every supported starting version, so the wiki does not describe that broader matrix as validated.

## Run the Windows server

1. Extract `MTA-Neon-Server-Windows-x64.zip` to a writable directory.
2. Edit `mods\deathmatch\mtaserver.conf`.
3. Start `MTA Server64.exe` from the extracted directory.
4. Allow the configured game and HTTP ports through the firewall. The default ports are `22003/UDP` and `22005/TCP`.

The server archive includes the runtime DLLs, configuration files, licenses, and standard resources required to start a new server. It is portable and does not install the Neon client.

## Keep client and server builds together

Client and server packages attached to one Latest publication were built from the same commit. Update both sides together when a server uses Neon-specific network protocols such as native-world startup or server-managed model identities. An older or ordinary MTA client may be rejected when it cannot satisfy the current protocol contract.

GitHub Actions artifacts are retained for developer diagnostics and older run inspection. Players and server owners should use the Release downloads above instead of choosing an `InstallFiles-*` artifact from a workflow run.
