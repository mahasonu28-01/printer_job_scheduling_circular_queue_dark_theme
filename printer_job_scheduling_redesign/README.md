# Printer Job Scheduling — Circular Queue

This version uses a dark monochrome theme with charcoal backgrounds, light text, and neutral-gray accents. The PJ badge and the “Queue Management System” label have been removed, while the page title, circular queue visualization, controls, job list, processing summary, and operation history remain.

## Files

- `index.html` — page structure
- `styles.css` — monochrome styling and responsive layout
- `script.js` — circular queue behavior and UI operations

## Run it

Open `index.html` directly in a modern browser, or open this folder in Visual Studio Code and run `index.html` with the Live Server extension.

## Included operations

- Enqueue
- Dequeue
- Process Job (simulated print operation)
- Peek Front and Peek Rear
- Get Size
- Is Empty?
- Display Queue
- Clear Queue
- Clear operation history

The circular buffer grows when full and shrinks when usage is low. A full job table displays all queued job names even when diagram slots have limited space. This demo simulates printing; it does not send documents to a physical printer.
