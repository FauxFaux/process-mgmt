import { Cycle } from '../../src/visit/cycle.js';


import { describe, it } from 'mocha';
import * as assert from 'assert';

import { add_items_to_data, add_processes_to_data, setup_data } from "./test_data.js";

describe('Cycles', function() {
    describe('Cycle Normalisation', function() {
        let data = setup_data();
        add_items_to_data(data, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
        add_processes_to_data(data, {
            'C': {"in": ['a', 'b'], "out": ['c']},
            'E': {"in": ['c', 'd'], "out": ['e']},
            'F': {"in": ['e'], "out": ['f', {"item": 'd', "quantity": 2}]},
            'G': {"in": ['f'], "out": ['g']},
        });
        it('normalises cycles - no change', function() {
            let c = new Cycle(null, [data.processes['E'], data.processes['F']]);
            c = c.normalise_cycle();
            assert.strictEqual(c.processes[0].id, 'E');
            assert.strictEqual(c.processes[1].id, 'F');
        });
        it('normalises cycles - change', function() {
            let c = new Cycle(null, [data.processes['F'], data.processes['E']]);
            c = c.normalise_cycle();
            assert.strictEqual(c.processes[0].id, 'E');
            assert.strictEqual(c.processes[1].id, 'F');
        });
        it('tests for equality without normalisation', function(){
            let c1 = new Cycle(null, [data.processes['F'], data.processes['E']]);
            let c2 = new Cycle(null, [data.processes['E'], data.processes['F']]);
            assert.strictEqual(c1.equals(c2), false);
        });
        it('tests for equality with normalisation', function(){
            let c1 = new Cycle(null, [data.processes['F'], data.processes['E']]);
            let c2 = new Cycle(null, [data.processes['E'], data.processes['F']]);
            assert.strictEqual(c1.normalise_cycle().equals(c2.normalise_cycle()), true);
        });
    });
});
