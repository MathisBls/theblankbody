import type * as THREE from 'three';

export interface SpringConfig {
  stiffness: number;
  damping: number;
}

/** Slightly under-damped: a small, playful overshoot. */
export const BOUNCY_SPRING: SpringConfig = { stiffness: 130, damping: 15 };
export const SOFT_SPRING: SpringConfig = { stiffness: 70, damping: 14 };

const MAX_STEP_SECONDS = 1 / 60;
const MAX_FRAME_SECONDS = 1 / 15;

function integrate(
  position: number,
  velocity: number,
  target: number,
  config: SpringConfig,
  seconds: number,
): [number, number] {
  const acceleration = config.stiffness * (target - position) - config.damping * velocity;
  const nextVelocity = velocity + acceleration * seconds;
  return [position + nextVelocity * seconds, nextVelocity];
}

function forEachStep(delta: number, step: (seconds: number) => void): void {
  let remaining = Math.min(delta, MAX_FRAME_SECONDS);
  while (remaining > 0) {
    const seconds = Math.min(remaining, MAX_STEP_SECONDS);
    step(seconds);
    remaining -= seconds;
  }
}

/** Semi-implicit Euler spring on a vector, sub-stepped so it stays stable on slow frames. */
export function springVector3(
  current: THREE.Vector3,
  velocity: THREE.Vector3,
  target: THREE.Vector3,
  config: SpringConfig,
  delta: number,
): void {
  forEachStep(delta, (seconds) => {
    [current.x, velocity.x] = integrate(current.x, velocity.x, target.x, config, seconds);
    [current.y, velocity.y] = integrate(current.y, velocity.y, target.y, config, seconds);
    [current.z, velocity.z] = integrate(current.z, velocity.z, target.z, config, seconds);
  });
}

export interface ScalarSpringState {
  value: number;
  velocity: number;
}

export function springScalar(state: ScalarSpringState, target: number, config: SpringConfig, delta: number): void {
  forEachStep(delta, (seconds) => {
    [state.value, state.velocity] = integrate(state.value, state.velocity, target, config, seconds);
  });
}
