# Bit Slice

FPGA bit slicing and alignment tool - a browser-based utility for visualizing, searching, and re-aligning raw hexadecimal data at the bit level.

**Live demo**: [sure-wang.github.io/bit-slice](https://sure-wang.github.io/bit-slice/)

## Features

- **Hex-to-Binary Visualization** - Convert hex data to binary and view it as a bit string
- **Window-Based Slicing** - Drag a slider to select the start bit and set window width to partition data into bit groups
- **Bit Sequence Matching** - Search for Verilog-style (`N'hXX`) or raw binary patterns with highlight and navigation
- **Slice Reassembly** - Re-slice binary data into hex groups and verify alignment
- **Input History** - Auto-saved hex inputs via localStorage with debounce

## Usage

Open the [live demo](https://sure-wang.github.io/bit-slice/) or `index.html` locally in any modern browser.

1. Enter hex data (e.g. `A3F2`) in the input field
2. Use the slider to select a start bit and adjust the window size
3. Optionally enter a match pattern (e.g. `7'h3F` or `0011111`) to find and jump to bit sequences
4. The result shows the re-sliced hex groups

## Limits

- **Input**: up to 512 hex characters (2048 bits), enforced by input field max length
- **Window size**: up to 512 bits per slice — `binaryToHex` uses BigInt, so there is no practical precision limit within the input cap

## Testing

```bash
node test.js
```

Covers hex/binary conversion, Verilog-style parsing (`N'hXX`), bit sequence matching, slice reassembly, and edge cases.

## License

MIT
