/**
 * Circular Ring Buffer backed by Float64Array.
 * Designed for high-frequency sampling (50ms) with zero dynamic GC allocations.
 */
export class RingBuffer {
  private readonly buffer: Float64Array;
  private head: number = 0;
  private length: number = 0;
  public readonly capacity: number;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('RingBuffer capacity must be greater than 0');
    }
    this.capacity = capacity;
    this.buffer = new Float64Array(capacity);
  }

  /**
   * Pushes a new datapoint into the buffer in O(1).
   * Overwrites the oldest value once capacity is reached.
   */
  public push(val: number): void {
    this.buffer[this.head] = val;
    this.head = (this.head + 1) % this.capacity;
    if (this.length < this.capacity) {
      this.length++;
    }
  }

  /**
   * Current number of stored datapoints.
   */
  public get size(): number {
    return this.length;
  }

  /**
   * Returns the most recently pushed value, or 0 if empty.
   */
  public getLatest(): number {
    if (this.length === 0) return 0;
    const latestIndex = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[latestIndex];
  }

  /**
   * Calculates minimum value across the current buffer without allocations.
   */
  public getMin(): number {
    if (this.length === 0) return 0;
    let min = Infinity;
    for (let i = 0; i < this.length; i++) {
      const val = this.buffer[i];
      if (val < min) min = val;
    }
    return min === Infinity ? 0 : min;
  }

  /**
   * Calculates maximum value across the current buffer without allocations.
   */
  public getMax(): number {
    if (this.length === 0) return 0;
    let max = -Infinity;
    for (let i = 0; i < this.length; i++) {
      const val = this.buffer[i];
      if (val > max) max = val;
    }
    return max === -Infinity ? 0 : max;
  }

  /**
   * Calculates mean average across the current buffer without allocations.
   */
  public getAverage(): number {
    if (this.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.length; i++) {
      sum += this.buffer[i];
    }
    return sum / this.length;
  }

  /**
   * Zero-allocation copy of chronologically sorted values into a destination Float64Array.
   * Returns the number of copied elements.
   */
  public copyOrderedInto(destination: Float64Array): number {
    const copyCount = Math.min(this.length, destination.length);
    let readIdx = this.length < this.capacity ? 0 : this.head;
    for (let i = 0; i < copyCount; i++) {
      destination[i] = this.buffer[readIdx];
      readIdx = (readIdx + 1) % this.capacity;
    }
    return copyCount;
  }

  /**
   * Returns an array of values ordered from oldest to newest.
   */
  public toArray(): number[] {
    const out = new Array<number>(this.length);
    let readIdx = this.length < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.length; i++) {
      out[i] = this.buffer[readIdx];
      readIdx = (readIdx + 1) % this.capacity;
    }
    return out;
  }

  /**
   * Clears the buffer.
   */
  public clear(): void {
    this.head = 0;
    this.length = 0;
    this.buffer.fill(0);
  }
}
