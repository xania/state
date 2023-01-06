import { subscribe } from './subscribe';
import { Rx } from './rx';
import { notify } from './notify';
import { map } from './map';
import { prop, PropertyFunction } from './prop';
import { bind } from './bind';

export class Value<T> implements Rx.Stateful<T> {
  readonly observers?: Rx.StateObserver<T>[];
  readonly operators: Rx.StateOperator<T>[] = [];
  public dependents?: Rx.Stateful<any>[];
  dirty = false;

  constructor(public snapshot?: T) {
    this.prop = null as any;
  }

  get() {
    return this.snapshot;
  }

  map = map;

  prop: PropertyFunction<T> = prop;
  notify = notify;
  subscribe = subscribe;
  bind = bind;
}
