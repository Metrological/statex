class Stage extends EventEmitter {

    constructor(document, options = {}) {
        super()
        this._setOptions(options);

        this.document = document

        this.transitions = new TransitionManager(this);
        this.animations = new AnimationManager(this);

        this.__looping = false
    }

    destroy() {
        if (!this._destroyed) {
            this.application.destroy()
            this._stopLoop()
            this._destroyed = true;
        }
    }

    getOption(name) {
        return this._options[name]
    }

    _setOptions(o) {
        this._options = {};

        let opt = (name, def) => {
            let value = o[name];

            if (value === undefined) {
                this._options[name] = def;
            } else {
                this._options[name] = value;
            }
        }

        opt('fixedDt', undefined);
    }

    setApplication(app) {
        this.application = app
    }

    init() {
        this.application.setAsRoot();
        this._startLoop()
    }

    get root() {
        return this.application
    }

    drawFrame() {
        if (this.getOption('fixedDt')) {
            this.dt = this.getOption('fixedDt');
        } else {
            this.dt = (!this.startTime) ? .02 : .001 * (this.currentTime - this.startTime);
        }
        this.startTime = this.currentTime;
        this.currentTime = (new Date()).getTime();

        this.emit('frameStart')
    }

    _startLoop() {
        this.__looping = true;
        if (!this._awaitingLoop) {
            this._loop();
        }
    }

    _stopLoop() {
        this.__looping = false;
    }

    _loop() {
        let lp = () => {
            this._awaitingLoop = false;
            if (this.__looping) {
                this.drawFrame();

                if (this.transitions.active.size || this.animations.active.size) {
                    requestAnimationFrame(lp);
                    this._awaitingLoop = true;
                } else {
                    // Stop looping until animations are added.
                    this.__looping = false
                }
            }
        }
        requestAnimationFrame(lp);
    }

    stop() {
        this._stopLoop();
    }

    resume() {
        this._startLoop();
    }

    create(object, createMode = false) {
        if (Utils.isString(object)) {
            const view = new View(this, 'span')
            view.text = object
            return view
        } else if (object.type || object.t) {
            const type = object.type || object.t
            let view
            if (typeof type === "string") {
                view = new View(this, type)
            } else {
                view = new type(this)
            }
            view.patch(object, createMode)
            return view
        } else if (object instanceof Element) {
            if (object.__view) {
                // Element already wrapped: reuse wrapper.
                return object.__view
            }
            return new View(this, object)
        } else {
            const view = new View(this)
            view.patch(object, createMode)
            return view
        }
    }

}