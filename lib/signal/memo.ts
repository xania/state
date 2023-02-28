// import { UnwrapStates } from '../observable/combine-latest';
import { pushOperator, removeOperator } from '../operators/map';
import { Rx } from '../rx';
import { Computation, compute, Computed } from './compute';

export function memo<T>(fn: () => T, label?: string) {
  const [value, deps] = compute(fn);
  const roots = resolveRoots(deps);
  const computed = new Computed(value, roots, label);
  if (deps.length > 0) {
    const signalOp = {
      type: Rx.StateOperatorType.Signal,
      target: computed,
      get ready() {
        for (const s of roots) {
          if (s.dirty) return false;
        }
        return true;
      },
      update() {
        const [newValue, newDeps] = compute(fn);
        resolveRoots(newDeps, computed.roots);
        for (let i = 0, len = deps.length; i < len; i++) {
          removeOperator(deps[i], signalOp);
        }
        for (let i = 0; i < newDeps.length; i++) {
          pushOperator(newDeps[i], signalOp);
        }

        if (newValue !== computed.snapshot) {
          computed.snapshot = newValue;
          computed.dirty = true;
        } else if (computed.dirty) {
          debugger;
        }
      },
    } satisfies Rx.SignalOperator<T>;

    for (let i = 0; i < deps.length; i++) {
      pushOperator(deps[i], signalOp);
    }
  }
  return computed;
}
function resolveRoots(deps: Computation, retval: Rx.Stateful[] = []) {
  retval.length = 0;
  for (const d of deps) {
    if (d instanceof Computed) {
      retval.push(...d.roots);
    } else {
      retval.push(d);
    }
  }
  return retval;
}
