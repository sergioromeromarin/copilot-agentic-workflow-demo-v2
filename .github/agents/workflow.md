---
name: pr-default
phase1: [backend, frontend, qa-integration]
phase2: [unit-tests, docs]
---

# Agent workflow

This workflow runs in two phases:
- Phase 1 runs in parallel for fast signal.
- Phase 2 receives handoffs from Phase 1.

If LLM is configured, handoff tasks can be refined by prompts.

