import { Rx } from './rx';
import { sync } from './sync';

export type SyncScheduler = {
  schedule(...state: Rx.GraphNode[]): void;
};

export const DefaultSyncScheduler: SyncScheduler = {
  schedule: sync,
};

export class BatchScheduler implements SyncScheduler {
  states: Rx.Stateful[] = [];

  schedule() {
    const { states } = this;
    states.push.apply(states, arguments as any);
  }

  flush() {
    const { states } = this;
    sync(...states);
    states.length = 0;
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
    const { states } = this;
    sync(...states);
    states.length = 0;
    this._animationHndl = -1;
  };
}
