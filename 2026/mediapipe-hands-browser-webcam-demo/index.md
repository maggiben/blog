---
title: "MediaPipe Hands: When Your Webcam Became a Skeleton Tracker"
subtitle: MediaPipe · Computer vision · CodePen
description: "In 2021 I forked Google's MediaPipe Hands demo into a CodePen—real-time hand landmarks, a 3D grid, and zero backend. Here's why it still feels like magic and how the pipeline works."
date: 2026-05-19
published: true
language: en
coverImage: assets/cover.png
tags:
  - mediapipe
  - computer-vision
  - javascript
  - typescript
  - codepen
  - creative-coding
codepen: https://codepen.io/maggiben/pen/MWvVYqy
---

![MediaPipe Hands — live tracking with control panel and 3D landmark grid](assets/cover.png)

**MediaPipe Hands**

---

There is a specific thrill in watching **your own hands** turn into geometry in real time—not a prerecorded clip, not a server round-trip, just the GPU, a webcam, and a loop that refuses to drop frames.

Back in November 2021 I published exactly that on CodePen: [**MediaPipe Hands**](https://codepen.io/maggiben/pen/MWvVYqy). It was a fork of Google's official sample, tightened into something I could share with a link and no install step. Green lines for the right hand, red for the left. A tiny **3D landmark grid** in the corner. Sliders for model complexity and confidence. Selfie mode, because everyone tests these things in front of a laptop camera.

Years later, computer vision moved on—bigger models, WASM bundles, hand landmarkers in new APIs—but the pen still does the thing that hooked me: **perception as a live UI**.

## Try it live

Allow webcam access when the browser prompts you. The demo below is the same code as the [CodePen](https://codepen.io/maggiben/pen/MWvVYqy), embedded directly in this page—no iframe—so `getUserMedia` runs on this post’s origin. In the control panel, choose **Webcam** (or upload an image) to start; that click is the user gesture the browser needs before showing the permission dialog.

<link href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils_3d@0.3/control_utils_3d.css" crossorigin="anonymous" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils@0.6/control_utils.css" crossorigin="anonymous" />
<link rel="stylesheet" href="assets/demo/styles.css" />

<div class="blog-embed mediapipe-hands-demo" id="mediapipe-hands-demo">
  <div class="container">
    <video class="input_video" playsinline></video>
    <canvas class="output_canvas" width="1280" height="720"></canvas>
    <div class="loading">
      <div class="spinner"></div>
      <div class="message">Loading</div>
    </div>
    <a class="abs logo" href="https://developers.google.com/mediapipe" target="_blank" rel="noopener noreferrer">
      <span class="title">MediaPipe</span>
    </a>
    <div class="shoutout">
      <div>
        <a href="https://developers.google.com/mediapipe/solutions/vision/hand_landmarker" target="_blank" rel="noopener noreferrer">
          Click here for more info
        </a>
      </div>
    </div>
  </div>
  <div class="control-panel"></div>
  <div class="square-box">
    <div class="landmark-grid-container"></div>
  </div>
  <a class="open-tab" href="assets/demo/index.html" target="_blank" rel="noopener noreferrer">Open fullscreen</a>
</div>

<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils@0.6/control_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils_3d@0.3/control_utils_3d.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js" crossorigin="anonymous"></script>
<script type="module" src="assets/demo/app.js"></script>

<p><em>Camera still blocked? Open <a href="assets/demo/index.html" target="_blank" rel="noopener noreferrer">the fullscreen demo</a> or the <a href="https://codepen.io/maggiben/pen/MWvVYqy" target="_blank" rel="noopener noreferrer">CodePen archive</a>. Requires HTTPS (or localhost).</em></p>

**What you should see:** your video feed with 21 landmarks per hand, connectors between joints, an FPS counter, and the 3D grid in the corner—like the capture above.

## Why this pen mattered to me

Before every product had "AI" in the subtitle, **MediaPipe** was the quiet proof that serious vision could run **in the tab**. No Python server. No frame upload. The model weights loaded from a CDN; `hands.send({ image })` did the rest.

CodePen was the perfect showroom:

| Piece | Role |
|-------|------|
| **TypeScript** | Types for `Results`, options, and landmark arrays—small safety net on a demo that would otherwise rot |
| **SCSS** | Nested layout for fullscreen canvas, loading spinner, corner grid |
| **CDN scripts** | `@mediapipe/hands`, drawing utils, control panel, 3D grid—same stack Google documented |
| **Instant share** | One URL for recruiters, friends, or future me who forgot this existed |

I did not invent hand tracking. I **curated** it: kept the 3D grid, wired device detection, left the sliders that make the demo feel like a lab bench instead of a GIF.

## What is running under the hood

The flow is the classic MediaPipe pattern—predictable once you have seen it once, addictive forever:

```
webcam frame → Hands.send(image) → onResults → canvas 2D + 3D grid
```

**1. Model load.** `Hands` resolves WASM and model files from jsDelivr using `locateFile` and the package `VERSION`—so the pen tracks whatever `@mediapipe/hands` version CodePen pins.

**2. Per-frame inference.** The control panel's `SourcePicker` grabs camera frames, resizes the canvas to the viewport aspect ratio, and awaits `hands.send({ image })`.

**3. 2D overlay.** In `onResults`, the code clears the canvas, draws the camera image, then for each detected hand:

- Classifies **left vs right** (`multiHandedness`)
- Draws connectors along `HAND_CONNECTIONS`
- Draws landmarks with depth-aware radius via `drawingUtils.lerp` on `z`—joints closer to the camera read slightly larger

Right hand: green strokes, red fills. Left hand: the inverse. Small choice; big readability when both hands overlap.

**4. 3D world landmarks.** The corner grid is the clever bit. `updateLandmarks` only accepts **one** merged landmark list, but you may have two hands. The pen **concatenates** world-space points and **offsets** connection indices so finger bones still line up:

```javascript
const offset = loop * mpHands.HAND_CONNECTIONS.length;
const offsetConnections = mpHands.HAND_CONNECTIONS.map((connection) => [
  connection[0] + offset,
  connection[1] + offset,
]);
```

That is the kind of glue code tutorials skip and demos need.

**5. UX polish.** A spinner fades when the first frame lands (`body.loaded`). The blog build logs a console warning on non-Chrome browsers—MediaPipe was picky in 2021 and honesty beat silent failure. Selfie mode mirrors the hidden `<video>` with `transform: scale(-1, 1)` so movement matches intuition.

## The stack (2021 edition)

- **[@mediapipe/hands](https://www.npmjs.com/package/@mediapipe/hands)** — 21 3D landmarks per hand, up to four hands
- **control_utils** — FPS readout, sliders, camera / image source picker
- **controls_3d** — `LandmarkGrid` for world coordinates
- **drawing_utils** — connectors and landmark circles on Canvas2D
- **User-agent check** — lightweight console warning for non-Chrome browsers

The pen's parent on CodePen is Google's reference; mine kept the spirit and the **interactive panel** front and center.

## What I would change today

If I refreshed the project now:

- **Hand Landmarker** — MediaPipe's newer Tasks API is the maintained path; the classic `Hands` solution still works but is legacy territory.
- **HTTPS and permissions** — the demo is inline HTML on the post page; your markdown pipeline must allow `<script>` and `<link>` (rehype-raw or equivalent). Camera access needs HTTPS and a user gesture (pick **Webcam** in the panel).
- **Mobile** — thermal throttling and smaller GPUs hurt; default `modelComplexity` to Lite on narrow viewports.
- **Privacy copy** — one line: frames stay local, nothing is uploaded. Obvious to us; not to every visitor.

None of that diminishes what 2021 felt like: **research-grade tracking as a front-end afternoon**.

## The lesson I still keep

Not every experiment needs a monorepo. Some need a **camera, a canvas, and a link you send at midnight** because the result is too cool to keep on localhost.

MediaPipe Hands was that for me—a reminder that the browser is not only forms and fetch; it is a place where **geometry can follow your fingers** at sixty frames per second.

If you build something similar, fork the pen, break the sliders, and see how fragile confidence thresholds are. That is how you learn vision—not from a slide deck, but from watching landmarks jitter when the light is wrong.

---

*CodePen: [codepen.io/maggiben/pen/MWvVYqy](https://codepen.io/maggiben/pen/MWvVYqy) · Demo source: [assets/demo/](assets/demo/) · Published November 2021*
