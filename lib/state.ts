import { Rx } from './rx';
import { Value } from './value';

export class State<T> extends Value<T> {
  constructor(public snapshot?: T) {
    super(snapshot);
  }

  set(input: T | Updater<T>, autoSync: boolean = true) {
    const { snapshot } = this;
    const newValue = input instanceof Function ? input(snapshot) : input;

    if (newValue !== snapshot) {
      this.snapshot = newValue;
      this.dirty = true;
    }

    if (autoSync) sync(this);
  }
}

type Updater<T> = (t?: T) => undefined | T;

export function sync(state: Rx.Stateful) {
  let curr: Rx.Stateful | undefined = state;
  while (curr) {
    if (curr.dirty) {
      curr.dirty = false;
      if (curr.observers) curr.notify();

      const { snapshot, operators } = curr;

      if (snapshot !== undefined && operators !== undefined) {
        for (let o = 0, olen = operators.length; o < olen; o++) {
          const operator = operators[o];
          switch (operator.type) {
            case Rx.StateOperatorType.Map:
              const mappedValue = operator.func(snapshot);
              const { target } = operator;
              if (target.snapshot !== mappedValue) {
                target.snapshot = mappedValue;
                target.dirty = true;
              }
              break;
            case Rx.StateOperatorType.Bind:
              const bindValue = operator.func(snapshot);
              const bindTarget = operator.target;
              if (bindTarget.snapshot !== bindValue) {
                bindTarget.snapshot = bindValue;
                bindTarget.dirty = true;
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

    curr = curr.dependent;
  }
}
