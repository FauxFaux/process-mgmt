import { Factory, FactoryGroup } from '../factory.js';
import { Stack } from '../stack.js';
import { Item } from '../item.js';
import { Data } from '../data.js';
import { Process } from '../process.js';

const raw = require('./exported-data.json');

const fix_identifier = function (id) {
    return id.replace(/-/g, '_');
};

const check_add = function (item, fn) {
    try {
        return fn();
    } catch (error) {
        console.log('error processing item:', item);
        throw error;
    }
};

const convert_ingredient = function (ingredient, recipe) {
    const ingredient_name = fix_identifier(ingredient.name);
    let amount = ingredient.amount;
    const probability = ingredient.probability;
    if (typeof amount === 'undefined') {
        amount = (ingredient.amount_min + ingredient.amount_max) / 2;
    }
    if (probability) {
        amount = amount * probability;
    }
    return check_add(
        recipe,
        // @ts-expect-error
        () => new Stack(data.items[ingredient_name], amount),
    );
};

const data_p = import('./exported-data.json', { assert: { type: 'json' } })
    .then((module) => module.default)
    .then((raw) => {
        const data = new Data('factorio-ab-01', '0.0.1');
        for (const recipe of raw.recipes) {
            if (!recipe.name) continue; // ignore '{}'
            check_add(recipe, function () {
                const name = fix_identifier(recipe.name);
                for (const ing of recipe.ingredients) {
                    const ing_name = fix_identifier(ing.name);
                    if (!data.items[ing_name]) {
                        data.add_item(new Item(ing_name, ing_name));
                    }
                }
            });
            for (const ing of recipe.products) {
                const ing_name = fix_identifier(ing.name);
                if (!data.items[ing_name]) {
                    check_add(recipe, () =>
                        data.add_item(new Item(ing_name, ing_name)),
                    );
                }
            }
            const inputs = recipe.ingredients.map((ing) =>
                convert_ingredient(ing, recipe),
            );
            let outputs = recipe.products
                .map((ing) => convert_ingredient(ing, recipe))
                .reduce((acc, cur) => {
                    // collect outputs of processes that output the same type multiple times.
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
                check_add(recipe, () =>
                    data.add_factory_group(new FactoryGroup(category)),
                );
            }

            data.add_process(
                new Process(
                    fix_identifier(recipe.name),
                    inputs,
                    outputs,
                    recipe.energy === 0 ? 0.1 : recipe.energy,
                    data.factory_groups[category],
                ),
            );
        }

        for (const machine of raw.craftingMachines as any[]) {
            if (!machine.name) continue; // ignore '{}'
            check_add(machine, function () {
                for (const cat of Object.keys(machine.categories)) {
                    const category_name = fix_identifier(cat);
                    if (!data.factory_groups[category_name]) {
                        data.add_factory_group(new FactoryGroup(category_name));
                    }
                }
                const machine_name = fix_identifier(machine.name);
                data.add_factory(
                    new Factory(
                        machine_name,
                        machine_name,
                        Object.keys(machine.categories)
                            .map((cat) => fix_identifier(cat))
                            .map((cat) => data.factory_groups[cat]),
                        1 / machine.craftingSpeed,
                    ),
                );
            });
        }
        return data;
    });

export default await data_p;
