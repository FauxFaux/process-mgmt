import { describe, it } from 'mocha';
import * as assert from 'assert';

import { ProcessChain } from '../../src/process.js';
import { RateCalculator } from '../../src/visit/rate_calculator.js';

import {
    add_items_to_data,
    add_processes_to_data,
    setup_data,
} from './test_data.js';
import { Stack } from '../../src/stack.js';
import { RateGraphRenderer } from '../../src/visit/rate_graph_renderer.js';
import { StandardGraphRenderer } from '../../src/visit/standard_graph_renderer.js';

describe('calculating for output rates', function () {
    describe('basic, almost linear', function () {
        const data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            C: { in: ['a', 'b'], out: ['c'] },
            D: { in: ['c'], out: ['d'] },
            E: { in: ['c', 'd'], out: ['e'] },
            F: { in: ['e'], out: ['f'] },
        });
        it('calculates process counts', function () {
            const pc = new ProcessChain(Object.values(data.processes));
            const result = pc.accept(
                new RateCalculator(
                    new Stack(data.items['f'], 1),
                    [],
                    (p) => null,
                ),
            );
            const process_counts = result.process_counts!;
            assert.strictEqual(process_counts['F'], 1);
            assert.strictEqual(process_counts['E'], 1);
            assert.strictEqual(process_counts['D'], 1);
            assert.strictEqual(process_counts['C'], 2);
        });
        it('calculates material counts', function () {
            const pc = new ProcessChain(Object.values(data.processes));
            const result = pc.accept(
                new RateCalculator(
                    new Stack(data.items['f'], 1),
                    [],
                    (p) => null,
                ),
            );
            // "positive" indicates that the set of processes is producing that rate of the item.
            // "negative" indicates that the set of processes is consuming that rate of the item.
            // For intermediate steps, "positive" == abs("negative")
            const materials = result.materials!;

            assert.strictEqual(
                materials.total_positive(data.items['a']).quantity,
                0,
            );
            assert.strictEqual(
                materials.total_negative(data.items['a']).quantity,
                -2,
            );

            assert.strictEqual(
                materials.total_positive(data.items['b']).quantity,
                0,
            );
            assert.strictEqual(
                materials.total_negative(data.items['b']).quantity,
                -2,
            );

            assert.strictEqual(
                materials.total_positive(data.items['c']).quantity,
                2,
            );
            assert.strictEqual(
                materials.total_negative(data.items['c']).quantity,
                -2,
            );

            assert.strictEqual(
                materials.total_positive(data.items['d']).quantity,
                1,
            );
            assert.strictEqual(
                materials.total_negative(data.items['d']).quantity,
                -1,
            );

            assert.strictEqual(
                materials.total_positive(data.items['e']).quantity,
                1,
            );
            assert.strictEqual(
                materials.total_negative(data.items['e']).quantity,
                -1,
            );

            assert.strictEqual(
                materials.total_positive(data.items['f']).quantity,
                1,
            );
            assert.strictEqual(
                materials.total_negative(data.items['f']).quantity,
                0,
            );
        });
    });
});
