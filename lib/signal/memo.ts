// import { UnwrapStates } from '../observable/combine-latest';
import { pushOperator, removeOperator } from '../operators/map';
import { Rx } from '../rx';
import { compute, Computed } from './compute';
import { Signal } from './signal';

export function memo<T>(fn: () => T, label?: string) {
  const deps: Signal[] = [];
  const value = compute(fn, deps);
  const computed = new Computed(value, deps, label);
  if (deps.length === 0) {
    return computed;
  } else {
    const signalOp = {
      type: Rx.StateOperatorType.Signal,
      target: computed,
      deps,
      update() {
        for (let i = 0, len = deps.length; i < len; i++) {
          removeOperator(deps[i], signalOp);
        }
        computed.snapshot = compute(fn, deps);
        for (let i = 0; i < deps.length; i++) {
          pushOperator(deps[i], signalOp);
        }
      },
    } satisfies Rx.SignalOperator<T>;

    for (let i = 0; i < deps.length; i++) {
      pushOperator(deps[i], signalOp);
    }

    return computed;
  }
}
