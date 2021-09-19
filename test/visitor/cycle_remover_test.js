import * as fs from 'fs';

import { describe, it } from 'mocha';
import * as assert from 'assert';

import { ProcessChain } from '../../src/process.js';

import { add_items_to_data, add_processes_to_data, setup_data } from "./test_data.js";
import { StandardGraphRenderer } from '../../src/visit/standard_graph_renderer.js';
import { CycleRemover } from '../../src/visit/cycle_remover.js';
import { CycleDetector } from '../../src/visit/cycle_detector.js';


describe('Cycle Removal', function() {
    describe('single single-process loop, net producer', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            'C': {"in": ['a', 'b'], "out": ['c']},
            'D': {"in": ['c', 'd'], "out": [{"item": 'd', "quantity": 2}]},
            'E': {"in": ['d'], "out": ['e']},
        });
        it('Removes one cycle', function() {
            let pc = new ProcessChain(Object.values(data.processes))
                .accept(new CycleRemover());
            assert.strictEqual(pc.processes.length, 3);
            assert.strictEqual(pc.processes.find(p => p.id == 'C').id, 'C');
            assert.strictEqual(typeof pc.processes.find(p => p.id == 'D'), "undefined");
            assert.strictEqual(pc.processes.find(p => p.id == 'E').id, 'E');
            assert.strictEqual(pc.accept(new CycleDetector()).length, 0);
        });
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
        it('Removes one cycle', function() {
            let pc = new ProcessChain(Object.values(data.processes))
                .accept(new CycleRemover());
            assert.strictEqual(pc.processes.length, 3);
            assert.strictEqual(pc.processes.find(p => p.id == 'C').id, 'C');
            assert.strictEqual(typeof pc.processes.find(p => p.id == 'E'), "undefined");
            assert.strictEqual(typeof pc.processes.find(p => p.id == 'F'), "undefined");
            assert.strictEqual(pc.processes.find(p => p.id == 'G').id, 'G');
            assert.strictEqual(pc.accept(new CycleDetector()).length, 0);
        });
    });
    describe('multiple, single-process loops, net consumers', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
        add_processes_to_data(data, {
            'C': {"in": ['a', 'b'], "out": ['d']},
            'D': {"in": ['c', {'item': 'd', 'quantity': 2}], "out": ['d', 'e']},
            'E': {"in": ['e'], "out": ['f']},
            'F': {"in": [{'item': 'f', 'quantity': 2}], "out": ['f', 'g']},
            'G': {"in": ['g'], "out": ['h']},
        });
        it('Removes both cycles', function() {
            let pc = new ProcessChain(Object.values(data.processes))
            pc = pc.accept(new CycleRemover());
            assert.strictEqual(pc.processes.length, 5);
            assert.strictEqual(pc.processes.find(p => p.id == 'C').id, 'C');
            assert.strictEqual(typeof pc.processes.find(p => p.id == 'D'), "undefined");
            assert.strictEqual(pc.processes.find(p => p.id == 'E').id, 'E');
            assert.strictEqual(typeof pc.processes.find(p => p.id == 'F'), "undefined");
            assert.strictEqual(pc.processes.find(p => p.id == 'G').id, 'G');
            assert.strictEqual(pc.accept(new CycleDetector()).length, 0);
        });
    });
    describe('multiple, single-process loops, with reuse of inputs', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
        add_processes_to_data(data, {
            'A': {"in": ['a'], "out": ['d']},
            'C': {"in": ['a', 'b'], "out": ['c']},
            'D': {"in": ['c', 'a', {'item': 'd', 'quantity': 2}], "out": ['d', 'e']},
            'E': {"in": ['c', 'e'], "out": ['f']},
            'F': {"in": ['c',  {'item': 'f', 'quantity': 2}], "out": ['g', 'f']},
            'G': {"in": ['c', 'g'], "out": ['h']},
        });
        it('Removes both cycles', function() {
            let pc = new ProcessChain(Object.values(data.processes))
            pc = pc.accept(new CycleRemover());
            assert.strictEqual(pc.processes.length, 6);
            assert.strictEqual(pc.processes.find(p => p.id == 'C').id, 'C');
            assert.strictEqual(typeof pc.processes.find(p => p.id == 'D'), "undefined");
            assert.strictEqual(pc.processes.find(p => p.id == 'E').id, 'E');
            assert.strictEqual(typeof pc.processes.find(p => p.id == 'F'), "undefined");
            assert.strictEqual(pc.processes.find(p => p.id == 'G').id, 'G');
            assert.strictEqual(pc.accept(new CycleDetector()).length, 0);
        });
    });
    describe('single process loop, net producer', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
        add_processes_to_data(data, {
            'C': {"in": ['a'], "out": ['c']},
            'E': {"in": ['a', 'c'], "out": [{'item': 'c', 'quantity': 2}, 'e']},
            'F': {"in": ['c', 'e'], "out": ['f']},
        });
        it('Removes the cycle', function() {
            let pc = new ProcessChain(Object.values(data.processes))
            pc = pc.accept(new CycleRemover());
            assert.strictEqual(pc.processes.length, 3);
            assert.strictEqual(pc.processes.find(p => p.id == 'C').id, 'C');
            assert.strictEqual(typeof pc.processes.find(p => p.id == 'E'), "undefined");
            assert.strictEqual(pc.processes.find(p => p.id == 'F').id, 'F');
            assert.strictEqual(pc.accept(new CycleDetector()).length, 0);
        });
    });
    describe('multi process loop, net producer', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
        add_processes_to_data(data, {
            'C': {"in": ['a'], "out": ['c']},
            'D': {"in": ['a', 'c'], "out": ['d']},
            'E': {"in": ['d'], "out": [{'item': 'c', 'quantity': 2}, 'e']},
            'F': {"in": ['c'], "out": ['f']},
        });
        it('Removes both cycles', function() {
            let pc = new ProcessChain(Object.values(data.processes))
            pc = pc.accept(new CycleRemover());
            assert.strictEqual(pc.processes.length, 3);
            assert.strictEqual(pc.processes.find(p => p.id == 'C').id, 'C');
            assert.strictEqual(typeof pc.processes.find(p => p.id == 'D'), "undefined");
            assert.strictEqual(typeof pc.processes.find(p => p.id == 'E'), "undefined");
            assert.strictEqual(pc.processes.find(p => p.id == 'F').id, 'F');
            assert.strictEqual(pc.accept(new CycleDetector()).length, 0);
        });
    });
    describe('multiple single process loops, net consumers', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
        add_processes_to_data(data, {
            'C': {"in": ['a'], "out": ['c']},
            'D': {"in": ['a', {'item': 'c', 'quantity': 2}], "out": ['c', 'd']},
            'E': {"in": ['d'], "out": ['e']},
            'F': {"in": [{'item': 'e', 'quantity': 2}], "out": ['e', 'f']},
        });
        it('Removes both cycles', function() {
            let pc = new ProcessChain(Object.values(data.processes))
            pc = pc.accept(new CycleRemover());
            assert.strictEqual(pc.processes.length, 4);
            assert.strictEqual(pc.processes.find(p => p.id == 'C').id, 'C');
            assert.strictEqual(typeof pc.processes.find(p => p.id == 'D'), "undefined");
            assert.strictEqual(pc.processes.find(p => p.id == 'E').id, 'E');
            assert.strictEqual(typeof pc.processes.find(p => p.id == 'F'), "undefined");
            assert.strictEqual(pc.accept(new CycleDetector()).length, 0);
        });
    });
    describe('nested loops, both net consumers', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
        add_processes_to_data(data, {
            'B': {"in": ['a'], "out": ['b']},
            'D': {"in": ['a', {'item': 'c', 'quantity': 2}], "out": ['c', 'd']},
            'E': {"in": ['d'], "out": ['e']},
            'F': {"in": [{'item': 'e', 'quantity': 2}], "out": ['c', 'e', 'f']},
        });
        it('Removes both cycles', function() {
            let pc = new ProcessChain(Object.values(data.processes))
            fs.writeFileSync("before.gv", pc.accept(new StandardGraphRenderer()).join('\n'))
            pc = pc.accept(new CycleRemover());
            fs.writeFileSync("after.gv", pc.accept(new StandardGraphRenderer()).join('\n'))
            assert.strictEqual(pc.processes.length, 2);
            assert.strictEqual(pc.processes.find(p => p.id == 'B').id, 'B');
            assert.strictEqual(pc.accept(new CycleDetector()).length, 0);
        });
    });
    describe('nested loops, both net producers', function() {});
    describe('nested loops, inner net producer, outer net consumer', function() {});
    describe('nested loops, inner net consumer, outer net producer', function() {});


});
