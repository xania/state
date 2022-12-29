import { subscribe } from './subscribe';
import { Rx } from './rx';

const syncValue = Symbol('snapshot');

export class Value<T> implements Rx.Stateful<T> {
  // readonly dependents: Dependent<T>[] = [];
  readonly observers: Rx.StateObserver<T>[] = [];
  readonly operators: Rx.StateOperator<T>[] = [];

  constructor(public root: Rx.Root, public snapshot?: T) {}

  map<U>(f: (x: T) => U) {
    const { snapshot, root } = this;
    const mappedValue = snapshot === undefined ? undefined : f(snapshot);
    const m = new Value(root, mappedValue);
    this.root.append(m);
    this.operators.push({
      type: Rx.StateOperatorType.Map,
      func: f,
      target: m,
    });
    return m;
  }

  notify() {
    const { observers, snapshot } = this;
    if (snapshot !== undefined)
      for (const obs of observers as any) {
        if (obs[syncValue] !== snapshot) {
          obs[syncValue] = snapshot;
          obs.next(snapshot);
        }
      }
  }

  subscribe = subscribe;
}
