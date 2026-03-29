# emuku-cli

A command-line tool for managing iOS Simulators and Android Emulators. Run it with no arguments for a fullscreen interactive menu, or pass commands directly for scripting.

## Tech Stack

- **TypeScript** (Node.js >= 18)
- **enquirer** — interactive terminal menus
- **ansi-colors** — terminal styling

**System Requirements**

- macOS (for iOS Simulators)
- Xcode Command Line Tools (`xcrun simctl`)
- Android SDK Command-line Tools (`emulator`, `adb`, `sdkmanager`)

---

## Interactive Mode

Run `emuku` with no arguments to launch a fullscreen, non-scrollable interactive menu:

```bash
emuku
```

- Fullscreen alternate screen buffer (like vim/htop)
- Categories: **iOS**, **Android**, **Runtime**, **Setup**, **Utility**
- Live device status in the header (refreshes on each menu transition)
- Press `Esc` or `Ctrl+C` anywhere to go back without crashing

---

## Direct CLI Usage

```bash
# iOS
emuku ios device list              # List all simulators
emuku ios device start <udid>      # Start a simulator
emuku ios device stop <udid>       # Stop a simulator
emuku ios device status            # Show running iOS devices

# Android
emuku android device list          # List all emulators
emuku android device start <avd>   # Start an emulator
emuku android device stop <avd>    # Stop an emulator
emuku android device status        # Show running Android devices

# Runtime
emuku app run ios [id]             # Run Flutter app on iOS simulator
emuku app run android [id]         # Run Flutter app on Android emulator
emuku status                       # Show all running devices

# Setup
emuku create ios                   # Setup iOS prerequisites
emuku create android               # Setup Android prerequisites

# Utility
emuku tools bash-completion        # Install shell completions (bash/zsh)
```

Full help: `emuku --help`

---

## Build & Run

```bash
npm install
npm run build
npm start                # Interactive mode
npm start -- <command>   # Direct CLI
npm run dev              # Watch mode
```

Global install:

```bash
npm link
emuku
```
