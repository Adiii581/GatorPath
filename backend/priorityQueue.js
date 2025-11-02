class MinPriorityQueue {
  constructor() {
    this.heap = [];
  }

  enqueue(priority, node) {
    this.heap.push({ priority, node });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue() {
    if (this.isEmpty()) return null;
    this.swap(0, this.heap.length - 1);
    const min = this.heap.pop();
    if (this.heap.length > 0) this.bubbleDown(0);
    return min;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].priority <= this.heap[index].priority) break;
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  bubbleDown(index) {
    const size = this.heap.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      if (left < size && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
      if (right < size && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
      if (smallest === index) break;
      this.swap(index, smallest);
      index = smallest;
    }
  }

  swap(a, b) {
    [this.heap[a], this.heap[b]] = [this.heap[b], this.heap[a]];
  }
}

module.exports = MinPriorityQueue;