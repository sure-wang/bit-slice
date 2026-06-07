# Bit Slice

> [中文版](README.zh-CN.md)

Bit Slice is a lightweight browser tool for inspecting hexadecimal data at the bit level: visualize bits, move an alignment window, search patterns, and re-slice the stream back into hex.

**Live demo**: [sure-wang.github.io/bit-slice](https://sure-wang.github.io/bit-slice/)

## Why

When debugging FPGA logic, embedded protocols, register payloads, packet dumps, or binary logs, the annoying part is often not conversion itself. It is answering:

- Which bit am I aligned to?
- What does this window become in hex?
- Where does this Verilog-style pattern occur?
- Did I shift by one bit?

Bit Slice keeps those answers visible without asking you to set up a project, install dependencies, or paste data into a heavy editor.

## Product Taste

- **Small by default**: one static HTML file, easy to host on GitHub Pages and easy to open locally.
- **Precise over decorative**: the UI favors bit positions, window ranges, match counts, and current values over visual noise.
- **Fast feedback**: paste hex, drag the start bit, adjust width, and see the result immediately.
- **Readable data**: bits are lightly grouped, matches are highlighted, and the current slice is framed.
- **Friendly to first-time users**: a built-in example shows the workflow without reading the README first.

## Features

- **Hex input** with validation, uppercasing, and a 512-character cap.
- **Bit view** with 4-bit grouping, current-window highlight, and match highlight.
- **Slice window** with start bit, width, end bit, match index, and current value status.
- **Pattern matching** for Verilog-style hex (`N'hXX`), raw hex, or binary strings.
- **Slice results** reassembled into hex groups, with copy actions for the current slice or full result.
- **Input history** saved locally with `localStorage`.

## Usage

Open the [live demo](https://sure-wang.github.io/bit-slice/) or open `index.html` locally in any modern browser.

1. Paste or enter hex data, for example `5E4D6EADA`.
2. Move the start-bit slider and set the window width.
3. Optionally search for a pattern such as `3'h5`, `8'hB7`, `B7`, or `10110111`.
4. Read the status strip for `start`, `end`, `width`, `match`, and `value`.
5. Copy the current slice or the full re-sliced result when needed.

## Good Fits

- FPGA signal alignment and `rxdata` inspection
- Embedded protocol payload checks
- Register field and packed-bit analysis
- Packet or binary log debugging
- Teaching bit order, slicing, and alignment concepts

## Limits

- **Input**: up to 512 hex characters, or 2048 bits.
- **Window size**: limited by the input length. Conversion uses `BigInt`, so precision is not lost within the input cap.
- **Persistence**: history is local to the browser through `localStorage`; no data is uploaded.

## Development

This project intentionally stays simple:

- `index.html` contains the app.
- `test.js` contains standalone logic tests.
- No build step is required.

Run tests with:

```bash
node test.js
```

The tests cover hex/binary conversion, Verilog-style parsing, bit sequence matching, slice reassembly, and edge cases.

## License

MIT
