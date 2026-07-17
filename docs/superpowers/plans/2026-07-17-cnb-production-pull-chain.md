# CNB Production Pull Chain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current production deployment path pull from CNB without recursively initializing the paused EasyManager submodule.

**Architecture:** Keep the repository structure unchanged and narrow only the deployment entry points. Replace recursive submodule commands in the root deploy script and deployment guide with explicit `MindAuth` and `MindFourm` initialization so the active production path stays on CNB while EasyManager remains paused and out of scope.

**Tech Stack:** Git submodules, Bash deployment script, Markdown deployment guide

## Global Constraints

- Do not modify `.gitmodules` in this change.
- Do not change the repository ownership or restore strategy of `EasyManager`.
- Do not add `download-site` to the root deployment chain.
- Keep the change minimal and limited to production pull-chain entry points.
- Ensure the default documented and scripted deployment path does not use `--recursive`.

---

## File Map

**Modify:**
- `deploy.sh` — replace recursive pull/update commands with explicit `MindAuth` + `MindFourm` submodule updates.
- `DEPLOYMENT.md` — replace recursive deployment examples and document the CNB-first active-chain behavior.

**Verify:**
- `deploy.sh` contains no `git pull --recurse-submodules`
- `deploy.sh` contains no `git submodule update --init --recursive`
- `DEPLOYMENT.md` main deployment path initializes only `MindAuth` and `MindFourm`

---

### Task 1: Narrow the deployment script to active CNB submodules only

**Files:**
- Modify: `deploy.sh:41-49`
- Test: `deploy.sh` command diff

**Interfaces:**
- Consumes: Current deploy entry point using `git pull --recurse-submodules` and `git submodule update --init --recursive`
- Produces: Root deploy script that updates only `MindAuth` and `MindFourm`

- [ ] **Step 1: Replace the recursive pull command**

Change:

```bash
git pull --recurse-submodules
```

to:

```bash
git pull
```

- [ ] **Step 2: Replace the recursive submodule init command**

Change:

```bash
git submodule update --init --recursive
```

to:

```bash
git submodule update --init MindAuth MindFourm
```

- [ ] **Step 3: Keep the surrounding comments aligned with the new behavior**

Ensure the nearby comments explain that the deploy script updates only the active production submodules instead of all recursive submodules.

Use wording equivalent to:

```bash
# Update active production submodules only
```

- [ ] **Step 4: Verify the script diff is scoped correctly**

Run:

```bash
git diff -- deploy.sh
```

Expected:
- The script no longer uses recursive submodule pull/update commands.
- Only the production pull-chain lines and nearby comments changed.

- [ ] **Step 5: Commit**

```bash
git add deploy.sh
git commit -m "$(cat <<'EOF'
chore: narrow deploy script to active CNB submodules
EOF
)"
```

---

### Task 2: Rewrite deployment docs to match the active CNB pull chain

**Files:**
- Modify: `DEPLOYMENT.md:22-31`
- Modify: `DEPLOYMENT.md` later update section containing `git submodule update --init --recursive`
- Test: deployment command examples in `DEPLOYMENT.md`

**Interfaces:**
- Consumes: Existing docs that tell operators to recursively initialize all submodules
- Produces: Deployment guide that initializes only `MindAuth` and `MindFourm` for the active production path

- [ ] **Step 1: Replace the initial clone-time recursive submodule command**

Change the deployment example from:

```bash
# 初始化子模块
git submodule update --init --recursive
```

to:

```bash
# 初始化当前生产主链路子模块
git submodule update --init MindAuth MindFourm
```

- [ ] **Step 2: Replace later recursive update examples**

Any later deployment or update example that currently says:

```bash
git submodule update --init --recursive
```

should become:

```bash
git submodule update --init MindAuth MindFourm
```

If the section is about updating an existing checkout rather than first init, use wording equivalent to:

```bash
git pull
git submodule update MindAuth MindFourm
```

- [ ] **Step 3: Add one explicit note about scope**

Add a short note near the deployment commands clarifying:

```md
当前生产部署链路只需要初始化 `MindAuth` 和 `MindFourm`。`EasyManager` 仍为暂停模块，不属于默认生产拉取流程；`download-site` 继续独立部署。
```

- [ ] **Step 4: Verify the documentation diff is scoped correctly**

Run:

```bash
git diff -- DEPLOYMENT.md
```

Expected:
- The main deployment path no longer uses recursive submodule commands.
- The new note clearly explains why only two submodules are initialized.

- [ ] **Step 5: Commit**

```bash
git add DEPLOYMENT.md
git commit -m "$(cat <<'EOF'
docs: document CNB-first active deployment submodules
EOF
)"
```

---

### Task 3: Verify the active production pull chain end-to-end at the repository-text level

**Files:**
- Verify only: `deploy.sh`, `DEPLOYMENT.md`

**Interfaces:**
- Consumes: Updated script and guide
- Produces: Verified text-level evidence that the active production path avoids recursive EasyManager pulls

- [ ] **Step 1: Search for forbidden recursive commands in deployment entry points**

Run:

```bash
git diff -- deploy.sh DEPLOYMENT.md
git grep -n "recurse-submodules\|submodule update --init --recursive" -- deploy.sh DEPLOYMENT.md
```

Expected:
- The diff shows the new explicit `MindAuth MindFourm` commands.
- `git grep` returns no forbidden recursive deployment commands, or only historical explanatory text that is clearly not the active path.

- [ ] **Step 2: Review the final deployment path manually**

Confirm the documented/scripted deployment path is now conceptually:

```bash
git clone <CNB MindProject>
git submodule update --init MindAuth MindFourm
```

and for updates:

```bash
git pull
git submodule update MindAuth MindFourm
```

- [ ] **Step 3: Commit any final touch-ups if needed**

If verification required no further changes, no additional commit is needed.

If a wording-only cleanup was needed, use:

```bash
git add deploy.sh DEPLOYMENT.md
git commit -m "$(cat <<'EOF'
chore: finalize CNB production pull chain docs
EOF
)"
```
