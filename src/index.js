// import { data } from './dsp/data.js';
// import { data } from './vt/data.js'
import { data } from './factorio-ab-01/data.js'
//import { data } from './factorio-ab/data.js'
import { ProcessChain, RateChain, Stack } from './structures.js';
// import { inspect } from 'util'
const readline = import('readline');

// console.log(inspect(data, false, null, true));

// console.log(data);

// let p = new ProcessChain([
//     data.processes.waste_water_purification_sulfuric,
//     data.processes.acid_sulfuric,
//     data.processes.gas_sulfur_dioxide,
//     data.processes.iron_ore_by_sorting,
//     data.processes.mineral_catalyst,
//     data.processes.mineral_sludge_from_slag_slurry,
//     data.processes.slag_slurry_from_crushed_stone,
//     data.processes.ore_jivolite_crushing,
//     data.processes.ore_saphirite_crushing,
// ]);


// Object.entries(data.processes).forEach(([id, proc]) => console.log(id));

// const readline_disambiguate = function(requirement, options) {
//     console.log('Multiple potential options for ', requirement, ':', options);

// };

// const array_disambiguate = function(requirement, options) { }
// const array_disambiguate = function(requirement, options) {
//     let arr = {};
//     arr[data.items.Diamond.id] = data.processes.Diamond_Rare;
//     arr[data.items.Carbon_Nanotube.id] = data.processes.Carbon_Nanotube;
//     arr[data.items.Graphene.id] = data.processes.Graphene_Rare;
//     arr[data.items.Casimir_Crystal.id] = data.processes.Casimir_Crystal;
//     arr[data.items.Photon_Combiner.id] = data.processes.Photon_Combiner;
//     arr[data.items.Energetic_Graphite.id] = data.processes.Energetic_Graphite;
//     arr[data.items.Crystal_Silicon.id] = data.processes.Crystal_Silicon_Rare;
//     arr[data.items.Deuterium.id] = data.processes.Deuterium;
//     if (arr[requirement] === false) {
//         throw new Error('No enabled priority for ' + requirement + ' (available: ' + options.map(i => i.id).join(', ') + ')');
//     }
//     return arr[requirement];
// };

// const array_disambiguate = function(requirement, options) {
//     let arr = {};
//     arr[data.items.gas_nitrogen_monoxide.id] = data.processes.solid_sodium_nitrate_processing;
//     if (!arr[requirement] === false) {
//         throw new Error('No enabled priority for ' + requirement + ' (available: ' + options.map(i => i.id).join(', ') + ')');
//     }
//     return arr[requirement];
// };

