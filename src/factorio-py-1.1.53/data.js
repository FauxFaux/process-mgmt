import { Factory, FactoryGroup } from '../factory.js';
import { Stack } from '../stack.js';
import { Item } from '../item.js';
import { Data } from '../data.js';
import { Process } from '../process.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let recipe_raw = require('./recipe-lister/recipe.json');


let data = new Data('factorio-py-1.1.53', '0.0.1');

const check_add = function(item, fn) {
    try {
        return fn();
    } catch (error) {
        console.log("error processing item:", item);
        throw error;
    }
}

const add_item = function(data, name) {
    if (!data.items[name]) {
        data.add_item(new Item(name, name));
    }
}

const convert_ingredient = function(data, ingredient) {
    let amount = ingredient.amount;
    if ((typeof amount) === "undefined") {
        amount = (ingredient.amount_min + ingredient.amount_max) / 2
    }
    let probability = ingredient.probability;
    if (probability) {
        amount = amount * probability;
    }
    return new Stack(data.items[ingredient.name], amount);
}

Object.values(recipe_raw).forEach(recipe => {
    check_add(recipe, () => {
        if (!Array.isArray(recipe.ingredients)) recipe.ingredients = [];
        recipe.ingredients.forEach(ingredient => {
            check_add([recipe, ingredient], () => add_item(data, ingredient.name));
        });
        if (!Array.isArray(recipe.products)) recipe.products = [];
        recipe.products.forEach(product => {
            check_add([recipe, product], () => add_item(data, product.name));
        });
        check_add([recipe, recipe.category], () => {
            if (!data.factory_groups[recipe.category]) {
                data.add_factory_group(new FactoryGroup(recipe.category));
            }
        });
        check_add(recipe, () => {
            data.add_process(new Process(
                recipe.name,
                recipe.ingredients.map(i => convert_ingredient(data, i)),
                recipe.products.map(i => convert_ingredient(data, i)),
                recipe.energy,
                data.factory_groups[recipe.category]
            ));
        });
    });
});


[
    'recipe-lister/assembling-machine.json',
    'recipe-lister/furnace.json',
    'recipe-lister/rocket-silo.json',
].map(
    f => require('./' + f)
).forEach(group => {
    Object.values(group).forEach(factory => {
        check_add([factory, factory.crafting_categories], () => {
            Object.keys(factory.crafting_categories).forEach(category_name => {
                if (!data.factory_groups[category_name]) {
                    data.add_factory_group(new FactoryGroup(category_name));
                }
            });
        });
        check_add(factory, () => {
            data.add_factory(new Factory(
                factory.name,
                factory.name,
                Object.keys(factory.crafting_categories).map(c => data.factory_groups[c]),
                factory.crafting_speed
            ));
        });
    });
});


export { data };
