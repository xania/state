import { subscribe } from './subscribe';
import { Rx } from './rx';

export class Value<T> implements Rx.Stateful<T> {
  readonly observers?: Rx.StateObserver<T>[];
  readonly operators: Rx.StateOperator<T>[] = [];
  dirty = false;

  constructor(public root: Rx.Root, public snapshot?: T) {}

  get() {
    return this.snapshot;
  }

  map<U>(f: (x: T) => U) {
    const { snapshot, root } = this;
    const mappedValue = snapshot === undefined ? undefined : f(snapshot);
    const m = new Value(root, mappedValue);
    this.root.push(m);
    this.operators.push({
      type: Rx.StateOperatorType.Map,
      func: f,
      target: m,
    });
    return m;
  }

  notify() {
    const { observers, snapshot } = this;
    if (observers !== undefined && snapshot !== undefined)
      for (const obs of observers as any) {
        obs.next(snapshot);
      }
  }

  subscribe = subscribe;
}