const array_disambiguate = function(requirement, options) {
    let arr = {};
    arr[data.items.uranium_ore.id] = data.processes.angelsore_crystal_mix5_processing;
    arr[data.items.silver_ore.id] = data.processes.angelsore_crystal_mix4_processing;
    arr[data.items.cobalt_ore.id] = data.processes.angelsore_crystal_mix3_processing;
    arr[data.items.rutile_ore.id] = data.processes.angelsore_crystal_mix1_processing;
    arr[data.items.liquid_sulfuric_acid.id] = data.processes.liquid_sulfuric_acid;
    arr[data.items.liquid_nitric_acid.id] = data.processes.liquid_nitric_acid;
    arr[data.items.angels_ore1_crushed.id] = data.processes.angelsore1_crushed;
    arr[data.items.angels_ore3_crushed.id] = data.processes.angelsore3_crushed;
    arr[data.items.liquid_hydrochloric_acid.id] = data.processes.liquid_hydrochloric_acid_solid_sodium_sulfate;
    arr[data.items.liquid_hydrofluoric_acid.id] = data.processes.liquid_hydrofluoric_acid;
    arr[data.items.fluorite_ore.id] = data.processes.angelsore_chunk_mix5_processing;

    arr[data.items.titanium_plate.id] = data.processes.angels_roll_titanium_converting;
    arr[data.items.angels_roll_titanium.id] = data.processes.roll_titanium_casting_fast;

    // advanced:
    arr[data.items.liquid_molten_titanium.id] = data.processes.molten_titanium_smelting_4;
    arr[data.items.ingot_titanium.id] = data.processes.sponge_titanium_smelting;
    arr[data.items.liquid_titanium_tetrachloride.id] = data.processes.processed_titanium_smelting;
    // arr[data.items.solid_carbon.id] = data.processes.carbon;
    arr[data.items.ingot_tin.id] = data.processes.pellet_tin_smelting;
    arr[data.items.ingot_chrome.id] = data.processes.solid_chrome_oxide_smelting;
    arr[data.items.solid_chrome_oxide.id] = data.processes.solid_dichromate_smelting;
    arr[data.items.cobalt_oxide.id] = data.processes.processed_cobalt_smelting;
    arr[data.items.solid_limestone.id] = data.processes.pellet_titanium_smelting;
    arr[data.items.solid_calcium_chloride.id] = data.processes.solid_calcium_chloride;
    arr[data.items.solid_sodium_carbonate.id] = data.processes.coke_purification_2;
    arr[data.items.gas_oxygen.id] = data.processes.water_separation;
    arr[data.items.gas_nitrogen.id] = data.processes.air_separation;
    arr[data.items.solid_coke.id] = data.processes.solid_coke;
    arr[data.items.solid_sodium_hydroxide.id] = data.processes.brine_electrolysis;
    arr[data.items.alumina.id] = data.processes.solid_aluminium_hydroxide_smelting;

    arr[data.items.ingot_cobalt.id] = data.processes.solid_cobalt_oxide_smelting;
    arr[data.items.solid_aluminium_hydroxide.id] = data.processes.processed_aluminium_smelting;
    arr[data.items.water_saline.id] = data.processes.water_saline;

    arr[data.items.crystal_seedling.id] = data.processes.crystal_slurry_filtering_1;
    arr[data.items.crystal_slurry.id] = data.processes.geode_blue_liquify;

    // coolant
    arr[data.items.liquid_coolant.id] = data.processes.coolant;
    // arr[data.items.liquid_mineral_oil.id] = data.processes.oil_refining;
    arr[data.items.liquid_mineral_oil.id] = data.processes.liquid_mineral_oil_catalyst;
    arr[data.items.liquid_naphtha.id] = data.processes.residual_oil_refining;
    arr[data.items.gas_carbon_monoxide.id] = data.processes.carbon_separation_1;
    arr[data.items.solid_carbon.id] = data.processes.coke_purification;
    arr[data.items.gas_residual.id] = data.processes.steam_cracking_oil_residual;
    arr[data.items.solid_oil_residual.id] = data.processes.oil_refining;
    arr[data.items.steam.id] = data.processes.angels_steam_water;
    arr[data.items.ingot_nickel.id] = data.processes.solid_nickel_carbonyl_smelting;
    // arr[data.items.ingot_nickel.id] = data.processes.cathode_nickel_smelting;

    // arr[data.items.fluorite_ore.id] = data.processes.greenyellow_waste_water_purification;
    // arr[solid_salt] = data.green_waste_water_purification;
    arr[data.items.solid_salt.id] = data.processes.salt;
    if (!(arr[requirement]) === true) {
        throw new Error('No enabled priority for ' + requirement + ' (available: ' + options.map(i => i.id).join(', ') + ')\n\n'
            + options.map(p => {
                return p.id + ' => \n'
                    + '  inputs:\n'
                    + p.inputs.map(i => '    ' + i.toString()).join('\n')
                    + '\n'
                    + '  outputs:\n'
                    + p.outputs.map(i => '    ' + i.toString()).join('\n')
                    + '\n'
                    + 'arr[data.items.' + requirement + '.id] = data.processes.' + p.id + ';'
                    + '\n'
                }).join('\n')

        );
    }
    return arr[requirement];
};


