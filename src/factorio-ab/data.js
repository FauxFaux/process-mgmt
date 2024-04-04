import {
    Data,
    Item,
    Stack,
    FactoryGroup,
    Factory,
    Process,
} from '../structures.js';

const data = new Data('factorio-ab', '0.0.1');

const mineable_ores = [
    'saphirite',
    'stiratite',
    'rubyte',
    'bobmonium',
    'crotinnium',
    'jivolite',
];
for (const ore of mineable_ores) {
    data.add_item(new Item('ore_' + ore, ore + ' ore'));
    data.add_item(new Item('crushed_' + ore, ore + ' crushed'));
    data.add_item(new Item('chunks_' + ore, ore + ' chunks'));
}
data.add_items([
    new Item('crushed_stone', 'crushed stone'),
    new Item('sludge_mineral', 'mineral sludge'),

    new Item('catalyst_mineral', 'mineral catalyst'),
    new Item('catalyst_crystal', 'crystal catalyst'),
    new Item('catalyst_hybrid', 'hybrid catalyst'),

    new Item('water_purified', 'purified water'),
    new Item('water_mineralized', 'mineralised water'),
    new Item('water_waste_sulfuric', 'sulphuric waste water'),

    new Item('slurry_slag', 'slag slurry'),

    new Item('sulfur', 'sulphur'),
    new Item('acid_sulfuric', 'sulphuric acid'),
    new Item('gas_sulfur_dioxide', 'sulphur dioxide gas'),
    new Item('gas_oxygen', 'oxygen gas'),

    new Item('ore_iron', 'iron ore'),
    new Item('ore_copper', 'copper ore'),
    new Item('iron_plate', 'iron plate'),
    new Item('copper_plate', 'copper plate'),
    new Item('circuit', 'circuit'),
]);
const items = data.items;

data.add_factory_groups([
    new FactoryGroup('crusher'),
    new FactoryGroup('sorter'),
    new FactoryGroup('smelter'),
    new FactoryGroup('crystallizer'),
    new FactoryGroup('filtration_unit'),
    new FactoryGroup('liquifier'),
    new FactoryGroup('assembler'),
    new FactoryGroup('chemical_plant'),
    new FactoryGroup('hydro_plant'),
]);
const factory_groups = data.factory_groups;

data.add_processes(
    [
        [items.ore_saphirite, items.crushed_saphirite],
        [items.ore_stiratite, items.crushed_stiratite],
        [items.ore_rubyte, items.crushed_rubyte],
        [items.ore_bobmonium, items.crushed_bobmonium],
        [items.ore_crotinnium, items.crushed_crotinnium],
        [items.ore_jivolite, items.crushed_jivolite],
    ].map((i) => {
        return new Process(
            i[0].id + '_crushing',
            [new Stack(i[0], 2)],
            [new Stack(i[1], 2), new Stack(items.crushed_stone, 1)],
            1,
            factory_groups.crusher,
        );
    }),
);
data.add_processes([
    new Process(
        'slag_slurry_from_crushed_stone',
        [
            new Stack(items.crushed_stone, 25),
            new Stack(items.acid_sulfuric, 15),
        ],
        [new Stack(items.slurry_slag, 50)],
        1,
        factory_groups.liquifier,
    ),
    new Process(
        'mineral_sludge_from_slag_slurry',
        [new Stack(items.slurry_slag, 50), new Stack(items.water_purified, 50)], //TODO add the filter frames.
        [
            new Stack(items.sludge_mineral, 50),
            new Stack(items.water_waste_sulfuric, 40),
        ],
        1,
        factory_groups.filtration_unit,
    ),
    new Process(
        'mineral_catalyst',
        [new Stack(items.sludge_mineral, 25)],
        [new Stack(items.catalyst_mineral, 2)],
        1,
        factory_groups.crystallizer,
    ),
]);
data.add_processes([
    new Process(
        'iron_ore_by_sorting',
        [
            new Stack(items.catalyst_mineral, 1),
            new Stack(items.crushed_saphirite, 2),
            new Stack(items.crushed_jivolite, 2),
        ],
        [new Stack(items.ore_iron, 4)],
        1,
        factory_groups.sorter,
    ),
]);
data.add_processes([
    new Process(
        'acid_sulfuric',
        [
            new Stack(items.gas_sulfur_dioxide, 90),
            new Stack(items.water_purified, 40),
        ],
        [new Stack(items.acid_sulfuric, 60)],
        1,
        factory_groups.chemical_plant,
    ),
    new Process(
        'gas_sulfur_dioxide',
        [new Stack(items.sulfur, 1), new Stack(items.gas_oxygen, 60)],
        [new Stack(items.gas_sulfur_dioxide, 60)],
        1,
        factory_groups.chemical_plant,
    ),
    new Process(
        'waste_water_purification_sulfuric',
        [new Stack(items.water_waste_sulfuric, 100)],
        [
            new Stack(items.sulfur, 1),
            new Stack(items.water_purified, 70),
            new Stack(items.water_mineralized, 20),
        ],
        1,
        factory_groups.hydro_plant,
    ),
]);

export default data;
