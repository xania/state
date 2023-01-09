import { addDependent, MapOperator } from './map';
import { prop } from './prop';
import { Rx } from './rx';
import { subscribe } from './subscribe';
const syncValue = Symbol('snapshot');

type UnwrapState<T> = T extends Rx.Stateful<infer U> ? U : never;
type UnwrapStates<T> = { [P in keyof T]: UnwrapState<T[P]> };

export function combineLatest<TArgs extends [...Rx.Stateful<any>[]]>(
  sources: [...TArgs]
): Rx.Stateful<UnwrapStates<TArgs>> {
  const snapshot: any[] = [];

  const target = new CombinedState<UnwrapStates<TArgs>>(snapshot as any);

  for (const source of sources) {
    addDependent(source, target, false);
  }

  for (let i = 0, len = sources.length; i < len; i++) {
    const source = sources[i];
    snapshot[i] = source.snapshot;

    const mergeOp: Rx.MergeOperator<any, any> = {
      type: Rx.StateOperatorType.Merge,
      property: i,
      snapshot,
      target,
    };
    const { operators } = source;
    if (operators) {
      operators.push(mergeOp);
    } else {
      source.operators = [mergeOp];
    }
  }

  return target;
}

class CombinedState<T extends [...any[]]> implements Rx.Stateful<T> {
  observers?: Rx.NextObserver<T>[];
  operators?: Rx.StateOperator<T>[];
  dirty = false;

  constructor(public snapshot: T) {}

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

    const operator: any = new MapOperator(f, mappedValue);
    addDependent(this, operator, false);

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
