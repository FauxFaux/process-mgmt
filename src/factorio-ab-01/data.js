import { Factory, FactoryGroup } from '../factory.js';
import { Stack } from '../stack.js';
import { Item } from '../item.js';
import { Data } from '../data.js';
import { Process } from '../process.js';


// import raw from './exported-data-min';
//const raw = import('./exported-data-min.json');
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
//let raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'exported-data-min.json'), 'utf8'));
// let raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'exported-data-min-hno3.json'), 'utf8'));
let raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'exported-data.json'), 'utf8'));

let data = new Data('factorio-ab-01', '0.0.1');

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
    if ((typeof amount) === "undefined") {
        amount = (ingredient.amount_min + ingredient.amount_max) / 2
    }
    return check_add(recipe, () => new Stack(data.items[ingredient_name], amount));
}

raw.recipes.forEach(recipe => {
    if (!recipe.name) return; // ignore '{}'
    check_add(recipe, function() {
        const name = fix_identifier(recipe.name);
        recipe.ingredients.forEach(ing => {
            const ing_name = fix_identifier(ing.name);
            if (!data.items[ing_name]) {
                data.add_item(new Item(ing_name, ing_name));
            }
        });
    });
    recipe.products.forEach(ing => {
        const ing_name = fix_identifier(ing.name);
        if (!data.items[ing_name]) {
            check_add(recipe, () => data.add_item(new Item(ing_name, ing_name)));
        }
    });
    let inputs = recipe.ingredients.map(ing => convert_ingredient(ing, recipe));
    let outputs = recipe.products.map(ing => convert_ingredient(ing, recipe));
    const category = fix_identifier(recipe.category);
    if (!data.factory_groups[category]) {
        check_add(recipe, () => data.add_factory_group(new FactoryGroup(category)));
    }

    data.add_process(new Process(
        fix_identifier(recipe.name),
        inputs,
        outputs,
        recipe.energy === 0 ? 0.1 : recipe.energy,
        data.factory_groups[category]
    ))
});

raw.craftingMachines.forEach(machine => {
    if (!machine.name) return; // ignore '{}'
    check_add(machine, function() {
        Object.keys(machine.categories).forEach(cat => {
            const category_name = fix_identifier(cat);
            if (!data.factory_groups[category_name]) {
                data.add_factory_group(new FactoryGroup(category_name));
            }
        });
        const machine_name = fix_identifier(machine.name);
        data.add_factory(new Factory(
            machine_name,
            machine_name,
            Object.keys(machine.categories).map(cat => data.factory_groups[cat]),
            1/machine.craftingSpeed
        ));
    });
});

export { data };