// let names = [
//     'iron_plate',
//     'magnet',
//     'gear',
//     'magnetic_coil',
//     'elctric_motor',
//     'electromagnetic_turbine',
//     'copper_plate',
//     'particle_container',
// ];
// let p = new ProcessChain(names.map(n => data.processes[n]));
// let p = new ProcessChain([data.processes['diamond']])
let p = new ProcessChain(Object.values(data.processes))
    // .disable(data.processes.Sulphuric_Acid.id)
    // .disable(data.processes.Silicon_Ore.id)
    // .filter_for_output(new Stack(data.items.U_Matrix, 1), array_disambiguate)
    // .disable(data.processes.Silicon_Ore.id)
    // .disable(data.processes.Sulphuric_Acid.id)
    // .filter_for_output(new Stack(data.items.Small_Carrier_Rocket, 1), array_disambiguate)
    // .filter_for_output(new Stack(data.items.electric_motor, 1), array_disambiguate)
    // .filter_for_output(new Stack(data.items.graviton_lens, 1), array_disambiguate)
    .filter_for_output(
        new Stack(data.items.catalysator_green, 1),
        array_disambiguate,
        [
            data.items.geode_blue.id,
            data.items.filter_frame.id,
            data.items.nickel_ore.id,
            data.items.sulfur.id,
            data.items.water_yellow_waste.id,
            data.items.water_greenyellow_waste.id,
            data.items.water_green_waste.id,
            data.items.water_red_waste.id,
            data.items.catalysator_brown.id,
            // data.items.catalysator_green.id,
            data.items.catalysator_orange.id,
            data.items.water_purified.id,
            data.items.water.id,
            data.items.liquid_nitric_acid.id,
            data.items.liquid_sulfuric_acid.id,
            // data.items.liquid_hydrofluoric_acid.id,
            data.items.liquid_hydrochloric_acid.id,
            // data.items.fluorite_ore.id,
            // data.items.liquid_coolant.id,
            data.items.gas_chlorine.id,
            data.items.coal.id,
            data.items.rutile_ore.id,
            data.items.stone_crushed.id,
            data.items.gas_hydrogen_chloride.id,
            data.items.tin_ore.id,
            data.items.bauxite_ore.id,
            data.items.crude_oil.id,
            data.items.thermal_water.id,
        ]
    )
    // .enable(data.processes.residual_oil_refining)
    // .enable(data.processes.steam_cracking_oil_residual)
    // .enable(data.processes.liquid_mineral_oil_catalyst)
    // .enable(data.processes.carbon_separation_1)
    // .enable()
    // .enable()
    // .enable()
    // .enable(data.processes.solid_salt_from_saline)
    // .enable(data.processes.greenyellow_waste_water_purification)
    // .filter_for_output(new Stack(data.items['liquid_sulfuric_acid'], 1), array_disambiguate)
    // .filter_for_output(new Stack(data.items.circuit, 1), array_disambiguate)
    // .filter_for_output(new Stack(data.items.liquid_nitric_acid, 1), array_disambiguate)
    ;

// p = new RateChain(p, {'assembler': data.factories.assembler_III});
p = new RateChain(p, {
    'ore_sorting': data.factories['ore_crusher_3'],
    'ore_sorting_t1': data.factories['ore_sorting_facility_4'],
    'ore_sorting_t2': data.factories['ore_floatation_cell_3'],
    'ore_sorting_t3': data.factories['ore_leaching_plant_3'],
    'ore_processing': data.factories['ore_processing_machine_4'],
    'ore_processing_2': data.factories['ore_processing_machine_4'],
    'ore_processing_3': data.factories['ore_processing_machine_4'],
    'ore_processing_4': data.factories['ore_processing_machine_4'],
    'pellet_pressing': data.factories['pellet_press_4'],
    'pellet_pressing_4': data.factories['pellet_press_4'],
    'pellet_pressing_4': data.factories['pellet_press_4'],
    'pellet_pressing_4': data.factories['pellet_press_4'],
    'liquifying': data.factories['liquifier_4'],
    'blast_smelting': data.factories['blast_furnace_4'],
    'filtering': data.factories['filtration_unit_2'],
    'crystallizing': data.factories['crystallizer_2'],
});

console.error(data.factories);
// // // let r = p.update(new Stack(data.items.circuit, 10));
p.update(new Stack(data.items.catalysator_green, 60),
    [// imported
        data.items.water.id,
        data.items.water_purified.id,
        data.items.crude_oil.id,
        data.items.coal.id,
        data.items.thermal_water.id,
        data.items.liquid_fuel_oil.id,
        data.items.filter_frame.id,

        data.items.liquid_sulfuric_acid.id,
        data.items.liquid_nitric_acid.id,
        data.items.catalysator_orange.id,
        data.items.sulfur.id,
    ],
    [// exported
        data.items.nickel_ore.id,
        data.items.liquid_coolant.id,
    ]
);
// p.update(new Stack(data.items['liquid_sulfuric_acid'], 600));
// p.update(new Stack(data.items['liquid_nitric_acid'], 100));
// p.update(new Stack(data.items.electric_motor, 8));
// p.update(
//     new Stack(data.items.Small_Carrier_Rocket, 2),
//     [
    // data.items.Hydrogen.id, data.items.Silicon_Ore.id, data.items.Sulphuric_Acid.id]
//     );
// console.log(r[0], r[1]);
// let p = new ProcessChain(Object.entries(data.processes).flatMap(
//  ([id, proc]) => proc
// ));

// let processes_from_exported_data = [
// 'angelsore-crushed-mix1-processing', // iron ore from 2x crushed + catalyst.
// ]

//console.log(p.processes_by_output)
// console.log('circuit production rate', data.processes[3].production_rate(data.items.circuit, 1))

// console.log(p.require_output(new Stack(data.items.circuit, 10)));
// console.log(p.all_items());

// let p = new ProcessChain(Object.values(data.processes));

console.log(p.to_graphviz());


// TITANIUM
// ALUMINIUM (bauxite)
// SILVER
// COBALT

// (URANIUM)
