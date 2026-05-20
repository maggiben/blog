---
title: "Vercel’s Uphill Battle in an AI-First Era"
subtitle: When SaaS UIs meet their agent-centric future
description: "A 2025 thesis on whether agent-first software threatens Vercel’s Next.js hosting model—updated in 2026 with a fact check and Vercel’s AI bets (v0, AI SDK, AI Gateway, Fluid Compute)."
date: 2025-02-11
updated: 2026-05-17
published: true
language: en
coverImage: assets/cover.webp
tags:
  - vercel
  - nextjs
  - saas
  - ai-agents
  - business-strategy
canonical: https://www.linkedin.com/pulse/vercels-uphill-battle-ai-first-era-when-saas-uis-meet-benjamin-maggi-0v7of/
---

*DALL-E*

---

In February 2025 I argued that the rise of **agent-first software** could erode the economic logic behind sprawling SaaS front ends—and, by extension, the platform that made its name hosting them: [Vercel](https://vercel.com). I published that take on [LinkedIn](https://www.linkedin.com/pulse/vercels-uphill-battle-ai-first-era-when-saas-uis-meet-benjamin-maggi-0v7of/). Fifteen months later, the question is not whether the shift is real, but **how much of the original threat materialized**, and whether Vercel’s response was strategy or a series of experiments thrown at the wall.

This version keeps the core argument, tightens the prose, fact-checks the claims, and adds what we now know about Vercel’s AI product line.

## The thesis, in one paragraph

For a decade, SaaS meant **screens**: dashboards, wizards, settings panels. Next.js became the default way to ship those experiences on the web, and Vercel became the default place to deploy them. Large language models and agents promised a different contract: describe the outcome in natural language, let software act. If that contract scales, teams might spend less on bespoke UI and fewer preview deployments—and a platform optimized for front-end velocity would need a new center of gravity.

That was the bet against Vercel. The counter-bet was that Vercel would **become the platform for AI apps** rather than lose to them.

## 1. Agent-first is real—but UIs did not vanish

**What held up.** Assistants in Slack, Teams, and IDE copilots did absorb work that used to require logging into a micro-app. Internal tools increasingly ship as chat plus tools (MCP, function calling, RAG). For many workflows, the “interface” is a thread, not a sidebar.

**What I overstated.** The death of the SaaS UI. In practice, agents and UIs coexist:

- **High-stakes flows** (billing, permissions, compliance) still need explicit UI affordances.
- **Discovery and trust** still lean on marketing sites, docs, and product chrome—often on Next.js.
- **AI-generated UI** (notably [v0](https://v0.app)) *increased* demand for deployable front ends rather than eliminating them.

So the shift is not “no more front end.” It is **fewer screens per unit of value**, and more churn between “chat-only” prototypes and hybrid products that need hosting, auth, and edge logic anyway.

## 2. Vercel’s customer base: pressure, not collapse

**What held up.** SMB SaaS teams did cut scope: MVPs shipped as API + agent + thin shell. Enterprises did route more internal automation through existing collaboration tools instead of new Next.js dashboards.

**What to nuance.** Vercel’s core market did not evaporate. Framework competition shifted—Remix’s team moved on after Shopify’s acquisition; Astro and others grew in content and marketing sites—but **Next.js remained the default for full-stack React products**, especially where AI features ship inside a normal web app. Vercel’s moat was never “only dashboards”; it was **developer workflow**: git push, preview URLs, edge, observability.

The risk was never overnight churn. It was **margin compression**: customers doing less UI work per dollar, or routing inference spend to model providers unless Vercel captured that layer too.

## 3. Economic pressure—and a plot twist

In early 2025 I pointed at growth expectations and feature velocity (Server Components, Turbopack, monorepo tooling) as signs of a company racing to justify a large valuation.

**Facts (public reporting, not audited by me):**

| Milestone | Approximate figure | Source type |
|-----------|-------------------|-------------|
| Series E (May 2024) | ~$250M at ~$3.25B valuation | Press / SEC filings via news |
| Series F (Sept 2025) | ~$300M at ~$9.3B post-money | Press, investor announcements |
| Revenue trajectory | Reports of ~$144M (2024) toward ~$200M+ ARR (2025) and higher run-rates in 2026 | Third-party estimates (e.g. Sacra, industry press) |

Those numbers do not prove every product bet worked. They do suggest **investors bought the AI pivot narrative** at a scale that contradicts a simple “Vercel is stranded on hosting” story. The uphill battle was real; the company also had capital and attention to fight it.

**What still holds.** Fast-moving framework defaults (Turbopack as the bundler path in modern Next releases, evolving caching and RSC patterns) continue to impose migration cost. Teams burned by churn are a real alternative-hosting constituency—even when they stay on React.

## 4. Fragmentation and deployment churn

**What held up.** Agent-heavy systems change behavior through prompts, tools, and model swaps—not only through UI commits. That can reduce the number of front-end deploys per feature.

**What to nuance.** Production AI apps still need **CI/CD, secrets, observability, and edge latency**—the same operational spine Vercel sells. Agents did not remove release engineering; they moved it toward **model routes, evals, and tool policies**. That is a different kind of preview surface, not the absence of one.

## 5. Throw it at the wall: Vercel’s AI portfolio (2025–2026)

Since the original article, Vercel has not quietly defended static hosting. It has stacked **AI infrastructure and developer products**—some clearly strategic, some still finding product-market fit. Treat this as a portfolio of bets, not a single master plan.

### v0 — generate UI, still ship on Vercel

[v0](https://v0.app) generates React/Tailwind-style UI from prompts and iterates in chat. It attacks the “agents replace UI” fear from the **other direction**: if the interface is cheap to generate, you still need a place to **run, preview, and secure** it. v0 is both a product and a funnel back to deployment.

### AI SDK — the ecosystem wedge

The [AI SDK](https://sdk.vercel.ai/) (`ai` on npm) became the de facto TypeScript layer for streaming chat, tool calling, structured outputs, and multi-provider models. [AI SDK 6](https://vercel.com/blog/ai-sdk-6) (late 2025) leaned into **agents**—e.g. tool-loop abstractions, MCP integration, and production-oriented agent patterns—so teams build agents *inside* Next apps rather than only beside them.

That is classic platform strategy: own the integration layer developers copy-paste from tutorials.

### AI Gateway and Fluid Compute — own the inference path

[Vercel’s AI Cloud positioning](https://vercel.com/ai) pushes **AI Gateway** (unified model access, keys, limits) and **Fluid Compute** (compute tuned for bursty inference). Whether customers use Vercel’s models or bring their own, the economic prize is **metered usage on Vercel’s bill**, not just static asset hosting.

### Templates, agents, and “see what sticks”

Shipped examples—chatbots, Slack agents, workflow templates—function as **distribution and learning loops**. They are as much marketing and habit formation as product. In a fast-moving market, that is rational: the winner is often whoever becomes the default `npm i ai` + deploy path before the category consolidates.

**Verdict on the wall.** Several bets stuck (SDK adoption, AI Gateway narrative, valuation step-up). v0 and agent templates are still competing with Cursor, Copilot, and vertical SaaS AI. The through-line is coherent: **move from “host your UI” to “host your AI app.”**

## Fact check: what I would change if I wrote it today

| Claim (Feb 2025) | Assessment (May 2026) |
|------------------|------------------------|
| Agents reduce need for large custom UIs | **Partly true** — scope shrinks; hybrid apps dominate |
| Vercel’s Next.js-centric moat weakens | **Overstated** — Next + Vercel still default for many AI web apps |
| Growth pressure forces risky feature velocity | **True** — framework churn remains a developer pain point |
| Vercel must pivot to AI integrations | **Happened** — AI SDK, Gateway, v0, Fluid Compute |
| SaaS UIs become “optional or obsolete” | **Too strong** — optional for some workflows, not for the category |

If you are building **design-system-aware** UIs with models, the tension in this article connects to [How to Train an AI to Use Your Own Design System](../how-to-train-ai-use-your-own-design-system/) and [Decoding HTML](../decoding-html-overcoming-semantic-challenges-llm-code-generation/). If you are skeptical that chat alone equals reasoning, see [Can Neural Networks Reason?](../can-neural-networks-reason-yann-lecun-lex-fridman/).

## Conclusion

The AI-first era did not retire the browser. It **re-priced** front-end work and **re-centered** platform value on inference, tools, and deployment of full-stack AI apps. Vercel’s uphill battle was never only about defending dashboards; it was about whether the company could become indispensable when the “product” is half model and half UI.

Early evidence says they bought time and mindshare with an aggressive AI stack—while still selling the same git-push workflow to a world that now ships agents alongside components. The open question for the next year is not “UI or agents,” but **who taxes the loop**: model providers, cloud hosts, or the team that owns both the SDK and the deploy button.

---

*Originally published February 11, 2025 on [LinkedIn](https://www.linkedin.com/pulse/vercels-uphill-battle-ai-first-era-when-saas-uis-meet-benjamin-maggi-0v7of/). Updated May 17, 2026 for benja.info.*
