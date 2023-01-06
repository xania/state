import { release, rent } from './array-pool';
import { Rx } from './rx';
import { Value } from './value';

export class State<T> extends Value<T> {
  public dependents?: Rx.Stateful<any>[];
  constructor(public snapshot?: T) {
    super(snapshot);
  }

  set(input: T | Updater<T>) {
    const { snapshot, dependents } = this;
    const newValue = input instanceof Function ? input(snapshot) : input;

    if (newValue !== snapshot) {
      this.snapshot = newValue;
      this.dirty = true;
    }

    const stack: Rx.Stateful<any>[] = rent();

    let stackLen = 0;
    if (dependents) {
      for (let i = dependents.length - 1; i >= 0; i--) {
        stack[stackLen++] = dependents[i];
      }
    }
    stack[stackLen++] = this as Rx.Stateful<any>;

    while (stackLen--) {
      const curr = stack[stackLen]!;
      // const curr = graph[i++];

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
              stack[stackLen++] = bindTarget;
              if (bindTarget.snapshot !== bindValue) {
                bindTarget.snapshot = bindValue;
                bindTarget.dirty = true;
                const g = bindTarget.dependents;
                if (g instanceof Array) {
                  for (let i = g.length - 1; i >= 0; i--) {
                    stack[stackLen++] = g[i];
                  }
                } else {
                  throw Error('bind is not implemented');
                }
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

    release(stack);
  }
}

type Updater<T> = (t?: T) => undefined | T;
