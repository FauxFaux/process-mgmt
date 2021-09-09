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
    // v----------------v---------------v----------------v
    describe('single, multi-process loop, net producer', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            'C': {"in": ['a', 'b'], "out": ['c']},
            'E': {"in": ['c', 'd'], "out": ['e']},
            'F': {"in": ['e'], "out": ['f', {"item": 'd', "quantity": 2}]},
            'G': {"in": ['f'], "out": ['g']},
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
    });
    //fs.writeFileSync("tmp.gv", pc.accept(new StandardGraphRenderer()).join('\n'))
    describe('single process loop, net consumer', function() {});
    describe('multi process loop, net consumer', function() {});
    describe('multiple single process loops, net consumers', function() {});
    describe('nested loops, both net producers', function() {});
    describe('nested loops, both net consumers', function() {});
    describe('nested loops, inner net producer, outer net consumer', function() {});
    describe('nested loops, inner net consumer, outer net producer', function() {});


});
