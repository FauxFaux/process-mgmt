import { describe, it } from 'mocha';
import * as assert from 'assert';

import { Factory, FactoryGroup } from '../../src/factory.js';
import { Process, ProcessChain } from '../../src/process.js';
import { Item } from '../../src/item.js';
import { Stack } from '../../src/stack.js';

import { RateVisitor } from '../../src/visit/rate_visitor.js';

let item_a = new Item('a', 'A');
let item_b = new Item('b', 'B');
let item_c = new Item('c', 'C');
let basic_group = new FactoryGroup('basic_group');
let double_speed_factory = new Factory('basic', 'basic', [basic_group], 0.5, 1);

let process_for_c = new Process(
    'produces_c',
    [new Stack(item_a, 3), new Stack(item_b, 2)],
    [new Stack(item_c, 5)],
    2,
    basic_group,
);

describe('Rate Visitor', function () {
    describe('Conversion to rates', function () {
        it("converts single process' output", function () {
            let pc = new ProcessChain([process_for_c]);
            let result = pc.accept(new RateVisitor());
            assert.strictEqual(2.5, result.processes[0].outputs[0].quantity);
        });
        it("converts single process' input", function () {
            let pc = new ProcessChain([process_for_c]);
            let result = pc.accept(new RateVisitor());
            assert.strictEqual(1.5, result.processes[0].inputs[0].quantity);
            assert.strictEqual(1, result.processes[0].inputs[1].quantity);
        });
        it("converts single process' duration", function () {
            let pc = new ProcessChain([process_for_c]);
            let result = pc.accept(new RateVisitor());
            assert.strictEqual(1, result.processes[0].duration);
        });
    });
    describe('Updates Processes based on factory type', function () {
        it("converts single process' output", function () {
            let pc = new ProcessChain([process_for_c]);
            let result = pc.accept(new RateVisitor(() => double_speed_factory));
            assert.strictEqual(5, result.processes[0].outputs[0].quantity);
        });
        it("converts single process' input", function () {
            let pc = new ProcessChain([process_for_c]);
            let result = pc.accept(new RateVisitor(() => double_speed_factory));
            assert.strictEqual(3, result.processes[0].inputs[0].quantity);
            assert.strictEqual(2, result.processes[0].inputs[1].quantity);
        });
        it("converts single process' duration", function () {
            let pc = new ProcessChain([process_for_c]);
            let result = pc.accept(new RateVisitor(() => double_speed_factory));
            assert.strictEqual(1, result.processes[0].duration);
        });
    });
});
