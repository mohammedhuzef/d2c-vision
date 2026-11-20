# RECOVERY PROMPTS (copy the one that matches the problem)

## R1: Context lost or new chat
Read prompts/_PROMPT_ANATOMY.md and prompts/DAY-N-MASTER-PROMPT.md (replace N with the current day). Run `git log --oneline -20`, `git status --short`, `python -m pytest -q`. Compare the day file's tasks with the code and commits. Report in 15 lines which tasks are done, partly done, or missing, each with evidence. Do not change anything yet. Wait for "go".

## R2: Agent says "done" without raw output
Stop. Paste the raw output of: python -m pytest -q, git grep -n "float(" backend/app/services, git diff --name-only -- frontend landing, and the route list of the app. For every claim in your last report, show the command output or the test name that proves it, or write "NOT RUN: <reason>". Do not edit code in this step.

## R3: A test was edited or deleted
Run `git diff HEAD~N --stat -- backend/tests` and `git diff HEAD~N -- backend/tests` (choose N to cover this day). List every removed or changed assert. Restore each one and fix the code instead. If an old test truly contradicts the FROZEN RULES, do not edit it: list it under "needs my decision" with the exact reason.

## R4: frontend/ or landing/ was touched
Run `git diff --name-only -- frontend landing`. Revert those files with `git checkout -- frontend landing` (only those paths). Then explain which backend gap made you want to change them, and fix it in the backend additively. Report the empty diff output.

## R5: Tests fail after a change
Run `python -m pytest -q -x`. Fix the first failure at its root cause (not by changing the test). Re-run. Repeat. If the number of failing tests goes up after a change, undo that change with `git checkout -- <files>` and try a different approach. Report each failure, its cause, and the fix.

## R6: PostgreSQL problems
Print the exact error. Check in order: TEST_DATABASE_URL format (postgresql+psycopg://user:pass@host:5432/db, no secrets in output), server reachable, database exists, alembic upgrade head on a fresh database, trigger DDL syntax (CREATE FUNCTION ... RETURNS trigger and CREATE TRIGGER ... EXECUTE FUNCTION), UUID and JSONB types, row locking with with_for_update(). Fix Postgres-specific code without breaking SQLite. Show the full-suite result on both.

## R7: Gemini errors (404, 403, 429, bad JSON)
Run scripts/check_gemini.py (key hidden). 404 on the model: list models that support generateContent for this key and set LLM_MODEL in .env to an available one (do not hard-code). 403 or 401: the key is wrong, restricted, or the API is not enabled for its project: say so, do not retry in a loop. 429: respect backoff and the per-run budget. Bad JSON: confirm structured output settings and that the parser handles malformed responses without crashing the run. Never print the key.

## R8: Extra business rules or invented fields crept in
grep backend/app for: payback, lifetime, elasticity, segment, willingness, effort, suggested_patch. Show every hit. Remove any business rule that is not in the FROZEN RULES, and any response field that is not in the contract. Do not edit tests; list conflicts under "needs my decision".

## R9: Contract drift
Run python scripts/export_openapi.py to a temporary file and compare with contracts/openapi.json. Show the differences. Fix the BACKEND to match the committed contract (field names, types, status codes). Only if the difference is ordering or description text may the file be regenerated.

## R10: Agent loops, is slow, or rewrites too much
Stop. State in five lines what you are trying to do, what failed, and the smallest change that could work. Make only that change. If you have made the same attempt twice, try a different approach or write "BLOCKED: <reason>" and move on to the next task.

## R11: A secret may have leaked
Run `git ls-files | findstr /i ".env"`, `git grep -n "AIza"`, and search the last test logs for the key. If a key is in a tracked file or output, tell me to revoke it in Google AI Studio, remove it from the file (never print it), and add a test that asserts no key pattern appears in tracked files, logs, responses, or errors.

## R12: Scope creep (agent starts the next day)
Stop. Revert uncommitted work that belongs to a later day (`git stash` or `git checkout -- <files>`). Finish only the current day's gate. Report what you reverted.
