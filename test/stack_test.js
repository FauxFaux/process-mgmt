import * as assert from 'assert';

import {Item} from '../src/item.js'
import {Stack, StackSet} from '../src/stack.js'

let item_a = new Item("a", "A");
let item_b = new Item("b", "B");

describe('Stack Tests', function() {
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
    describe("division", function() {
        it("divides by a scalar", function() {
            let a = new Stack(item_a, 12);
            let div = a.div(4);
            assert.strictEqual(3, div.quantity);
            assert.strictEqual(item_a, div.item);
        });
    });
    describe("multiplication", function() {
        it("multiplies by a scalar", function() {
            let a = new Stack(item_a, 12);
            let mul = a.mul(4);
            assert.strictEqual(48, mul.quantity);
            assert.strictEqual(item_a, mul.item);
        });
    });
});

describe('StackSet Tests', function(){
    describe('total', function() {
        it('can total with 2x +ive', function() {
            let s = new StackSet();
            s.add(new Stack(item_a, 3));
            s.add(new Stack(item_a, 4));
            let total = s.total(item_a);
            assert.strictEqual(7, total.quantity);
            assert.strictEqual(item_a, total.item);
        });
        it('can total with +ive, -ive', function() {
            let s = new StackSet();
            s.add(new Stack(item_a, 3));
            s.add(new Stack(item_a, -4));
            let total = s.total(item_a);
            assert.strictEqual(-1, total.quantity);
            assert.strictEqual(item_a, total.item);
        });
        it('can total with add & sub', function() {
            let s = new StackSet();
            s.add(new Stack(item_a, 3));
            s.sub(new Stack(item_a, 4));
            let total = s.total(item_a);
            assert.strictEqual(-1, total.quantity);
            assert.strictEqual(item_a, total.item);
        });
        it('only totals per item', function() {
            let s = new StackSet();
            s.add(new Stack(item_a, 3));
            s.add(new Stack(item_b, -4));
            let ta = s.total(item_a);
            let tb = s.total(item_b);
            assert.strictEqual(3, ta.quantity);
            assert.strictEqual(-4, tb.quantity);
            assert.strictEqual(item_a, ta.item);
            assert.strictEqual(item_b, tb.item);
        });
        it('can total +ive only', function() {
            let s = new StackSet();
            s.add(new Stack(item_a, 3));
            s.add(new Stack(item_a, -4));
            let total = s.total_positive(item_a);
            assert.strictEqual(3, total.quantity);
            assert.strictEqual(item_a, total.item);
        });
        it('can total -ive only', function() {
            let s = new StackSet();
            s.add(new Stack(item_a, 3));
            s.add(new Stack(item_a, -4));
            let total = s.total_negative(item_a);
            assert.strictEqual(-4, total.quantity);
            assert.strictEqual(item_a, total.item);
        });
    });
});
