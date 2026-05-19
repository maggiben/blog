---
title: "MediaPipe Hands: When Your Webcam Became a Skeleton Tracker"
subtitle: MediaPipe · Computer vision · CodePen
description: "In 2021 I forked Google's MediaPipe Hands demo into a CodePen—real-time hand landmarks, a 3D grid, and zero backend. Here's why it still feels like magic, how the pipeline works, and the live demo brought back to the blog."
date: 2026-05-19
published: true
language: en
coverImage: assets/cover.svg
tags:
  - mediapipe
  - computer-vision
  - javascript
  - typescript
  - codepen
  - creative-coding
codepen: https://codepen.io/maggiben/pen/MWvVYqy
---

![MediaPipe Hands — hand skeleton overlay and 3D landmark grid](assets/cover.svg)

**MediaPipe Hands**

---

There is a specific thrill in watching **your own hands** turn into geometry in real time—not a prerecorded clip, not a server round-trip, just the GPU, a webcam, and a loop that refuses to drop frames.

Back in November 2021 I published exactly that on CodePen: [**MediaPipe Hands**](https://codepen.io/maggiben/pen/MWvVYqy). It was a fork of Google's official sample, tightened into something I could share with a link and no install step. Green lines for the right hand, red for the left. A tiny **3D landmark grid** in the corner. Sliders for model complexity and confidence. Selfie mode, because everyone tests these things in front of a laptop camera.

Years later, computer vision moved on—bigger models, WASM bundles, hand landmarkers in new APIs—but the pen still does the thing that hooked me: **perception as a live UI**.

## Try it in the frame below (camera required)

Allow webcam access when your browser prompts you. Use the control panel inside the frame—**Selfie Mode**, hand count, model complexity, confidence sliders—then wave at the camera. Chrome desktop is still the sweet spot; other browsers may work with different performance.

<div class="blog-embed">
  <iframe
    src="assets/demo/index.html"
    title="MediaPipe Hands — interactive hand tracking demo"
    loading="lazy"
    allow="camera; microphone; autoplay; fullscreen"
    allowfullscreen
  ></iframe>
</div>

<p><em>If the frame stays black, use <strong>Open in new tab</strong> inside the demo or open <a href="assets/demo/index.html">assets/demo/index.html</a> directly—some browsers only grant the camera outside a nested frame.</em></p>

<p><em>Original CodePen (2021): <a href="https://codepen.io/maggiben/pen/MWvVYqy">codepen.io/maggiben/pen/MWvVYqy</a>.</em></p>

**What you should see:** your video feed with 21 landmarks per hand, connectors drawn between joints, an FPS counter, and a control panel to flip selfie mode, raise `maxNumHands` to four, or trade accuracy for speed with model complexity.

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

**5. UX polish.** A spinner fades when the first frame lands (`body.loaded`). `device-detector-js` warns if you are not on Chrome—MediaPipe was picky in 2021 and honesty beat silent failure. Selfie mode mirrors the hidden `<video>` with `transform: scale(-1, 1)` so movement matches intuition.

## The stack (2021 edition)

- **[@mediapipe/hands](https://www.npmjs.com/package/@mediapipe/hands)** — 21 3D landmarks per hand, up to four hands
- **control_utils** — FPS readout, sliders, camera / image source picker
- **controls_3d** — `LandmarkGrid` for world coordinates
- **drawing_utils** — connectors and landmark circles on Canvas2D
- **device-detector-js** (ESM from esm.sh) — lightweight UA gate

The pen's parent on CodePen is Google's reference; mine kept the spirit and the **interactive panel** front and center.

## What I would change today

If I refreshed the project now:

- **Hand Landmarker** — MediaPipe's newer Tasks API is the maintained path; the classic `Hands` solution still works but is legacy territory.
- **HTTPS and permissions** — embeds need `allow="camera"` (included above); some readers will still need a top-level tab.
- **Mobile** — thermal throttling and smaller GPUs hurt; default `modelComplexity` to Lite on narrow viewports.
- **Privacy copy** — one line: frames stay local, nothing is uploaded. Obvious to us; not to every visitor.

None of that diminishes what 2021 felt like: **research-grade tracking as a front-end afternoon**.

## Source on this blog

The interactive frame above loads **[assets/demo/index.html](assets/demo/index.html)**—the same MediaPipe stack as the CodePen, in plain HTML and JavaScript so it ships with the post. Fork the sliders, break confidence thresholds, or open the file in a new tab if your browser withholds the camera inside the frame.

## The lesson I still keep

Not every experiment needs a monorepo. Some need a **camera, a canvas, and a link you send at midnight** because the result is too cool to keep on localhost.

MediaPipe Hands was that for me—a reminder that the browser is not only forms and fetch; it is a place where **geometry can follow your fingers** at sixty frames per second.

If you build something similar, fork the pen, break the sliders, and see how fragile confidence thresholds are. That is how you learn vision—not from a slide deck, but from watching landmarks jitter when the light is wrong.

---

*Original CodePen: [codepen.io/maggiben/pen/MWvVYqy](https://codepen.io/maggiben/pen/MWvVYqy) · Published November 2021 · Demo mirror: [assets/demo/index.html](assets/demo/index.html)*
