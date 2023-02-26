import { subscribe } from '../observable/subscribe';
import { Rx } from '../rx';
import { DefaultSyncScheduler } from '../scheduler';
import { register } from './compute';

export class Signal<T> implements Rx.GraphNode {
  constructor(public snapshot: T) {}
  dependent?: Rx.Stateful<any> | undefined;
  dirty: boolean = false;
  observers?: Rx.NextObserver<T>[] | undefined;
  operators?: Rx.StateOperator<T>[] | undefined;

  subscribe = subscribe;

  get = () => {
    register(this);
    return this.snapshot as T;
  };

  set = (newValue: T, scheduler = DefaultSyncScheduler) => {
    const { snapshot } = this;
    if (newValue !== snapshot) {
      this.snapshot = newValue;
      this.dirty = true;
    }
    scheduler?.schedule(this);
  };
}
