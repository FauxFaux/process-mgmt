import { Factory, FactoryGroup } from '../factory.js';
import { Stack } from '../stack.js';
import { Item } from '../item.js';
import { Data } from '../data.js';
import { Process } from '../process.js';


import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'exported-data.json'), 'utf8'));

let data = new Data('factorio-ab-1.1.38', '0.0.1');

const fix_identifier = function(id) {
    return id.replace(/-/g, '_');
}

const check_add = function(item, fn) {
    try {
        return fn();
    } catch (error) {
        console.log("error processing item:", item);
        throw error;
    }
}

const convert_ingredient = function(ingredient, recipe) {
    const ingredient_name = fix_identifier(ingredient.name);
    let amount = ingredient.amount;
    let probability = ingredient.probability;
    if ((typeof amount) === "undefined") {
        amount = (ingredient.amount_min + ingredient.amount_max) / 2
    }
    if (probability) {
        amount = amount * probability;
    }
    return check_add(recipe, () => new Stack(data.items[ingredient_name], amount));
}

Object.values(raw.recipe).forEach(recipe => {
    if (!recipe.name) return; // ignore '{}'
    if (recipe.normal) {
        recipe.ingredients = recipe.normal.ingredients;
        recipe.results = recipe.normal.results;
        recipe.result = recipe.normal.result;
    }
    if (recipe.result) {
        recipe.results = [{"type": "item", "name": recipe.result, "amount": 1}];
    }
    if ("undefined" === typeof(recipe.category)) {
        console.warn("missing category for ", recipe.name);
        recipe.category = "crafting";
    }
    if ("undefined" === typeof(recipe.energy_required)) {
        console.warn("missing energy_required for ", recipe.name);
        recipe.energy_required = 1;
    }
    if (
        (typeof recipe.ingredients) === "object" &&
        Object.entries(recipe.ingredients).length === 0) {
        recipe.ingredients = [];
    }
    if (
        (typeof recipe.results) === "object" &&
        Object.entries(recipe.results).length === 0
    ) {
        recipe.results = [];
    }



    check_add(recipe, function() {
        const name = fix_identifier(recipe.name);
        recipe.ingredients.forEach(ing => {
            const ing_name = fix_identifier(ing.name);
            if (!data.items[ing_name]) {
                data.add_item(new Item(ing_name, ing_name));
            }
        });
    });
    check_add(recipe, () => {
        recipe.results.forEach(ing => {
            const ing_name = fix_identifier(ing.name);
            if (!data.items[ing_name]) {
                check_add(recipe, () => data.add_item(new Item(ing_name, ing_name)));
            }
        });
    });
    let inputs = recipe.ingredients.map(ing => convert_ingredient(ing, recipe));
    let outputs = recipe.results
        .map(ing => convert_ingredient(ing, recipe))
        .reduce((acc, cur) => { // collect outputs of processes that output the same type multiple times.
            if (acc[cur.item.id]) {
                acc[cur.item.id] = acc[cur.item.id].add(cur);
            } else {
                acc[cur.item.id] = cur;
            }
            return acc;
        }, {});
    outputs = Object.values(outputs);
    const category = fix_identifier(recipe.category);
    if (!data.factory_groups[category]) {
        check_add(recipe, () => data.add_factory_group(new FactoryGroup(category)));
    }

    check_add(recipe, () => {
        data.add_process(new Process(
            fix_identifier(recipe.name),
            inputs,
            outputs,
            recipe.energy_required === 0 ? 0.1 : recipe.energy_required,
            data.factory_groups[category]
        ))
    });
});

Object.values(raw['assembling-machine']).forEach(machine => {
    if (!machine.name) return; // ignore '{}'
    check_add(machine, function() {
        machine.crafting_categories.forEach(cat => {
            const category_name = fix_identifier(cat);
            if (!data.factory_groups[category_name]) {
                data.add_factory_group(new FactoryGroup(category_name));
            }
        });
        const machine_name = fix_identifier(machine.name);
        data.add_factory(new Factory(
            machine_name,
            machine_name,
            machine.crafting_categories
                .map(cat => fix_identifier(cat))
                .map(cat => data.factory_groups[cat]),
            1/machine.crafting_speed
        ));
    });
});

export { data };
