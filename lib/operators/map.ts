import { Rx } from '../rx';

export class MapOperator<T, U> implements Rx.MapOperator<T, U> {
  type: Rx.StateOperatorType.Map = Rx.StateOperatorType.Map;

  dirty: boolean = false;
  observers?: Rx.NextObserver<U>[] | undefined;
  operators?: Rx.StateOperator<U>[];

  constructor(public func: (t: T) => U, public target: Rx.GraphNode<U>) {}
}

export function pushOperator(g: Rx.GraphNode, op: Rx.StateOperator<any>) {
  // this.dependent = mop;
  const { operators } = g;
  if (operators) {
    operators.push(op);
  } else {
    g.operators = [op];
  }
}
