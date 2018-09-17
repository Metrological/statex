/**
 * Copyright Metrological, 2017
 */

class Transition extends EventEmitter {

    constructor(manager, settings, view, property) {
        super()

        this.manager = manager;

        this._settings = settings;

        this._view = view
        this._getter = View.getGetter(property)
        this._setter = View.getSetter(property)

        this._merger = settings.merger

        if (!this._merger) {
            this._merger = View.getMerger(property)
        }

        this._startValue = this._getter(this._view)
        this._targetValue = this._startValue

        this._p = 1
        this._delayLeft = 0
    }

    start(targetValue) {
        this._startValue = this._getter(this._view)

        if (!this.isAttached()) {
            // We don't support transitions on non-attached views. Just set value without invoking listeners.
            this._targetValue = targetValue
            this._p = 1;
            this._updateDrawValue()
        } else {
            if (targetValue === this._startValue) {
                this.reset(targetValue, 1)
            } else {
                this._targetValue = targetValue
                this._p = 0
                this._delayLeft = this._settings.delay
                this.emit('start')
                this.add()
            }
        }
    }

    finish() {
        if (this._p < 1) {
            // Value setting and will must be invoked (async) upon next transition cycle.
            this._p = 1
        }
    }

    stop() {
        // Just stop where the transition is at.
        this.manager.removeActive(this)
    }

    reset(targetValue, p) {
        if (!this.isAttached()) {
            // We don't support transitions on non-attached views. Just set value without invoking listeners.
            this._startValue = this._getter(this._view)
            this._targetValue = targetValue
            this._p = 1
            this._updateDrawValue()
        } else {
            this._startValue = this._getter(this._view)
            this._targetValue = targetValue
            this._p = p
            this.add()
        }
    }

    _updateDrawValue() {
        this._setter(this._view, this.getDrawValue())
    }

    add() {
        this.manager.addActive(this)
    }

    isAttached() {
        return this._view.attached
    }

    isRunning() {
        return (this._p < 1.0)
    }

    progress(dt) {
        if (!this.isAttached()) {
            // Skip to end of transition so that it is removed.
            this._p = 1
        }

        if (this.p < 1) {
            if (this.delayLeft > 0) {
                this._delayLeft -= dt

                if (this.delayLeft < 0) {
                    dt = -this.delayLeft
                    this._delayLeft = 0

                    this.emit('delayEnd')
                } else {
                    return
                }
            }

            if (this._settings.duration == 0) {
                this._p = 1
            } else {
                this._p += dt / this._settings.duration
            }
            if (this._p >= 1) {
                // Finished!
                this._p = 1
            }
        }

        this._updateDrawValue()

        this.invokeListeners()
    }

    invokeListeners() {
        this.emit('progress', this.p)
        if (this.p === 1) {
            this.emit('finish')
        }
    }

    updateTargetValue(targetValue) {
        let t = this._settings.timingFunctionImpl(this.p)
        if (t === 1) {
            this._targetValue = targetValue
        } else if (t === 0) {
            this._startValue = this._targetValue
            this._targetValue = targetValue
        } else {
            this._startValue = targetValue - ((targetValue - this._targetValue) / (1 - t))
            this._targetValue = targetValue
        }
    }

    getDrawValue() {
        if (this.p >= 1) {
            return this.targetValue
        } else {
            let v = this._settings._timingFunctionImpl(this.p)
            return this._merger(this.targetValue, this.startValue, v)
        }
    }

    skipDelay() {
        this._delayLeft = 0
    }

    get startValue() {
        return this._startValue
    }

    get targetValue() {
        return this._targetValue
    }

    get p() {
        return this._p
    }

    get delayLeft() {
        return this._delayLeft
    }

    get view() {
        return this._view
    }

    get settings() {
        return this._settings
    }

    set settings(v) {
        this._settings = v;
    }

}

Transition.prototype.isTransition = true
