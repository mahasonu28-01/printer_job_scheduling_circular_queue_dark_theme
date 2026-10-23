(() => {
  'use strict';

  class DynamicCircularQueue {
    constructor(initialCapacity = 4) {
      this.minCapacity = initialCapacity;
      this.buffer = new Array(initialCapacity);
      this.frontIndex = 0;
      this.count = 0;
    }
    get capacity() { return this.buffer.length; }
    get size() { return this.count; }
    isEmpty() { return this.count === 0; }
    physicalIndex(offset) { return (this.frontIndex + offset) % this.capacity; }
    resize(newCapacity) {
      const next = new Array(newCapacity);
      for (let i = 0; i < this.count; i++) next[i] = this.buffer[this.physicalIndex(i)];
      this.buffer = next;
      this.frontIndex = 0;
    }
    enqueue(value) {
      if (this.count === this.capacity) this.resize(this.capacity * 2);
      const index = this.physicalIndex(this.count);
      this.buffer[index] = value;
      this.count++;
      return index;
    }
    dequeue() {
      if (this.isEmpty()) throw new Error('Cannot remove a job: the queue is empty.');
      const value = this.buffer[this.frontIndex];
      this.buffer[this.frontIndex] = undefined;
      this.count--;
      if (this.count === 0) this.frontIndex = 0;
      else this.frontIndex = (this.frontIndex + 1) % this.capacity;
      if (this.capacity > this.minCapacity && this.count <= Math.floor(this.capacity / 4)) {
        this.resize(Math.max(this.minCapacity, Math.floor(this.capacity / 2)));
      }
      return value;
    }
    peekFront() {
      if (this.isEmpty()) throw new Error('Cannot peek: the queue is empty.');
      return this.buffer[this.frontIndex];
    }
    peekRear() {
      if (this.isEmpty()) throw new Error('Cannot peek: the queue is empty.');
      return this.buffer[this.physicalIndex(this.count - 1)];
    }
    toArray() { return Array.from({ length: this.count }, (_, i) => this.buffer[this.physicalIndex(i)]); }
    clear() { this.buffer = new Array(this.minCapacity); this.frontIndex = 0; this.count = 0; }
  }

  const queue = new DynamicCircularQueue(4);
  const $ = id => document.getElementById(id);
  const input = $('jobInput');
  let defaultJobNumber = 1;
  let totalProcessed = 0;
  let history = [];

  function setStatus(message, type = '') {
    const el = $('status');
    el.textContent = message;
    el.className = `status-box${type ? ` ${type}` : ''}`;
  }

  function record(message) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    history.unshift({ time, message });
    history = history.slice(0, 30);
    renderHistory();
  }

  function renderHistory() {
    const box = $('logList');
    box.replaceChildren();
    if (!history.length) {
      const empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.textContent = 'No operations yet.';
      box.appendChild(empty);
      return;
    }
    history.forEach(item => {
      const row = document.createElement('div'); row.className = 'history-item';
      const time = document.createElement('span'); time.className = 'history-time'; time.textContent = item.time;
      const message = document.createElement('span'); message.className = 'history-message'; message.textContent = item.message;
      row.append(time, message);
      box.appendChild(row);
    });
  }

  function renderQueue() {
    const board = $('ringBoard');
    board.querySelectorAll('.slot').forEach(node => node.remove());
    const cap = queue.capacity;
    const isMobile = window.matchMedia('(max-width: 560px)').matches;
    const centerX = board.clientWidth / 2;
    const centerY = board.clientHeight / 2;
    const sideMargin = isMobile ? 31 : 38;
    const verticalMargin = isMobile ? 31 : 36;
    const radius = Math.max(65, Math.min(centerX - sideMargin, centerY - verticalMargin, 230));
    const outline = board.querySelector('.ring-outline');
    outline.style.width = `${radius * 2 + 18}px`;
    outline.style.height = `${radius * 2 + 18}px`;

    const spacingPerSlot = (2 * Math.PI * radius) / cap;
    const maxSlotWidth = isMobile ? 115 : 142;
    const slotWidth = Math.max(32, Math.min(maxSlotWidth, spacingPerSlot * 0.76));
    const slotHeight = Math.max(38, Math.min(isMobile ? 82 : 92, slotWidth * 0.76));
    const rearIndex = queue.isEmpty() ? -1 : queue.physicalIndex(queue.size - 1);

    for (let i = 0; i < cap; i++) {
      const angle = (-Math.PI / 2) + (2 * Math.PI * i / cap);
      const node = document.createElement('div');
      const isFront = !queue.isEmpty() && i === queue.frontIndex;
      const isRear = !queue.isEmpty() && i === rearIndex;
      const value = queue.buffer[i];
      node.className = 'slot' + (value === undefined ? ' empty' : '') + (isFront ? ' front' : '') + (isRear ? ' rear' : '');
      node.style.left = `${centerX + radius * Math.cos(angle)}px`;
      node.style.top = `${centerY + radius * Math.sin(angle)}px`;
      node.style.width = `${slotWidth}px`;
      node.style.height = `${slotHeight}px`;
      node.title = `Index ${i}: ${value === undefined ? 'empty' : value}`;
      node.setAttribute('aria-label', `Slot ${i}: ${value === undefined ? 'empty' : value}${isFront ? ', Front' : ''}${isRear ? ', Rear' : ''}`);

      const index = document.createElement('span');
      index.className = 'index'; index.textContent = `[${i}]`;
      const label = document.createElement('span');
      label.className = 'value'; label.textContent = value === undefined ? '—' : value;
      label.style.maxWidth = `${Math.max(20, slotWidth - 12)}px`;
      if (slotWidth < 58) { index.style.fontSize = '.53rem'; label.style.fontSize = '.56rem'; }
      if (slotWidth < 43) { index.style.fontSize = '.47rem'; label.style.fontSize = '.5rem'; }
      node.append(index, label);
      if (isFront) {
        const tag = document.createElement('span'); tag.className = 'pointer'; tag.textContent = 'FRONT'; node.appendChild(tag);
      }
      if (isRear) {
        const tag = document.createElement('span'); tag.className = 'pointer'; tag.textContent = 'REAR'; node.appendChild(tag);
      }
      board.appendChild(node);
    }

    $('countCenter').textContent = String(queue.size);
    $('capacityCenter').textContent = `Slots allocated: ${queue.capacity}`;
    $('bufferStatus').textContent = `${queue.capacity} slots allocated`;
    $('jobListSummary').textContent = `${queue.size} job${queue.size === 1 ? '' : 's'} · ${queue.capacity} slots`;

    const order = queue.toArray();
    const tableBody = $('jobTableBody');
    tableBody.replaceChildren();
    if (!order.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4; td.className = 'empty-row'; td.textContent = 'Queue is empty.';
      tr.appendChild(td); tableBody.appendChild(tr);
    } else {
      order.forEach((job, i) => {
        const tr = document.createElement('tr');
        const fifo = document.createElement('td'); fifo.textContent = String(i + 1);
        const index = document.createElement('td'); index.textContent = String(queue.physicalIndex(i));
        const name = document.createElement('td'); name.textContent = job; name.title = job;
        const pointer = document.createElement('td');
        const role = queue.size === 1 ? 'FRONT + REAR' : i === 0 ? 'FRONT' : i === queue.size - 1 ? 'REAR' : '—';
        if (role === '—') pointer.textContent = role;
        else {
          const tag = document.createElement('span');
          tag.className = 'role-tag ' + (role === 'FRONT + REAR' ? 'both' : role.toLowerCase());
          tag.textContent = role; pointer.appendChild(tag);
        }
        tr.append(fifo, index, name, pointer); tableBody.appendChild(tr);
      });
    }

    const line = $('orderLine'); line.replaceChildren();
    if (!order.length) {
      const none = document.createElement('span'); none.className = 'empty-order'; none.textContent = 'Queue is empty.'; line.appendChild(none);
    } else {
      order.forEach((job, i) => {
        if (i) { const arrow = document.createElement('span'); arrow.className = 'arrow'; arrow.textContent = '→'; line.appendChild(arrow); }
        const text = document.createElement('span'); text.textContent = job; line.appendChild(text);
      });
    }
  }

  function enqueue(event) {
    if (event) event.preventDefault();
    let job = input.value.trim();
    if (!job) job = `Print Job ${defaultJobNumber++}`;
    const before = queue.capacity;
    queue.enqueue(job);
    const grew = queue.capacity > before;
    setStatus(grew ? `Enqueued “${job}”. Buffer expanded from ${before} to ${queue.capacity} slots.` : `Enqueued “${job}” at the Rear.`);
    record(`Enqueue: “${job}”${grew ? ` · capacity ${before} → ${queue.capacity}` : ''}`);
    input.value = ''; input.focus(); renderQueue();
  }

  function dequeue() {
    if (queue.isEmpty()) { setStatus('Cannot dequeue: the queue is empty.', 'error'); record('Dequeue failed: queue is empty.'); return; }
    const before = queue.capacity; const job = queue.dequeue(); const shrunk = queue.capacity < before;
    setStatus(`Dequeued “${job}”. Removed the oldest job at the Front${shrunk ? `; buffer reduced to ${queue.capacity} slots` : ''}.`);
    record(`Dequeue: removed “${job}”${shrunk ? ` · capacity ${before} → ${queue.capacity}` : ''}`);
    renderQueue();
  }

  function processJob() {
    if (queue.isEmpty()) { setStatus('Cannot process a job: the queue is empty.', 'error'); record('Process Job failed: queue is empty.'); return; }
    const before = queue.capacity; const job = queue.dequeue(); const shrunk = queue.capacity < before;
    totalProcessed++;
    $('processedCount').textContent = String(totalProcessed);
    $('lastProcessed').textContent = `Last processed: “${job}”`;
    setStatus(`Processed “${job}”. The simulated print job was removed from the Front${shrunk ? `; buffer reduced to ${queue.capacity} slots` : ''}.`);
    record(`Process Job: printed “${job}”${shrunk ? ` · capacity ${before} → ${queue.capacity}` : ''}`);
    renderQueue();
  }

  function peek(which) {
    try {
      const job = which === 'front' ? queue.peekFront() : queue.peekRear();
      setStatus(`Peek ${which === 'front' ? 'Front' : 'Rear'}: “${job}”. No job was removed.`);
      record(`Peek ${which}: “${job}”`);
    } catch (error) {
      setStatus(error.message, 'error'); record(`Peek ${which} failed: queue is empty.`);
    }
  }

  $('enqueueForm').addEventListener('submit', enqueue);
  $('dequeueBtn').addEventListener('click', dequeue);
  $('processBtn').addEventListener('click', processJob);
  $('peekFrontBtn').addEventListener('click', () => peek('front'));
  $('peekRearBtn').addEventListener('click', () => peek('rear'));
  $('sizeBtn').addEventListener('click', () => { setStatus(`Queue size: ${queue.size} job(s). Allocated capacity: ${queue.capacity} slot(s).`); record(`Get Size: ${queue.size}`); });
  $('emptyBtn').addEventListener('click', () => { const empty = queue.isEmpty(); setStatus(empty ? 'Is Empty? Yes — there are no jobs waiting.' : `Is Empty? No — ${queue.size} job(s) are waiting.`); record(`Is Empty: ${empty ? 'true' : 'false'}`); });
  $('displayBtn').addEventListener('click', () => { const jobs = queue.toArray(); setStatus(jobs.length ? `FIFO order (Front → Rear): ${jobs.join(' → ')}` : 'Queue is empty.', jobs.length ? '' : 'neutral'); record(`Display Queue: ${jobs.length ? jobs.join(' → ') : 'empty'}`); });
  $('clearBtn').addEventListener('click', () => { const previous = queue.size; queue.clear(); setStatus(`Queue cleared. Removed ${previous} job(s); buffer reset to ${queue.capacity} slots.`); record(`Clear Queue: removed ${previous} job(s)`); renderQueue(); });
  $('clearLogBtn').addEventListener('click', () => { history = []; renderHistory(); setStatus('Operation history cleared.', 'neutral'); });
  window.addEventListener('resize', renderQueue);
  renderQueue();
})();
