import { bind } from './bind';
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

  constructor(public func: (t: T) => U, public snapshot?: U | undefined) {
    this.target = this;
  }

  get() {
    return this.snapshot;
  }
  notify = notify;
  subscribe: Rx.Stateful<U>['subscribe'] = subscribe;
  map = map;
  bind = bind;
  prop = prop;
}

export function map<T, U>(this: Rx.Stateful<T>, f: (x: T) => U) {
  const { snapshot } = this;
  const mappedValue = snapshot === undefined ? undefined : f(snapshot);

  const mop: any = new MapOperator(f, mappedValue);
  addDependent(this, mop);
  // this.dependent = mop;
  const { operators } = this;
  if (operators) {
    operators.push(mop);
  } else {
    this.operators = [mop];
  }
  return mop;
}

export function addDependent(
  source: Rx.Stateful,
  dependent: Rx.Stateful,
  checkCircular: boolean = true
): boolean {
  if (source === dependent) return false;

  if (checkCircular) {
    let d: Rx.Stateful | undefined = dependent;
    do {
      if (d === source) throw Error('circular');
      d = d.dependent;
    } while (d);
  }

  while (source.dependent) {
    source = source.dependent;
  }

  if (source === dependent) return false;
  source.dependent = dependent;
  return true;
}

export function removeDependent(
  source: Rx.Stateful,
  dependent: Rx.Stateful
): boolean {
  while (source.dependent) {
    if (source.dependent === dependent) {
      source.dependent = dependent.dependent;

      return true;
    }
    source = source.dependent;
  }
  return false;
}
