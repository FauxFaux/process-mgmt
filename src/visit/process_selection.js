const select_process = function (chain, item_id, callback) {
    const processes_for_current = chain.processes_by_output[item_id];
    if (processes_for_current && processes_for_current.length > 1) {
        if (!callback) {
            throw new Error('No priority selector enabled');
        }
        return callback(item_id, processes_for_current);
    }
    if (processes_for_current && processes_for_current.length == 1) {
        return processes_for_current[0];
    }
};

export { select_process };
