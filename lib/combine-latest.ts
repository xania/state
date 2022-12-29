import { Rx } from './rx';
import { Value } from './value';

const syncValue = Symbol('snapshot');

class CombinedRoot implements Rx.Root {
  constructor(public roots: Rx.Root[]) {}
  push(state: Rx.Stateful<any>) {
    const { roots } = this;

    let length = roots.length;
    while (length--) {
      roots[length].push(state);
    }
  }
}

const voidRoot: Rx.Root = {
  push() {},
};

function createRoot(sources: Rx.Stateful<any>[]) {
  const roots: Rx.Root[] = [];

  for (const src of sources) {
    const srcRoot = src.root;
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

  if (roots.length === 0) return voidRoot;
  if (roots.length === 1) return roots[0];

  return new CombinedRoot(roots);
}

export function combineLatest<TArgs extends [...Rx.Stateful<any>[]]>(
  sources: [...TArgs]
) {
  const snapshot: any[] = [];

  const root = createRoot(sources);
  const target = new CombineState<Rx.UnwrapStates<TArgs>>(
    root,
    snapshot as any
  );
  root.push(target);

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    snapshot[i] = source.snapshot;
    source.operators.push({
      type: Rx.StateOperatorType.Merge,
      property: i,
      snapshot,
      target,
    });
  }

  return target;
}

class CombineState<T extends [...any[]]> implements Rx.Stateful<T> {
  observers: Rx.NextObserver<T>[] = [];
  operators: Rx.StateOperator<T>[] = [];
  dirty = false;

  constructor(public root: Rx.Root, public snapshot: T) {}

  map<U>(f: (x: T) => U) {
    const { snapshot, root } = this;
    let mappedValue = undefined;
    for (let i = 0, len = snapshot.length; i < len; i++) {
      if (snapshot[i] === undefined) break;
      if (i + 1 === len) {
        mappedValue = f(snapshot);
      }
    }
    const target = new Value(root, mappedValue);
    root.push(target);
    this.operators.push({
      type: Rx.StateOperatorType.Map,
      func: f,
      target: target,
    });
    return target;
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
