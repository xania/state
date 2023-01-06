import { MapOperator } from './map';
import { prop } from './prop';
import { Rx } from './rx';
import { subscribe } from './subscribe';
import { Value } from './value';

const syncValue = Symbol('snapshot');

class CombinedRoot implements Rx.Dependents {
  length: number = 0;
  constructor(public roots: Rx.Dependents[]) {}
  [n: number]: Rx.Stateful<any>;
  push(state: Rx.Stateful<any>) {
    this[this.length] = state;
    this.length++;

    const { roots } = this;

    let length = roots.length;
    while (length--) {
      roots[length].push(state);
    }
  }
}

const voidRoot: Rx.Dependents = {
  push() {},
  length: 0,
};

function createRoot(sources: Rx.Stateful<any>[]) {
  const roots: Rx.Dependents[] = [];

  for (const src of sources) {
    if (src.dependents === undefined) {
      roots.push((src.dependents = []));
    } else {
      const srcRoot: Rx.Dependents = src.dependents;

      if (srcRoot instanceof CombinedRoot) {
        for (const curr of srcRoot.roots) {
          if (!roots.includes(curr)) {
            roots.push(curr);
          }
        }
      } else if (!roots.includes(srcRoot)) {
        roots.push(srcRoot);
      }
    }
  }

  if (roots.length === 0) return voidRoot;
  if (roots.length === 1) return roots[0];

  return new CombinedRoot(roots);
}

type UnwrapState<T> = T extends Value<infer U> ? U : T;
type UnwrapStates<T> = { [P in keyof T]: UnwrapState<T[P]> };

export function combineLatest<TArgs extends [...Rx.Stateful<any>[]]>(
  sources: [...TArgs]
): Rx.Stateful<UnwrapStates<TArgs>> {
  const snapshot: any[] = [];

  const graph = createRoot(sources);
  const target = new CombineState<UnwrapStates<TArgs>>(graph, snapshot as any);
  graph.push(target);

  for (let i = 0, len = sources.length; i < len; i++) {
    const source = sources[i];
    snapshot[i] = source.snapshot;

    const mergeop: Rx.MergeOperator<any, any> = {
      type: Rx.StateOperatorType.Merge,
      property: i,
      snapshot,
      target,
    };
    const { operators } = source;
    if (operators) {
      operators.push(mergeop);
    } else {
      source.operators = [mergeop];
    }
  }

  return target;
}

class CombineState<T extends [...any[]]> implements Rx.Stateful<T> {
  observers?: Rx.NextObserver<T>[];
  operators?: Rx.StateOperator<T>[];
  dirty = false;

  constructor(public dependents: Rx.Dependents, public snapshot: T) {}

  get() {
    return this.snapshot;
  }

  prop = prop;
  subscribe = subscribe;

  map<U>(f: (x: T) => U) {
    const { snapshot } = this;
    let mappedValue = undefined;
    for (let i = 0, len = snapshot.length; i < len; i++) {
      if (snapshot[i] === undefined) break;
      if (i + 1 === len) {
        mappedValue = f(snapshot);
      }
    }

    const dependents: Rx.Dependents = this.dependents ?? (this.dependents = []);
    const operator: any = new MapOperator(dependents, f, mappedValue);
    dependents.push(operator);

    const { operators } = this;
    if (operators) {
      operators.push(operator);
    } else {
      this.operators = [operator];
    }

    return operator;
  }

  notify() {
    const { observers, snapshot } = this;
    if (observers && snapshot.every((x) => x !== undefined)) {
      for (const obs of observers as any) {
        if (obs[syncValue] !== snapshot) {
          obs[syncValue] = snapshot;
          obs.next(snapshot);
        }
      }
    }
  }
}
