import { Item, Stack, FactoryGroup, Factory, Process } from '../structures.js'

let data = {}

data.items = [
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
].reduce((acc, item) => {acc[item.id] = item; return acc;}, {});
let items = data.items;

data.factory_groups = [
    new FactoryGroup("smelter"),
    new FactoryGroup("assembler"),
].reduce((acc, item) => {acc[item.id] = item; return acc;}, {});
let factory_groups = data.factory_groups;

data.processes = [
    new Process(
        [new Stack(items.iron_ore, 1)],
        [new Stack(items.iron_plate, 1)],
        1,
        factory_groups.smelter
    ),
    new Process(
        [new Stack(items.iron_ore, 1)],
        [new Stack(items.magnet, 1)],
        1,
        factory_groups.smelter
    ),
    new Process(
        [new Stack(items.copper_ore, 1)],
        [new Stack(items.copper_plate, 1)],
        1,
        factory_groups.smelter
    ),
    new Process(
        [new Stack(items.silicon_ore, 1)],
        [new Stack(items.high_purity_silicon, 1)],
        1,
        factory_groups.smelter
    ),
    new Process(
        [new Stack(items.high_purity_silicon, 1)],
        [new Stack(items.crystal_silicon, 1)],
        1,
        factory_groups.smelter
    ),
    new Process(
        [new Stack(items.copper_plate, 1), new Stack(items.iron_plate, 2)],
        [new Stack(items.circuit, 2)],
        1,
        factory_groups.assembler
    ),
    new Process(
        [new Stack(items.copper_plate, 1), new Stack(items.high_purity_silicon, 2)],
        [new Stack(items.microcrystalline_component, 2)],
        2,
        factory_groups.assembler
    ),
    new Process(
        [new Stack(items.microcrystalline_component, 2), new Stack(items.circuit, 2)],
        [new Stack(items.processor, 1)],
        3,
        factory_groups.assembler
    ),

]

export { data };
