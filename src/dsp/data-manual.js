import {
    Data,
    Item,
    Stack,
    FactoryGroup,
    Factory,
    Process,
} from '../structures.js';

const data = new Data('dsp', '0.0.1');

data.add_items([
    new Item('iron_ore', 'iron ore'),
    new Item('iron_plate', 'iron plate'),
    new Item('magnet', 'magnet'),
    new Item('stone_ore', 'stone ore'),
    new Item('stone', 'stone'),
    new Item('steel', 'steel'),
    new Item('glass', 'glass'),
    new Item('copper_ore', 'copper ore'),
    new Item('titanium_ore', 'titanium ore'),
    new Item('titanium_plate', 'titanium plate'),
    new Item('copper_plate', 'copper plate'),
    new Item('circuit', 'circuit'),
    new Item('silicon_ore', 'silicon ore'),
    new Item('high_purity_silicon', 'high purity silicon'),
    new Item('crystal_silicon', 'crystal silicon'),
    new Item('processor', 'processor'),
    new Item('microcrystalline_component', 'microcrystalline component'),
    new Item('electromagnetic_turbine', 'electromagnetic turbine'),
    new Item('graphine', 'graphine'),
    new Item('particle_container', 'particle container'),
    new Item('electric_motor', 'electric motor'),
    new Item('magnetic_coil', 'magnetic coil'),
    new Item('gear', 'gear'),
    new Item('graviton_lens', 'graviton lens'),
    new Item('diamond', 'diamond'),
    new Item('strange_matter', 'strange matter'),
    new Item('energetic_graphite', 'energetic graphite'),
    new Item('deuterium', 'deuterium'),
    new Item('coal', 'coal'),
    new Item('kimberlite_ore', 'kimberlite ore'),
    new Item('d', ''),
]);
const items = data.items;

data.add_factory_groups([
    new FactoryGroup('smelter'),
    new FactoryGroup('assembler'),
    new FactoryGroup('particle_collider'),
]);
const factory_groups = data.factory_groups;

data.add_factories([
    new Factory('assembler_I', 'assembler I', factory_groups.assembler, 1 / 1),
    new Factory(
        'assembler_II',
        'assembler II',
        factory_groups.assembler,
        1 / 1.25,
    ),
    new Factory(
        'assembler_III',
        'assembler III',
        factory_groups.assembler,
        1 / 1.5,
    ),

    new Factory('smelter', 'smelter', factory_groups.smelter, 1),
    new Factory(
        'particle_collider',
        'particle collider',
        factory_groups.particle_collider,
        1,
    ),
]);

data.add_processes([
    // new Process(
    //     'hardened titanium thing', // XXX find the name for the titanium stuff
    //     [new Stack(items.steel, 4), new Stack(items.sulfuric_acid, 8), new Stack(items.titanium, 4)],
    //     [new Stack(items.titanium_stuff, 1)],
    //     12,
    //     factory_groups.smelter
    // ),
    new Process(
        'diamond_rare',
        [new Stack(items.kimberlite_ore, 1)],
        [new Stack(items.diamond, 1)],
        2,
        factory_groups.smelter,
    ),
    new Process(
        'glass',
        [new Stack(items.stone_ore, 2)],
        [new Stack(items.glass, 1)],
        2,
        factory_groups.smelter,
    ),
    new Process(
        'stone',
        [new Stack(items.stone_ore, 1)],
        [new Stack(items.stone, 1)],
        1,
        factory_groups.smelter,
    ),
    new Process(
        'titanium_plate',
        [new Stack(items.titanium_ore, 2)],
        [new Stack(items.titanium_plate, 1)],
        2,
        factory_groups.smelter,
    ),
    new Process(
        'steel',
        [new Stack(items.iron_plate, 3)],
        [new Stack(items.steel, 1)],
        3,
        factory_groups.smelter,
    ),
    new Process(
        'energetic_graphite',
        [new Stack(items.coal, 2)],
        [new Stack(items.energetic_graphite, 1)],
        1,
        factory_groups.smelter,
    ),
    new Process(
        'diamond',
        [new Stack(items.energetic_graphite, 1)],
        [new Stack(items.diamond, 1)],
        1,
        factory_groups.smelter,
    ),
    new Process(
        'strange_matter',
        [
            new Stack(items.particle_container, 2),
            new Stack(items.iron_plate, 2),
            new Stack(items.deuterium, 10),
        ],
        [new Stack(items.strange_matter, 1)],
        8,
        factory_groups.particle_collider,
    ),
    new Process(
        'graviton_lens',
        [new Stack(items.diamond, 4), new Stack(items.strange_matter, 1)],
        [new Stack(items.graviton_lens, 1)],
        6,
        factory_groups.assembler,
    ),
    new Process(
        'iron_plate',
        [new Stack(items.iron_ore, 1)],
        [new Stack(items.iron_plate, 1)],
        1,
        factory_groups.smelter,
    ),
    new Process(
        'magnet',
        [new Stack(items.iron_ore, 1)],
        [new Stack(items.magnet, 1)],
        1.5,
        factory_groups.smelter,
    ),
    new Process(
        'copper_plate',
        [new Stack(items.copper_ore, 1)],
        [new Stack(items.copper_plate, 1)],
        1,
        factory_groups.smelter,
    ),
    new Process(
        'high_purity_silicon',
        [new Stack(items.silicon_ore, 1)],
        [new Stack(items.high_purity_silicon, 1)],
        1,
        factory_groups.smelter,
    ),
    new Process(
        'crystal_silicon',
        [new Stack(items.high_purity_silicon, 1)],
        [new Stack(items.crystal_silicon, 1)],
        1,
        factory_groups.smelter,
    ),
    new Process(
        'circuit',
        [new Stack(items.copper_plate, 1), new Stack(items.iron_plate, 2)],
        [new Stack(items.circuit, 2)],
        1,
        factory_groups.assembler,
    ),
    new Process(
        'microcrystalline_component',
        [
            new Stack(items.copper_plate, 1),
            new Stack(items.high_purity_silicon, 2),
        ],
        [new Stack(items.microcrystalline_component, 2)],
        2,
        factory_groups.assembler,
    ),
    new Process(
        'processor',
        [
            new Stack(items.microcrystalline_component, 2),
            new Stack(items.circuit, 2),
        ],
        [new Stack(items.processor, 1)],
        3,
        factory_groups.assembler,
    ),
    new Process(
        'particle_container',
        [
            new Stack(items.copper_plate, 2),
            new Stack(items.graphine, 2),
            new Stack(items.electromagnetic_turbine, 2),
        ],
        [new Stack(items.particle_container, 1)],
        4,
        factory_groups.assembler,
    ),
    new Process(
        'electromagnetic_turbine',
        [new Stack(items.magnetic_coil, 2), new Stack(items.electric_motor, 2)],
        [new Stack(items.electromagnetic_turbine, 1)],
        2,
        factory_groups.assembler,
    ),
    new Process(
        'magnetic_coil',
        [new Stack(items.magnet, 2), new Stack(items.copper_plate, 1)],
        [new Stack(items.magnetic_coil, 1)],
        1,
        factory_groups.assembler,
    ),
    new Process(
        'elctric_motor',
        [
            new Stack(items.magnetic_coil, 1),
            new Stack(items.iron_plate, 2),
            new Stack(items.gear, 1),
        ],
        [new Stack(items.electric_motor, 1)],
        2,
        factory_groups.assembler,
    ),
    new Process(
        'gear',
        [new Stack(items.iron_plate, 1)],
        [new Stack(items.gear, 1)],
        1,
        factory_groups.assembler,
    ),
]);

export { data };
