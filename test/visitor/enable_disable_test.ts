import { describe, it } from 'mocha';
import * as assert from 'assert';

import { ProcessChain } from '../../src/process.js';
import { EnableDisable } from '../../src/visit/enable_disable_visitor.js';

import {
    add_items_to_data,
    add_processes_to_data,
    setup_data,
} from './test_data.js';

describe('Enables and disables processes', function () {
    describe('basic enable/disable', function () {
        const data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            C: { in: ['a', 'b'], out: ['c'] },
            D: { in: ['c'], out: ['d'] },
            E: { in: ['c', 'd'], out: ['e'] },
            F: { in: ['d'], out: ['f'] },
            G: { in: ['d'], out: ['g'] },
        });
        it('enables from an empty ProcessChain', function () {
            const pc = new ProcessChain([]);
            const result = pc.accept(new EnableDisable(data, ['C'], []));
            assert.strictEqual(result.processes.length, 1);
        });
        it('disables', function () {
            const pc = new ProcessChain(Object.values(data.processes));
            const result = pc.accept(new EnableDisable(data, [], ['C']));
            assert.strictEqual(result.processes.length, 4);
        });
    });
});
