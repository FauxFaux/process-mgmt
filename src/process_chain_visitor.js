



class ProcessChainVisitor {

    check(chain) {}
    visit_item(item, chain) { }
    visit_process(process, chain) { }
    visit_item_process_edge(item, process, chain, index) { }
    visit_process_item_edge(process, item, chain, index) { }
    build() { return null; }


}


export { ProcessChainVisitor };
