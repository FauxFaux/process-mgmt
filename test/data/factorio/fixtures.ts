const single_solids_recipe = {
    'copper-plate': {
        name: 'copper-plate',
        localised_name: ['item-name.copper-plate'],
        category: 'smelting',
        group: {
            name: 'intermediate-products',
            type: 'item-group',
        },
        subgroup: {
            name: 'raw-material',
            type: 'item-subgroup',
        },
        energy: 10,
        ingredients: [
            {
                type: 'item',
                name: 'copper-ore',
                amount: 8,
            },
        ],
        products: [
            {
                type: 'item',
                name: 'copper-plate',
                probability: 1,
                amount: 1,
            },
        ],
    },
};

const single_temperature_recipe = {
    'warmer-stone-brick-1': {
        name: 'warmer-stone-brick-1',
        localised_name: ['item-name.warmer-stone-brick'],
        category: 'rhe',
        group: {
            name: 'py-petroleum-handling',
            type: 'item-group',
        },
        subgroup: {
            name: 'py-petroleum-handling-hot-air',
            type: 'item-subgroup',
        },
        enabled: false,
        hidden: false,
        hidden_from_player_crafting: false,
        emissions_multiplier: 1,
        energy: 5,
        ingredients: [
            {
                type: 'item',
                name: 'warm-stone-brick',
                amount: 5,
            },
            {
                type: 'fluid',
                name: 'coke-oven-gas',
                amount: 100,
                minimum_temperature: 500,
                maximum_temperature: 1.7976931348623e308,
                catalyst_amount: 100,
            },
        ],
        products: [
            {
                type: 'item',
                name: 'warmer-stone-brick',
                probability: 1,
                amount: 5,
            },
            {
                type: 'fluid',
                name: 'coke-oven-gas',
                probability: 1,
                amount: 100,
                temperature: 250,
                catalyst_amount: 100,
            },
        ],
    },
    'hot-residual-mixture-to-coke': {
        name: 'hot-residual-mixture-to-coke',
        localised_name: ['item-name.coke'],
        category: 'upgrader',
        group: {
            name: 'py-petroleum-handling',
            type: 'item-group',
        },
        energy: 6,
        ingredients: [
            {
                type: 'fluid',
                name: 'hot-residual-mixture',
                amount: 150,
            },
            {
                type: 'fluid',
                name: 'water',
                amount: 300,
            },
        ],
        products: [
            {
                type: 'item',
                name: 'coke',
                probability: 1,
                amount: 40,
            },
            {
                type: 'fluid',
                name: 'coke-oven-gas',
                probability: 1,
                amount: 60,
                temperature: 500,
            },
        ],
    },
};

const multiple_temperature_recipe = {
    'warmer-stone-brick-1': {
        name: 'warmer-stone-brick-1',
        localised_name: ['item-name.warmer-stone-brick'],
        category: 'rhe',
        group: {
            name: 'py-petroleum-handling',
            type: 'item-group',
        },
        subgroup: {
            name: 'py-petroleum-handling-hot-air',
            type: 'item-subgroup',
        },
        enabled: false,
        hidden: false,
        hidden_from_player_crafting: false,
        emissions_multiplier: 1,
        energy: 5,
        ingredients: [
            {
                type: 'item',
                name: 'warm-stone-brick',
                amount: 5,
            },
            {
                type: 'fluid',
                name: 'coke-oven-gas',
                amount: 100,
                minimum_temperature: 300,
                maximum_temperature: 1.7976931348623e308,
                catalyst_amount: 100,
            },
        ],
        products: [
            {
                type: 'item',
                name: 'warmer-stone-brick',
                probability: 1,
                amount: 5,
            },
            {
                type: 'fluid',
                name: 'coke-oven-gas',
                probability: 1,
                amount: 100,
                temperature: 250,
                catalyst_amount: 100,
            },
        ],
    },
    'coke-oven-gas-300': {
        name: 'coke-oven-gas-300',
        localised_name: ['item-name.coke'],
        category: 'upgrader',
        group: {
            name: 'py-petroleum-handling',
            type: 'item-group',
        },
        energy: 6,
        ingredients: [
            {
                type: 'fluid',
                name: 'water',
                amount: 300,
            },
        ],
        products: [
            {
                type: 'item',
                name: 'coke',
                probability: 1,
                amount: 30,
            },
            {
                type: 'fluid',
                name: 'coke-oven-gas',
                probability: 1,
                amount: 60,
                temperature: 300,
            },
        ],
    },
    'coke-oven-gas-500': {
        name: 'coke-oven-gas-500',
        localised_name: ['item-name.coke'],
        category: 'upgrader',
        group: {
            name: 'py-petroleum-handling',
            type: 'item-group',
        },
        energy: 6,
        ingredients: [
            {
                type: 'fluid',
                name: 'water',
                amount: 300,
            },
        ],
        products: [
            {
                type: 'item',
                name: 'coke',
                probability: 1,
                amount: 40,
            },
            {
                type: 'fluid',
                name: 'coke-oven-gas',
                probability: 1,
                amount: 60,
                temperature: 500,
            },
        ],
    },
};

const single_mixed_recipe = {
    'warmer-air-2': {
        name: 'warmer-air-2',
        localised_name: ['fluid-name.hot-air'],
        group: {
            name: 'py-petroleum-handling',
            type: 'item-group',
        },
        category: 'upgrader',
        energy: 2,
        ingredients: [
            {
                type: 'item',
                name: 'warmer-stone-brick',
                amount: 20,
            },
            {
                type: 'fluid',
                name: 'pressured-air',
                amount: 150,
            },
        ],
        products: [
            {
                type: 'item',
                name: 'stone-brick',
                probability: 1,
                amount: 20,
            },
            {
                type: 'fluid',
                name: 'hot-air',
                probability: 1,
                amount: 300,
            },
        ],
    },
};

export {
    single_mixed_recipe,
    multiple_temperature_recipe,
    single_temperature_recipe,
    single_solids_recipe,
};
