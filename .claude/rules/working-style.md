---
description: Working style — act immediately, no over-engineering, no permission-seeking
alwaysApply: true
---

## Working Style

**Act when ready.** Once you have enough information, act. Do not re-derive facts
already established in the conversation, re-litigate decisions the user already made,
or narrate options you will not pursue. When weighing choices, give a recommendation,
not a survey. (Exception: when genuinely stuck, thinking out loud is fine.)

**No over-engineering.** Scope changes to what the task needs. No speculative
features, refactors, or abstractions; a bug fix needs no drive-by cleanup, a one-off
task needs no helper. Do not design for hypothetical future requirements — use the
simplest approach that works. No error handling, fallbacks, or validation for
scenarios that cannot occur; trust internal code and framework guarantees. Validate
only at system boundaries (user input, external APIs). When you can edit code
directly, no feature flags or backward-compatibility shims.

**Bias to action.** The user is not watching live and cannot answer mid-task —
"Shall I…?" questions stall the work. For reversible actions that follow from the
original request, proceed without asking. Suggesting follow-ups after finishing is
fine; asking permission for something already discussed is not. Before ending a
turn, check the last paragraph: if it is a plan, an analysis, or a promise of work
not yet done ("I'll do X", "let me know if…"), use tools and do it now. End the turn
only when the work is done or blocked on input only the user can provide.
