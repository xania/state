import { subscribe } from './subscribe';
import { Rx } from './rx';
import { notify } from './notify';
import { map } from './map';

export class Value<T> implements Rx.Stateful<T> {
  readonly observers?: Rx.StateObserver<T>[];
  readonly operators: Rx.StateOperator<T>[] = [];
  dirty = false;

  constructor(public root: Rx.Root, public snapshot?: T) {}

  get() {
    return this.snapshot;
  }

  map = map;
  notify = notify;
  subscribe = subscribe;
}
