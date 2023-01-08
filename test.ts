import { combineLatest } from './lib';
import { State } from './lib/state';

const a = new State<number>();
const b = new State('even');
const c = new State('odd');
const d = a.bind((x) => (x % 2 === 0 ? b : c));

d.subscribe({
  next(v) {
    console.log('d: ', v);
  },
});

a.set(2);
verify(d.get(), 'even', '');

b.set('foo');
verify(d.get(), 'foo', '');

a.set(3);
verify(d.get(), 'odd', '');

b.set('bar');
verify(d.get(), 'odd', 'b is disconnected from d');

function verify<T>(expected: T, actual: T, message: string) {
  if (expected !== actual)
    console.error(`'${expected}' !== '${actual}' ${message}`);
}

const combined = combineLatest([b, c]).map(([x, y]) => `${x} + ${y}`);
console.log(combined.get());
b.set('foo');
console.log(combined.get());

export function App() {
  const count = new State<number>();
  const double = count.map((x) => x * 2);
  const triple = count.map((x) => x * 3);
  const quadruple = double.map((x) => x * 2);

  const sum = combineLatest([count, triple, quadruple]).map((values) =>
    values.reduce((x, y) => x + y, 0)
  );

  console.log(sum);
}
