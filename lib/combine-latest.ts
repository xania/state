import { Rx } from './rx';
import { Value } from './value';

const syncValue = Symbol('snapshot');

class CombinedRoot implements Rx.Root {
  constructor(public roots: Rx.Root[]) {}
  append(state: Rx.Stateful<any>) {
    for (const root of this.roots) {
      root.append(state);
    }
  }
}

function createRoot(sources: Rx.Stateful<any>[]) {
  const roots: Rx.Root[] = [];

  for (const s of sources) {
    if (!roots.includes(s.root)) {
      roots.push(s.root);
    }
  }

  if (roots.length === 1) return roots[0];

  return new CombinedRoot(roots);
}

export function combineLatest<TArgs extends [...Rx.Stateful<any>[]], U>(
  sources: [...TArgs]
) {
  const snapshot = sources.map((x) => x.snapshot) as Rx.UnwrapStates<TArgs>;

  const root = createRoot(sources);
  const target = new CombineState(root, snapshot);
  root.append(target);

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    source.operators.push({
      type: Rx.StateOperatorType.Merge,
      property: i,
      snapshot,
      target,
      dependencies: sources,
    });
  }

  return target;
}

class CombineState<T extends [...any[]]> implements Rx.Stateful<T> {
  observers: Rx.NextObserver<T>[] = [];
  operators: Rx.StateOperator<T>[] = [];

  constructor(public root: Rx.Root, public snapshot: T) {}

  map<U>(f: (x: T) => U) {
    const { snapshot } = this;
    const mappedValue = snapshot.some((x) => x === undefined)
      ? undefined
      : f(snapshot);
    const m = new Value(this.root, mappedValue);
    this.operators.push({
      type: Rx.StateOperatorType.Map,
      func: f,
      target: m,
    });
    return m;
  }

  notify() {
    const { observers, snapshot } = this;
    if (snapshot.every((x) => x !== undefined)) {
      for (const obs of observers as any) {
        if (obs[syncValue] !== snapshot) {
          obs[syncValue] = snapshot;
          obs.next(snapshot);
        }
      }
    }
  }
}
