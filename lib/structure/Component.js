class Component extends View {

    constructor(stage, properties) {
        super(stage)

        // Encapsulate tags to prevent leaking.
        this.tagRoot = true;

        if (Utils.isObjectLiteral(properties)) {
            Object.assign(this, properties)
        }

        // Start with root state
        this.__state = ""

        this.__initialized = false
        this.__firstActive = false
        this.__firstEnable = false

        this.__construct()

        this.patch(this.constructor._getTemplate(), true)

        this._registerLifecycleListeners()

        this.__signals = undefined
    }

    static getHtmlType() {
        // Allow user to specify root type in component template.
        return this._getTemplate().type || super.getHtmlType()
    }

    _registerLifecycleListeners() {
        this.on('attach', () => {
            if (!this.__initialized) {
                this.__init()
                this.__initialized = true
            }

            this.fire('_attach')
        })

        this.on('detach', () => {
            this.fire('_detach')
        })

        this.on('active', () => {
            if (!this.__firstActive) {
                this.fire('_firstActive')
                this.__firstActive = true
            }

            this.fire('_active')
        })

        this.on('inactive', () => {
            this.fire('_inactive')
        })

        this.on('enabled', () => {
            if (!this.__firstEnable) {
                this.fire('_firstEnable')
                this.__firstEnable = true
            }

            this.fire('_enable')
        })

        this.on('disabled', () => {
            this.fire('_disable')
        })
    }

    get application() {
        return this.stage.application
    }

    get state() {
        return this.__state
    }

    __construct() {
        this.fire('_construct')
    }

    __init() {
        this.fire('_init')
    }

    __focus(newTarget, prevTarget) {
        this.fire('_focus', {newTarget: newTarget, prevTarget: prevTarget})
    }

    __unfocus(newTarget) {
        this.fire('_unfocus', {newTarget: newTarget})
    }

    __focusBranch(target) {
        this.fire('_focusBranch', {target: target})
    }

    __unfocusBranch(target, newTarget) {
        this.fire('_unfocusBranch', {target:target, newTarget:newTarget})
    }

    __focusChange(target, newTarget) {
        this.fire('_focusChange', {target:target, newTarget:newTarget})
    }

    _getFocused() {
        // Override to delegate focus to child components.
        return this
    }

    _setFocusSettings(settings) {
        // Override to add custom settings. See Application._handleFocusSettings().
    }

    _getStates() {
        if (!this.constructor.__states) {
            this.constructor.__states = this.constructor._states()
            if (!Utils.isObjectLiteral(this.constructor.__states)) {
                this._throwError("States object empty")
            }
        }
        return this.constructor.__states
    }

    static _states() {
        return {}
    }

    static _getTemplate() {
        if (!this.__template) {
            this.__template = this._template()
            if (!Utils.isObjectLiteral(this.__template)) {
                this._throwError("Template object empty")
            }
        }
        return this.__template
    }

    static _template() {
        return {}
    }

    hasFinalFocus() {
        let path = this.application._focusPath
        return path && path.length && path[path.length - 1] === this
    }

    hasFocus() {
        let path = this.application._focusPath
        return path && (path.indexOf(this) >= 0)
    }

    get cparent() {
        return Component.getParent(this)
    }

    seekAncestorByType(type) {
        let c = this.cparent
        while(c) {
            if (c.constructor === type) {
                return c
            }
            c = c.cparent
        }
    }

    getSharedAncestorComponent(view) {
        let ancestor = this.getSharedAncestor(view)
        while(ancestor && !ancestor.isComponent) {
            ancestor = ancestor.parent
        }
        return ancestor
    }

    /**
     * Fires the specified event on the state machine.
     * @param event
     * @param {object} args
     * @return {boolean}
     *   True iff the state machine could find and execute a handler for the event (event and condition matched).
     */
    fire(event, args = {}) {
        if (!Utils.isObjectLiteral(args)) {
            this._throwError("Fire: args must be object")
        }
        return this.application.stateManager.fire(this, event, args)
    }

    /**
     * Signals the parent of the specified event.
     * A parent/ancestor that wishes to handle the signal should set the 'signals' property on this component.
     * @param {string} event
     * @param {object} args
     * @param {boolean} bubble
     */
    signal(event, args = {}, bubble = false) {
        if (!Utils.isObjectLiteral(args)) {
            this._throwError("Signal: args must be object")
        }

        if (!args._source) {
            args = Object.assign({_source: this}, args)
        }

        if (this.__signals && this.cparent) {
            let fireEvent = this.__signals[event]
            if (fireEvent === false) {
                // Ignore event, even when bubbling.
                return
            }
            if (fireEvent) {
                if (fireEvent === true) {
                    fireEvent = event
                }

                const handled = this.cparent.fire(fireEvent, args)
                if (handled) return
            }
        }
        if (bubble && this.cparent) {
            // Bubble up.
            this.cparent.signal(event, args, bubble)
        }
    }

    get signals() {
        return this.__signals
    }

    set signals(v) {
        if (!Utils.isObjectLiteral(v)) {
            this._throwError("Signals: specify an object with signal-to-fire mappings")
        }
        this.__signals = Object.assign(this.__signals || {}, v)
    }

    /**
     * Fires the specified event downwards.
     * A descendant that wishes to handle the signal should set the '_broadcasts' property on this component.
     * @warn handling a broadcast will stop it from propagating; to continue propagation return false from the state
     * event handler.
     */
    broadcast(event, args = {}) {
        if (!Utils.isObjectLiteral(args)) {
            this._throwError("Broadcast: args must be object")
        }

        if (!args._source) {
            args = Object.assign({_source: this}, args)
        }

        if (this.__broadcasts) {
            let fireEvent = this.__broadcasts[event]
            if (fireEvent === false) {
                return
            }
            if (fireEvent) {
                if (fireEvent === true) {
                    fireEvent = event
                }

                const handled = this.fire(fireEvent, args)
                if (handled) {
                    // Skip propagation
                    return
                }
            }
        }

        // Propagate down.
        const subs = []
        Component.collectSubComponents(subs, this)
        for (let i = 0, n = subs.length; i < n; i++) {
            subs[i].broadcast(event, args)
        }
    }

    static collectSubComponents(subs, view) {
        if (view.hasChildren()) {
            // We must use the private property because direct children access may be disallowed.
            const childList = view.__childList
            for (let i = 0, n = childList.length; i < n; i++) {
                const child = childList.getAt(i)
                if (child.isComponent) {
                    subs.push(child)
                } else {
                    Component.collectSubComponents(subs, child)
                }
            }
        }
    }

    get broadcasts() {
        return this.__broadcasts
    }

    set broadcasts(v) {
        if (!Utils.isObjectLiteral(v)) {
            this._throwError("Broadcasts: specify an object with broadcast-to-fire mappings")
        }
        this.__broadcasts = Object.assign(this.__broadcasts || {}, v)
    }

    static getComponent(view) {
        let parent = view
        while (parent && !parent.isComponent) {
            parent = parent.parent
        }
        return parent
    }

    static getParent(view) {
        return Component.getComponent(view.parent)
    }

}

Component.prototype.isComponent = true
