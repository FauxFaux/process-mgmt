
import { describe, it } from 'mocha';
import * as assert from 'assert';

import { ProcessChain } from '../../src/process.js';
import { EnableDisable } from '../../src/visit/enable_disable_visitor.js';
import { LinearAlgebra } from '../../src/visit/linear_agebra_visitor.js';

import { add_items_to_data, add_processes_to_data, setup_data } from "./test_data.js";


describe('Linear Algebra', function() {
    let data = setup_data();
    add_items_to_data(data, ['h', 'l', 'g', 'w', 'c']);
    add_processes_to_data(data, {
        'HC': {"in": [{"item": 'h', "quantity": 40},  {"item": 'w', "quantity": 30}],
               "out": [{"item": 'l', "quantity": 30}]},
        'LC': {"in": [{"item": 'l', "quantity": 30},  {"item": 'w', "quantity": 30}], 
                "out": [{"item": 'g', "quantity": 20}]},
        'AO': {"in": [{"item": 'c', "quantity": 100}, {"item": 'w', "quantity": 50}], 
                "out": [{"item": 'h', "quantity": 10}, {"item": 'l', "quantity": 45}, {"item": 'g', "quantity": 55}]}
    });

    describe('initial matrix is sorted and filled', function() {
        
        let la = new LinearAlgebra();
        let pc = new ProcessChain(Object.values(data.processes))
            .accept(la);
        assert.deepStrictEqual(la.initial_matrix.data, [
        //     AD   HC   LC
            [-100,   0,   0], // c
            [  55,   0,  20], // g
            [  10, -40,   0], // h
            [  45,  30, -30], // l
            [ -50, -30, -30]  // w
        ])
    });
});
