import { subscribe } from '../observable/subscribe';
import { Rx } from '../rx';
import { DefaultSyncScheduler, SyncScheduler } from '../scheduler';
import { register } from './compute';

export class Signal<T = any> implements Rx.Stateful<T> {
  constructor(
    public snapshot: T,
    public scheduler: SyncScheduler = DefaultSyncScheduler
  ) {}

  dependent?: Rx.Stateful<any> | undefined;
  dirty: boolean = false;
  observers?: Rx.NextObserver<T>[] | undefined;
  operators?: Rx.StateOperator<T>[] | undefined;

  subscribe = subscribe;

  get = () => {
    register(this);
    return this.snapshot as T;
  };

  set = (newValue: T) => {
    const { snapshot } = this;
    if (newValue === snapshot) {
      return false;
    }
    this.snapshot = newValue;
    if (this.dirty) {
      return false;
    }
    this.dirty = true;
    this.scheduler.schedule(this);
    return true;
  };
}

export function signal<T>(value: T, scheduler?: SyncScheduler) {
  return new Signal(value, scheduler);
}
