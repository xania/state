import { notify } from './notify';
import { prop } from './prop';
import { Rx } from './rx';
import { subscribe } from './subscribe';

export class MapOperator<T, U> implements Rx.Stateful<U>, Rx.MapOperator<T, U> {
  type: Rx.StateOperatorType.Map = Rx.StateOperatorType.Map;

  target: Rx.Stateful<U>;
  dirty: boolean = false;
  observers?: Rx.NextObserver<U>[] | undefined;
  operators?: Rx.StateOperator<U>[];

  constructor(
    public dependents: Rx.Dependents,
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
  prop = prop;
}

export type MapFunction<T> = <U>(
  this: Rx.Stateful<T>,
  f: (x: T) => U
) => Rx.Stateful<U>;

export function map<T, U>(
  this: Rx.Stateful<T>,
  f: (x: T) => U
): Rx.Stateful<U> {
  const { snapshot } = this;
  const mappedValue = snapshot === undefined ? undefined : f(snapshot);

  const dependents: Rx.Dependents = this.dependents ?? (this.dependents = []);
  const mop: any = new MapOperator(dependents, f, mappedValue);
  dependents.push(mop);
  const { operators } = this;
  if (operators) {
    operators.push(mop);
  } else {
    this.operators = [mop];
  }
  return mop;
}
