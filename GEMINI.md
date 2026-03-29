# Project Overview

`emuku` is a CLI tool written in TypeScript for controlling iOS simulators and Android emulators. It provides commands for listing, starting, and creating devices.

## Architecture

The project follows a modular structure:

-   `src/index.ts`: The main entry point that handles command-line argument parsing and routing.
-   `src/commands/`: Contains the implementation for each CLI command (e.g., `ios device-list`).
-   `src/lib/`: Core logic for interacting with iOS/Android simulators/emulators and shell commands.
-   `src/utils/`: Shared utility functions for logging, display, and other common tasks.
-   `src/types/`: TypeScript type definitions.
-   `src/completions/`: Scripts for shell auto-completion.

## Building and Running

**Build the project:**

```bash
npm run build
```

**Run the CLI locally:**

```bash
npm start -- <command>
# Example
npm start -- ios device-list
```

**Run in watch mode for development:**

```bash
npm run dev
```

## Development Conventions

-   **Git:** Always use `rtk` for git commands (e.g., `rtk git status`).
-   **Commits:** Follow the conventional commit format: `type(scope): subject`. For example: `feat(android): add support for API 34 emulators`.
-   **Interactive Prompts:** Use the `enquirer` library for all user prompts.
-   **Shell Commands:** Use the wrapper functions in `src/lib/shell.ts` for executing external commands. These functions provide better error handling and logging.
-   **Platform Specifics:**
    -   iOS commands should handle cases where the user is not on macOS.
    -   Android tool paths should be resolved dynamically, as they may not be in the system's `$PATH`.
