import { data } from './factorio-ab-01/data.js'
import { ProcessChain, RateChain, Stack } from './structures.js';
const readline = import('readline');


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

    arr[data.items.nitinol_alloy.id] = data.processes.angels_plate_nitinol;
    arr[data.items.tin_plate.id] = data.processes.angels_roll_tin_converting;
    arr[data.items.angels_roll_tin.id] = data.processes.roll_tin_casting;

    // arr[data.items.fluorite_ore.id] = data.processes.greenyellow_waste_water_purification;
    // arr[solid_salt] = data.green_waste_water_purification;
    arr[data.items.solid_salt.id] = data.processes.salt;
    arr[data.items.liquid_concrete.id] = data.processes.concrete_mixture_2;
    arr[data.items.solid_cement.id] = data.processes.cement_mixture_1;

    // arr[data.items.copper_plate.id] = data.processes.angels_plate_copper;
    arr[data.items.copper_plate.id] = data.processes.angels_roll_copper_converting;
    arr[data.items.angels_roll_copper.id] = data.processes.roll_copper_casting_fast;
    arr[data.items.ingot_copper.id] = data.processes.anode_copper_smelting;

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


let p = new ProcessChain(Object.values(data.processes))
    .filter_for_output(
        new Stack(data.items.copper_plate, 1),
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
            data.items.ingot_nickel.id,
            data.items.ingot_titanium.id,
            data.items.steel_plate.id,
            data.items.quartz.id,
            data.items.solid_lime.id,
            data.items.water_thin_mud.id,
            data.items.copper_ore.id,
            data.items.liquid_coolant.id,
        ]
    )
    ;

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
    'induction_smelting': data.factories.induction_furnace_4,
    'induction_smelting_2': data.factories.induction_furnace_4,
    'induction_smelting_3': data.factories.induction_furnace_4,
    'induction_smelting_4': data.factories.induction_furnace_4,
    'casting': data.factories.casting_machine_4,
    'casting_2': data.factories.casting_machine_4,
    'casting_3': data.factories.casting_machine_4,
    'casting_4': data.factories.casting_machine_4,
    'strand_casting': data.factories.strand_casting_machine_4,
    'strand_casting_2': data.factories.strand_casting_machine_4,
    'strand_casting_3': data.factories.strand_casting_machine_4,
    'strand_casting_4': data.factories.strand_casting_machine_4,
    'advanced_crafting': data.factories.assembling_machine_6,
    'chemical_smelting': data.factories.angels_chemical_furnace_4,
    'chemical_smelting_2': data.factories.angels_chemical_furnace_4,
    'chemical_smelting_3': data.factories.angels_chemical_furnace_4,
    'chemical_smelting_4': data.factories.angels_chemical_furnace_4,
    'petrochem_electrolyser': data.factories.angels_electrolyser_4,
});

p.update(new Stack(data.items.copper_plate, 120),
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
        data.items.steel_plate.id,
        data.items.copper_ore.id,
        data.items.liquid_coolant.id,
    ],
    [// exported
        data.items.nickel_ore.id,
    ]
);


console.log(p.to_graphviz());
