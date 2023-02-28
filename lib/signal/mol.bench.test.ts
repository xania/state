import { describe, it } from 'vitest';
import { batch } from '../scheduler';
import { effect } from './effect';
import { memo } from './memo';
import { signal } from './signal';

function fib(n: number): number {
  if (n < 2) return 1;
  return fib(n - 1) + fib(n - 2);
}
function hard(n: number, log: string) {
  const res = n + fib(16);
  return res;
}
const numbers = Array.from({ length: 5 }, (_2, i) => i);

describe('benchmarks', () => {
  it('mol bench', () => {
    let res: any[] = [];
    const A2 = signal(0, 'A2');
    const B = signal(0, 'B');
    const C = memo(() => (A2.get() % 2) + (B.get() % 2), 'C');
    const D = memo(
      () => numbers.map((i) => ({ x: i + (A2.get() % 2) - (B.get() % 2) })),
      'D'
    );
    const E = memo(() => hard(C.get() + A2.get() + D.get()[0].x, 'E'), 'E');
    const F = memo(() => hard(D.get()[2].x || B.get(), 'F'), 'F');
    const G = memo(
      () => C.get() + (C.get() || E.get() % 2) + D.get()[4].x + F.get(),
      'G'
    );
    const H2 = effect(() => res.push(hard(G.get(), 'H')), 'H2');
    const I2 = effect(() => res.push(G.get()), 'I2');
    const J = effect(
      () => res.push('J ' + F.get() + ' - ' + hard(F.get(), 'J')),
      'J'
    );
    function iter(i: number) {
      res.length = 0;
      console.log('---------- ' + i);
      batch(() => {
        B.set(1);
        A2.set(1 + i * 2);
      });
      console.log(res.join(', '));

      console.log('----------');
      batch(() => {
        A2.set(2 + i * 2);
        B.set(2);
      });
      console.log(res.join(', '));
    }
    iter(1);
    iter(0);
    iter(1);
    iter(2);
  });
});
