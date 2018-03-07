class Application extends Component {

    __construct() {
        this.stateManager = new StateManager()
        this.stateManager.debug = this.debug

        this.stage.application = this

        super.__construct()
    }

    __init() {
        super.__init()
        this.__updateFocus()
    }

    __attach() {
        super.__attach()
    }

    __updateFocus(maxRecursion = 100) {
        const newFocusPath = this.__getFocusPath()
        const newFocusedComponent = newFocusPath[newFocusPath.length - 1]
        if (!this._focusPath) {
            // First focus.
            this._focusPath = newFocusPath

            // Focus events.
            for (let i = 0, n = this._focusPath.length; i < n; i++) {
                this._focusPath[i].__focus(newFocusedComponent, undefined)
            }
        } else {
            const focusedComponent = this._focusPath[this._focusPath.length - 1]

            let m = Math.min(this._focusPath.length, newFocusPath.length)
            let index
            for (index = 0; index < m; index++) {
                if (this._focusPath[index] !== newFocusPath[index]) {
                    break
                }
            }

            if (this._focusPath.length !== newFocusPath.length || index !== newFocusPath.length) {
                if (this._debug) {
                    console.log(this.stateManager._logPrefix + '* FOCUS ' + newFocusedComponent.getLocationString())
                }
                // Unfocus events.
                for (let i = this._focusPath.length - 1; i >= index; i--) {
                    this._focusPath[i].__unfocus(newFocusedComponent, focusedComponent)
                }

                this._focusPath = newFocusPath

                // Focus events.
                for (let i = index, n = this._focusPath.length; i < n; i++) {
                    this._focusPath[i].__focus(newFocusedComponent, focusedComponent)
                }

                // Focus changed events.
                for (let i = 0; i < index; i++) {
                    this._focusPath[i].__focusChange(newFocusedComponent, focusedComponent)
                }

                // Focus events could trigger focus changes.
                if (maxRecursion-- === 0) {
                    throw new Error("Max recursion count reached in focus update")
                }
                this.__updateFocus(maxRecursion)
            }

        }
    }

    __getFocusPath() {
        const path = [this]
        let current = this
        do {
            const nextFocus = current._getFocus()
            if (!nextFocus || (nextFocus === current)) {
                // Found!
                break
            }


            let ptr = nextFocus.cparent
            if (ptr === current) {
                path.push(nextFocus)
            } else {
                // Not an immediate child: include full path to descendant.
                const newParts = [nextFocus]
                do {
                    newParts.push(ptr)
                    ptr = ptr.cparent
                    if (!ptr) {
                        current._throwError("Return value for _getFocus must be an attached descendant component but its '" + nextFocus.getLocationString() + "'")
                    }
                } while (ptr !== current)

                // Add them reversed.
                for (let i = 0, n = newParts.length; i < n; i++) {
                    path.push(newParts[n - i - 1])
                }
            }

            current = nextFocus
        } while(true)

        return path
    }

    get focusPath() {
        return this._focusPath
    }

    receiveKeydown(e) {
        const path = this.focusPath
        const n = path.length
        for (let i = 0; i < n; i++) {
            if (path[i].__captureKey(e)) {
                return
            }

            path[i].__notifyKey(e)
        }
        for (let i = n - 1; i >= 0; i--) {
            if (path[i].__handleKey(e)) {
                return
            }
        }
    }

    get debug() {
        return this._debug
    }

    set debug(v) {
        this._debug = v
        if (this.stateManager) {
            this.stateManager.debug = true
        }
    }

}
