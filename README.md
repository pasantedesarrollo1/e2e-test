# Cross-Repository E2E Testing Architecture & CI/CD Workflow

## Overview
This document outlines the architecture, configuration steps, and technical decisions for the cross-repository End-to-End (E2E) testing workflow. The system is designed to trigger automated Playwright tests in a dedicated testing repository whenever a new release branch is pushed to the main frontend repository.

## 1. Frontend Repository Configurations (Trigger Source)
To allow the frontend repository to securely trigger workflows in the E2E testing repository, a Personal Access Token (PAT) must be configured.

### Configuration Steps:
1. **Generate a GitHub PAT (Personal Access Token):**
   - Go to GitHub Developer Settings > Personal access tokens > Tokens (classic).
   - Generate a new token.
   - **Required Scopes:** 
     - `repo` (Full control of private repositories).
     - `workflow` (Update GitHub Action workflows).
   - Copy the generated token (`ghp_...`).
2. **Add Secret to Frontend Repository:**
   - Go to the Frontend Repository Settings > Secrets and variables > Actions.
   - Create a new repository secret named `E2E_REPO_PAT`.
   - Paste the generated token as the value.

## 2. Workflow Trigger Mechanism
The trigger workflow (`trigger-e2e.yml`) deployed in the frontend repository listens for the creation of `release/**` branches. 
- **Dynamic Versioning:** It automatically extracts the version number from the pushed branch (e.g., `release/7.10.0`), prepends a `v` if necessary, and constructs the target E2E branch name (e.g., `feature/E2E-tests-for-version-v7.10.0`).
- **Cross-Repo Dispatch:** It uses the GitHub CLI (`gh workflow run`) authenticated via the `E2E_REPO_PAT` to send a dispatch signal to the E2E repository, passing the dynamically constructed branch name.

## 3. E2E Repository Configuration & Runner Adjustments
The receiving workflow (`e2e.yml`) runs on a self-hosted Windows runner. Several structural changes were implemented to ensure stability, environment isolation, and cross-platform compatibility.

### Local Developer State Preservation (Safe Stash)
Since the self-hosted runner executes on a machine that may be actively used for local development, the workflow enforces strict state preservation:
- **State Saving:** Before fetching any remote code, the workflow records the active branch and stashes any uncommitted local changes (including untracked files) using `git stash push`.
- **Target Execution (Develop vs. Release):** 
  - *Current State:* The workflow is currently configured to forcefully checkout, build, and test the `develop` branch. 
  - *Future State:* Once fully integrated, this logic will be updated so that instead of defaulting to `develop`, it will pull the specific `release/*` branch that was just pushed, build that exact release code, and execute the tests against it.
- **State Restoration:** Upon completion (regardless of success or failure), the workflow checks out the developer's original branch and restores the stashed changes using `git stash pop`. 
- **Manual Stash Management:** As a strict safety measure against accidental code loss (e.g., if a merge conflict occurs during the pop process), stashes are NOT forcefully deleted by the runner. Developers are expected to manually review and clear their stashes (`git stash drop` / `git stash clear`) to ensure no underlying changes are inadvertently wiped out.

### Windows Environment Workarounds
Because the self-hosted runner is a Windows environment executing via PowerShell, specific workarounds were required to handle scripts originally designed for UNIX-like systems:
- **Bash Shell Enforcement for `npm build`:** The frontend's `package.json` contains Linux-specific commands (like `cp`). To prevent build failures on Windows ("cp is not recognized as an internal or external command"), the workflow injects a configuration before building: `npm config set script-shell "C:\Program Files\Git\bin\bash.exe"`. This temporarily forces `npm` to evaluate scripts using Git Bash instead of Windows CMD, resolving path and command discrepancies.
- **Log Capturing for Notifications (`Tee-Object`):** To provide robust Telegram notifications with exact test metrics (passed, failed, flaky, duration), the runner must capture the Playwright `stdout`. Since bash's `tee` is not natively available in PowerShell, the workflow uses PowerShell's native `Tee-Object -FilePath test-output.log`. This pipes the output simultaneously to the console and to a log file, ensuring the notification action can parse the results even if the test execution step throws an exception.