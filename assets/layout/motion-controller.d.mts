export type MotionMode = 'none' | 'trace' | 'reveal' | 'pulse';
export type MotionState = {
  running: boolean;
  paused?: boolean;
  reduced?: boolean;
  animations?: number;
  reason?: 'static' | 'reduced-motion' | 'missing-target' | 'unsupported-mode';
};
export declare class MotionController {
  constructor(root: Element);
  readonly root: Element;
  readonly animations: Animation[];
  readonly mode: MotionMode;
  stop(): void;
  play(mode: MotionMode, options?: {paused?: boolean; force?: boolean}): MotionState;
  setPaused(paused: boolean): MotionState;
}
