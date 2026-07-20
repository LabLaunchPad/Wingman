# Continuous Execution

**Principle:** Once you begin executing a workflow, maintain momentum through to completion. The workflow should run as a cohesive unit, not a series of start-stop-check cycles.

## Rules

1. Don't pause to announce what you're about to do — just do it
2. Don't stop to summarize intermediate progress unless specifically asked
3. If you hit a blocker, document it and work around it, don't stop
4. Complete the full workflow before returning to the user
5. Batch related operations rather than doing them one at a time

## Anti-Patterns

- "Let me check if this is working so far..." → just keep going
- "Now I'll move on to..." → just move on
- "Before I continue..." → continue
- Stopping to explain each step as you go

## Exception

Only pause if you encounter a genuine decision point that requires user input, or if the session health hook warns about context limits.
