import { describe, it } from 'mocha';
import * as assert from 'assert';

import { ProcessChain } from '../../src/process.js';
import { FilterForOutput } from '../../src/visit/filter_for_output_visitor.js';

import {
    add_items_to_data,
    add_processes_to_data,
    setup_data,
} from './test_data.js';

describe('Filtering For Output', function () {
    describe('basic filtering', function () {
        const data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            C: { in: ['a', 'b'], out: ['c'] },
            D: { in: ['c'], out: ['d'] },
            E: { in: ['c', 'd'], out: ['e'] },
            F: { in: ['d'], out: ['f'] },
            G: { in: ['d'], out: ['g'] },
        });
        it('filters for "f"', function () {
            const pc = new ProcessChain(Object.values(data.processes));
            const result = pc.accept(new FilterForOutput(data.items['f']));
            assert.strictEqual(result.processes.length, 3);
        });
        it('filters for "g"', function () {
            const pc = new ProcessChain(Object.values(data.processes));
            const result = pc.accept(new FilterForOutput(data.items['g']));
            assert.strictEqual(result.processes.length, 3);
        });
        it('filters for "e"', function () {
            const pc = new ProcessChain(Object.values(data.processes));
            const result = pc.accept(new FilterForOutput(data.items['e']));
            assert.strictEqual(result.processes.length, 3);
        });
        it('filters for "c"', function () {
            const pc = new ProcessChain(Object.values(data.processes));
            const result = pc.accept(new FilterForOutput(data.items['c']));
            assert.strictEqual(result.processes.length, 1);
        });
    });
});
