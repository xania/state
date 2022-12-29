import { Rx } from './rx';
import { Value } from './value';

class Root {
  constructor(public dependents: Rx.Stateful<any>[]) {}

  append(state: Rx.Stateful<any>) {
    this.dependents.push(state);
  }
}
export class State<T> extends Value<T> {
  dependents: Rx.Stateful<any>[];
  constructor(public snapshot?: T) {
    const dependents: Rx.Stateful<any>[] = [];
    super(new Root(dependents), snapshot);
    dependents.push(this);
    this.dependents = dependents;
  }

  update(input: T | Updater<T>) {
    const { snapshot } = this;
    const newValue = input instanceof Function ? input(snapshot) : input;

    const dirty = new Set<Rx.Stateful<any>>();

    if (newValue !== this.snapshot) {
      this.snapshot = newValue;
      dirty.add(this);
    }
    for (const curr of this.dependents) {
      const { snapshot } = curr;

      if (snapshot !== undefined) {
        for (const o of curr.operators) {
          switch (o.type) {
            case Rx.StateOperatorType.Map:
              const mappedValue = o.func(snapshot);
              if (o.target.snapshot !== mappedValue) {
                o.target.snapshot = mappedValue;
                dirty.add(o.target);
              }
              break;
            case Rx.StateOperatorType.Merge:
              if (o.snapshot[o.property] !== snapshot) {
                o.snapshot[o.property] = snapshot;
                dirty.add(o.target);
              }
              break;
          }
        }
      }
    }

    for (const d of dirty) {
      d.notify();
    }
  }
}

type Updater<T> = (t?: T) => undefined | T;
