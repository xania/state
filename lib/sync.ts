import { notify } from './notify';
import { Rx } from './rx';

export function sync(...states: Rx.GraphNode[]) {
  let statesLen = states.length;
  while (statesLen--) {
    let curr: Rx.GraphNode | undefined = states[statesLen];
    while (curr) {
      if (curr.dirty) {
        curr.dirty = false;
        if (curr.observers) notify(curr);

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
}
