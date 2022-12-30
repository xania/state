import { Rx } from './rx';
import { Value } from './value';

export class State<T> extends Value<T> {
  dependents: Rx.Stateful<any>[];
  constructor(public snapshot?: T) {
    const dependents: Rx.Stateful<any>[] = [];
    super(dependents, snapshot);
    dependents.push(this);
    this.dependents = dependents;
  }

  set(input: T | Updater<T>) {
    const { snapshot, dependents } = this;
    const newValue = input instanceof Function ? input(snapshot) : input;

    if (newValue !== snapshot) {
      this.snapshot = newValue;
      this.dirty = true;
    }

    for (let i = 0, len = dependents.length; i < len; i++) {
      const curr = dependents[i];

      if (!curr.dirty) {
        continue;
      }

      curr.dirty = false;
      if (curr.observers) curr.notify();

      const { snapshot, operators } = curr;

      if (snapshot !== undefined && operators !== undefined) {
        for (let o = 0, olen = operators.length; o < olen; o++) {
          const operator = operators[o];
          switch (operator.type) {
            case Rx.StateOperatorType.Apply:
              const { func: applyfunc } = operator;
              const applyValue = applyfunc.apply(operator, snapshot);
              const { target: applyTarget } = operator;
              if (applyTarget.snapshot !== applyValue) {
                applyTarget.snapshot = applyValue;
                applyTarget.dirty = true;
              }
              break;
            case Rx.StateOperatorType.Map:
              const { func: mapfunc } = operator;
              const mappedValue = mapfunc(snapshot);
              const { target } = operator;
              if (target.snapshot !== mappedValue) {
                target.snapshot = mappedValue;
                target.dirty = true;
              }
              break;
            case Rx.StateOperatorType.Merge:
              const { property } = operator;
              if (operator.snapshot[property] !== snapshot) {
                operator.snapshot[property] = snapshot;
                const { target } = operator;
                target.dirty = true;
              }
              break;
          }
        }
      }
    }
  }
}

type Updater<T> = (t?: T) => undefined | T;
