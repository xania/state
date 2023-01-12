import { addDependent, removeDependent } from './map';
import { Rx } from './rx';
import { from } from './utils/from';
import { id } from './utils/id';
import { Value } from './value';

export function bind<T, U>(
  this: Rx.Stateful<T>,
  binder: (t: T) => Rx.StateInput<U>
): Rx.Stateful<U> {
  const { snapshot } = this;
  const target = new Value<U>();

  addDependent(this, target);

  const connectOp = {
    type: Rx.StateOperatorType.Bind,
    func: id,
    target,
  } as Rx.BindOperator<U>;

  const bindOp = {
    prevState: undefined as Rx.Stateful<U> | undefined | null,
    type: Rx.StateOperatorType.Bind,
    func(x: T): U {
      const boundState = from(binder(x));
      const { prevState } = this;
      if (prevState !== boundState) {
        if (prevState) {
          removeDependent(prevState, this.target);
          removeOperation(prevState, connectOp);
        }
        if (boundState) {
          addDependent(boundState, this.target, false);
          addOperation(boundState, connectOp);
        }
        this.prevState = boundState;
        return boundState?.snapshot as U;
      } else {
        return prevState?.snapshot as U;
      }
    },
    target,
  };

  if (snapshot) {
    const init = bindOp.func(snapshot);
    if (init !== undefined) {
      target.snapshot = init;
    }
  }

  addOperation(this, bindOp as Rx.StateOperator<T>);
  return target;
}

function removeOperation<T>(state: Rx.Stateful<T>, op: Rx.StateOperator<T>) {
  const { operators } = state;
  if (operators) {
    const idx = operators.indexOf(op);
    operators.splice(idx, 1);
  }
}

function addOperation<T>(state: Rx.Stateful<T>, op: Rx.StateOperator<T>) {
  const { operators } = state;
  if (operators) {
    operators.push(op);
  } else {
    state.operators = [op];
  }
}
