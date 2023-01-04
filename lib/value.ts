import { subscribe } from './subscribe';
import { Rx } from './rx';
import { notify } from './notify';
import { map, MapFunction } from './map';
import { prop, PropertyFunction } from './prop';

export class Value<T> implements Rx.Stateful<T> {
  readonly observers?: Rx.StateObserver<T>[];
  readonly operators: Rx.StateOperator<T>[] = [];
  dirty = false;

  constructor(public root: Rx.Root, public snapshot?: T) {}

  get() {
    return this.snapshot;
  }

  map: MapFunction<T> = map;
  prop: PropertyFunction<T> = prop;
  notify = notify;
  subscribe = subscribe;
}
