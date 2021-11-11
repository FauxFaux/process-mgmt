import * as fs from 'fs';

import { describe, it } from 'mocha';
import * as assert from 'assert';

import { ProcessChain } from '../../src/process.js';
import { RateCalculator } from '../../src/visit/rate_calculator.js';

import { add_items_to_data, add_processes_to_data, setup_data } from "./test_data.js";
import { Stack } from '../../src/stack.js';
import { RateGraphRenderer } from '../../src/visit/rate_graph_renderer.js';
import { StandardGraphRenderer } from '../../src/visit/standard_graph_renderer.js';
import { CycleDetector } from '../../src/visit/cycle_detector.js';


describe('Cycle Detection', function() {
    describe('single single-process loop, net producer', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            'C': {"in": ['a', 'b'], "out": ['c']},
            'D': {"in": ['c', 'd'], "out": [{"item": 'd', "quantity": 2}]},
            'E': {"in": ['d'], "out": ['e']},
        });
        it('finds one cycle', function() {
            let pc = new ProcessChain(Object.values(data.processes));
            let cycles = pc.accept(new CycleDetector());
            assert.strictEqual(cycles.length, 1);
        });
        it('detected cycle is D', function() {
            let pc = new ProcessChain(Object.values(data.processes));
            let cycles = pc.accept(new CycleDetector());
            assert.strictEqual(cycles[0].processes[0].id, 'D');
        });
        // it('detected loop item is d', function() {
        //     let pc = new ProcessChain(Object.values(data.processes));
        //     let cycles = pc.accept(new CycleDetector());
        //     assert.strictEqual(cycles[0].loop_items[0].id, 'd');
        // });
    });
    describe('single, multi-process loop, net producer', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            'C': {"in": ['a', 'b'], "out": ['c']},
            'E': {"in": ['c', 'd'], "out": ['e']},
            'F': {"in": ['e'], "out": ['f', {"item": 'd', "quantity": 2}]},
            'G': {"in": ['f'], "out": ['g']},
        });
        it('finds one cycle', function() {
            let pc = new ProcessChain(Object.values(data.processes));
            let cycles = pc.accept(new CycleDetector());
            assert.strictEqual(cycles.length, 1);
        });
        it('detected cycle is E, F', function() {
            let pc = new ProcessChain(Object.values(data.processes));
            let cycles = pc.accept(new CycleDetector());
            assert.strictEqual(cycles[0].processes[0].id, 'F');
            assert.strictEqual(cycles[0].processes[1].id, 'E');
        });
    });
    describe('multiple, single-process loops', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            'C': {"in": ['a', 'b'], "out": ['c']},
            'D': {"in": ['a', 'c', {'item': 'd', 'quantity': 2}], "out": ['d']},
            'E': {"in": ['d'], "out": ['e']},
            'F': {"in": [{'item': 'e', 'quantity': 2}], "out": ['e', 'f']},
            'G': {"in": ['f'], "out": ['g']},
        });
        it('finds two cycle', function() {
            let pc = new ProcessChain(Object.values(data.processes));
            let cycles = pc.accept(new CycleDetector());
            assert.strictEqual(cycles.length, 2);
        });
        it('a detected cycle is F', function() {
            let pc = new ProcessChain(Object.values(data.processes));
            let cycles = pc.accept(new CycleDetector());
            assert.strictEqual(cycles[0].processes[0].id, 'F');
        });
        it('a detected cycle is D', function() {
            let pc = new ProcessChain(Object.values(data.processes));
            let cycles = pc.accept(new CycleDetector());
            assert.strictEqual(cycles[1].processes[0].id, 'D');
        });
    });
    describe('multiple, single-process loops, with reuse of inputs', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            'C': {"in": ['a', 'b'], "out": ['c']},
            'D': {"in": ['a', 'c', {'item': 'd', 'quantity': 2}], "out": ['d']},
            'E': {"in": ['d'], "out": ['e']},
            'F': {"in": ['c',  {'item': 'e', 'quantity': 2}], "out": ['e', 'f']},
            'G': {"in": ['f'], "out": ['g']},
        });
        it('finds two cycle', function() {
            let pc = new ProcessChain(Object.values(data.processes));
            fs.writeFileSync("tmp.gv", pc.accept(new StandardGraphRenderer()).join('\n'))
            let cycles = pc.accept(new CycleDetector());
            assert.strictEqual(cycles.length, 2);
        });
        it('a detected cycle is D', function() {
            let pc = new ProcessChain(Object.values(data.processes));
            let cycles = pc.accept(new CycleDetector());
            assert.deepStrictEqual(cycles[0].processes[0].id, 'F');
        });
        it('a detected cycle is F', function() {
            let pc = new ProcessChain(Object.values(data.processes));
            let cycles = pc.accept(new CycleDetector());
            assert.deepStrictEqual(cycles[1].processes[0].id, 'D');
        });
    });
});
