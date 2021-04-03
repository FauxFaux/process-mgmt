import { check } from './structures_base.js';


class FactoryGroup {
    constructor(name) {
        check("name", name);
        this.id = name;
        this.name = name;
    }

    toString() {
        return "FactoryGroup: [name: " + this.name + "]";
    }
}

class Factory {
    constructor(name, group, duration_modifier = 1) {
        check("name", name, "group", group, "duration_modifier", duration_modifier);
        this.name = name;
        this.group = group;
        this.duration_modifier = duration_modifier;
    }

    toString() {
        return "Factory: [name: " + this.name + ", group: " + this.group + "]";
    }
}

export {FactoryGroup, Factory}
