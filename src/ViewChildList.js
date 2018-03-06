/**
 * Manages the list of children for a view.
 */
class ViewChildList extends ObjectList {

    constructor(view) {
        super()
        this._view = view
    }

    get e() {
        return this._view.e
    }

    onAdd(item, index) {
        this.e.insertBefore(item.e, this.e.children[index])
        item._updateParent()
    }

    onRemove(item, index) {
        this.e.removeChild(item.e)
        item._updateParent()
    }

    onSync(removed, added, order) {
        const e = this._view._e
        if (order.length) {
            for (let i = 0, n = order.length; i < n; i++) {
                this.e.appendChild(order[i].e)
            }

            while(e.firstChild !== order[0].e) {
                e.removeChild(e.firstChild)
            }
        } else {
            while(e.firstChild) {
                e.removeChild(e.firstChild)
            }
        }

        removed.forEach((view) => {
            view._updateParent()
        })

        added.forEach((view) => {
            view._updateParent()
        })
    }

    onSet(item, index, prevItem) {
        this.e.replaceChild(item.e, prevItem)
        this.e.children[index].__view._updateParent()
        item._updateParent()
    }

    onMove(item, fromIndex, toIndex) {
        this.e.insertBefore(item.e, this.e.children[toIndex])
        item._updateParent()
    }

    createItem(object) {
        if (Utils.isString(object)) {
            const view = new View(this._view.stage, 'span')
            view.text = object
            return view
        } else if (object.type || object.t) {
            const type = object.type || object.t
            if (typeof type === "string") {
                return new View(this._view.stage, type)
            } else {
                return new type(this._view.stage)
            }
        } else {
            return new View(this._view.stage)
        }
    }

    isItem(object) {
        return object.isView
    }

}
