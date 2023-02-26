import { expect, describe, it } from 'vitest';
import { BatchScheduler } from '../scheduler';
import { effect } from './effect';
import { memo } from './memo';
import { Signal } from './signal';

describe('signal', () => {
  it('create', () => {
    const signal = new Signal(0);
    expect(signal.get()).toBe(0);
  });

  it('compute 0', () => {
    const y = memo(() => 2);
    expect(y.get()).toBe(2);
  });

  it('compute 1', () => {
    const x = new Signal(1);
    const y = memo(() => x.get() * 2);
    expect(y.get()).toBe(x.get() * 2);
  });

  it('compute more', () => {
    const x = new Signal(2);
    const y = new Signal(3);
    const z = memo(() => x.get() * y.get());
    expect(z.get()).toBe(6);
  });

  it('effect', () => {
    const x = new Signal(2);
    const y = new Signal(3);

    const f = new Signal(0);

    effect(() => {
      f.set(x.get() * y.get());
    });

    x.set(11);
    expect(f.get()).toBe(33);
    y.set(12);
    expect(f.get()).toBe(132);
  });

  it('batch effects', () => {
    const x = new Signal(2);
    const y = new Signal(3);

    const f = new Signal(0);

    effect(() => {
      f.set(x.get() * y.get());
    });

    const batch = new BatchScheduler();

    x.set(11, batch);
    expect(f.get()).toBe(6);
    y.set(12, batch);
    expect(f.get()).toBe(6);

    batch.flush();

    expect(f.get()).toBe(132);
  });
});
