import { subscribe } from './subscribe';
import { Rx } from './rx';
import { notify } from './notify';
import { map, MapFunction } from './map';

export class Value<T> implements Rx.Stateful<T> {
  readonly observers?: Rx.StateObserver<T>[];
  readonly operators: Rx.StateOperator<T>[] = [];
  dirty = false;

  constructor(public root: Rx.Root, public snapshot?: T) {}

  get() {
    return this.snapshot;
  }

  map: MapFunction<T> = map;
  notify = notify;
  subscribe = subscribe;
}
