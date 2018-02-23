class Stage extends EventEmitter {

    constructor(document, options = {}) {
        super()
        this.document = document
        this.options = options

        this.transitions = new TransitionManager(this);
        this.animations = new AnimationManager(this);

        this._root = new View(this)
        this._root.setAsRoot()

        this._looping = false
    }

    get root() {
        return this._root
    }

    drawFrame() {
        if (this.options.fixedDt) {
            this.dt = this.options.fixedDt;
        } else {
            this.dt = (!this.startTime) ? .02 : .001 * (this.currentTime - this.startTime);
        }
        this.startTime = this.currentTime;
        this.currentTime = (new Date()).getTime();

        this.emit('frameStart')
    }

    _startLoop() {
        this._looping = true;
        if (!this._awaitingLoop) {
            this._loop();
        }
    }

    _stopLoop() {
        this._looping = false;
    }

    _loop() {
        let lp = () => {
            this._awaitingLoop = false;
            if (this._looping) {
                this.drawFrame();

                if (this.transitions.active.size || this.animations.active.size) {
                    requestAnimationFrame(lp);
                    this._awaitingLoop = true;
                } else {
                    // Stop looping until animations are added.
                    this._looping = false
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

}