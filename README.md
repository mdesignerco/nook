<div align="center">

<img 
  src="https://raw.githubusercontent.com/mdesignerco/nook/main/src-tauri/icons/128x128.png"
  alt="Nook"
  width="72"
/>

# Nook

<br/>

<!-- HERO SHOWCASE — full-width cinematic shot or video -->
<!-- ![Hero[❤️](your-hero-url) -->
<img width="1920" height="1080" alt="Nook Hero" src="https://github.com/user-attachments/assets/22041f25-a69e-457d-80d9-7dfbfbed2d29" />

</div>

---

Nook makes your Windows desktop feel alive.

Every transition is a physics simulation.
Every element responds to touch.
Every pixel is in motion.

Your desktop has been asleep for years.
This wakes it up.

---

## The Island

<!-- SHOWCASE: GIF or short clip — Island expanding, cycling through modes (3-5s) -->
<!-- ![Island Demo[❤️](your-island-gif-url) -->

<p align="center">
  <img width="430" height="70" alt="Nook Island" src="https://github.com/user-attachments/assets/0d723558-9df4-4214-b20e-4a1f97eb1f22" />
</p>

A notch at the top of your screen that adapts to what you're doing.

Scroll or swipe to switch modes.
Watch it transform.

**Music** — album art, track info, playback controls. A visualizer that reacts to five frequency bands with spring physics. It moves when the music plays.

<!-- SHOWCASE: GIF — music mode reacting to a song -->
<!-- ![Music Visualizer[❤️](your-music-gif-url) -->

**Command Center** — WiFi, Bluetooth, Do Not Disturb, volume, brightness. Everything you usually dig through settings for.

<!-- SHOWCASE: GIF — command center toggling controls -->
<!-- ![Command Center[❤️](your-command-center-gif-url) -->

**Status** — Battery, weather. Your desktop, summarized.

**Calendar** — A month view with a Pomodoro timer. Focus without switching apps.

Each transition is spring-loaded.
Width, height, border-radius, position — all animate independently.
It feels mechanical. In a good way.

---

<!-- The Dock section was intentionally removed on 2026-10-01. Kept as a note in case
     it returns. Showcase image used:
     https://github.com/user-attachments/assets/96229f0e-1246-4baf-b8ad-3e8f77142a12 -->

## Under the Hood

<!-- SHOWCASE: Optional — architecture diagram or visual of the 5-window system -->
<!-- ![Architecture[❤️](your-arch-url) -->

A Rust backend that speaks directly to the Windows shell.

Global hooks intercepting keys before Windows sees them.
WASAPI capturing system audio in real-time.
COM controlling your media sessions.
WMI monitoring your hardware.

The whole thing sleeps when you don't need it.
The audio visualizer pauses when nothing's playing.
The cursor monitor hides when the dock is gone.
Thumbnails only refresh on focus.

It's fast because it has to be.

---

<!-- SHOWCASE: Full-width cinematic video or GIF montage -->
<!-- ![Nook Montage[❤️](your-montage-url) -->

---

## 🛡️ Microsoft Defender

Some users may see a Microsoft Defender warning when installing Nook.

The executable was submitted directly to Microsoft for analysis. Microsoft reviewed the file and confirmed that it **does not meet their criteria for malware or potentially unwanted applications**, and **the detection has been removed**.

<p align="center">
  <img width="800" alt="Microsoft Security Intelligence" src="https://github.com/user-attachments/assets/67ddddde-9c68-4338-a0f2-c5645e416514" />
</p>

<details>
<summary>Still seeing the detection?</summary>

Your system may still have the previous Defender signature cached. Microsoft recommends updating your Defender security intelligence.

Open **Command Prompt as Administrator** and run:

```cmd
cd "C:\Program Files\Windows Defender"
MpCmdRun.exe -removedefinitions -dynamicsignatures
MpCmdRun.exe -SignatureUpdate
```

</details>

## Get It Running

**Download** the latest build from [Releases[❤️](https://github.com/mdesignerco/nook/releases/latest).

Or build from source:

```bash
git clone https://github.com/mdesignerco/nook.git
cd nook
bun install
bun run tauri dev
```

You'll need [Rust[❤️](https://rustup.rs/) and [Bun[❤️](https://bun.sh/). That's it.

---

## Contributing

Nook is open source.
Found a bug? Open an issue.
Have an idea? Send a PR.
Want to just say it's cool? A star goes a long way.

Licensed under [GPLv3[❤️](LICENSE).

---

<div align="center">

**Your desktop is waiting.**

</div>

---

Made with ![heart](https://mdesigner.co/wp-content/uploads/2026/04/heart_mdesigner.webp) by [mdesigner.co](https://mdesigner.co/)
