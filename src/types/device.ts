export interface IOSDevice {
  udid: string;
  name: string;
  state: 'Booted' | 'Shutdown';
  isAvailable: boolean;
  runtime: string;        // e.g., "iOS 26.2"
  runtimeId: string;      // e.g., "com.apple.CoreSimulator.SimRuntime.iOS-26-2"
  deviceType: string;     // e.g., "iPhone 17 Pro"
}

export interface AndroidDevice {
  avdName: string;
  state: 'Running' | 'Stopped';
  port?: number;           // e.g., 5554 if running
}
