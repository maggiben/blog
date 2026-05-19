---
title: "Event-Density Calendar: When Time Becomes a Visual Widget"
subtitle: Calendar · Moment.js · CodePen
description: "A month grid where each day's circle scales with how busy you were—not a list, a heat map you can click. I built this on CodePen years ago; here's why time widgets still matter and how event density works."
date: 2026-05-19
published: true
language: en
coverImage: assets/cover.png
tags:
  - calendar
  - javascript
  - momentjs
  - ui
  - codepen
  - creative-coding
codepen: https://codepen.io/maggiben/pen/OPmLBW
---

![Event-density calendar — month grid with scaled circles and expanded day details](assets/cover.png)

**Event-density calendar**

---

Most calendars show you **what** is scheduled. A smaller, sharper class of widgets shows you **how much** happened—at a glance, on a grid you already understand.

Years ago I published one on CodePen: [**Event-density calendar**](https://codepen.io/maggiben/pen/OPmLBW). Blue header, binder rings, month navigation with a slide animation. Each day is a number and a circle; the circle **grows** when that day carried more events. Click a busy day and a panel unfolds beneath the week row, listing what happened. No backend, no framework ceremony—**Moment.js**, vanilla DOM, and CSS animations that aged surprisingly well.

The original demo mapped **malware and bot names** onto January 2017 (a threat-intel calendar for a security context). The mechanic is the same either way: **density as UI**.

## Try it live

The widget below is the [CodePen](https://codepen.io/maggiben/pen/OPmLBW) embedded in this post. Click any day with a visible blue circle, use the header arrows to change months, and watch the detail panel open under the week row. The pen opens on **January 2017** with the original sample data—navigate to the current month or fork the pen to plug in your own events.

<div class="blog-embed">
  <p
    class="codepen"
    data-height="620"
    data-pen-title="Calendar"
    data-default-tab="result"
    data-slug-hash="OPmLBW"
    data-user="maggiben"
    style="height: 620px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0; border: 0;"
  >
    <span>See the Pen <a href="https://codepen.io/maggiben/pen/OPmLBW">Calendar</a> by Benjamin (<a href="https://codepen.io/maggiben">@maggiben</a>) on <a href="https://codepen.io">CodePen</a>.</span>
  </p>
  <script async src="https://public.codepenassets.com/embed/index.js"></script>
</div>

<p><em>Embed blocked or blank? <a href="https://codepen.io/maggiben/pen/OPmLBW" target="_blank" rel="noopener noreferrer">Open the pen on CodePen</a>.</em></p>

**What you should see:** a compact month view, circles sized by event count, and an expandable detail strip anchored under the week—like the capture above.

## Why time widgets are still worth building

Dates are the one coordinate system every user already knows. That makes the calendar grid a **universal canvas** for data:

| Pattern | What the user reads instantly |
|---------|-------------------------------|
| **Dot calendar** | Something happened (binary) |
| **Heat map** | Intensity across days (GitHub contributions) |
| **Agenda list** | Exact schedule (Google Calendar) |
| **Event-density grid** | *How heavy* a day was, then drill-down on demand |

The density approach trades all-day precision for **pattern recognition**. You are not answering “What time is my dentist?” You are answering “Which week in Q1 looked like a dumpster fire?” or “When did incidents cluster?”

That is why security dashboards, habit trackers, and release calendars all flirt with the same idea: **encode volume in the cell before you encode detail in a tooltip**.

## What is running under the hood

The widget is a small state machine drawn with DOM APIs:

```
events[] → draw month grid → scale circle by count / maxCount → click → inject .details row
```

**1. Normalize dates.** On each redraw, event entries are converted with Moment so comparisons use `isSame(day, 'day')`.

**2. Build the grid.** The current month is filled day by day; leading and trailing cells come from `backFill` and `fowardFill` so the grid is always six rows of weeks. Each cell gets a `day-number` and a `circle` span.

**3. Density encoding.** The code finds the busiest day in the dataset (`maxEvents`), then scales each circle:

```javascript
var size = (1 / this.maxEvents) * todayEvents.events.length;
circle.style.transform = 'scale(' + size + ')';
```

Quiet days keep a zero-scale circle (invisible). Busy days approach full size. It is a linear map, not a log scale—honest and easy to reason about when you have five events, not five hundred.

**4. Interaction model.** Only days with events are clickable. `openDay` injects a `.details` block as a sibling inside the **week row**, positions a triangular `.arrow` under the clicked cell, and lists colored event rows. Switching days in the same week reuses the container and animates the list out/in.

**5. Month transitions.** Changing month sets `next` or `prev`, re-draws, and applies CSS classes `month out` / `month in` with keyframed slides—old-school `-webkit-animation` era, still charming.

**6. Angular wrapper (original).** The CodePen shipped an `ng-app` directive that passed sample data into `new Calendar('#calendar', data)`. The calendar engine itself is plain DOM; Angular was only the glue.

## The stack (CodePen era)

- **[Moment.js](https://momentjs.com/)** — month boundaries, `isSame`, add/subtract months (the API we had before Temporal won the long game)
- **Vanilla `Calendar` constructor** — no virtual DOM; explicit `createElement` and class toggles
- **LESS → CSS** — binder rings, header typography, month slide animations
- **CodePen** — instant share link, zero build step

The pen’s README still says the quiet part out loud: *“A calendar that tells you how many events happened on a particular date.”* That one sentence is the product spec.

## What I would change today

If I refreshed the project now:

- **Temporal or Luxon** — Moment is in maintenance mode; modern codebases should start elsewhere.
- **Accessibility** — keyboard focus per day, `aria-expanded` on the detail panel, `aria-label` that reads “3 events” not only a bigger circle.
- **Responsive width** — the original fixed ~480px layout; a wider embed or fluid `max-width` would help on large screens.
- **Data API** — accept `events: { date, items[] }[]` from JSON fetch instead of hard-coded arrays; keep the renderer dumb.
- **Reduced motion** — respect `prefers-reduced-motion` and skip month slides for users who need it.

None of that undermines the core idea: **time is not only a list—it is a shape**, and circles that breathe with workload are a legible shape.

## The lesson I still keep

The best widgets do not add a new metaphor. They **bend one you already know**—the wall calendar, the month view—and add one extra channel (density) before they ask for a click.

This pen was never a SaaS. It was a **visual argument**: you can see busy season without reading every title. In a world of infinite agenda scroll, that is still a gift.

Fork it, swap malware names for deploys, or pipe CI failures into the array and watch release week swell. You will learn more about your timeline from the circles than from another notification badge.

---

*CodePen: [codepen.io/maggiben/pen/OPmLBW](https://codepen.io/maggiben/pen/OPmLBW) · Blog copy of source: [assets/demo/](assets/demo/) · Sample data: January 2017 threat-intel theme*
