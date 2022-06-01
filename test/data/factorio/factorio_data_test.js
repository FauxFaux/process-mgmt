import { describe, it } from 'mocha';
import * as assert from 'assert';
import { Factory, FactoryGroup } from '../../../src/factory.js';
import { Process } from '../../../src/process.js';

import { Item } from '../../../src/item.js'
import { Stack } from '../../../src/stack.js'

import { create_data } from '../../../src/factorio-py-1.1.53/data_base.js';

let RECIPES = './recipe-lister/recipe.json';
let ASSEMBLERS = './recipe-lister/assembling-machine.json';
let FURNACES = './recipe-lister/furnace.json';
let SILO = './recipe-lister/rocket-silo.json';

import { single_mixed_recipe, single_temperature_recipe, single_solids_recipe } from './fixtures.js';

describe('Data Parsing', function() {
    describe('standard solid processes', function() {
        let result = create_data(path => {
            switch(path) {
                case RECIPES:
                    return single_solids_recipe;
                default:
                    return {};
            }
        });
        it('finds a single process', function() {
            assert.deepStrictEqual(Object.keys(result.processes), ['copper-plate']);
        });
        it('the process has a single input', function() {
            assert.deepStrictEqual(
                result.processes['copper-plate'].inputs,
                [new Stack(new Item('copper-ore', 'copper-ore'), 8)]
                );
        });
        it('the process has a single output', function() {
            assert.deepStrictEqual(
                result.processes['copper-plate'].outputs,
                [new Stack(new Item('copper-plate', 'copper-plate'), 1)]
                );
        });
    });
    describe('temperature restricted processes', function() {
        let result = create_data(path => {
            switch(path) {
                case RECIPES:
                    return single_temperature_recipe;
                default:
                    return {};
            }
        });
        it('finds processes', function() {
            assert.deepStrictEqual(
                Object.keys(result.processes).sort(),
                [
                    'hot-residual-mixture-to-coke',
                    'warmer-stone-brick-1'
                ]
            );
        });
        it('data has three fluid variants', function() {
            assert.deepStrictEqual(
                Object.values(result.items)
                    .filter(item => item.name.startsWith('coke-oven-gas'))
                    .sort((a, b) => {
                        if (a.name < b.name) return -1;
                        if (a.name > b.name) return 1;
                        return 0;
                    }),
                [
                    new Item('coke-oven-gas', 'coke-oven-gas'),
                    new Item('coke-oven-gas_250', 'coke-oven-gas (250)'),
                    new Item('coke-oven-gas_500', 'coke-oven-gas (500)')
                ]
            )
        });
        it('the process has a two inputs', function() {
            assert.deepStrictEqual(
                result.processes['warmer-stone-brick-1'].inputs,
                [
                    new Stack(new Item('warm-stone-brick', 'warm-stone-brick'), 5),
                    new Stack(new Item('coke-oven-gas_500', 'coke-oven-gas (500)'), 100)
                ]
                );
        });
        it('the process has a two outputs', function() {
            assert.deepStrictEqual(
                result.processes['warmer-stone-brick-1'].outputs,
                [
                    new Stack(new Item('warmer-stone-brick', 'warmer-stone-brick'), 5),
                    new Stack(new Item('coke-oven-gas_250', 'coke-oven-gas (250)'), 100)
                ]
                );
        });
    });
});
