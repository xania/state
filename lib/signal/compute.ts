import { Signal } from './signal';

const computations: Computation[] = [];

export function compute(fn: Function) {
  const computation: Computation = [];
  computations.push(computation);
  const value = fn();
  if (computation !== computations.pop()) {
    throw Error('corrupt compute stack');
  }

  if (computations.length) {
    const parent = computations[computations.length - 1];
    parent.push(...computation);
  }

  return [value, computation] as const;
}

export function register(signal: Signal<any>) {
  if (computations.length) {
    // compute pending
    const computation = computations[computations.length - 1];

    let len = computation.length;
    while (len--) {
      if (computation[len] === signal) break;
    }
    if (len < 0) computation.push(signal);
  }
}

export type Computation = Signal<any>[];
