import { BloomSift } from '../src/index.js';

const ITERATIONS = 100000;
const CAPACITY = 10000;
const ERROR_RATE = 0.01;

function formatOps(ops: number): string {
  if (ops >= 1000000) return `${(ops / 1000000).toFixed(2)}M ops/sec`;
  if (ops >= 1000) return `${(ops / 1000).toFixed(2)}K ops/sec`;
  return `${ops.toFixed(2)} ops/sec`;
}

function bench(name: string, fn: () => void, iterations: number): void {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const end = performance.now();

  const totalMs = end - start;
  const opsPerSec = (iterations / totalMs) * 1000;

  console.log(`${name.padEnd(30)} ${formatOps(opsPerSec).padStart(15)} (${totalMs.toFixed(2)}ms)`);
}

console.log('bloom-sift Benchmarks');
console.log('='.repeat(50));
console.log(`Iterations: ${ITERATIONS.toLocaleString()}`);
console.log(`Capacity: ${CAPACITY.toLocaleString()}, Error Rate: ${ERROR_RATE}`);
console.log('');

// Create filter
const filter = new BloomSift({ capacity: CAPACITY, errorRate: ERROR_RATE });

// Benchmark add
bench('add (string)', () => {
  filter.add(`item-${Math.random()}`);
}, ITERATIONS);

// Reset for has benchmark
const testFilter = new BloomSift({ capacity: CAPACITY, errorRate: ERROR_RATE });
for (let i = 0; i < CAPACITY; i++) {
  testFilter.add(`item-${i}`);
}

// Benchmark has (hit)
let idx = 0;
bench('has (hit)', () => {
  testFilter.has(`item-${idx++ % CAPACITY}`);
}, ITERATIONS);

// Benchmark has (miss)
bench('has (miss)', () => {
  testFilter.has(`nonexistent-${Math.random()}`);
}, ITERATIONS);

// Benchmark serialize
const smallFilter = new BloomSift({ capacity: 1000, errorRate: 0.01 });
for (let i = 0; i < 1000; i++) smallFilter.add(`item-${i}`);

bench('serialize', () => {
  smallFilter.serialize();
}, 10000);

// Benchmark deserialize
const serialized = smallFilter.serialize();
bench('deserialize', () => {
  BloomSift.deserialize(serialized);
}, 10000);

// Benchmark create
bench('create filter', () => {
  new BloomSift({ capacity: 1000, errorRate: 0.01 });
}, 10000);

console.log('');
console.log('Memory Usage:');
console.log(`  Filter size: ${testFilter.size.toLocaleString()} bits`);
console.log(`  Memory: ${Math.ceil(testFilter.size / 8).toLocaleString()} bytes`);
console.log(`  Hash count: ${testFilter.hashCount}`);
