import { Rx } from '../rx';

export class MapOperator<T, U> implements Rx.MapOperator<T, U> {
  type: Rx.StateOperatorType.Map = Rx.StateOperatorType.Map;

  dirty: boolean = false;
  observers?: Rx.NextObserver<U>[] | undefined;
  operators?: Rx.StateOperator<U>[];

  constructor(public func: (t: T) => U, public target: Rx.Stateful<U>) {}
}

export function pushOperator(
  g: Rx.Stateful<void>,
  op: Rx.StateOperator<void>
): void;
export function pushOperator(
  g: Rx.Stateful<any>,
  op: Rx.StateOperator<any>
): void;
export function pushOperator(g: any, op: any) {
  // this.dependent = mop;
  const { operators } = g;
  if (operators) {
    operators.push(op);
  } else {
    g.operators = [op];
  }
}
export function removeOperator(s: Rx.Stateful, op: Rx.StateOperator) {
  const { operators } = s;
  if (operators) {
    const idx = operators.indexOf(op);
    if (idx >= 0) {
      operators.splice(idx, 1);
      return true;
    }
  }
  return false;
}
