---
title: "I Built Shredder: An Algo Framework for a Market That Won't Sit Still"
subtitle: Shredder
description: "Shredder is my open-source trading framework for researching strategies, backtesting with fees, and running paper bots—built around a simple truth: there is no perfect algorithm, only disciplined uncertainty."
date: 2026-03-27
published: true
language: en
coverImage: assets/cover.png
tags:
  - trading
  - algorithmic-trading
  - typescript
  - fintech
  - open-source
  - shredder
repo: https://github.com/maggiben/shredder
---

**Shredder**

---

I did not set out to find the holy grail of Bitcoin entries.

I set out to build a place where **my own strategies** could live: defined in code (or sketched with math and, cautiously, AI), tested against history, stressed in simulation, and run in **paper mode** long before any real money is at risk. That place is [**Shredder**](https://github.com/maggiben/shredder)—a monorepo with a NestJS API, a Next.js dashboard, tick workers per symbol, backtests, and a risk layer that says “no” more often than my optimism does.

The dashboard looks serious. Green candles, buy/sell markers, a bot on **BTCUSDT** with a **15m** interval and a **15s** tick. What it does *not* show is certainty. Under the hood, Shredder is an argument that **modeling markets is brutally hard** and that **a perfect algo is a category error**—not a delayed engineering task.

## What Shredder is

Shredder is a **framework**, not a signal-selling machine:

| Piece | Role |
|-------|------|
| `apps/api` | Supervises bots, ingests tick webhooks, auth, orders queue (BullMQ + Redis) |
| `apps/worker` | Pulls candles, runs registered strategies, evaluates risk, emits paper or live *intent* |
| `apps/dashboard` | Bots, simulations, indicators, charts—**no agent may place orders from the UI** |
| `packages/strategies` | Your logic, registered like plugins |
| `packages/backtest` | Historical runs with fees and simulation metrics |
| `packages/risk` | Hard limits on drawdown, notional, equity floor |
| `packages/ai` | Suggest-only tooling—not autonomous trading |

You spawn a **tick worker** per bot (symbol, data provider, interval). The API watches the process and receives webhooks on each tick. **Paper trading is the default**; flipping to live intent requires explicit env and exchange keys—and even then, the README is blunt that parts of the order path are still **demo placeholders**, not production exchange plumbing.

That honesty is the point. I would rather ship a lab than a lottery ticket with a logo.

## Why markets resist a “perfect” model

A perfect algorithm would need a perfect **model of the market**. Markets are not a closed system with stable rules. They are other people, liquidity, regulation, narrative, and feedback loops—all changing the rules while you play.

### 1. The world is non-stationary

Backtests assume the past is a rehearsal for the future. It rarely is. Volatility clusters, correlations flip, and regimes change (calm grind, liquidation cascade, range-bound chop). A strategy tuned on 2023 data can be **charity** in 2025. You are not fitting one distribution; you are fitting a distribution that **moves**.

### 2. You only see what survived

Survivorship bias is not a footnote. Delisted coins, blown-up funds, and strategies that stopped being marketed do not appear in your CSV. What remains looks more predictable than the full population ever was.

### 3. Overfitting is the default outcome

Given enough indicators and parameters, you will find a curve that **explains** history and **confuses** the future. Walk-forward tests, out-of-sample holds, and simple strategies help—but they do not grant immunity. The market has more degrees of freedom than your validation split.

### 4. Execution is part of the strategy

Backtests love mid-price fills. Reality has **spread**, **slippage**, **partial fills**, **latency**, and fees. Shredder’s backtest path includes fee modeling and simulation metrics for a reason: a signal that wins on paper can lose on taker fees alone. Your 15m candle does not care that your order arrived 200ms late.

### 5. The map is not the territory

OHLCV bars compress **microstructure**: who lifted the offer, how thin the book was, whether your size moved the price. A candlestick is a cartoon. Strategies drawn on cartoons can be witty and still wrong.

### 6. The market fights back (reflexivity)

If an edge is real and scalable, capital piles in until it shrinks. Published patterns get arbed. Your bot is not trading in a vacuum; it is trading in a crowd that includes other bots—and **your own past trades** can change liquidity. There is no fixed “true” price process to discover once and encode forever.

### 7. Tail risk is not optional

Models trained on benign samples underestimate **gap risk**, exchange outages, stablecoin stress, and plain weirdness. A drawdown cap in code (Shredder’s risk engine blocks buys when equity breaches floors or drawdown limits) is necessary; it is not sufficient. **Black swans are not outliers in the economic sense—they are outliers in your dataset.**

### 8. AI does not repeal any of this

Shredder can call an LLM for **suggestions** (`POST /ai/suggest`). That is useful for exploring indicator combinations or narrating a backtest—not for outsourcing judgment. Language models interpolate text; they do not hold a joint distribution over tomorrow’s order book. Paste a shiny “AI analyst” on a bad strategy and you get **confident losses**.

## What “good” looks like instead

If perfection is off the table, what remains is **process**:

1. **Hypothesis in code** — Strategies are versioned, reviewable functions—not vibes in a spreadsheet.
2. **Backtest with skepticism** — Include fees, stress parameters, and simulation ledgers; treat great Sharpe ratios as guilty until proven robust.
3. **Paper first, always** — Workers default to paper mode; the dashboard labels **Paper** loudly. Live keys and mainnet are opt-in, testnet by default when you wire Binance.
4. **Risk outside the strategy** — Strategies propose `BUY` / `SELL` / `HOLD`; `DefaultRiskEngine` can veto buys on drawdown, notional caps, and equity floors. Risk stays in code, not in a chat prompt.
5. **Separation of concerns** — The UI supervises and visualizes; it does not trade. No “click here to let GPT size your position.”

The screenshot above is a **demo bot** on paper: candle trail, paper buy/sell markers, worker output in the trail API. It is a laboratory window—not a track record.

## Architecture in one breath

When you hit **Start**, the API spawns a Node worker with env for symbol, interval, webhook URL, and bot id. Each tick: fetch or synthesize candles, run strategies, aggregate signals, run risk, optionally record a **paper trade event**, POST JSON back to the API. The dashboard polls trails and renders a candlestick chart with overlays.

Rust shows up in the repo for performance-sensitive pieces; TypeScript carries most of the product surface. Postgres holds users, bots, and history; Redis queues orders. It is boring infrastructure on purpose—**excitement belongs in research, not in surprise production behavior.**

## The impossibility of the perfect algo

“Perfect” would mean: for all future states relevant to your capital, your rule always maximizes risk-adjusted return subject to your constraints. That requires **omniscience** or a **stationary generative model** that the world does not provide.

Even in academia, the efficient-market intuition pushes back: persistent, scalable, low-risk alpha is rare *because* smart people hunt it. In practice, you are always trading **model risk** (your assumptions are wrong), **implementation risk** (bugs, outages), and **incentive risk** (you will override the system after three red days).

So Shredder does not promise alpha. It promises **structure**:

- A place to test ideas.
- Defaults that assume you will be wrong.
- Guardrails that fail closed.
- A path from simulation → paper → (if you ever choose it) live—with eyes open.

## Try it yourself

Clone the repo, bring up Postgres and Redis with Docker, copy `.env.example` to `apps/api/.env`, run migrations, then:

```bash
pnpm install
pnpm --filter @shredder/db db:deploy
pnpm --filter @shredder/api dev
```

Run the dashboard separately, register a user, create a **paper** bot, watch ticks arrive. Read the [README](https://github.com/maggiben/shredder) for Binance testnet keys, strategy registration, and security notes.

If you want a calmer relationship with markets—track what you own without betting on prophecy—see my other project [Elliott](../i-built-elliott-portfolio-tracker-stays-on-your-device/), a portfolio tracker that stays on your device. Shredder is the opposite energy: **hypotheses and falsification**, not net-worth comfort food.

## Closing thought

The market is not a puzzle with a missing piece. It is an adversarial, non-stationary, partially observed system where your edge decays and your mistakes are billed in dollars.

Building Shredder taught me that the win is not finding the perfect algo. The win is **building a discipline** that survives knowing you never will—and still finding the work fascinating.

---

*Code and docs: [github.com/maggiben/shredder](https://github.com/maggiben/shredder). Trade at your own risk; this is not financial advice.*
