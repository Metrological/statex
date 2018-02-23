class ViewTransforms {

    constructor(view) {
        this._view = view
        this._items = []
        this._itemKeys = undefined
    }

    has(prio) {
        return !!this._items[prio]
    }

    item(prio, force = false) {
        if (!force && prio > 100 && prio < 110) {
            this._view._throwError("Transform items 100-110 are reserved")
        }

        if (!this._items[prio]) {
            this._items[prio] = new ViewTransformsItem(this, prio)
            this._itemKeys = undefined
        }

        return this._items[prio]
    }

    patch(settings) {
        this._blocked = true
        const items = Object.keys(settings)
        items.forEach(item => {
            if (settings[item] === undefined) {
                delete this._items[item]
            } else {
                this.item(item).patch(settings[item])
            }
        })

        this._blocked = false
        this.update()
    }

    update() {
        if (!this._blocked) {
            const parts = [];
            
            if (!this._itemKeys) {
                this._itemKeys = Object.keys(this._items).map(items => parseFloat(items))
                this._itemKeys.sort((a, b) => a - b)
            }
            this._itemKeys.forEach((key) => {
                const item = this._items[key]
                const name = item._name
                if (name) {
                    parts.push(name + '(' + item.value + ')')
                }
            })
            this._view.$.transform = parts.join(' ');
        }
    }
}

class ViewTransformsItem {

    constructor(transforms, prio) {
        this._transforms = transforms
        this._prio = prio
        this._name = ""
        this._value = undefined
        this._orig = undefined
    }

    _getValue(def) {
        if (this._orig === undefined) {
            return def
        }
        return this._orig
    }
    
    get name() {
        return this._name
    }
    
    get value() {
        return this._value
    }

    get orig() {
        return this._orig
    }

    get matrix() {
        return this._getValue()
    }

    set matrix(v) {
        this._name = 'matrix'
        this._value = v
        this._transforms.update()
    }

    get translate() {
        return this._getValue(0)
    }

    set translate(v) {
        this._name = 'translate'
        this._orig = v
        this._value = Utils.isNumber(s) ? s + 'rad' : s
        this._transforms.update()
    }

    get translateX() {
        return this._getValue(0)
    }

    set translateX(v) {
        this._name = 'translateX'
        this._orig = v
        this._value = Utils.isNumber(v) ? v + 'px' : v
        this._transforms.update()
    }

    get translateY() {
        return this._getValue(0)
    }

    set translateY(v) {
        this._name = 'translateY'
        this._orig = v
        this._value = Utils.isNumber(v) ? v + 'px' : v
        this._transforms.update()
    }

    get scale() {
        return this._getValue(1)
    }

    set scale(v) {
        this._name = 'scale'
        this._orig = v
        this._value = v
        this._transforms.update()
    }

    get scaleX() {
        return this._getValue(1)
    }

    set scaleX(v) {
        this._name = 'scaleX'
        this._orig = v
        this._value = v
        this._transforms.update()
    }

    get scaleY() {
        return this._getValue(1)
    }

    set scaleY(v) {
        this._name = 'scaleY'
        this._orig = v
        this._value = v
        this._transforms.update()
    }

    get rotate() {
        return this._getValue(0)
    }

    set rotate(v) {
        this._name = 'rotate'
        this._orig = v
        this._value = Utils.isNumber(v) ? v + 'rad' : v
        this._transforms.update()
    }

    get skew() {
        return this._getValue(0)
    }

    set skew(v) {
        this._name = 'skew'
        this._orig = v
        this._value = Utils.isNumber(v) ? v + 'rad' : v
        this._transforms.update()
    }

    get skewX() {
        return this._getValue(0)
    }

    set skewX(v) {
        this._name = 'skewX'
        this._orig = v
        this._value = Utils.isNumber(v) ? v + 'rad' : v
        this._transforms.update()
    }

    get skewY() {
        return this._getValue(0)
    }

    set skewY(v) {
        this._name = 'skewY'
        this._orig = v
        this._value = Utils.isNumber(v) ? v + 'rad' : v
        this._transforms.update()
    }

    get matrix3d() {
        return this._getValue()
    }

    set matrix3d(v) {
        this._name = 'matrix3d'
        this._orig = v
        this._value = v
        this._transforms.update()
    }

    get translate3d() {
        return this._getValue()
    }

    set translate3d(v) {
        this._name = 'translate3d'
        this._orig = v
        this._value = v
        this._transforms.update()
    }

    get translateZ() {
        return this._getValue(0)
    }

    set translateZ(v) {
        this._name = 'translateZ'
        this._orig = v
        this._value = Utils.isNumber(v) ? v + 'px' : v
        this._transforms.update()
    }

    get scale3d() {
        return this._getValue()
    }

    set scale3d(v) {
        this._name = 'scale3d'
        this._orig = v
        this._value = v
        this._transforms.update()
    }

    get scaleZ() {
        return this._getValue(0)
    }

    set scaleZ(v) {
        this._name = 'scaleZ'
        this._orig = v
        this._value = v
        this._transforms.update()
    }

    get rotate3d() {
        return this._getValue()
    }

    set rotate3d(v) {
        this._name = 'rotate3d'
        this._orig = v
        this._value = v
        this._transforms.update()
    }

    get rotateX() {
        return this._getValue(0)
    }

    set rotateX(v) {
        this._name = 'rotateX'
        this._orig = v
        this._value = Utils.isNumber(v) ? v + 'rad' : v
        this._transforms.update()
    }

    get rotateY() {
        return this._getValue(0)
    }

    set rotateY(v) {
        this._name = 'rotateY'
        this._orig = v
        this._value = Utils.isNumber(v) ? v + 'rad' : v
        this._transforms.update()
    }

    get rotateZ() {
        return this._getValue(0)
    }

    set rotateZ(v) {
        this._name = 'rotateZ'
        this._orig = v
        this._value = Utils.isNumber(v) ? v + 'rad' : v
        this._transforms.update()
    }

    get perspective() {
        return this._getValue()
    }

    set perspective(v) {
        this._name = 'perspective'
        this._orig = v
        this._value = Utils.isNumber(v) ? v + 'px' : v
        this._transforms.update()
    }

    patch(settings) {
        Base.patchObject(this, settings)
    }

}