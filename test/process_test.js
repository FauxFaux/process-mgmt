
import { describe, it } from 'mocha';
import * as assert from 'assert';
import { Factory, FactoryGroup } from '../src/factory.js';
import { Process } from '../src/process.js';

import {Item} from '../src/item.js'
import {Stack} from '../src/stack.js'

let item_a = new Item("a", "A");
let item_b = new Item("b", "B");
let item_c = new Item("c", "C");
let basic_group = new FactoryGroup('basic_group');
let basic_factory = new Factory("basic", "basic", basic_group, 1);

let process_for_c = new Process(
        "for_c",
        [new Stack(item_a, 3), new Stack(item_b, 2)],
        [new Stack(item_c, 5)],
        2,
        basic_group);


describe('Process Tests', function() {
    describe('Rate, input, and output calculations', function() {
        it('can calculate how many copies of a process is needed to produce a desired rate', function() {
            // 2s per run. 5 items per run -> 2.5 per second.
            // requires 10 units per second.
            // 4 factories producing the output
            let result = process_for_c.process_count_for_rate(new Stack(item_c, 10));
            assert.strictEqual(result, 4);
        });
        it('calculates the rate of production', function() {
            let result = process_for_c.production_rate(item_c, 4);
            assert.strictEqual(result, 10);
        });
        it('calculates the requirements for a number of process copies', function() {
            let result = process_for_c.requirements_for_count(3);
            assert.strictEqual(result[0].quantity, 9);
        });
    });
});
