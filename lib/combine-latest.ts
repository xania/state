import { MapOperator } from './map';
import { Rx } from './rx';

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

  constructor(public root: Rx.Root, public snapshot: T) {}

  get() {
    return this.snapshot;
  }

  map<U>(f: (x: T) => U) {
    const { snapshot, root } = this;
    let mappedValue = undefined;
    for (let i = 0, len = snapshot.length; i < len; i++) {
      if (snapshot[i] === undefined) break;
      if (i + 1 === len) {
        mappedValue = f(snapshot);
      }
    }

    const operator = new MapOperator(root, f, mappedValue);
    root.push(operator);

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
