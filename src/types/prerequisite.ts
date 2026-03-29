export interface PrerequisiteCheck {
  name: string;
  description: string;
  installed: boolean;
  version?: string;
  fixCommand?: string;
  fixInstructions?: string;
}
