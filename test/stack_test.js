import * as assert from 'assert';

import {Item} from '../src/item.js'
import {Stack, StackSet} from '../src/stack.js'

let item_a = new Item("a", "A");
let item_b = new Item("b", "B");

describe('Stack Tests', function () {
    describe("addition", function() {
        it('can add two stacks', function() {
            let a = new Stack(item_a, 2);
            let b = new Stack(item_a, 4);
            let sum = a.add(b);
            assert.strictEqual(item_a, sum.item);
            assert.strictEqual(6, sum.quantity);
        });
        it('clones when adding null', function() {
            let a = new Stack(item_a, 2);
            let sum = a.add(null);
            assert.strictEqual(item_a, sum.item);
            assert.strictEqual(2, sum.quantity);
        });
        it('fails when adding different item types', function() {
            let a = new Stack(item_a, 2);
            let b = new Stack(item_b, 4);
            assert.throws(() => a.add(b), Error);
        });
    });
});
