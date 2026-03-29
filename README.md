# emuku-cli

A command-line tool designed for efficiently managing, starting, stopping, and viewing the status of iOS Simulators and Android Emulators.

`emuku` provides a clean, persistent interactive terminal menu with real-time hardware status polling, as well as a traditional argument-based CLI for scripting and quick actions.

## 0. Tech Stack & Dependencies

**Tech Stack**
- **Language**: TypeScript (Node.js >= 18)
- **Framework**: Customized manual CLI routing with `enquirer` for interactive menus.

**Dependencies**
- **`enquirer`**: Powers the dynamic, interactive terminal menus and backgrounds polling.
- **`ansi-colors`**: Provides rich terminal styling and colors.

**System Requirements**
- macOS (for iOS Simulators)
- iOS: `xcrun simctl` (available via Xcode Command Line Tools)
- Android: Android SDK Command-line Tools (`emulator`, `adb`, `sdkmanager`)

---

## 1. Using the CLI with Arguments

You can use `emuku` by passing direct arguments. This is ideal for scripts, aliases, or quick actions without entering the interactive menu.

```bash
# List all available simulators/emulators
emuku ios device list
emuku android device list

# Start a specific device (by UDID or AVD Name)
emuku ios device start <udid>
emuku android device start <avd_name>

# Stop a running device
emuku ios device stop <udid>
emuku android device stop <avd_name>

# View currently running devices
emuku ios device status
emuku android device status

# Check prerequisites for local machine
emuku ios setup
emuku android setup
```

For a full list of commands, run:
```bash
emuku --help
```

---

## 2. Using the Interactive CLI

To launch the persistent, interactive interface, simply run `emuku` with no arguments:

```bash
emuku
```

### Interactive Features:
- **Categorized Menus**: Actions are grouped into logical categories: `iOS`, `Android`, `Runtime`, `Setup`, and `Utility` navigation trees.
- **Real-time Status Header**: The main header dynamically polls your system every 2 seconds to display the exact number of running Android and iOS emulators, updating automatically even while you are sitting completely idle on the menu.
- **Graceful Navigation**: Press `Esc` or `Ctrl+C` at any time (even deep inside an action prompt) to safely cancel your current action and return to the previous submenu without crashing the application.

---

## 3. How to Build and Run

To build the TypeScript project and run it locally:

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Run the CLI
npm start -- [arguments]
# Or launch interactive mode:
npm start

# For development (Watch Mode)
npm run dev
```

Alternatively, you can link the binary globally for use anywhere:
```bash
npm install
npm run build
npm link
emuku
```
