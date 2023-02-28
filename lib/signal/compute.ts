import { subscribe } from '../observable/subscribe';
import { Rx } from '../rx';
import { Signal } from './signal';

const computations: Computation[] = [];

export function compute<T>(fn: () => T, deps: Computation) {
  deps.length = 0;
  computations.push(deps);
  const value = fn();
  if (deps !== computations.pop()) {
    throw Error('corrupt compute stack');
  }

  return value;
}

export function register(signal: Signal | Computed) {
  if (computations.length) {
    // compute pending
    const computation = computations[computations.length - 1];

    const stack: typeof signal[] = [signal];
    while (stack.length) {
      const curr = stack.pop()!;
      if (curr instanceof Signal) {
        let len = computation.length;
        while (len--) {
          if (computation[len] === curr) break;
        }
        if (len < 0) computation.push(curr);
      } else {
        stack.push(...curr.deps);
      }
    }
  }
}

export type Computation = Signal<any>[];

export class Computed<T = any> implements Rx.Stateful<T> {
  constructor(
    public snapshot: T,
    public deps: Signal[],
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
