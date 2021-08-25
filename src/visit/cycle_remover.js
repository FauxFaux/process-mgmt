



class CycleRemover {

    check(chain) {
        return {
            init: true,
            visit_item: true,
            visit_process: true,
            visit_item_process_edge: true,
            visit_process_item_edge: true,
        }
    }
    init(chain) { }
    visit_item(item, chain) { }
    visit_process(process, chain) { }
    visit_item_process_edge(item, process, chain, index) { }
    visit_process_item_edge(process, item, chain, index) { }
    build() { return null; }
}


export { CycleRemover };
