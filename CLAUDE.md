# emuku-cli

CLI tool to control iOS simulators and Android emulators.

## Build

```bash
npm run build       # Compile TypeScript
npm run dev         # Watch mode
node dist/index.js  # Run locally
```

## Git

**Always use `rtk` for all git commands:**
```bash
rtk git status
rtk git add <files>
rtk git commit -m "..."
rtk git log
```

## Commit Style

Small commits per feature:
```
feat/fix/chore/test/doc(JIRA_ID): Title
<blank line>
One or two lines of summary.
```

## Architecture

```
src/
  commands/     # Command handlers (ios/, android/, create/, tools/)
  lib/          # Core logic (ios/, android/, shell.ts)
  utils/        # Shared utilities (display, checklist, logger)
  types/        # TypeScript types (device, prerequisite)
  completions/  # Shell completion scripts (bash.sh, zsh.sh)
  index.ts      # Entry point and CLI router
```

## Rules

- Small commits per logical feature
- Use `enquirer` for all interactive prompts
- `shell.exec()` never throws — returns `{ exitCode, stdout, stderr }`
- Android tools are NOT always in $PATH — use `resolveAndroidTool()` from `src/lib/shell.ts`
- `create ios` must exit immediately on non-macOS
- Detached emulator process: use `spawn` + `detached: true` + `unref()`
