import { notify } from './notify';
import { Rx } from './rx';

export function sync(stack: Rx.Stateful[]) {
  while (stack.length) {
    let curr: Rx.Stateful = stack.pop()!;
    if (curr.dirty) {
      curr.dirty = false;
      if (curr.observers) notify(curr);

      const { snapshot, operators } = curr;

      if (operators !== undefined) {
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
                if (!target.dirty) {
                  target.dirty = true;
                  // pending.push(target);
                  stack.push(target);
                }
              }
              break;
            case Rx.StateOperatorType.Signal:
              if (operator.update()) {
                const target = operator.target;
                target.dirty = true;
                stack.push(target);
              }
              break;
          }
        }
      }

      if (curr.dependent) {
        stack.push(curr.dependent);
      }
    }
  }
}
