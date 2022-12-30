import { notify } from './notify';
import { Rx } from './rx';
import { subscribe } from './subscribe';

export class MapOperator<T, U> implements Rx.Stateful<U>, Rx.MapOperator<T, U> {
  type: Rx.StateOperatorType.Map = Rx.StateOperatorType.Map;

  target: Rx.Stateful<U>;
  dirty: boolean = false;
  observers?: Rx.NextObserver<U>[] | undefined;
  operators?: Rx.StateOperator<U>[];

  constructor(
    public root: Rx.Root,
    public func: (t: T) => U,
    public snapshot?: U | undefined
  ) {
    this.target = this;
  }

  get() {
    return this.snapshot;
  }
  notify = notify;
  subscribe = subscribe;
  map = map;
}

export function map<T, U>(
  this: Rx.Stateful<T>,
  f: (x: T) => U
): Rx.Stateful<U> {
  const { snapshot, root } = this;
  const mappedValue = snapshot === undefined ? undefined : f(snapshot);
  const mop = new MapOperator(root, f, mappedValue);
  root.push(mop);
  const { operators } = this;
  if (operators) {
    operators.push(mop);
  } else {
    this.operators = [mop];
  }
  return mop;
}
