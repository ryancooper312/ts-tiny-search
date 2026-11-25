# ts-tiny-search

[![CI](https://github.com/ryancooper312/ts-tiny-search/actions/workflows/ci.yml/badge.svg)](https://github.com/ryancooper312/ts-tiny-search/actions/workflows/ci.yml)

Lightweight, zero-dependency TypeScript utilities for Unicode-normalized tokenized search and stable selection pinning.

## Features

- **Zero runtime dependencies**: Pure TypeScript compatible with Node.js 22+ native type stripping as well as standard bundlers.
- **Unicode & diacritic folding**: Normalizes accented characters (`Café` matches `cafe`) via NFD decomposition.
- **Tokenized multi-word matching**: Matches search terms in any order across caller-selected fields, preventing unintended matches on hidden internal IDs.
- **Stable selection pinning**: Moves pre-selected rows to the top of long pickers while preserving relative order and leaving short lists untouched.

## Usage

```ts
import {pinSelectedToTop, tokenizedFilter} from './src/index.ts';

const accounts = [
    {id: 'acc_901', name: 'Café Operations', selected: false},
    {id: 'acc_902', name: 'Travel Reimbursement Payable', selected: true},
];

const ordered = pinSelectedToTop(accounts, (item) => item.selected, 1);

const filtered = tokenizedFilter(ordered, 'payable travel', {
    getFields: (item) => [item.name], // omit hidden internal IDs
});
```

## Testing

```bash
npm test
```

## License

MIT
