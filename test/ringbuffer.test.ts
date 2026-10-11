import { RingBuffer } from '../src/telemetry/RingBuffer.js';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('Testing RingBuffer...');

// 1. Initial empty buffer
const rb = new RingBuffer(5);
assert(rb.capacity === 5, 'Capacity should be 5');
assert(rb.size === 0, 'Initial size should be 0');
assert(rb.getLatest() === 0, 'Empty getLatest should return 0');

// 2. Push elements below capacity
rb.push(10);
rb.push(20);
rb.push(30);
assert(rb.size === 3, 'Size should be 3');
assert(rb.getLatest() === 30, 'Latest should be 30');
assert(rb.getMin() === 10, 'Min should be 10');
assert(rb.getMax() === 30, 'Max should be 30');
assert(rb.getAverage() === 20, 'Average should be 20');

let arr = rb.toArray();
assert(JSON.stringify(arr) === JSON.stringify([10, 20, 30]), 'toArray should match [10, 20, 30]');

// 3. Fill to capacity and wrap around
rb.push(40);
rb.push(50);
assert(rb.size === 5, 'Size should be 5');
rb.push(60); // Overwrites 10
assert(rb.size === 5, 'Size should remain 5 after overflow');
assert(rb.getLatest() === 60, 'Latest should be 60');

arr = rb.toArray();
assert(JSON.stringify(arr) === JSON.stringify([20, 30, 40, 50, 60]), 'toArray should be [20, 30, 40, 50, 60]');
assert(rb.getMin() === 20, 'Min should be 20');
assert(rb.getMax() === 60, 'Max should be 60');

// 4. Test zero-allocation copyOrderedInto
const dest = new Float64Array(5);
const copied = rb.copyOrderedInto(dest);
assert(copied === 5, 'Should copy 5 elements');
for (let i = 0; i < 5; i++) {
  assert(dest[i] === arr[i], `dest[${i}] should match ${arr[i]}`);
}

console.log('✅ RingBuffer tests passed successfully!');
