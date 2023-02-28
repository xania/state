import { subscribe } from '../observable/subscribe';
import { Rx } from '../rx';
import { Signal } from './signal';

const computations: Computation[] = [];

export function compute<T>(fn: () => T) {
  const deps: Computation = [];
  computations.push(deps);
  const value = fn();
  if (deps !== computations.pop()) {
    throw Error('corrupt compute stack');
  }

  return [value, deps] as const;
}

export function register(signal: Signal | Computed) {
  if (computations.length) {
    // compute pending
    const computation = computations[computations.length - 1];
    if (!computation.includes(signal)) {
      computation.push(signal);
    }
  }
}

export type Computation = Rx.Stateful[];

export class Computed<T = any> implements Rx.Stateful<T> {
  constructor(
    public snapshot: T,
    public roots: Rx.Stateful[],
    public label?: string
  ) {}
  dependent?: Rx.Stateful<any> | undefined;
  dirty: boolean = false;
  observers?: Rx.NextObserver<T>[] | undefined;
  operators?: any[] | undefined;

  subscribe = subscribe;

  get = () => {
    register(this);
    return this.snapshot;
  };

  toString() {
    return this.label;
  }
}
