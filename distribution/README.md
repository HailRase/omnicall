# Axatalk

**Desktop SIP softphone for Windows, macOS, and Linux.**

Register on your PBX, place and receive calls, and manage your account from a focused desktop client.

---

## About Axatalk

Axatalk is an enterprise-oriented softphone for operators and knowledge workers who need reliable SIP telephony on the desktop. It supports SIP registration, inbound and outbound calls, account settings, and in-app update checks.

This repository does **not** contain application source code. It hosts public distribution artifacts only.

---

## What This Repository Contains

| Item | Purpose |
| --- | --- |
| [`README.md`](README.md) | Installation and update guidance |
| [`update-manifest.json`](update-manifest.json) | Version metadata for in-app update checks |
| [`CHANGELOG.md`](CHANGELOG.md) | Public release history (English) |
| [**GitHub Releases**](https://github.com/HailRase/axatalk-releases/releases) | Signed-off installers per version |

---

## Downloads

**Latest release:** [github.com/HailRase/axatalk-releases/releases/latest](https://github.com/HailRase/axatalk-releases/releases/latest)

| Platform | File | Notes |
| --- | --- | --- |
| Windows | `Axatalk-<version>-win-x64.exe` | Recommended for most users |
| Windows (IT) | `Axatalk-<version>-win-x64.msi` | Suitable for managed deployment |
| macOS (Apple Silicon) | `Axatalk-<version>-mac-arm64.dmg` | Drag to Applications |
| Linux | `Axatalk-<version>-linux-x86_64.AppImage` | **Recommended** — no install step |
| Linux (Debian/Ubuntu) | `Axatalk-<version>-linux-amd64.deb` | Install via terminal (see below) |

### Linux installation notes

**`.deb` packages:** GUI installers on some distributions are unreliable. Use the terminal:

```bash
cd ~/Downloads
sudo apt install ./Axatalk-*-linux-amd64.deb
```

**AppImage:**

```bash
chmod +x Axatalk-*-linux-x86_64.AppImage
./Axatalk-*-linux-x86_64.AppImage
```

### First launch

1. Open **Axatalk**.
2. Wait for the application to finish loading.
3. Open **Settings → Account**.
4. Enter your SIP credentials and WebSocket server (`wss://…`).
5. Select **Authorize**.

---

## Release Notes

Each [GitHub Release](https://github.com/HailRase/axatalk-releases/releases) includes structured notes: highlights, added features, changes, and fixes.

A full version history is also available in [`CHANGELOG.md`](CHANGELOG.md).

---

## Updates

Axatalk checks for updates using [`update-manifest.json`](update-manifest.json) on the `main` branch of this repository.

- **In the app:** Settings → General → About → **Check for updates**
- When a newer version is available, the app opens the latest release download page
- Updates are **manual** — the app does not auto-install new versions

The manifest exposes `latestVersion`, `downloadUrl`, per-platform installer URLs, and a link to release notes.

---

## Support / Feedback

- **PBX and SIP account setup** — contact your telephony administrator
- **Client installation** — use this page and the [Releases](https://github.com/HailRase/axatalk-releases/releases) page
- **Product issues** — report through your organization's Axatalk support channel

---

## Source Code

Application source code is maintained separately and is not published in this repository. This repo is for installers, update metadata, and release documentation only.
