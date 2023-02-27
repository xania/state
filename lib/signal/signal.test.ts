import { expect, describe, it, vi } from 'vitest';
import { BatchScheduler } from '../scheduler';
import { effect } from './effect';
import { memo } from './memo';
import { signal, Signal } from './signal';

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

    const eff01 = effect(
      count(
        () => {
          f.set(x.get() * y.get());
        },
        (x) => expect(x).toBeLessThan(4)
      )
    );

    expect(eff01.deps.length).toBe(2);

    x.set(11);
    expect(f.get()).toBe(33);
    y.set(12);
    expect(f.get()).toBe(132);
  });

  it('batch effects', () => {
    const batch = new BatchScheduler();

    const x = new Signal(2, batch);
    const y = new Signal(3, batch);

    const f = new Signal(0, batch);

    const eff01 = effect(
      count(
        () => {
          f.set(x.get() * y.get());
        },
        (x) => expect(x).toBeLessThan(4)
      )
    );
    expect(eff01.deps.length).toBe(2);

    x.set(11);
    expect(f.get()).toBe(6);
    y.set(12);
    expect(f.get()).toBe(6);

    batch.flush();

    expect(f.get()).toBe(132);
  });

  it('conditional signals', () => {
    const even = signal(false);

    const x = signal(1);
    const y = signal(2);

    const result = memo(() => (even.get() ? x.get() : y.get()));
    expect(result.deps.length).toBe(2);

    expect(result.get()).toBe(y.get());
    expect(x.operators).not.toBeDefined();
    expect(result.deps).toContain(y);
    expect(result.deps).toContain(even);
    expect(result.deps).not.toContain(x);
    even.set(true);
    expect(result.get()).toBe(x.get());
    expect(y.operators!.length).toBe(0);
    expect(result.deps).toContain(x);
    expect(result.deps).toContain(even);
    expect(result.deps).not.toContain(y);
  });
});

function count(fn: Function, cb: (n: number) => void) {
  let count = 0;
  return function () {
    fn();
    cb(++count);
  };
}
