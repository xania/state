import { Rx } from './rx';
import { sync } from './sync';

export type SyncScheduler = {
  schedule(...state: Rx.Stateful[]): void;
};

export const DefaultSyncScheduler: SyncScheduler = {
  schedule(x) {
    sync([x]);
  },
};

export class BatchScheduler implements SyncScheduler {
  states: Rx.Stateful[] = [];

  schedule(state: Rx.Stateful<any>) {
    this.states.push(state);
  }

  flush() {
    const { states } = this;
    sync(states);
  }
}

export class AnimationScheduler implements SyncScheduler {
  states: Rx.Stateful[] = [];
  private _animationHndl: number = -1;

  schedule() {
    const { states } = this;
    states.push.apply(states, arguments as any);

    if (this._animationHndl < 0)
      this._animationHndl = requestAnimationFrame(this.flush);
  }

  cancel() {
    if (this._animationHndl < 0) cancelAnimationFrame(this._animationHndl);
  }

  flush = () => {
    sync(this.states);
    this._animationHndl = -1;
  };
}
