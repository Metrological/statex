class Base {

    static defaultSetter(obj, name, value) {
        obj[name] = value
    }

    static patchObject(obj, settings) {
        let names = Object.keys(settings)
        for (let i = 0, n = names.length; i < n; i++) {
            let name = names[i]

            this.patchObjectProperty(obj, name, settings[name])
        }
    }

    static patchObjectProperty(obj, name, value) {
        let setter = obj.setSetting || Base.defaultSetter;

        // Type is a reserved keyword to specify the class type on creation.
        if (name.substr(0, 2) !== "__" && name !== "type") {
            if (Utils.isFunction(value) && value.__local) {
                // Local function (Base.local(s => s.something))
                value = value.__local(obj)
            }

            setter(obj, name, value)
        }
    }

    static local(func) {
        // This function can be used as an object setting, which is called with the target object.
        func.__local = true
    }

}
