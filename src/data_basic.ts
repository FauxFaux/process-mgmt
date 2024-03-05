import {
    Data,
    Item,
    Stack,
    FactoryGroup,
    Factory,
    Process,
} from './structures.js';

const check_add = function (item, fn) {
    try {
        return fn();
    } catch (error) {
        console.log('error processing item:', item);
        throw error;
    }
};

function data_from_standard_json(name, version, json_import_p) {
    return json_import_p
        .then((module) => module.default)
        .then((raw) => {
            const data = new Data(name, version);

            for (const i of raw.items)
                check_add(i, () => {
                    if (!i.id) return;
                    data.add_item(new Item(i.id, i.i18n.en, i.group));
                });

            for (const p of raw.processes) {
                if (!p.name) continue;
                if (!data.factory_groups['' + p.factory_group]) {
                    check_add(p, () =>
                        data.add_factory_group(
                            new FactoryGroup('' + p.factory_group),
                        ),
                    );
                }
                const inputs = Object.entries(p.inputs).map((e: [any, any]) => {
                    return check_add(
                        p,
                        () => new Stack(data.items[e[0]], e[1]),
                    );
                });
                const outputs = Object.entries(p.outputs).map(
                    (e: [any, any]) => {
                        return check_add(
                            p,
                            () => new Stack(data.items[e[0]], e[1]),
                        );
                    },
                );
                check_add(p, () => {
                    data.add_process(
                        new Process(
                            p.name,
                            inputs,
                            outputs,
                            p.duration,
                            check_add(
                                p,
                                () => data.factory_groups['' + p.factory_group],
                            ),
                        ),
                    );
                });
            }

            for (const ff of raw.factory_types.map((f) => [
                f,
                new Factory(
                    '' + f.id,
                    '' + f.name,
                    f.factory_groups.map((id) => data.factory_groups[id]),
                    f.duration_modifier,
                    f.output_modifier,
                ),
            ]))
                check_add(ff[0], () => data.add_factory(ff[1]));

            return data;
        });
}

export { data_from_standard_json };
