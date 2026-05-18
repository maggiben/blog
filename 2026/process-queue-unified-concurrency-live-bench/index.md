---
title: "process-queue: One Million Operations, Full Control While It Runs"
subtitle: process-queue
description: "I built process-queue to merge promise concurrency limiting with queue lifecycle controls—and a live bench that enqueues a million tasks in the browser. Strengths, honest limits, and a demo you can poke."
date: 2026-05-18
published: true
coverImage: assets/cover.png
tags:
  - typescript
  - concurrency
  - open-source
  - javascript
  - performance
repo: https://github.com/maggiben/ProcessQueue
---

**process-queue**

---

Most async utilities ask you to pick a lane: **limit parallel promises** (the `p-limit` world) or **run a queue with pause, batch, and callbacks** (the classic QueueManager world). Real apps need both—a crawl of images with backpressure *and* a button that says pause.

[**process-queue**](https://github.com/maggiben/ProcessQueue) is my attempt to merge those lanes into one TypeScript-first class: `limit` / `map` / `enqueue` on one side; `pause` / `resume` / `next` / `clear` / `drain` on the other—with **runtime** knobs for `concurrency`, `delay`, and `batch`. No runtime dependencies. MIT licensed.

To prove it is not only true in unit tests, I shipped a **live bench** on Vercel.

## Try the live bench

The demo runs a real `ProcessQueue` instance in your browser—same package the app imports from source. Load a million tasks, drag concurrency, hit `pause()`, watch throughput climb.

<div class="blog-embed">
  <iframe
    src="https://process-queue.vercel.app/"
    title="process-queue live bench on Vercel"
    loading="lazy"
    allowfullscreen
  ></iframe>
</div>

<p><em>If the embed does not load, open <a href="https://process-queue.vercel.app/">process-queue.vercel.app</a> in a new tab.</em></p>

The headline on the page is deliberate: **“One million operations. Full control while it runs.”** That is the promise—bounded parallelism you can steer mid-flight, not a fire-and-forget `Promise.all` that eats the tab.

## Why I built it

I kept reaching for two patterns in the same codebase:

1. **“Run at most N at a time”** — API calls, file chunks, worker-style tasks.  
2. **“Process this backlog with rules”** — pause for maintenance, clear on cancel, batch dequeue, retry a failed item.

Copy-pasting `p-limit` plus a home-grown queue always drifted. One place updated concurrency; the other did not. One had `drain()`; the other used ad-hoc counters.

`ProcessQueue` is the unified type I wanted:

```ts
import { ProcessQueue } from "process-queue";

const queue = new ProcessQueue({ concurrency: 4, batch: 8 });

await queue.limit(async (id: number) => fetchItem(id), 42);
queue.addEach(items);
queue.pause();
queue.update({ concurrency: 64 });
queue.resume();
await queue.drain();
```

## Strengths (what it does well)

### 1. Hybrid API without a second dependency

| You need… | Reach for… |
|-----------|------------|
| `p-limit`-style tasks | `limit()`, `enqueue()`, `map()` |
| QueueManager-style items | `add()`, `addEach()`, `each()`, `complete()` |
| Backpressure + lifecycle | `pause()`, `resume()`, `next()`, `clear()`, `drain()` |
| Observability | `metrics()`, `activeCount`, `pendingCount` |

### 2. Runtime control

Concurrency is not only a constructor argument—you can `update({ concurrency, delay, batch })` or assign `queue.concurrency = 64` while work is in flight. The live bench wires every slider to `update()` so you feel the scheduler respond.

`delay` supports throttling between dispatch cycles; `delay: -1` switches to **manual** stepping via `next()`—useful when you want explicit control (and documented in the README).

### 3. Practical extras

- **Priority enqueue** — `enqueue(task, { priority: true })` pushes to the front.  
- **AbortSignal** — cancelled tasks reject without wedging the queue.  
- **`maxQueueSize`** — optional cap with `QueueCapacityError`.  
- **Retry hook** — `each()` handler can `return true` to re-queue an item (demo uses this for a one-shot retry path).  
- **`rejectOnClear`** — pending promises reject on `clear()` when you need hard cancellation semantics.

### 4. Implementation choices that matter at scale

- Pending work sits in a **deque** (`push` / `shift` / `pushFront`)—not a shifting array.  
- Dispatch uses `queueMicrotask` when `delay <= 0` so bursts do not synchronously starve the UI thread.  
- The million-task demo does **not** enqueue one million separate UI updates blindly—it batches enqueues (`ENQUEUE_CHUNK = 5000`) and groups **20 logical ops per task** so the bench stresses the scheduler without pretending every app should spawn 1e6 promises naively.

### 5. Discipline around quality

- **Vitest** unit, integration, reliability, and performance smoke tests.  
- **ESLint + strict TypeScript**; `prepublishOnly` runs lint, typecheck, test, build.  
- **Zero production dependencies** in the package itself.

## Weaknesses (honest limits)

No library is free lunch. These are the tradeoffs I would tell a teammate before adopting:

### 1. It is not a distributed queue

Everything is **in-process** (Node or browser). No Redis, no persistence, no cross-tab leader election. For background jobs across machines, you still want BullMQ, SQS, or similar.

### 2. `map()` is not a streaming map

`map(iterable, mapper)` builds an array of `limit()` promises and `Promise.all`s them. Fine for thousands of items; for millions, you will allocate millions of promises unless you chunk at the call site—exactly what the bench teaches.

### 3. `addEach` is convenient, not magical

Each item becomes a queued entry. Dumping a huge array without chunking can stress memory. The API is honest; the caller owns batching strategy.

### 4. `indexOf` is linear

It walks pending entries. Fine for moderate queues; not a database index.

### 5. Mental model overlap

If you only need a tiny `p-limit` clone, this package is **more API surface than you need**. The value appears when you also want pause/clear/drain/metrics—or when you are tired of two abstractions diverging.

### 6. Breaking by design

The README states migration from legacy QueueManager / `p-limit` setups is **intentionally breaking**. You adopt the hybrid model, not a drop-in alias.

### 7. Young project

The repo is new; battle-testing happens in your app and in the bench—not a decade of npm downloads. Treat v1 as “solid tests + clear API,” not “industry default.”

## What the bench is proving

The Vite + React UI is a **teaching instrument**:

- **Load 1,000,000 tasks** — chunked enqueue, bundled ops per task, progress and throughput meters.  
- **Runtime sliders** — concurrency (default 256 in the demo), delay, batch.  
- **Control panel** — `pause()`, `resume()`, `next()`, `clear()`, `drain()` wired to buttons.  
- **Samples** — `addEach`, `map`, priority burst, `AbortSignal`—each logs to the event panel.

Target run time is tuned around ~45 seconds for the full million on a decent machine—not a benchmark certificate, but a **regression spectacle**: if dispatch regresses, you see it in the progress bar.

## When to reach for it

**Good fit:**

- Browser or Node apps that need **bounded concurrency** plus **pause/cancel/drain**.  
- Migrating off “`p-limit` + hand-rolled queue state.”  
- Workers, crawlers, importers, batch processors where operators tune throughput live.

**Poor fit:**

- Distributed job systems.  
- Durable queues that survive process restarts.  
- One-liner “just limit to 5” with no lifecycle—use the smallest tool.

## Get the code

```bash
git clone https://github.com/maggiben/ProcessQueue.git
cd ProcessQueue
npm install
npm test
npm run build
cd demo && npm install && npm run dev
```

Package name on npm: **`process-queue`** (see README for `npm install process-queue` when published).

Related experiments on this blog: [Rings](../rings-webgl-threejs-experiment/) pushes the GPU; [Shredder](../i-built-shredder-algo-trading-framework-no-perfect-algo/) pushes tick workers; **process-queue** pushes the humble event loop—and asks whether you can still steer it at task one million.

---

*Live bench: [process-queue.vercel.app](https://process-queue.vercel.app). Source: [github.com/maggiben/ProcessQueue](https://github.com/maggiben/ProcessQueue).*
