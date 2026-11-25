import assert from 'node:assert/strict';
import {describe, it} from 'node:test';

import {normalizeText, pinSelectedToTop, tokenizeQuery, tokenizedFilter} from '../src/index.ts';

type AccountOption = {
    id: string;
    name: string;
    code?: string;
    selected?: boolean;
};

describe('normalizeText & tokenizeQuery', () => {
    it('strips diacritics and normalizes whitespace and casing', () => {
        assert.equal(normalizeText('  Café   Crème  '), 'cafe   creme');
        assert.deepEqual(tokenizeQuery('  Café   CRÈME  '), ['cafe', 'creme']);
        assert.deepEqual(tokenizeQuery('   '), []);
    });
});

describe('tokenizedFilter', () => {
    const accounts: AccountOption[] = [
        {id: 'internal-401', name: 'Travel Expenses', code: '6100'},
        {id: 'internal-402', name: 'Café Operations', code: '6200'},
        {id: 'internal-403', name: 'Office Supplies', code: '6300'},
        {id: 'internal-404', name: 'Travel Reimbursement Payable', code: '2100'},
    ];

    it('matches multi-word queries regardless of token order', () => {
        const res = tokenizedFilter(accounts, 'payable travel', {
            getFields: (item) => [item.name, item.code],
        });
        assert.deepEqual(res.map((x) => x.id), ['internal-404']);
    });

    it('matches accented strings with ASCII search queries', () => {
        const res = tokenizedFilter(accounts, 'cafe ops', {
            getFields: (item) => [item.name],
        });
        assert.equal(res.length, 0);

        const directMatch = tokenizedFilter(accounts, 'cafe operations', {
            getFields: (item) => [item.name],
        });
        assert.deepEqual(directMatch.map((x) => x.id), ['internal-402']);
    });

    it('respects displayed-only fields and avoids hidden internal IDs', () => {
        const res = tokenizedFilter(accounts, '401', {
            getFields: (item) => [item.name],
        });
        assert.deepEqual(res, []);
    });

    it('returns a shallow copy of all items on empty or whitespace query', () => {
        const res = tokenizedFilter(accounts, '   ', {
            getFields: (item) => [item.name],
        });
        assert.deepEqual(res, accounts);
        assert.notEqual(res, accounts);
    });

    it('skips filtering below minItemsToFilter threshold', () => {
        const res = tokenizedFilter(accounts, 'nonexistent', {
            getFields: (item) => [item.name],
            minItemsToFilter: 12,
        });
        assert.deepEqual(res, accounts);
    });
});

describe('pinSelectedToTop', () => {
    const buildItems = (count: number, selectedIndexes: number[]): AccountOption[] =>
        Array.from({length: count}, (_, i) => ({
            id: String(i + 1),
            name: `Item ${i + 1}`,
            selected: selectedIndexes.includes(i),
        }));

    it('preserves original order when list is shorter than minItemsToPin', () => {
        const shortList = buildItems(8, [5]);
        const res = pinSelectedToTop(shortList, (x) => !!x.selected, 12);
        assert.deepEqual(res.map((x) => x.id), shortList.map((x) => x.id));
    });

    it('pins multiple selected items to the top while keeping relative order', () => {
        const longList = buildItems(14, [3, 9]);
        const res = pinSelectedToTop(longList, (x) => !!x.selected, 12);
        assert.deepEqual(res.slice(0, 4).map((x) => x.id), ['4', '10', '1', '2']);
        assert.equal(res.length, 14);
    });
});
