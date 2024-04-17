import { describe, it } from 'mocha';
import * as assert from 'assert';
import { Factory, FactoryGroup } from '../src/factory.js';
import { Process } from '../src/process.js';
import { RateProcess } from '../src/rate_process.js';

import { Item } from '../src/item.js';
import { Stack } from '../src/stack.js';

const item_a = new Item('a', 'A');
const item_b = new Item('b', 'B');
const item_c = new Item('c', 'C');
const basic_group = new FactoryGroup('basic_group');
const basic_factory = new Factory('basic', 'basic', basic_group, 1);

const process_for_c = new Process(
    'for_c',
    [new Stack(item_a, 3), new Stack(item_b, 2)],
    [new Stack(item_c, 5)],
    1,
    basic_group,
);

describe('Rate Process Tests', function () {
    describe('process count for input', function () {
        it('can calculate how many copies of a process is needed', function () {
            const proc = new RateProcess(process_for_c, basic_factory);
            const result = proc.process_count_for_rate(new Stack(item_c, 10));
            assert.strictEqual(2, result);
        });
    });
});
