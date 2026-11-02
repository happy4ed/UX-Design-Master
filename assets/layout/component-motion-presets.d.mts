export type MotionStrength = 'static' | 'micro' | 'quiet' | 'balanced' | 'expressive' | 'dramatic';
export type MotionFeel = 'neutral' | 'precise' | 'brisk' | 'tension' | 'relax' | 'spring' | 'elastic' | 'linear' | 'stepped';
export interface MotionPreset {
  duration: number;
  pressScale: number;
  enterDistance: number;
  enterScale: number;
  galleryCycle: number;
  effectDistance: number;
  effectScale: number;
  effectAngle: number;
  effectBlur: number;
  strength: MotionStrength;
  feel: MotionFeel;
  easing: string;
  reduced: boolean;
}
export declare const motionStrengths: Readonly<Record<MotionStrength, Pick<MotionPreset, 'duration' | 'pressScale' | 'enterDistance' | 'enterScale' | 'galleryCycle' | 'effectDistance' | 'effectScale' | 'effectAngle' | 'effectBlur'>>>;
export declare const motionFeels: Readonly<Record<MotionFeel, {label: string; easing: string; description: string}>>;
export declare function resolveMotion(strength?: MotionStrength, feel?: MotionFeel, options?: {reduced?: boolean}): MotionPreset;
export declare function applyMotionPreset(root: HTMLElement, preset: MotionPreset): MotionPreset;
