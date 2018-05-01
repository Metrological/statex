class View extends EventEmitter {

    constructor(stage, type = 'div') {
        super()
        this.stage = stage
        this.__id = ++View.id

        if (type instanceof Element) {
            this.__e = type
        } else {
            this.__e = this.stage.document.createElement(type)
        }

        this.__e.__view = this
        this.__pivotX = 0.5
        this.__pivotY = 0.5
        this.__active = false
        this.__attached = false
        this.__parent = null
        this.__textMode = false
        this.__childList = undefined
        this.__transform = undefined
        this.__fireHtmlEvent = undefined
        this.__signalHtmlEvent = undefined
    }

    setAsRoot() {
        this.tagRoot = true
        this._updateAttached()
        this._updateActive()
    }

    _updateParent() {
        const newParent = this.__e.parentNode ? this.__e.parentNode.__view : null
        const oldTagRootId = this.__parent ? this.__parent.tagRootId : 0
        const newTagRootId = newParent ? newParent.tagRootId : 0

        this.__parent = newParent
        this._updateAttached()
        this._updateActive()

        if (oldTagRootId !== newTagRootId) {
            if (oldTagRootId) {
                this._clearTagRec('_R' + oldTagRootId)
            }
            if (newTagRootId) {
                this._setTagRec('_R' + newTagRootId)
            }
        }
    }

    _updateAttached() {
        const newAttached = this.isAttached()
        if (this.__attached !== newAttached) {
            this.__attached = newAttached

            if (this.__childList) {
                let children = this.__childList.get();
                if (children) {
                    let m = children.length;
                    if (m > 0) {
                        for (let i = 0; i < m; i++) {
                            children[i]._updateAttached();
                        }
                    }
                }
            }

            this.emit(newAttached ? 'attach' : 'detach')
        }
    }

    _updateActive() {
        const newActive = this.isActive()
        if (this.__active !== newActive) {
            this.emit(newActive ? 'active' : 'inactive')
            this.emit(newActive ? 'enable' : 'disable')
            this.__active = newActive
        }
    }

    // We don't have 'within bounds' support so we bundle active/enabled events.
    isAttached() {
        return (this.__parent ? this.__parent.__attached : (this.stage.root === this))
    }

    isActive() {
        return this.isVisible() && (this.__parent ? this.__parent.__active : (this.stage.root === this));
    }

    isVisible() {
        return (this.visible && this.alpha > 0)
    }

    set attribs(settings) {
        let names = Object.keys(settings)
        for (let i = 0, n = names.length; i < n; i++) {
            let name = names[i]

            if (settings[name] === undefined) {
                this.e.removeAttribute(name)
            } else {
                this.e.setAttribute(name, settings[name])
            }
        }
    }

    get style() {
        return this.$
    }

    set style(settings) {
        let names = Object.keys(settings)
        for (let i = 0, n = names.length; i < n; i++) {
            let name = names[i]
            this.$[name] = settings[name]
        }
    }

    get transform() {
        if (!this.__transform) {
            this.__transform = new ViewTransforms(this)
        }

        return this.__transform
    }

    set transform(settings) {
        this.transform.patch(settings)
    }

    _applyTransform(prio, name, value) {
        this.transform.item(prio, true)[name] = value
    }

    _getTransform(prio, def = 0) {
        const v = this.transform.item(prio, true).orig
        if (v === undefined) {
            return def
        }
        return v
    }

    set ref(v) {
        const charcode = v.charCodeAt(0)
        if (!Utils.isUcChar(charcode)) {
            this._throwError("Ref must start with an upper case character: " + v)
            return
        }

        // Set attribute for debug.
        this.s('data-ref', v)

        // Add tag.
        this.__e.classList.add(v)

        this._ref = v
    }

    get ref() {
        return this._ref
    }

    getByRef(ref) {
        return this.__childList ? this.__childList.getByRef(ref) : undefined
    }

    get parent() {
        return this.__e.parentNode ? this.__e.parentNode.__view : null
    }

    set text(t) {
        // This property is not allowed together with children.
        if (this.__childList) this.__childList.clear()
        if (this.e.firstChild) {
            this.e.removeChild(this.e.firstChild)
        }
        this.e.appendChild(document.createTextNode(t))
        this.__textMode = true
        this.__childList = undefined
    }

    get childList() {
        if (this.__textMode) {
            this.e.removeChild(this.e.firstChild)
            this.__textMode = false
        }

        if (!this.__childList) {
            this.__childList = new ViewChildList(this)
        }
        return this.__childList
    }

    get children() {
        return this.childList.get()
    }

    set children(children) {
        this.childList.patch(children)
    }

    add(o) {
        this.childList.a(o)
    }

    patch(settings, createMode = false) {
        let paths = Object.keys(settings)

        if (settings.hasOwnProperty("__create")) {
            createMode = settings["__create"]
        }

        for (let i = 0, n = paths.length; i < n; i++) {
            let path = paths[i]
            const v = settings[path]

            let pointIdx = path.indexOf(".")
            let arrowIdx = path.indexOf(">")
            if (arrowIdx === -1 && pointIdx === -1) {
                const firstCharCode = path.charCodeAt(0)
                if (Utils.isUcChar(firstCharCode)) {
                    // Ref.
                    const child = this.getByRef(path)
                    if (!child) {
                        if (v !== undefined) {
                            let subCreateMode = createMode
                            if (Utils.isObjectLiteral(v)) {
                                if (v.hasOwnProperty("__create")) {
                                    subCreateMode = v.__create
                                }
                            }

                            if (subCreateMode === null) {
                                // Ignore.
                            } else if (subCreateMode === true) {
                                // Add to list immediately.
                                let c
                                if (Utils.isObjectLiteral(v)) {
                                    // Catch this case to capture createMode flag.
                                    c = this.childList.createItem(v);
                                    c.patch(v, subCreateMode);
                                } else if (v instanceof Element) {
                                    c = this.childList.createItem(v);
                                } else if (Utils.isObject(v)) {
                                    c = v
                                }
                                if (c.isView) {
                                    c.ref = path
                                }

                                this.childList.a(c)
                            } else {
                                this._throwError("Can't find path: " + path)
                            }
                        }
                    } else {
                        if (v === undefined) {
                            if (child.parent) {
                                child.parent.childList.remove(child)
                            }
                        } else if (v instanceof Element) {
                            let c = this.childList.createItem(v);
                            c.ref = child.ref
                            const index = child.parent.childList.getIndex(child)
                            child.parent.childList.setAt(c, index)
                        } else if (Utils.isObjectLiteral(v)) {
                            child.patch(v, createMode)
                        } else if (v.isView) {
                        } else {
                            this._throwError("Unexpected value for path: " + path)
                        }
                    }
                } else {
                    // Property.
                    Base.patchObjectProperty(this, path, v)
                }
            } else {
                // Select path.
                const views = this.select(path)
                if (v === undefined) {
                    for (let i = 0, n = views.length; i < n; i++) {
                        if (views[i].parent) {
                            views[i].parent.childList.remove(views[i])
                        }
                    }
                } else if (Utils.isObjectLiteral(v)) {
                    // Recursive path.
                    for (let i = 0, n = views.length; i < n; i++) {
                        views[i].patch(v, createMode)
                    }
                } else {
                    this._throwError("Unexpected value for path: " + path)
                }
            }
        }
    }

    sel(path) {
        const results = this.select(path)
        if (results.length) {
            return results[0]
        } else {
            return undefined
        }
    }

    select(path) {
        if (path.indexOf(",") !== -1) {
            let selectors = path.split(',')
            let res = []
            for (let i = 0; i < selectors.length; i++) {
                res = res.concat(this._select(selectors[i]))
            }
            return res
        } else {
            return this._select(path)
        }
    }

    _select(path) {
        if (path === "") return [this]
        let pointIdx = path.indexOf(".")
        let arrowIdx = path.indexOf(">")
        if (pointIdx === -1 && arrowIdx === -1) {
            // Quick case.
            if (Utils.isUcChar(path.charCodeAt(0))) {
                const ref = this.getByRef(path)
                return ref ? [ref] : []
            } else {
                return this.mtag(path)
            }
        }

        // Detect by first char.
        let isChild
        if (arrowIdx === 0) {
            isChild = true
            path = path.substr(1)
        } else if (pointIdx === 0) {
            isChild = false
            path = path.substr(1)
        } else {
            const firstCharcode = path.charCodeAt(0)
            isChild = Utils.isUcChar(firstCharcode)
        }

        if (isChild) {
            // ">"
            return this._selectChilds(path)
        } else {
            // "."
            return this._selectDescs(path)
        }
    }

    _selectChilds(path) {
        const pointIdx = path.indexOf(".")
        const arrowIdx = path.indexOf(">")

        let isRef = Utils.isUcChar(path.charCodeAt(0))

        if (pointIdx === -1 && arrowIdx === -1) {
            if (isRef) {
                const ref = this.getByRef(path)
                return ref ? [ref] : []
            } else {
                return this.mtag(path)
            }
        }

        if ((arrowIdx === -1) || (pointIdx !== -1 && pointIdx < arrowIdx)) {
            let next
            const str = path.substr(0, pointIdx)
            if (isRef) {
                const ref = this.getByRef(str)
                next = ref ? [ref] : []
            } else {
                next = this.mtag(str)
            }
            let total = []
            const subPath = path.substr(pointIdx + 1)
            for (let i = 0, n = next.length; i < n; i++) {
                total = total.concat(next[i]._selectDescs(subPath))
            }
            return total
        } else {
            let next
            const str = path.substr(0, arrowIdx)
            if (isRef) {
                const ref = this.getByRef(str)
                next = ref ? [ref] : []
            } else {
                next = this.mtag(str)
            }
            let total = []
            const subPath = path.substr(arrowIdx + 1)
            for (let i = 0, n = next.length; i < n; i++) {
                total = total.concat(next[i]._selectChilds(subPath))
            }
            return total
        }
    }

    _selectDescs(path) {
        const arrowIdx = path.indexOf(">")
        if (arrowIdx === -1) {
            // Use multi-tag path directly.
            return this.mtag(path)
        } else {
            const str = path.substr(0, arrowIdx)
            let next = this.mtag(str)

            let total = []
            const subPath = path.substr(arrowIdx + 1)
            for (let i = 0, n = next.length; i < n; i++) {
                total = total.concat(next[i]._selectChilds(subPath))
            }
            return total
        }
    }

    _throwError(message) {
        throw new Error(this.constructor.name + " (" + this.getLocationString() + "): " + message)
    }

    getDepth() {
        let depth = 0;

        let p = this.__parent;
        while(p) {
            depth++;
            p = p.__parent;
        }

        return depth;
    };

    getAncestor(l) {
        let p = this;
        while (l > 0 && p.__parent) {
            p = p.__parent;
            l--;
        }
        return p;
    };

    getAncestorAtDepth(depth) {
        let levels = this.getDepth() - depth;
        if (levels < 0) {
            return null;
        }
        return this.getAncestor(levels);
    };

    isAncestorOf(c) {
        let p = c;
        while(p = p.parent) {
            if (this === p) {
                return true;
            }
        }
        return false;
    };

    getSharedAncestor(c) {
        let o1 = this;
        let o2 = c;
        let l1 = o1.getDepth();
        let l2 = o2.getDepth();
        if (l1 > l2) {
            o1 = o1.getAncestor(l1 - l2);
        } else if (l2 > l1) {
            o2 = o2.getAncestor(l2 - l1);
        }

        do {
            if (o1 === o2) {
                return o1;
            }

            o1 = o1.__parent;
            o2 = o2.__parent;
        } while (o1 && o2);

        return null;
    };

    getLocationString() {
        let i;
        i = this.parent ? this.parent.childList.getIndex(this) : "R";
        let localTags = this.getTags();
        let str = this.parent ? this.parent.getLocationString(): ""
        if (this.ref) {
            str += ":[" + i + "]" + this.ref
        } else if (localTags.length) {
            str += ":[" + i + "]" + localTags.join(",")
        } else {
            str += ":[" + i + "]#" + this.__id
        }
        return str
    }

    toString() {
        return this.e.innerHTML
    }

    get id() {
        return this.__e.id
    }

    set id(v) {
        this.__e.id = v
    }

    get e() {
        return this.__e
    }

    g(prop) {
        return this.__e.getAttribute(prop)
    }

    s(prop, value) {
        this.__e.setAttribute(prop, value)
    }

    get $() {
        return this.__e.style
    }

    get alpha() {
        return (this.$.opacity === '' ? 1 : this.$.opacity)
    }

    set alpha(v) {
        this.$.opacity = v
        this._updateActive()
    }

    get visible() {
        return (this.$.display !== 'none')
    }

    set visible(v) {
        this.$.display = v ? '' : 'none'
        this._updateActive()
    }
    
    get pivotX() {
        return this.__pivotX
    }

    get pivotY() {
        return this.__pivotY
    }

    set pivotX(v) {
        this.__pivotX = v
        this._updateTransformOrigin()
    }

    set pivotY(v) {
        this.__pivotY = v
        this._updateTransformOrigin()
    }

    get pivot() {
        return this.__pivotX
    }

    set pivot(v) {
        this.__pivotX = v
        this.__pivotY = v
        this._updateTransformOrigin()
    }

    get rotation() {
        return this._getTransform(102, 0)
    }

    set rotation(v) {
        this._applyTransform(102, 'rotate', v)
    }
    
    get scaleX() {
        return this._getTransform(100, 1)
    }
    
    set scaleX(v) {
        this._applyTransform(100, 'scaleX', v)
    }

    get scaleY() {
        return this._getTransform(101, 1)
    }

    set scaleY(v) {
        this._applyTransform(101, 'scaleY', v)
    }

    get scale() {
        return this._scaleX
    }

    set scale(v) {
        this._scaleX = v
        this._scaleY = v
    }

    get x() {
        return this._getTransform(98, 0)
    }

    set x(v) {
        this._applyTransform(98, 'translateX', v)
    }

    get y() {
        return this._getTransform(99, 0)
    }

    set y(v) {
        this._applyTransform(99, 'translateY', v)
    }

    get w() {
        return (this.$.width.endsWith("px") ? parseFloat(this.$.width.substr(0, -2)) : 0)
    }

    set w(v) {
        this.$.width = v + 'px'
    }

    get h() {
        return (this.$.height.endsWith("px") ? parseFloat(this.$.height.substr(0, -2)) : 0)
    }

    set h(v) {
        this.$.height = v + 'px'
    }

    get clipping() {
        return this.$.overflow === 'hidden'
    }

    set clipping(v) {
        this.$.overflow = v ? 'hidden' : 'visible'
    }

    set color(v) {
        this.$.background = View.getRgbaString(v)
    }

    get zIndex() {
        return this.$.zIndex
    }

    set zIndex(v) {
        this.$.zIndex = v
    }

    removeTag(v) {
        const acc = v.split(' ')
        this.__e.classList.remove(...acc)
    }

    addTag(v) {
        const charcode = v.charCodeAt(0)
        if (Utils.isUcChar(charcode)) {
            this._throwError("Tag may not start with an upper case character.")
            return
        }

        const acc = v.split(' ')
        this.__e.classList.add(...acc)
    }

    hasTag(v) {
        return this.__e.classList.contains(v)
    }

    _tag(tag) {
        const e = this.e.querySelector(`._R${this.tagRootId}.${tag}`)
        return e ? e.__view : undefined
    }

    t(tag) {
        this._tag(tag)
    }

    get tag() {
        return this._tag;
    }

    set tag(t) {
        this.tags = t;
    }

    getTags() {
        return this.__e.className.split(" ")
    }

    set tags(v) {
        if (!Array.isArray(v)) v = [v];
        this.setTags(v);
    }

    set tagRoot(v) {
        if (v !== !!this._tagRootId) {
            const trid = this.tagRootId
            if (trid) {
                this._clearTagRec('_R' + trid)
            }
            this._tagRootId = v ? this.__id : undefined

            if (this.tagRootId) {
                if (this.__childList) {
                    let children = this.__childList.get();
                    if (children) {
                        let m = children.length;
                        for (let i = 0; i < m; i++) {
                            this._setTagRec('_R' + this.tagRootId)
                        }
                    }
                }
            }
        }
    }

    get tagRoot() {
        return !!this._tagRootId
    }

    get tagRootId() {
        return this._tagRootId || (this.__parent ? this.__parent.tagRootId : 0)
    }

    _clearTagRec(tag) {
        if (this.hasTag(tag)) {
            this.removeTag(tag)
            if (this.__childList) {
                let children = this.__childList.get();
                if (children) {
                    let m = children.length;
                    for (let i = 0; i < m; i++) {
                        children[i]._clearTagRec(tag)
                    }
                }
            }
        }
    }

    _setTagRec(tag) {
        this.addTag(tag)
        if (!this.tagRoot) {
            if (this.__childList) {
                let children = this.__childList.get();
                if (children) {
                    let m = children.length;
                    for (let i = 0; i < m; i++) {
                        children[i]._setTagRec(tag)
                    }
                }
            }
        }
    }


    mtag(tag) {
        // Tag contexts.
        return [].slice.call(this.e.querySelectorAll(`._R${this.tagRootId}.${tag}`)).map((e) => e.__view)
    }

    find(selector) {
        // Tag contexts.
        return [].slice.call(this.e.querySelectorAll(selector)).map((e) => e.__view)
    }

    setTags(tags) {

        this.__e.className = ""

        const list = tags.reduce((acc, tag) => {
            return acc.concat(tag.split(' '))
        }, [])

        this.__e.classList.add(...list)
    }

    _updateTransformOrigin() {
        this.$.transformOrigin = (this.__pivotX * 100) + '% '  + (this.__pivotY * 100) + '%';
    }

    _updateTransform() {
        const parts = [];
        const ids = Object.keys(this.__transform).map(id => parseFloat(id)).sort()
        ids.forEach((id) => {
            const names = Object.keys(this.__transform[id])
            names.forEach(names, (name) => {
                parts.push(name + '(' + this.__transform[id][name] + ')')
            })
        })
        this.$.transform = parts.join(' ');
    }

    static getRgbaString(color) {
        let r = ((color / 65536) | 0) % 256;
        let g = ((color / 256) | 0) % 256;
        let b = color % 256;
        let a = ((color / 16777216) | 0) / 255;
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(4) + ')';
    }

    animation(settings) {
        return this.stage.animations.createAnimation(this, settings);
    }

    transition(property, settings) {
        if (settings === undefined) {
            return this._getTransition(property);
        } else {
            this._setTransition(property, settings);
            // We do not create/return the transition, because it would undo the 'lazy transition creation' optimization.
            return null;
        }
    }

    set transitions(object) {
        let keys = Object.keys(object);
        keys.forEach(property => {
            this.transition(property, object[property]);
        });
    }

    set smooth(object) {
        let keys = Object.keys(object);
        keys.forEach(property => {
            let value = object[property]
            if (Array.isArray(value)) {
                this.setSmooth(property, value[0], value[1])
            } else {
                this.setSmooth(property, value)
            }
        });
    }

    fastForward(property) {
        if (this._transitions) {
            let t = this._transitions[property];
            if (t && t.isTransition) {
                t.finish();
            }
        }
    }

    _getTransition(property) {
        if (!this._transitions) {
            this._transitions = {};
        }
        let t = this._transitions[property];
        if (!t) {
            // Create default transition.
            t = new Transition(this.stage.transitions, this.stage.transitions.defaultTransitionSettings, this, property);
        } else if (t.isTransitionSettings) {
            // Upgrade to 'real' transition.
            t = new Transition(
                this.stage.transitions,
                t,
                this,
                property
            );
        }
        this._transitions[property] = t;
        return t;
    }

    _setTransition(property, settings) {
        if (!settings) {
            this._removeTransition(property);
        } else {
            if (Utils.isObjectLiteral(settings)) {
                // Convert plain object to proper settings object.
                settings = this.stage.transitions.createSettings(settings);
            }

            if (!this._transitions) {
                this._transitions = {};
            }

            let current = this._transitions[property];
            if (current && current.isTransition) {
                // Runtime settings change.
                current.settings = settings;
                return current;
            } else {
                // Initially, only set the settings and upgrade to a 'real' transition when it is used.
                this._transitions[property] = settings;
            }
        }
    }

    _removeTransition(property) {
        if (this._transitions) {
            delete this._transitions[property];
        }
    }

    getSmooth(property, v) {
        let t = this._getTransition(property);
        if (t && t.isAttached()) {
            return t.targetValue;
        } else {
            return v;
        }
    }

    setSmooth(property, v, settings) {
        if (settings) {
            this._setTransition(property, settings);
        }
        let t = this._getTransition(property);
        t.start(v);
        return t
    }

    get fireHtmlEvent() {
        if (!this.__fireHtmlEvent) {
            this.__fireHtmlEvent = {}
        }
        return this.__fireHtmlEvent
    }

    set fireHtmlEvent(obj) {
        let isArray = Array.isArray(obj)
        let events
        if (isArray) {
            events = obj
        } else {
            events = Object.keys(obj)
        }

        events.forEach(name => {
            const target = isArray ? name : obj[name]
            if (this.fireHtmlEvent[name] && this.fireHtmlEvent[name].target === name) {
                // Skip.
                return
            }

            if (this.fireHtmlEvent[name]) {
                this.e.removeEventListener(this.fireHtmlEvent[name])
            }

            if (!target) {
                delete this.fireHtmlEvent[name]
            } else {
                const listener = (e) => {
                    Component.getComponent(this).fire(target, {event: e, view: this})
                }
                listener.target = target
                this.e.addEventListener(name, listener)
                this.fireHtmlEvent[name] = listener
            }
        })
    }

    get signalHtmlEvent() {
        if (!this.__signalHtmlEvent) {
            this.__signalHtmlEvent = {}
        }
        return this.__signalHtmlEvent
    }

    set signalHtmlEvent(obj) {
        let isArray = Array.isArray(obj)
        let events
        if (isArray) {
            events = obj
        } else {
            events = Object.keys(obj)
        }

        events.forEach(name => {
            const target = isArray ? name : obj[name]
            if (this.signalHtmlEvent[name] && this.signalHtmlEvent[name].target === name) {
                // Skip.
                return
            }

            if (this.signalHtmlEvent[name]) {
                this.e.removeEventListener(this.signalHtmlEvent[name])
            }

            if (!target) {
                delete this.signalHtmlEvent[name]
            } else {
                const listener = (e) => {
                    Component.getComponent(this).signal(target, {event: e, view: this})
                }
                listener.target = target
                this.e.addEventListener(name, listener)
                this.signalHtmlEvent[name] = listener
            }
        })
    }

    static getGetter(propertyPath) {
        let getter = View.PROP_GETTERS.get(propertyPath);
        if (!getter) {
            getter = new Function('obj', 'return obj.' + propertyPath);
            View.PROP_GETTERS.set(propertyPath, getter);
        }
        return getter;
    }

    static getSetter(propertyPath) {
        let setter = View.PROP_SETTERS.get(propertyPath);
        if (!setter) {
            setter = new Function('obj', 'v', 'obj.' + propertyPath + ' = v');
            View.PROP_SETTERS.set(propertyPath, setter);
        }
        return setter;
    }

    static isColorProperty(property) {
        return property.startsWith("color")
    }

    static getMerger(property) {
        if (View.isColorProperty(property)) {
            return StageUtils.mergeColors
        } else {
            return StageUtils.mergeNumbers
        }
    }

}

View.id = 0
View.PROP_GETTERS = new Map();
View.PROP_SETTERS = new Map();

View.prototype.isView = true