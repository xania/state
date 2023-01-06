import { rent, release } from './array-pool';
import { MapOperator } from './map';
import { prop } from './prop';
import { Rx } from './rx';
import { subscribe } from './subscribe';
import { Value } from './value';

const syncValue = Symbol('snapshot');

class CombinedDependents implements Rx.Dependents {
  constructor(public roots: Rx.Dependents[]) {}
  [n: number]: Rx.Stateful<any>;
  push(state: Rx.Stateful<any>) {
    const { roots } = this;

    let length = roots.length;
    while (length--) {
      roots[length].push(state);
    }
  }
}

const voidRoot: Rx.Dependents = {
  push() {},
};

function combineDependents(sources: Rx.Stateful<any>[]) {
  const slen = sources.length;

  const roots = rent();
  let rootsLength = 0;

  for (let i = 0; i < slen; i++) {
    const source = sources[i];
    let dependents = source.dependents;
    if (!dependents) {
      source.dependents = dependents = [];
      roots[rootsLength++] = dependents;
    } else if (dependents instanceof CombinedDependents) {
      const sourceRoots = dependents.roots;
      for (let s = 0, srLen = sourceRoots.length; s < srLen; s++) {
        const srcRoot = sourceRoots[s];
        let included = false;
        for (let i = 0; i < rootsLength; i++) {
          if (roots[i] === srcRoot) {
            included = true;
            break;
          }
        }
        if (!included) {
          roots[rootsLength++] = srcRoot;
        }
      }
    } else {
      let included = false;
      for (let i = 0; i < rootsLength; i++) {
        if (roots[i] === dependents) {
          included = true;
          break;
        }
      }
      if (!included) {
        roots[rootsLength++] = dependents;
      }
    }
  }

  if (rootsLength === 0) return voidRoot;
  if (rootsLength === 1) return roots[0];

  const clone = roots.slice(0, rootsLength);
  release(roots);

  return new CombinedDependents(clone);
}

type UnwrapState<T> = T extends Value<infer U> ? U : T;
type UnwrapStates<T> = { [P in keyof T]: UnwrapState<T[P]> };

export function combineLatest<TArgs extends [...Rx.Stateful<any>[]]>(
  sources: [...TArgs]
): Rx.Stateful<UnwrapStates<TArgs>> {
  const snapshot: any[] = [];

  const dependents = combineDependents(sources);
  const target = new CombinedState<UnwrapStates<TArgs>>(
    dependents,
    snapshot as any
  );
  dependents.push(target);

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

class CombinedState<T extends [...any[]]> implements Rx.Stateful<T> {
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
