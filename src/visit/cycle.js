

class Cycle {
    /**
     *
     * @param {*} loop_items Array of Item objects, listing an item type that forms part of the loop.
     * @param {*} processes Array of processes that is the loop.
     */
    constructor(loop_items, processes) {
        this.loop_items = loop_items;
        this.processes = processes;
        this.process_counts = {};
    }

    /**
     * Does not normalise cycles before comparison. If that is required, consider using:
     * cycle.normalise_cycle().equals(other.normalise_cycle());
     * Does not include loop items in the comparison.
     * @param {*} other another cycle.
     * @returns boolean if this equals other.
     */
    equals(other) {
        if ((typeof other) === "undefined") return false;
        if (this.processes.length != other.processes.length) return false;
        return this.processes.every((elem, idx) => elem == other.processes[idx]);
    }

    normalise_cycle() {
        let smallest_idx = this.processes.reduce((prev, _cur, idx, arr) => {
            if (prev == -1) {
                return idx;
            } else {
                if (arr[prev] < arr[idx]) {
                    return prev;
                } else {
                    return idx;
                }
            }
        }, -1);

        let a = this.processes.slice(0, smallest_idx);
        let b = this.processes.slice(smallest_idx);
        return new Cycle(this.loop_items, b.concat(a));
    }
}

export { Cycle };
