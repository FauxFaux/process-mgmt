import { Data, Item, Stack, FactoryGroup, Factory, Process } from '../structures.js'

let data = new Data("dsp", "0.0.1");

data.add_items([
    new Item("iron_ore", "iron ore"),
    new Item("iron_plate", "iron plate"),
    new Item("magnet", "magnet"),
    new Item("copper_ore", "copper ore"),
    new Item("copper_plate", "copper plate"),
    new Item("circuit", "circuit"),
    new Item("silicon_ore", "silicon ore"),
    new Item("high_purity_silicon", "high purity silicon"),
    new Item("crystal_silicon", "crystal silicon"),
    new Item("processor", "processor"),
    new Item("microcrystalline_component", "microcrystalline component"),
    new Item("electromagnetic_turbine", "electromagnetic turbine"),
    new Item("graphine", "graphine"),
    new Item("particle_container", "particle container"),
    new Item("electric_motor", "electric motor"),
    new Item("magnetic_coil", "magnetic coil"),
    new Item("gear", "gear"),
    new Item("a", ""),
    new Item("b", ""),
]);
let items = data.items;

data.add_factory_groups([
    new FactoryGroup("smelter"),
    new FactoryGroup("assembler"),
]);
let factory_groups = data.factory_groups;

data.add_processes([
    new Process(
        "iron_plate",
        [new Stack(items.iron_ore, 1)],
        [new Stack(items.iron_plate, 1)],
        1,
        factory_groups.smelter
    ),
    new Process(
        "magnet",
        [new Stack(items.iron_ore, 1)],
        [new Stack(items.magnet, 1)],
        1,
        factory_groups.smelter
    ),
    new Process(
        "copper_plate",
        [new Stack(items.copper_ore, 1)],
        [new Stack(items.copper_plate, 1)],
        1,
        factory_groups.smelter
    ),
    new Process(
        "high_purity_silicon",
        [new Stack(items.silicon_ore, 1)],
        [new Stack(items.high_purity_silicon, 1)],
        1,
        factory_groups.smelter
    ),
    new Process(
        "crystal_silicon",
        [new Stack(items.high_purity_silicon, 1)],
        [new Stack(items.crystal_silicon, 1)],
        1,
        factory_groups.smelter
    ),
    new Process(
        "circuit",
        [new Stack(items.copper_plate, 1), new Stack(items.iron_plate, 2)],
        [new Stack(items.circuit, 2)],
        1,
        factory_groups.assembler
    ),
    new Process(
        "microcrystalline_component",
        [new Stack(items.copper_plate, 1), new Stack(items.high_purity_silicon, 2)],
        [new Stack(items.microcrystalline_component, 2)],
        2,
        factory_groups.assembler
    ),
    new Process(
        "processor",
        [new Stack(items.microcrystalline_component, 2), new Stack(items.circuit, 2)],
        [new Stack(items.processor, 1)],
        3,
        factory_groups.assembler
    ),
    new Process(
        "particle_container",
        [new Stack(items.copper_plate, 2), new Stack(items.graphine, 2), new Stack(items.electromagnetic_turbine, 2)],
        [new Stack(items.particle_container, 1)],
        4,
        factory_groups.assembler
    ),
    new Process(
        "electromagnetic_turbine",
        [new Stack(items.magnetic_coil, 2), new Stack(items.electric_motor, 2)],
        [new Stack(items.electromagnetic_turbine, 1)],
        2,
        factory_groups.assembler
    ),
    new Process(
        "magnetic_coil",
        [new Stack(items.magnet, 2), new Stack(items.copper_plate, 1)],
        [new Stack(items.magnetic_coil, 1)],
        1,
        factory_groups.assembler
    ),
    new Process(
        "elctric_motor",
        [new Stack(items.magnetic_coil, 1), new Stack(items.iron_plate, 2), new Stack(items.gear, 1)],
        [new Stack(items.electric_motor, 1)],
        2,
        factory_groups.assembler
    ),
    new Process(
        "gear",
        [new Stack(items.iron_plate, 1)],
        [new Stack(items.gear, 1)],
        1,
        factory_groups.assembler
    ),
]);

export { data };
