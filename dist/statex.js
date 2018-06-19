window.statex = (function() {
/**
 * This is a partial (and more efficient) implementation of the event emitter.
 * It attempts to maintain a one-to-one mapping between events and listeners, skipping an array lookup.
 * Only if there are multiple listeners, they are combined in an array.
 *
 * Copyright Metrological, 2017
 */
class EventEmitter {

    constructor() {
        // This is set (and kept) to true when events are used at all.
        this._hasEventListeners = false
    }

    on(name, listener) {
        if (!this._hasEventListeners) {
            this._eventFunction = {}
            this._eventListeners = {}
            this._hasEventListeners = true
        }

        const current = this._eventFunction[name]
        if (!current) {
            this._eventFunction[name] = listener
        } else {
            if (this._eventFunction[name] !== EventEmitter.combiner) {
                this._eventListeners[name] = [this._eventFunction[name], listener]
                this._eventFunction[name] = EventEmitter.combiner
            } else {
                this._eventListeners[name].push(listener)
            }
        }
    }

    has(name, listener) {
        if (this._hasEventListeners) {
            const current = this._eventFunction[name]
            if (current) {
                if (current === EventEmitter.combiner) {
                    const listeners = this._eventListeners[name]
                    let index = listeners.indexOf(listener)
                    return (index >= 0)
                } else if (this._eventFunction[name] === listener) {
                    return true
                }
            }
        }
        return false;
    }

    off(name, listener) {
        if (this._hasEventListeners) {
            const current = this._eventFunction[name]
            if (current) {
                if (current === EventEmitter.combiner) {
                    const listeners = this._eventListeners[name]
                    let index = listeners.indexOf(listener)
                    if (index >= 0) {
                        listeners.splice(index, 1)
                    }
                    if (listeners.length === 1) {
                        this._eventFunction[name] = listeners[0]
                        this._eventListeners[name] = undefined
                    }
                } else if (this._eventFunction[name] === listener) {
                    this._eventFunction[name] = undefined
                }
            }
        }
    }

    removeListener(name, listener) {
        this.off(name, listener)
    }

    emit(name, arg1, arg2, arg3) {
        if (this._hasEventListeners) {
            const func = this._eventFunction[name]
            if (func) {
                if (func === EventEmitter.combiner) {
                    func(this, name, arg1, arg2, arg3)
                } else {
                    func(arg1, arg2, arg3)
                }
            }
        }
    }

}

EventEmitter.combiner = function(object, name, arg1, arg2, arg3) {
    const listeners = object._eventListeners[name]
    if (listeners) {
        // Because listener may detach itself while being invoked, we use a forEach instead of for loop.
        listeners.forEach((listener) => {
            listener(arg1, arg2, arg3)
        })
    }
}

/**
 * Copyright Metrological, 2017
 */
class Utils {
    static isFunction(value) {
        return typeof value === 'function';
    }

    static isNumber(value) {
        return typeof value === 'number';
    }

    static isInteger(value) {
        return (typeof value === 'number' && (value % 1) === 0);
    }

    static isBoolean(value) {
        return value === true || value === false;
    }

    static isString(value) {
        return typeof value == 'string';
    }

    static clone(v) {
        if (Utils.isObjectLiteral(v)) {
            return Utils.getDeepClone(v)
        } else {
            // Copy by value.
            return v
        }
    }

    static cloneObjShallow(obj) {
        let keys = Object.keys(obj);
        let clone = {}
        for (let i = 0; i < keys.length; i++) {
            clone[keys[i]] = obj[keys[i]];
        }
        return clone;
    }

    static merge(obj1, obj2) {
        let keys = Object.keys(obj2);
        for (let i = 0; i < keys.length; i++) {
            obj1[keys[i]] = obj2[keys[i]];
        }
        return obj1;
    }

    static isObject(value) {
        let type = typeof value;
        return !!value && (type == 'object' || type == 'function');
    }

    static isPlainObject(value) {
        let type = typeof value;
        return !!value && (type == 'object');
    }

    static isObjectLiteral(value){
        return typeof value === 'object' && value && value.constructor === Object
    }

    static getArrayIndex(index, arr) {
        return Utils.getModuloIndex(index, arr.length);
    }

    static getModuloIndex(index, len) {
        if (len == 0) return index;
        while (index < 0) {
            index += Math.ceil(-index / len) * len;
        }
        index = index % len;
        return index;
    }

    static getDeepClone(obj) {
        let i, c;
        if (Utils.isFunction(obj)) {
            // Copy functions by reference.
            return obj;
        }
        if (Array.isArray(obj)) {
            c = [];
            let keys = Object.keys(obj);
            for (i = 0; i < keys.length; i++) {
                c[keys[i]] = Utils.getDeepClone(obj[keys[i]]);
            }
            return c;
        } else if (Utils.isObject(obj)) {
            c = {}
            let keys = Object.keys(obj);
            for (i = 0; i < keys.length; i++) {
                c[keys[i]] = Utils.getDeepClone(obj[keys[i]]);
            }
            return c;
        } else {
            return obj;
        }
    }

    static equalValues(v1, v2) {
        if ((typeof v1) !== (typeof v2)) return false
        if (Utils.isObjectLiteral(v1)) {
            return Utils.equalObjectLiterals(v1, v2)
        } else {
            return v1 === v2
        }
    }

    static equalObjectLiterals(obj1, obj2) {
        let keys1 = Object.keys(obj1)
        let keys2 = Object.keys(obj2)
        if (keys1.length !== keys2.length) {
            return false
        }

        for (let i = 0, n = keys1.length; i < n; i++) {
            const k1 = keys1[i]
            const k2 = keys2[i]
            if (k1 !== k2) {
                return false
            }

            const v1 = obj1[k1]
            const v2 = obj2[k2]

            if (Utils.isObjectLiteral(v1)) {
                if (!this.equalObjectLiterals(v1, v2)) {
                    return false
                }
            } else {
                if (v1 !== v2) {
                    return false
                }
            }
        }

        return true;
    }

    static setToArray(s) {
        let result = [];
        s.forEach(function (value) {
            result.push(value);
        });
        return result;
    }

    static iteratorToArray(iterator) {
        let result = [];
        let iteratorResult = iterator.next();
        while (!iteratorResult.done) {
            result.push(iteratorResult.value);
            iteratorResult = iterator.next();
        }
        return result;
    }

    static isUcChar(charcode) {
        return charcode >= 65 && charcode <= 90
    }
}

/**
 * Copyright Metrological, 2017
 */
class StageUtils {

    static mergeNumbers(v1, v2, p) {
        return v1 * p + v2 * (1 - p);
    };

    static rgb(r, g, b) {
        return (r << 16) + (g << 8) + b + (255 * 16777216);
    };

    static rgba(r, g, b, a) {
        return (r << 16) + (g << 8) + b + (((a * 255) | 0) * 16777216);
    };

    static getRgbaString(color) {
        let r = ((color / 65536) | 0) % 256;
        let g = ((color / 256) | 0) % 256;
        let b = color % 256;
        let a = ((color / 16777216) | 0) / 255;
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(4) + ')';
    };

    static getRgbaComponentsNormalized(argb) {
        let r = ((argb / 65536) | 0) % 256;
        let g = ((argb / 256) | 0) % 256;
        let b = argb % 256;
        let a = ((argb / 16777216) | 0);
        return [r / 255, g / 255, b / 255, a / 255];
    };

    static getRgbComponentsNormalized(argb) {
        let r = ((argb / 65536) | 0) % 256;
        let g = ((argb / 256) | 0) % 256;
        let b = argb % 256;
        return [r / 255, g / 255, b / 255];
    };

    static getRgbaComponents(argb) {
        let r = ((argb / 65536) | 0) % 256;
        let g = ((argb / 256) | 0) % 256;
        let b = argb % 256;
        let a = ((argb / 16777216) | 0);
        return [r, g, b, a];
    };

    static getArgbNumber(rgba) {
        rgba[0] = Math.max(0, Math.min(255, rgba[0]));
        rgba[1] = Math.max(0, Math.min(255, rgba[1]));
        rgba[2] = Math.max(0, Math.min(255, rgba[2]));
        rgba[3] = Math.max(0, Math.min(255, rgba[3]));
        let v = ((rgba[3] | 0) << 24) + ((rgba[0] | 0) << 16) + ((rgba[1] | 0) << 8) + (rgba[2] | 0);
        if (v < 0) {
            v = 0xFFFFFFFF + v + 1;
        }
        return v;
    };

    static mergeColors(c1, c2, p) {
        let r1 = ((c1 / 65536) | 0) % 256;
        let g1 = ((c1 / 256) | 0) % 256;
        let b1 = c1 % 256;
        let a1 = ((c1 / 16777216) | 0);

        let r2 = ((c2 / 65536) | 0) % 256;
        let g2 = ((c2 / 256) | 0) % 256;
        let b2 = c2 % 256;
        let a2 = ((c2 / 16777216) | 0);

        let r = r1 * p + r2 * (1 - p) | 0;
        let g = g1 * p + g2 * (1 - p) | 0;
        let b = b1 * p + b2 * (1 - p) | 0;
        let a = a1 * p + a2 * (1 - p) | 0;

        return a * 16777216 + r * 65536 + g * 256 + b;
    };

    static mergeMultiColors(c, p) {
        let r = 0, g = 0, b = 0, a = 0, t = 0;
        let n = c.length;
        for (let i = 0; i < n; i++) {
            let r1 = ((c[i] / 65536) | 0) % 256;
            let g1 = ((c[i] / 256) | 0) % 256;
            let b1 = c[i] % 256;
            let a1 = ((c[i] / 16777216) | 0);
            r += r1 * p[i];
            g += g1 * p[i];
            b += b1 * p[i];
            a += a1 * p[i];
            t += p[i];
        }

        t = 1 / t;
        return ((a * t) | 0) * 16777216 + ((r * t) | 0) * 65536 + ((g * t) | 0) * 256 + ((b * t) | 0);
    };

    static mergeMultiColorsEqual(c) {
        let r = 0, g = 0, b = 0, a = 0, t = 0;
        let n = c.length;
        for (let i = 0; i < n; i++) {
            let r1 = ((c[i] / 65536) | 0) % 256;
            let g1 = ((c[i] / 256) | 0) % 256;
            let b1 = c[i] % 256;
            let a1 = ((c[i] / 16777216) | 0);
            r += r1;
            g += g1;
            b += b1;
            a += a1;
            t += 1.0;
        }

        t = 1 / t;
        return ((a * t) | 0) * 16777216 + ((r * t) | 0) * 65536 + ((g * t) | 0) * 256 + ((b * t) | 0);
    };

    static rad(deg) {
        return deg * (Math.PI / 180);
    };

    static getTimingBezier(a, b, c, d) {
        let xc = 3.0 * a;
        let xb = 3.0 * (c - a) - xc;
        let xa = 1.0 - xc - xb;
        let yc = 3.0 * b;
        let yb = 3.0 * (d - b) - yc;
        let ya = 1.0 - yc - yb;

        return function (time) {
            if (time >= 1.0) {
                return 1;
            }
            if (time <= 0) {
                return 0;
            }

            let t = 0.5, cbx, cbxd, dx;

            for (let it = 0; it < 20; it++) {
                cbx = t * (t * (t * xa + xb) + xc);
                dx = time - cbx;
                if (dx > -1e-8 && dx < 1e-8) {
                    return t * (t * (t * ya + yb) + yc);
                }

                // Cubic bezier derivative.
                cbxd = t * (t * (3 * xa) + 2 * xb) + xc;

                if (cbxd > 1e-10 && cbxd < 1e-10) {
                    // Problematic. Fall back to binary search method.
                    break;
                }

                t += dx / cbxd;
            }

            // Fallback: binary search method. This is more reliable when there are near-0 slopes.
            let minT = 0;
            let maxT = 1;
            for (it = 0; it < 20; it++) {
                t = 0.5 * (minT + maxT);

                cbx = t * (t * (t * xa + xb) + xc);

                dx = time - cbx;
                if (dx > -1e-8 && dx < 1e-8) {
                    // Solution found!
                    return t * (t * (t * ya + yb) + yc);
                }

                if (dx < 0) {
                    maxT = t;
                } else {
                    minT = t;
                }
            }

        };
    };

    static getTimingFunction(str) {
        switch (str) {
            case "linear":
                return function (time) {
                    return time
                };
            case "ease":
                return StageUtils.getTimingBezier(0.25, 0.1, 0.25, 1.0);
            case "ease-in":
                return StageUtils.getTimingBezier(0.42, 0, 1.0, 1.0);
            case "ease-out":
                return StageUtils.getTimingBezier(0, 0, 0.58, 1.0);
            case "ease-in-out":
                return StageUtils.getTimingBezier(0.42, 0, 0.58, 1.0);
            case "step-start":
                return function () {
                    return 1
                };
            case "step-end":
                return function (time) {
                    return time === 1 ? 1 : 0;
                };
            default:
                let s = "cubic-bezier(";
                if (str && str.indexOf(s) === 0) {
                    let parts = str.substr(s.length, str.length - s.length - 1).split(",");
                    if (parts.length !== 4) {
                        console.warn("Unknown timing function: " + str);

                        // Fallback: use linear.
                        return function (time) {
                            return time
                        };
                    }
                    let a = parseFloat(parts[0]);
                    let b = parseFloat(parts[1]);
                    let c = parseFloat(parts[2]);
                    let d = parseFloat(parts[3]);
                    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) {
                        console.warn("Unknown timing function: " + str);
                        // Fallback: use linear.
                        return function (time) {
                            return time
                        };
                    }

                    return StageUtils.getTimingBezier(a, b, c, d);
                } else {
                    console.warn("Unknown timing function: " + str);
                    // Fallback: use linear.
                    return function (time) {
                        return time
                    };
                }
        }
    };

    static getSplineValueFunction(v1, v2, p1, p2, o1, i2, s1, s2) {
        // Normalize slopes because we use a spline that goes from 0 to 1.
        let dp = p2 - p1;
        s1 *= dp;
        s2 *= dp;

        let helpers = StageUtils.getSplineHelpers(v1, v2, o1, i2, s1, s2);
        if (!helpers) {
            return function (p) {
                if (p == 0) return v1;
                if (p == 1) return v2;

                return v2 * p + v1 * (1 - p);
            };
        } else {
            return function (p) {
                if (p == 0) return v1;
                if (p == 1) return v2;
                return StageUtils.calculateSpline(helpers, p);
            };
        }
    };

    static getSplineRgbaValueFunction(v1, v2, p1, p2, o1, i2, s1, s2) {
        // Normalize slopes because we use a spline that goes from 0 to 1.
        let dp = p2 - p1;
        s1[0] *= dp;
        s1[1] *= dp;
        s1[2] *= dp;
        s1[3] *= dp;
        s2[0] *= dp;
        s2[1] *= dp;
        s2[2] *= dp;
        s2[3] *= dp;

        let cv1 = StageUtils.getRgbaComponents(v1);
        let cv2 = StageUtils.getRgbaComponents(v2);

        let helpers = [
            StageUtils.getSplineHelpers(cv1[0], cv2[0], o1, i2, s1[0], s2[0]),
            StageUtils.getSplineHelpers(cv1[1], cv2[1], o1, i2, s1[1], s2[1]),
            StageUtils.getSplineHelpers(cv1[2], cv2[2], o1, i2, s1[2], s2[2]),
            StageUtils.getSplineHelpers(cv1[3], cv2[3], o1, i2, s1[3], s2[3])
        ];

        if (!helpers[0]) {
            return function (p) {
                // Linear.
                if (p == 0) return v1;
                if (p == 1) return v2;

                return StageUtils.mergeColors(v2, v1, p);
            };
        } else {
            return function (p) {
                if (p == 0) return v1;
                if (p == 1) return v2;

                return StageUtils.getArgbNumber([
                    Math.min(255, StageUtils.calculateSpline(helpers[0], p)),
                    Math.min(255, StageUtils.calculateSpline(helpers[1], p)),
                    Math.min(255, StageUtils.calculateSpline(helpers[2], p)),
                    Math.min(255, StageUtils.calculateSpline(helpers[3], p))
                ]);
            };
        }

    };

    /**
     * Creates helpers to be used in the spline function.
     * @param {number} v1
     *   From value.
     * @param {number} v2
     *   To value.
     * @param {number} o1
     *   From smoothness (0 = linear, 1 = smooth).
     * @param {number} s1
     *   From slope (0 = horizontal, infinite = vertical).
     * @param {number} i2
     *   To smoothness.
     * @param {number} s2
     *   To slope.
     * @returns {Number[]}
     *   The helper values to be supplied to the spline function.
     *   If the configuration is actually linear, null is returned.
     */
    static getSplineHelpers(v1, v2, o1, i2, s1, s2) {
        if (!o1 && !i2) {
            // Linear.
            return null;
        }

        // Cubic bezier points.
        // http://cubic-bezier.com/
        let csx = o1;
        let csy = v1 + s1 * o1;
        let cex = 1 - i2;
        let cey = v2 - s2 * i2;

        // Helper letiables.
        let xa = 3 * csx - 3 * cex + 1;
        let xb = -6 * csx + 3 * cex;
        let xc = 3 * csx;

        let ya = 3 * csy - 3 * cey + v2 - v1;
        let yb = 3 * (cey + v1) - 6 * csy;
        let yc = 3 * (csy - v1);
        let yd = v1;

        return [xa, xb, xc, ya, yb, yc, yd];
    };

    /**
     * Calculates the intermediate spline value based on the specified helpers.
     * @param {number[]} helpers
     *   Obtained from getSplineHelpers.
     * @param {number} p
     * @return {number}
     */
    static calculateSpline(helpers, p) {
        let xa = helpers[0];
        let xb = helpers[1];
        let xc = helpers[2];
        let ya = helpers[3];
        let yb = helpers[4];
        let yc = helpers[5];
        let yd = helpers[6];

        if (xa == -2 && ya == -2 && xc == 0 && yc == 0) {
            // Linear.
            return p;
        }

        // Find t for p.
        let t = 0.5, cbx, dx;

        for (let it = 0; it < 20; it++) {
            // Cubic bezier function: f(t)=t*(t*(t*a+b)+c).
            cbx = t * (t * (t * xa + xb) + xc);

            dx = p - cbx;
            if (dx > -1e-8 && dx < 1e-8) {
                // Solution found!
                return t * (t * (t * ya + yb) + yc) + yd;
            }

            // Cubic bezier derivative function: f'(t)=t*(t*(3*a)+2*b)+c
            let cbxd = t * (t * (3 * xa) + 2 * xb) + xc;

            if (cbxd > 1e-10 && cbxd < 1e-10) {
                // Problematic. Fall back to binary search method.
                break;
            }

            t += dx / cbxd;
        }

        // Fallback: binary search method. This is more reliable when there are near-0 slopes.
        let minT = 0;
        let maxT = 1;
        for (it = 0; it < 20; it++) {
            t = 0.5 * (minT + maxT);

            // Cubic bezier function: f(t)=t*(t*(t*a+b)+c)+d.
            cbx = t * (t * (t * xa + xb) + xc);

            dx = p - cbx;
            if (dx > -1e-8 && dx < 1e-8) {
                // Solution found!
                return t * (t * (t * ya + yb) + yc) + yd;
            }

            if (dx < 0) {
                maxT = t;
            } else {
                minT = t;
            }
        }

        return t;
    };
}

/**
 * Copyright Metrological, 2017
 */
class Base {

    static defaultSetter(obj, name, value) {
        obj[name] = value
    }

    static patchObject(obj, settings) {
        if (!Utils.isObjectLiteral(settings)) {
            console.error("Settings must be object literal")
        } else {
            let names = Object.keys(settings)
            for (let i = 0, n = names.length; i < n; i++) {
                let name = names[i]

                this.patchObjectProperty(obj, name, settings[name])
            }
        }
    }

    static patchObjectProperty(obj, name, value) {
        let setter = obj.setSetting || Base.defaultSetter;

        if (name.substr(0, 1) === "_" && name !== "__create") {
            // Disallow patching private variables.
            console.error("Patch of private property '" + name + "' is not allowed")
        } else if (name !== "type") {
            // Type is a reserved keyword to specify the class type on creation.
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
        this._stopLoop()
        this._destroyed = true;
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
            return new View(this, object)
        } else {
            const view = new View(this)
            view.patch(object, createMode)
            return view
        }
    }

}
class View extends EventEmitter {

    constructor(stage, type = undefined) {
        super()

        this.stage = stage
        this.__id = ++View.id

        if (!type) {
            type = this.constructor.getHtmlType()
        }

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

    static getHtmlType() {
        return 'div'
    }

    setAsRoot() {
        this.tagRoot = true
        this._updateAttached()
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

            // No need to recurse since we are already recursing when setting the attached flags.
            this._updateActiveLocal()

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

    _updateActiveLocal() {
        const newActive = this.isActive()
        if (this.__active !== newActive) {
            this.emit(newActive ? 'active' : 'inactive')
            this.emit(newActive ? 'enable' : 'disable')
            this.__active = newActive
        }
    }

    _updateActive() {
        const newActive = this.isActive()
        if (this.__active !== newActive) {
            this.emit(newActive ? 'active' : 'inactive')
            this.emit(newActive ? 'enable' : 'disable')
            this.__active = newActive

            if (this.__childList) {
                let children = this.__childList.get();
                if (children) {
                    let m = children.length;
                    if (m > 0) {
                        for (let i = 0; i < m; i++) {
                            children[i]._updateActive();
                        }
                    }
                }
            }
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

    set a(settings) {
        this.attribs = settings
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
        if (v.indexOf(" ") !== -1) {
            v = v.split(" ").join("_")
        }
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
                                    c = this.stage.create(v, subCreateMode)
                                } else if (v instanceof Element) {
                                    c = this.stage.create(v, subCreateMode)
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
                            v.ref = child.ref
                            const index = child.parent.childList.getIndex(child)
                            child.parent.childList.setAt(v, index)
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
        let isRef
        if (arrowIdx === 0) {
            isRef = true
            path = path.substr(1)
        } else if (pointIdx === 0) {
            isRef = false
            path = path.substr(1)
        } else {
            const firstCharcode = path.charCodeAt(0)
            isRef = Utils.isUcChar(firstCharcode)
        }

        return this._selectChilds(path, isRef)
    }

    _selectChilds(path, isRef) {
        const pointIdx = path.indexOf(".")
        const arrowIdx = path.indexOf(">")

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
                total = total.concat(next[i]._selectChilds(subPath, false))
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
                total = total.concat(next[i]._selectChilds(subPath, true))
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
        if (value === undefined) {
            this.__e.removeAttribute(prop)
        } else {
            this.__e.setAttribute(prop, value)
        }
    }

    get $() {
        return this.__e.style
    }

    set $(v) {
        this.style = v
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

        if (this._ref) {
            list.push(this._ref)
        }

        const tagRootId = this.tagRootId
        if (tagRootId) {
            list.push(`_R${tagRootId}`)
        }

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
            let target = isArray ? name : obj[name]
            if (target === true) {
                target = name
            }

            if (this.fireHtmlEvent[name] && this.fireHtmlEvent[name].target === name) {
                // Skip.
                return
            }

            if (this.fireHtmlEvent[name]) {
                this.e.removeEventListener(name, this.fireHtmlEvent[name])
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
            let target = isArray ? name : obj[name]
            if (target === true) {
                target = name
            }

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
/**
 * Manages a list of objects.
 * Objects may be patched. Then, they can be referenced using the 'ref' (string) property.
 */
class ObjectList {

    constructor() {
        this._items = []
        this._refs = {}
    }

    get() {
        return this._items
    }

    get first() {
        return this._items[0]
    }

    get last() {
        return this._items.length ? this._items[this._items.length - 1] : undefined
    }

    add(item) {
        this.addAt(item, this._items.length);
    }

    addAt(item, index) {
        if (index >= 0 && index <= this._items.length) {
            let currentIndex = this._items.indexOf(item)
            if (currentIndex === index) {
                return item;
            }

            if (currentIndex != -1) {
                this.setAt(item, index)
            } else {
                if (item.ref) {
                    this._refs[item.ref] = item
                }
                this._items.splice(index, 0, item);
                this.onAdd(item, index)
            }
        } else {
            throw new Error('addAt: The index ' + index + ' is out of bounds ' + this._items.length);
        }
    }

    replace(item, prevItem) {
        const index = this.getIndex(prevItem)
        if (index === -1) {
            throw new Error('replace: The previous item does not exist');
        }
        this.setAt(item, index)
    }

    setAt(item, index) {
        if (index >= 0 && index <= this._items.length) {
            let currentIndex = this._items.indexOf(item)
            if (currentIndex != -1) {
                if (currentIndex !== index) {
                    const fromIndex = currentIndex
                    if (fromIndex <= index) {
                        index--
                    }
                    if (fromIndex !== index) {
                        this._items.splice(fromIndex, 1)
                        this._items.splice(index, 0, item)
                        this.onMove(item, fromIndex, index)
                    }
                }
            } else {
                if (index < this._items.length) {
                    if (this._items[index].ref) {
                        this._refs[this._items[index].ref] = undefined
                    }
                }

                const prevItem = this._items[index]

                // Doesn't exist yet: overwrite current.
                this._items[index] = item

                if (item.ref) {
                    this._refs[item.ref] = item
                }

                this.onSet(item, index, prevItem)
            }
        } else {
            throw new Error('setAt: The index ' + index + ' is out of bounds ' + this._items.length);
        }
    }

    getAt(index) {
        return this._items[index]
    }

    getIndex(item) {
        return this._items.indexOf(item)
    }

    remove(item) {
        let index = this._items.indexOf(item)

        if (index !== -1) {
            this.removeAt(index)
        }
    };

    removeAt(index) {
        let item = this._items[index]

        if (item.ref) {
            this._refs[item.ref] = undefined
        }

        this._items.splice(index, 1);

        this.onRemove(item, index)

        return item;
    };

    clear() {
        let n = this._items.length
        if (n) {
            let prev = this._items
            this._items = []
            this._refs = {}
            this.onSync(prev, [], [])
        }
    };

    a(o) {
        if (Utils.isObjectLiteral(o)) {
            let c = this.createItem(o);
            c.patch(o);
            this.add(c);
            return c;
        } else if (o instanceof Element) {
            let c = this.createItem(o);
            this.add(c);
            return c;
        } else if (Array.isArray(o)) {
            for (let i = 0, n = o.length; i < n; i++) {
                this.a(o[i]);
            }
            return null;
        } else if (this.isItem(o)) {
            this.add(o);
            return o;
        }
    };

    get length() {
        return this._items.length;
    }

    _getRefs() {
        return this._refs
    }

    getByRef(ref) {
        return this._refs[ref]
    }

    clearRef(ref) {
        delete this._refs[ref]
    }

    setRef(ref, child) {
        this._refs[ref] = child
    }

    patch(settings) {
        if (Utils.isObjectLiteral(settings)) {
            this._setByObject(settings)
        } else if (Array.isArray(settings)) {
            this._setByArray(settings)
        }
    }

    _setByObject(settings) {
        // Overrule settings of known referenced items.
        let refs = this._getRefs()
        let crefs = Object.keys(settings)
        for (let i = 0, n = crefs.length; i < n; i++) {
            let cref = crefs[i]
            let s = settings[cref]

            let c = refs[cref]
            if (!c) {
                if (this.isItem(s)) {
                    // Replace previous item
                    s.ref = cref
                    this.add(s)
                } else {
                    // Create new item.
                    c = this.createItem(s)
                    c.ref = cref
                    c.patch(s)
                    this.add(c)
                }
            } else {
                if (this.isItem(s)) {
                    if (c !== s) {
                        // Replace previous item
                        let idx = this.getIndex(c)
                        s.ref = cref
                        this.setAt(s, idx)
                    }
                } else {
                    c.patch(s)
                }
            }
        }
    }

    _equalsArray(array) {
        let same = true
        if (array.length === this._items.length) {
            for (let i = 0, n = this._items.length; (i < n) && same; i++) {
                same = same && (this._items[i] === array[i])
            }
        } else {
            same = false
        }
        return same
    }

    _setByArray(array) {
        // For performance reasons, first check if the arrays match exactly and bail out if they do.
        if (this._equalsArray(array)) {
            return
        }

        for (let i = 0, n = this._items.length; i < n; i++) {
            this._items[i].marker = true
        }

        let refs
        let newItems = []
        for (let i = 0, n = array.length; i < n; i++) {
            let s = array[i]
            if (this.isItem(s)) {
                s.marker = false
                newItems.push(s)
            } else {
                let cref = s.ref
                let c
                if (cref) {
                    if (!refs) refs = this._getRefs()
                    c = refs[cref]
                }

                if (!c) {
                    // Create new item.
                    c = this.createItem(s)
                } else {
                    c.marker = false
                }

                if (Utils.isObjectLiteral(s)) {
                    c.patch(s)
                }

                newItems.push(c)
            }
        }

        this._setItems(newItems)
    }

    _setItems(newItems) {
        let prevItems = this._items
        this._items = newItems

        // Remove the items.
        let removed = prevItems.filter(item => {let m = item.marker; delete item.marker; return m})
        let added = newItems.filter(item => (prevItems.indexOf(item) === -1))

        if (removed.length || added.length) {
            // Recalculate refs.
            this._refs = {}
            for (let i = 0, n = this._items.length; i < n; i++) {
                let ref = this._items[i].ref
                if (ref) {
                    this._refs[ref] = this._items[i]
                }
            }
        }

        this.onSync(removed, added, newItems)
    }

    sort(f) {
        const items = this._items.slice()
        items.sort(f)
        this._setByArray(items)
    }

    onAdd(item, index) {
    }

    onRemove(item, index) {
    }

    onSync(removed, added, order) {
    }

    onSet(item, index, prevItem) {
    }

    onMove(item, fromIndex, toIndex) {
    }

    createItem(object) {
        throw new Error("ObjectList.createItem must create and return a new object")
    }

    isItem(object) {
        return false
    }

}

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
        const e = this._view.__e
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
        this.e.replaceChild(item.e, prevItem.e)
        this.e.children[index].__view._updateParent()
        item._updateParent()
    }

    onMove(item, fromIndex, toIndex) {
        this.e.insertBefore(item.e, this.e.children[toIndex])
        item._updateParent()
    }

    createItem(object) {
        return this._view.stage.create(object)
    }

    isItem(object) {
        return object.isView
    }

}

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

    hasFocus() {
        let path = this.application._focusPath
        return path && path.length && path[path.length - 1] === this
    }

    hasFinalFocus() {
        let path = this.application._focusPath
        return path && (path.indexOf(this) >= 0)
    }

    get cparent() {
        return Component.getParent(this)
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

    get _broadcasts() {
        return this.__broadcasts
    }

    set _broadcasts(v) {
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

class Application extends Component {

    constructor(options = {}, properties) {
        // Save options temporarily to avoid having to pass it through the constructor.
        Application._temp_options = options

        const stage = new Stage(window.document, options.stage)
        super(stage, properties)

        // We must construct while the application is not yet attached.
        // That's why we 'init' the stage later (which actually emits the attach event).
        this.stage.init()

        this.__keymap = this.getOption('keys')
        if (this.__keymap) {
            window.addEventListener('keydown', e => {
                this._receiveKeydown(e)
            })
        }
    }

    getOption(name) {
        return this.__options[name]
    }

    _setOptions(o) {
        this.__options = {};

        let opt = (name, def) => {
            let value = o[name];

            if (value === undefined) {
                this.__options[name] = def;
            } else {
                this.__options[name] = value;
            }
        }

        opt('debug', false);
        opt('keys', {});
    }

    __construct() {
        this.stage.setApplication(this)

        this._setOptions(Application._temp_options)
        delete Application._temp_options

        // We must create the state manager before the first 'fire' ever: the 'construct' event.
        this.stateManager = new StateManager()
        this.stateManager.debug = this.__options.debug

        super.__construct()
    }

    __init() {
        super.__init()
        this.__updateFocus()
    }

    __updateFocus(maxRecursion = 100) {
        const newFocusPath = this.__getFocusPath()
        const newFocusedComponent = newFocusPath[newFocusPath.length - 1]
        const prevFocusedComponent = this._focusPath ? this._focusPath[this._focusPath.length - 1] : undefined

        if (!prevFocusedComponent) {
            // First focus.
            this._focusPath = newFocusPath

            // Focus events.
            for (let i = 0, n = this._focusPath.length; i < n; i++) {
                this._focusPath[i].__focus(newFocusedComponent, undefined)
            }
        } else {
            let m = Math.min(this._focusPath.length, newFocusPath.length)
            let index
            for (index = 0; index < m; index++) {
                if (this._focusPath[index] !== newFocusPath[index]) {
                    break
                }
            }

            if (this._focusPath.length !== newFocusPath.length || index !== newFocusPath.length) {
                if (this.__options.debug) {
                    console.log(this.stateManager._logPrefix + '* FOCUS ' + newFocusedComponent.getLocationString())
                }
                // Unfocus events.
                for (let i = this._focusPath.length - 1; i >= index; i--) {
                    this._focusPath[i].__unfocus(newFocusedComponent, prevFocusedComponent)
                }

                this._focusPath = newFocusPath

                // Focus events.
                for (let i = index, n = this._focusPath.length; i < n; i++) {
                    this._focusPath[i].__focus(newFocusedComponent, prevFocusedComponent)
                }

                // Focus changed events.
                for (let i = 0; i < index; i++) {
                    this._focusPath[i].__focusChange(newFocusedComponent, prevFocusedComponent)
                }

                // Focus events could trigger focus changes.
                if (maxRecursion-- === 0) {
                    throw new Error("Max recursion count reached in focus update")
                }
                this.__updateFocus(maxRecursion)
            }
        }

        // Performance optimization: do not gather settings if no handler is defined.
        if (this.__initialized && this._handleFocusSettings !== Application.prototype._handleFocusSettings) {
            // Get focus settings. These can be used for dynamic application-wide settings the depend on the
            // focus directly (such as the application background).
            const focusSettings = {}
            for (let i = 0, n = this._focusPath.length; i < n; i++) {
                this._focusPath[i]._setFocusSettings(focusSettings)
            }

            this._handleFocusSettings(focusSettings, this.__prevFocusSettings, newFocusedComponent, prevFocusedComponent)

            this.__prevFocusSettings = focusSettings
        }
    }

    _handleFocusSettings(settings, prevSettings, focused, prevFocused) {
        // Override to handle focus-based settings.
    }

    __getFocusPath() {
        const path = [this]
        let current = this
        do {
            const nextFocus = current._getFocused()
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
                    if (!ptr) {
                        current._throwError("Return value for _getFocused must be an attached descendant component but its '" + nextFocus.getLocationString() + "'")
                    }
                    newParts.push(ptr)
                    ptr = ptr.cparent
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

    /**
     * Injects an event in the state machines, top-down from application to focused component.
     */
    focusTopDownEvent(event, args) {
        const path = this.focusPath
        const n = path.length
        if (Array.isArray(event)) {
            // Multiple events.
            for (let i = 0; i < n; i++) {
                if (path[i].fire(event)) {
                    return true
                }
            }
        } else {
            // Single event.
            for (let i = 0; i < n; i++) {
                if (path[i].fire(event, args)) {
                    return true
                }
            }
        }
        return false
    }

    /**
     * Injects an event in the state machines, bottom-up from focused component to application.
     */
    focusBottomUpEvent(event, args) {
        const path = this.focusPath
        const n = path.length
        if (Array.isArray(event)) {
            // Multiple events.
            for (let i = n - 1; i >= 0; i--) {
                if (path[i].fire(event)) {
                    return true
                }
            }
        } else {
            // Single event.
            for (let i = n - 1; i >= 0; i--) {
                if (path[i].fire(event, args)) {
                    return true
                }
            }
        }
        return false
    }

    _receiveKeydown(e) {
        const obj = {keyCode: e.keyCode}
        if (this.__keymap[e.keyCode]) {
            if (!this.stage.application.focusTopDownEvent([{event: "_capture" + this.__keymap[e.keyCode]}, {event: "_captureKey", args: obj}])) {
                this.stage.application.focusBottomUpEvent([{event: "_handle" + this.__keymap[e.keyCode]}, {event: "_handleKey", args: obj}])
            }
        } else {
            if (!this.stage.application.focusTopDownEvent("_captureKey", obj)) {
                this.stage.application.focusBottomUpEvent("_handleKey", obj)
            }
        }
    }

}

class StateManager {

    constructor() {
        this._fireLevel = 0
        this._logPrefix = ""
        this._debug = false
    }

    get debug() {
        return this._debug
    }

    set debug(v) {
        this._debug = v
    }

    /**
     * Fires the specified event on the state machine.
     * @param {Component} component
     * @param {string|object[]} event
     *   Either a single event, or an array of events ({event: 'name', args: *}.
     *   In case of an array, the event is fired that had a match in the deepest state.
     *   If multiple events match in the deepest state, the first specified one has priority.
     * @param {*} args
     * @return {boolean}
     *   True iff the state machine could find and execute a handler for the event (event and condition matched).
     */
    fire(component, event, args) {
        // After an event is fired (by external means), the action may cause other events to be triggered. We
        // distinguish between primary and indirect events because we have to perform some operations after primary
        // events only.

        // Purely for logging.
        const primaryEvent = (this._fireLevel === 0)
        this._fireLevel++

        if (this.debug) {
            if (!primaryEvent) {
                this._logPrefix += " "
            } else {
                this._logPrefix = ""
            }
        }

        let found
        if (Array.isArray(event)) {
            found = this._mfire(component, event, args)
        } else {
            found = this._fire(component, event, args)
        }

        if (found && primaryEvent) {
            // Update focus.
            component.application.__updateFocus()
        }

        this._fireLevel--

        if (this.debug) {
            this._logPrefix = this._logPrefix.substr(0, this._logPrefix.length - 1)
        }

        return !!found
    }

    _fire(component, event, args) {
        if (Utils.isUcChar(event.charCodeAt(0))) {
            component._throwError("Event may not start with an upper case character: " + event)
        }

        const paths = this._getStatePaths(component, component.state)
        for (let i = 0, n = paths.length; i < n; i++) {
            const result = this._attemptFirePathEvent(component, paths[i], event, args)
            if (result) {
                return result
            }
        }
    }

    _mfire(component, events) {
        const paths = this._getStatePaths(component, component.state)
        for (let j = 0, m = paths.length; j < m; j++) {
            for (let i = 0, n = events.length; i < n; i++) {
                const result = this._attemptFirePathEvent(component, paths[j], events[i].event, events[i].args)
                if (result) {
                    return result
                }
            }
        }
    }

    _attemptFirePathEvent(component, path, event, args) {
        const result = StateManager._getStateAction(path, event)
        if (result) {
            let validAction = (result.s !== undefined)
            let newState = result.s
            if (result.a) {
                try {
                    if (this.debug) {
                        console.log(`${this._logPrefix}${component.constructor.name} "${component.state}".${event} ${component.getLocationString()}`)
                    }
                    newState = result.a.call(component, args)
                    validAction = (newState !== false)
                    if (!validAction) {
                        if (this.debug) {
                            console.log(`${this._logPrefix}[PASS THROUGH]`)
                        }
                    }
                } catch(e) {
                    console.error(e)
                }
            }
            if (validAction) {
                result.event = event
                result.args = args
                result.s = newState
                result.p = path

                const prevState = component.state

                if (Utils.isString(newState)) {
                    this._setState(component, StateManager._ucfirst(newState), {event: event, args: args, prevState: prevState, newState: newState})
                }

                return result
            }
        }
    }

    static _ucfirst(str) {
        return str.charAt(0).toUpperCase() + str.substr(1)
    }

    _getStatePaths(component, state) {
        const states = component._getStates()

        if (state == "") return [states]
        const parts = state.split(".")

        let cursor = states
        const path = [cursor]
        for (let i = 0, n = parts.length; i < n; i++) {
            const key = StateManager._ucfirst(parts[i])
            if (!cursor.hasOwnProperty(key)) {
                component._throwError("State path not found: '" + state + "'")
            }
            cursor = cursor[key]
            path.push(cursor)
        }
        return path.reverse()
    }

    /**
     * Returns the active's edge action and state.
     * @param {string} state
     * @param event
     * @return {object}
     * @private
     */
    static _getStateAction(state, event) {
        if (!state.hasOwnProperty(event)) {
            return null
        }
        const def = state[event]

        if (Utils.isFunction(def)) {
            // Action.
            return {a: def, s: undefined}
        } else if (Utils.isString(def)) {
            // State.
            return {a: undefined, s: def}
        }

        return null
    }


    _setState(component, newState, eargs) {
        if (this.debug) {
            console.log(`${this._logPrefix}╚>"${newState !== component.state ? newState : ""}"`)
        }

        if (newState !== component.state) {
            this._fireLevel++
            if (this.debug) {
                this._logPrefix += " "
            }

            const paths = this._getStatePaths(component, component.state)

            // Switch state to new state.
            const newPaths = this._getStatePaths(component, newState)

            const info = StateManager._compareStatePaths(paths, newPaths)
            const exit = info.exit.reverse()
            const enter = info.enter
            const state = component.state
            for (let i = 0, n = exit.length; i < n; i++) {
                component.__state = StateManager._getSuperState(state, i)
                const def = StateManager._getStateAction(exit[i], "_exit")
                if (def) {
                    if (this.debug) {
                        console.log(`${this._logPrefix}${component.constructor.name} "${component.state}"._exit ${component.getLocationString()}`)
                    }
                    let stateSwitch = StateManager._executeAction(def, component, eargs)
                    if (stateSwitch === false) {
                        if (this.debug) {
                            console.log(`${this._logPrefix}[CANCELED]`)
                        }
                    } else if (stateSwitch) {
                        const info = this._setState(
                            component,
                            stateSwitch,
                            eargs
                        )

                        this._fireLevel--
                        if (this.debug) {
                            this._logPrefix = this._logPrefix.substr(0, this._logPrefix.length - 1)
                        }

                        return info
                    }
                }
            }

            component.__state = StateManager._getSuperState(state, exit.length)

            for (let i = 0, n = enter.length; i < n; i++) {
                component.__state = StateManager._getSuperState(newState, (n - (i + 1)))
                const def = StateManager._getStateAction(enter[i], "_enter")
                if (def) {
                    if (this.debug) {
                        console.log(`${this._logPrefix}${component.constructor.name} "${newState}"._enter ${component.getLocationString()}`)
                    }
                    let stateSwitch = StateManager._executeAction(def, component, eargs)
                    if (stateSwitch === false) {
                        if (this.debug) {
                            console.log(`${this._logPrefix}[CANCELED]`)
                        }
                    } else if (stateSwitch) {
                        const info = this._setState(
                            component,
                            stateSwitch,
                            eargs
                        )

                        this._fireLevel--
                        if (this.debug) {
                            this._logPrefix = this._logPrefix.substr(0, this._logPrefix.length - 1)
                        }

                        return info
                    }
                }
            }

            this._fireLevel--
            if (this.debug) {
                this._logPrefix = this._logPrefix.substr(0, this._logPrefix.length - 1)
            }
        }

    }

    static _executeAction(action, component, args) {
        let newState
        if (action.a) {
            newState = action.a.call(component, args)
        }
        if (newState === undefined) {
            newState = action.s
        }
        return newState
    }

    static _getSuperState(state, levels) {
        if (levels === 0) {
            return state
        }
        return state.split(".").slice(0, -levels).join(".")
    }

    /**
     * Returns the exit states and enter states when switching states (in natural branch order).
     */
    static _compareStatePaths(current, newPaths) {
        current = current.reverse()
        newPaths = newPaths.reverse()
        const n = Math.min(current.length, newPaths.length)
        let pos
        for (pos = 0; pos < n; pos++) {
            if (current[pos] !== newPaths[pos]) break
        }

        return {exit: current.slice(pos), enter: newPaths.slice(pos)}
    }

}
class Animation extends EventEmitter {

    constructor(manager, settings, view) {
        super()

        this.manager = manager

        this._settings = settings

        this._view = view

        this._state = Animation.STATES.IDLE

        this._p = 0
        this._delayLeft = 0
        this._repeatsLeft = 0

        this._stopDelayLeft = 0
        this._stopP = 0
    }

    start() {
        if (this._view && this._view.isAttached()) {
            this._p = 0
            this._delayLeft = this.settings.delay
            this._repeatsLeft = this.settings.repeat
            this._state = Animation.STATES.PLAYING
            this.emit('start')
            this.checkActive()
        } else {
            console.warn("View must be attached before starting animation")
        }
    }

    play() {
        if (this._state == Animation.STATES.STOPPING && this.settings.stopMethod == AnimationSettings.STOP_METHODS.REVERSE) {
            // Continue.
            this._state = Animation.STATES.PLAYING
            this.emit('stopContinue')
        } else if (this._state != Animation.STATES.PLAYING && this._state != Animation.STATES.FINISHED) {
            // Restart.
            this.start()
        }
    }

    replay() {
        if (this._state == Animation.STATES.FINISHED) {
            this.start()
        } else {
            this.play()
        }
    }

    skipDelay() {
        this._delayLeft = 0
        this._stopDelayLeft = 0
    }

    finish() {
        if (this._state === Animation.STATES.PLAYING) {
            this._delayLeft = 0
            this._p = 1
        } else if (this._state === Animation.STATES.STOPPING) {
            this._stopDelayLeft = 0
            this._p = 0
        }
    }

    stop() {
        if (this._state === Animation.STATES.STOPPED || this._state === Animation.STATES.IDLE) return

        this._stopDelayLeft = this.settings.stopDelay || 0

        if (((this.settings.stopMethod === AnimationSettings.STOP_METHODS.IMMEDIATE) && !this._stopDelayLeft) || this._delayLeft > 0) {
            // Stop upon next progress.
            this._state = Animation.STATES.STOPPING
            this.emit('stop')
        } else {
            if (this.settings.stopMethod === AnimationSettings.STOP_METHODS.FADE) {
                this._stopP = 0
            }

            this._state = Animation.STATES.STOPPING
            this.emit('stop')
        }

        this.checkActive()
    }

    stopNow() {
        if (this._state !== Animation.STATES.STOPPED || this._state !== Animation.STATES.IDLE) {
            this._state = Animation.STATES.STOPPING
            this._p = 0
            this.emit('stop')
            this.reset()
            this._state = Animation.STATES.STOPPED
            this.emit('stopFinish')
        }
    }

    isPlaying() {
        return this._state === Animation.STATES.PLAYING
    }

    isStopping() {
        return this._state === Animation.STATES.STOPPING
    }

    checkActive() {
        if (this.isActive()) {
            this.manager.addActive(this)
        }
    }

    isActive() {
        return (this._state == Animation.STATES.PLAYING || this._state == Animation.STATES.STOPPING) && this._view && this._view.isAttached()
    }

    progress(dt) {
        if (!this._view) return
        this._progress(dt)
        this.apply()
    }

    _progress(dt) {
        if (this._state == Animation.STATES.STOPPING) {
            this._stopProgress(dt)
            return
        }

        if (this._state != Animation.STATES.PLAYING) {
            return
        }

        if (this._delayLeft > 0) {
            this._delayLeft -= dt

            if (this._delayLeft < 0) {
                dt = -this._delayLeft
                this._delayLeft = 0

                this.emit('delayEnd')
            } else {
                return
            }
        }

        if (this.settings.duration === 0) {
            this._p = 1
        } else if (this.settings.duration > 0) {
            this._p += dt / this.settings.duration
        }
        if (this._p >= 1) {
            // Finished!
            if (this.settings.repeat == -1 || this._repeatsLeft > 0) {
                if (this._repeatsLeft > 0) {
                    this._repeatsLeft--
                }
                this._p = this.settings.repeatOffset

                if (this.settings.repeatDelay) {
                    this._delayLeft = this.settings.repeatDelay
                }

                this.emit('repeat', this._repeatsLeft)
            } else {
                this._p = 1
                this._state = Animation.STATES.FINISHED
                this.emit('finish')
                if (this.settings.autostop) {
                    this.stop()
                }
            }
        } else {
            this.emit('progress', this._p)
        }
    }

    _stopProgress(dt) {
        let duration = this._getStopDuration()

        if (this._stopDelayLeft > 0) {
            this._stopDelayLeft -= dt

            if (this._stopDelayLeft < 0) {
                dt = -this._stopDelayLeft
                this._stopDelayLeft = 0

                this.emit('stopDelayEnd')
            } else {
                return
            }
        }
        if (this.settings.stopMethod == AnimationSettings.STOP_METHODS.IMMEDIATE) {
            this._state = Animation.STATES.STOPPED
            this.emit('stop')
            this.emit('stopFinish')
        } else if (this.settings.stopMethod == AnimationSettings.STOP_METHODS.REVERSE) {
            if (duration === 0) {
                this._p = 0
            } else if (duration > 0) {
                this._p -= dt / duration
            }

            if (this._p <= 0) {
                this._p = 0
                this._state = Animation.STATES.STOPPED
                this.emit('stopFinish')
            }
        } else if (this.settings.stopMethod == AnimationSettings.STOP_METHODS.FADE) {
            this._progressStopTransition(dt)
            if (this._stopP >= 1) {
                this._p = 0
                this._state = Animation.STATES.STOPPED
                this.emit('stopFinish')
            }
        } else if (this.settings.stopMethod == AnimationSettings.STOP_METHODS.ONETOTWO) {
            if (this._p < 2) {
                if (duration === 0) {
                    this._p = 2
                } else if (duration > 0) {
                    if (this._p < 1) {
                        this._p += dt / this.settings.duration
                    } else {
                        this._p += dt / duration
                    }
                }
                if (this._p >= 2) {
                    this._p = 2
                    this._state = Animation.STATES.STOPPED
                    this.emit('stopFinish')
                } else {
                    this.emit('progress', this._p)
                }
            }
        } else if (this.settings.stopMethod == AnimationSettings.STOP_METHODS.FORWARD) {
            if (this._p < 1) {
                if (this.settings.duration == 0) {
                    this._p = 1
                } else {
                    this._p += dt / this.settings.duration
                }
                if (this._p >= 1) {
                    if (this.settings.stopMethod == AnimationSettings.STOP_METHODS.FORWARD) {
                        this._p = 1
                        this._state = Animation.STATES.STOPPED
                        this.emit('stopFinish')
                    } else {
                        if (this._repeatsLeft > 0) {
                            this._repeatsLeft--
                            this._p = 0
                            this.emit('repeat', this._repeatsLeft)
                        } else {
                            this._p = 1
                            this._state = Animation.STATES.STOPPED
                            this.emit('stopFinish')
                        }
                    }
                } else {
                    this.emit('progress', this._p)
                }
            }
        }

    }

    _progressStopTransition(dt) {
        if (this._stopP < 1) {
            if (this._stopDelayLeft > 0) {
                this._stopDelayLeft -= dt

                if (this._stopDelayLeft < 0) {
                    dt = -this._stopDelayLeft
                    this._stopDelayLeft = 0

                    this.emit('delayEnd')
                } else {
                    return
                }
            }

            const duration = this._getStopDuration()

            if (duration == 0) {
                this._stopP = 1
            } else {
                this._stopP += dt / duration
            }
            if (this._stopP >= 1) {
                // Finished!
                this._stopP = 1
            }
        }
    }

    _getStopDuration() {
        return this.settings.stopDuration || this.settings.duration
    }

    apply() {
        if (this._state == Animation.STATES.STOPPED) {
            this.reset()
        } else {
            let factor = 1
            if (this._state === Animation.STATES.STOPPING && this.settings.stopMethod === AnimationSettings.STOP_METHODS.FADE) {
                factor = (1 - this.settings.stopTimingFunctionImpl(this._stopP))
            }
            this._settings.apply(this._view, this._p, factor)
        }
    }

    reset() {
        this._settings.reset(this._view)
    }

    get state() {
        return this._state
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

    get frame() {
        return Math.round(this._p * this._settings.duration * 60)
    }

    get settings() {
        return this._settings
    }

}

Animation.STATES = {
    IDLE: 0,
    PLAYING: 1,
    STOPPING: 2,
    STOPPED: 3,
    FINISHED: 4
}

/**
 * Copyright Metrological, 2017
 */
class AnimationActionItems {
    
    constructor(action) {
        this._action = action
        
        this._clear()
    }

    _clear() {
        this._p = []
        this._pe = []
        this._idp = []
        this._f = []
        this._v = []
        this._lv = []
        this._sm = []
        this._s = []
        this._ve = []
        this._sme = []
        this._se = []

        this._length = 0
    }
    
    parse(def) {
        let i, n
        if (!Utils.isObjectLiteral(def)) {
            def = {0: def}
        }

        let defaultSmoothness = 0.5

        let items = []
        for (let key in def) {
            if (def.hasOwnProperty(key)) {
                let obj = def[key]
                if (!Utils.isObjectLiteral(obj)) {
                    obj = {v: obj}
                }

                let p = parseFloat(key)

                if (key == "sm") {
                    defaultSmoothness = obj.v
                } else if (!isNaN(p) && p >= 0 && p <= 2) {
                    obj.p = p

                    obj.f = Utils.isFunction(obj.v)
                    obj.lv = obj.f ? obj.v(0, 0) : obj.v

                    items.push(obj)
                }
            }
        }

        // Sort by progress value.
        items = items.sort(function(a, b) {return a.p - b.p})

        n = items.length

        for (i = 0; i < n; i++) {
            let last = (i == n - 1)
            if (!items[i].hasOwnProperty('pe')) {
                // Progress.
                items[i].pe = last ? (items[i].p <= 1 ? 1 : 2 /* support onetotwo stop */) : items[i + 1].p
            } else {
                // Prevent multiple items at the same time.
                const max = i < n - 1 ? items[i + 1].p : 1
                if (items[i].pe > max) {
                    items[i].pe = max
                }
            }
            if (items[i].pe === items[i].p) {
                items[i].idp = 0
            } else {
                items[i].idp = 1 / (items[i].pe - items[i].p)
            }
        }

        // Color merger: we need to split/combine RGBA components.
        const rgba = (this._action.hasColorProperty())

        // Calculate bezier helper values.
        for (i = 0; i < n; i++) {
            if (!items[i].hasOwnProperty('sm')) {
                // Smoothness.
                items[i].sm = defaultSmoothness
            }
            if (!items[i].hasOwnProperty('s')) {
                // Slope.
                if (i === 0 || i === n - 1 || (items[i].p === 1 /* for onetotwo */)) {
                    // Horizontal slope at start and end.
                    items[i].s = rgba ? [0, 0, 0, 0] : 0
                } else {
                    const pi = items[i - 1]
                    const ni = items[i + 1]
                    if (pi.p === ni.p) {
                        items[i].s = rgba ? [0, 0, 0, 0] : 0
                    } else {
                        if (rgba) {
                            const nc = StageUtils.getRgbaComponents(ni.lv)
                            const pc = StageUtils.getRgbaComponents(pi.lv)
                            const d = 1 / (ni.p - pi.p)
                            items[i].s = [
                                d * (nc[0] - pc[0]),
                                d * (nc[1] - pc[1]),
                                d * (nc[2] - pc[2]),
                                d * (nc[3] - pc[3])
                            ]
                        } else {
                            items[i].s = (ni.lv - pi.lv) / (ni.p - pi.p)
                        }
                    }
                }
            }
        }

        for (i = 0; i < n - 1; i++) {
            // Calculate value function.
            if (!items[i].f) {

                let last = (i === n - 1)
                if (!items[i].hasOwnProperty('ve')) {
                    items[i].ve = last ? items[i].lv : items[i + 1].lv
                }

                // We can only interpolate on numeric values. Non-numeric values are set literally when reached time.
                if (Utils.isNumber(items[i].v) && Utils.isNumber(items[i].lv)) {
                    if (!items[i].hasOwnProperty('sme')) {
                        items[i].sme = last ? defaultSmoothness : items[i + 1].sm
                    }
                    if (!items[i].hasOwnProperty('se')) {
                        items[i].se = last ? (rgba ? [0, 0, 0, 0] : 0) : items[i + 1].s
                    }

                    // Generate spline.
                    if (rgba) {
                        items[i].v = StageUtils.getSplineRgbaValueFunction(items[i].v, items[i].ve, items[i].p, items[i].pe, items[i].sm, items[i].sme, items[i].s, items[i].se)
                    } else {
                        items[i].v = StageUtils.getSplineValueFunction(items[i].v, items[i].ve, items[i].p, items[i].pe, items[i].sm, items[i].sme, items[i].s, items[i].se)
                    }

                    items[i].f = true
                }
            }
        }

        if (this.length) {
            this._clear()
        }

        for (i = 0, n = items.length; i < n; i++) {
            this._add(items[i])
        }        
    }

    _add(item) {
        this._p.push(item.p || 0)
        this._pe.push(item.pe || 0)
        this._idp.push(item.idp || 0)
        this._f.push(item.f || false)
        this._v.push(item.hasOwnProperty('v') ? item.v : 0 /* v might be false or null */ )
        this._lv.push(item.lv || 0)
        this._sm.push(item.sm || 0)
        this._s.push(item.s || 0)
        this._ve.push(item.ve || 0)
        this._sme.push(item.sme || 0)
        this._se.push(item.se || 0)
        this._length++
    }
    
    _getItem(p) {
        const n = this._length
        if (!n) {
            return -1
        }

        if (p < this._p[0]) {
            return 0
        }

        for (let i = 0; i < n; i++) {
            if (this._p[i] <= p && p < this._pe[i]) {
                return i
            }
        }

        return n - 1;        
    }

    getValue(p) {
        const i = this._getItem(p)
        if (i == -1) {
            return undefined
        } else {
            if (this._f[i]) {
                const o = Math.min(1, Math.max(0, (p - this._p[i]) * this._idp[i]))
                return this._v[i](o)
            } else {
                return this._v[i]
            }
        }
    }

    get length() {
        return this._length
    }

}


/**
 * Copyright Metrological, 2017
 */

class AnimationActionSettings {

    constructor() {
        /**
         * The selector that selects the views.
         * @type {string}
         */
        this._selector = ""

        /**
         * The value items, ordered by progress offset.
         * @type {AnimationActionItems}
         * @private
         */
        this._items = new AnimationActionItems(this)

        /**
         * The affected properties (paths).
         * @private
         */
        this._props = []

        /**
         * Property setters, indexed according to props.
         * @private
         */
        this._propSetters = []

        this._resetValue = undefined
        this._hasResetValue = false

        this._hasColorProperty = undefined
    }

    getResetValue() {
        if (this._hasResetValue) {
            return this._resetValue
        } else {
            return this._items.getValue(0)
        }
    }

    apply(view, p, factor) {
        const views = this.getAnimatedViews(view)

        let v = this._items.getValue(p)

        if (v === undefined || !views.length) {
            return
        }

        if (factor !== 1) {
            // Stop factor.
            let sv = this.getResetValue()

            if (Utils.isNumber(v) && Utils.isNumber(sv)) {
                if (this.hasColorProperty()) {
                    v = StageUtils.mergeColors(v, sv, factor)
                } else {
                    v = StageUtils.mergeNumbers(v, sv, factor)
                }
            }
        }

        // Apply transformation to all components.
        const n = this._propSetters.length

        const m = views.length
        for (let j = 0; j < m; j++) {
            for (let i = 0; i < n; i++) {
                this._propSetters[i](views[j], v)
            }
        }
    }
    
    getAnimatedViews(view) {
        return view.select(this._selector)
    }

    reset(view) {
        const views = this.getAnimatedViews(view)

        let v = this.getResetValue()

        if (v === undefined || !views.length) {
            return
        }

        // Apply transformation to all components.
        const n = this._propSetters.length

        const m = views.length
        for (let j = 0; j < m; j++) {
            for (let i = 0; i < n; i++) {
                this._propSetters[i](views[j], v)
            }
        }
    }
    
    set selector(v) {
        this._selector = v
    }

    set t(v) {
        this.selector = v
    }

    get resetValue() {
        return this._resetValue
    }
    
    set resetValue(v) {
        this._resetValue = v
        this._hasResetValue = (v !== undefined)
    }

    set rv(v) {
        this.resetValue = v
    }

    set value(v) {
        this._items.parse(v)
    }

    set v(v) {
        this.value = v
    }

    set properties(v) {
        if (!Array.isArray(v)) {
            v = [v]
        }

        this._props = []

        v.forEach((prop) => {
            this._props.push(prop)
            this._propSetters.push(View.getSetter(prop))
        })
    }

    set property(v) {
        this._hasColorProperty = undefined
        this.properties = v
    }

    set p(v) {
        this.properties = v
    }

    patch(settings) {
        Base.patchObject(this, settings)
    }

    hasColorProperty() {
        if (this._hasColorProperty === undefined) {
            this._hasColorProperty = this._props.length ? View.isColorProperty(this._props[0]) : false
        }
        return this._hasColorProperty
    }
}

AnimationActionSettings.prototype.isAnimationActionSettings = true

/**
 * Copyright Metrological, 2017
 */
class AnimationManager {

    constructor(stage) {
        this.stage = stage

        this.stage.on('frameStart', () => this.progress())

        /**
         * All running animations on attached subjects.
         * @type {Set<Animation>}
         */
        this.active = new Set()
    }

    progress() {
        if (this.active.size) {
            let dt = this.stage.dt

            let filter = false
            this.active.forEach(function(a) {
                if (a.isActive()) {
                    a.progress(dt)
                } else {
                    filter = true
                }
            })

            if (filter) {
                this.active = new Set([...this.active].filter(t => t.isActive()))
            }
        }
    }

    createAnimation(view, settings) {
        if (Utils.isObjectLiteral(settings)) {
            // Convert plain object to proper settings object.
            settings = this.createSettings(settings)
        }

        return new Animation(
            this,
            settings,
            view
        )
    }

    createSettings(settings) {
        const animationSettings = new AnimationSettings()
        Base.patchObject(animationSettings, settings)
        return animationSettings
    }

    addActive(transition) {
        if (!this.active.size) this.stage._startLoop()
        this.active.add(transition)
    }
}


/**
 * Copyright Metrological, 2017
 */

class AnimationSettings {
    constructor() {
        /**
         * @type {AnimationActionSettings[]}
         * @private
         */
        this._actions = []

        this.delay = 0
        this.duration = 1

        this.repeat = 0
        this.repeatOffset = 0
        this.repeatDelay = 0

        this.autostop = false

        this.stopMethod = AnimationSettings.STOP_METHODS.FADE
        this._stopTimingFunction = 'ease'
        this._stopTimingFunctionImpl = StageUtils.getTimingFunction(this._stopTimingFunction)
        this.stopDuration = 0
        this.stopDelay = 0
    }

    get actions() {
        return this._actions
    }

    set actions(v) {
        this._actions = []
        for (let i = 0, n = v.length; i < n; i++) {
            const e = v[i]
            if (!e.isAnimationActionSettings) {
                const aas = new AnimationActionSettings(this)
                aas.patch(e)
                this._actions.push(aas)
            } else {
                this._actions.push(e)
            }
        }
    }

    /**
     * Applies the animation to the specified view, for the specified progress between 0 and 1.
     * @param {View} view
     * @param {number} p
     * @param {number} factor
     */
    apply(view, p, factor = 1) {
        this._actions.forEach(function(action) {
            action.apply(view, p, factor)
        })
    }

    /**
     * Resets the animation to the reset values.
     * @param {View} view
     */
    reset(view) {
        this._actions.forEach(function(action) {
            action.reset(view)
        })
    }

    get stopTimingFunction() {
        return this._stopTimingFunction
    }

    set stopTimingFunction(v) {
        this._stopTimingFunction = v
        this._stopTimingFunctionImpl = StageUtils.getTimingFunction(v)
    }

    get stopTimingFunctionImpl() {
        return this._stopTimingFunctionImpl
    }

    patch(settings) {
        Base.patchObject(this, settings)
    }
}

AnimationSettings.STOP_METHODS = {
    FADE: 'fade',
    REVERSE: 'reverse',
    FORWARD: 'forward',
    IMMEDIATE: 'immediate',
    ONETOTWO: 'onetotwo'
}


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
        return this._view.isAttached()
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

/**
 * Copyright Metrological, 2017
 */
class TransitionManager {

    constructor(stage) {
        this.stage = stage;

        this.stage.on('frameStart', () => this.progress());

        /**
         * All transitions that are running and attached.
         * (we don't support transitions on un-attached views to prevent memory leaks)
         * @type {Set<Transition>}
         */
        this.active = new Set();

        this.defaultTransitionSettings = new TransitionSettings();
    }

    progress() {
        if (this.active.size) {
            let dt = this.stage.dt;

            let filter = false;
            this.active.forEach(function(a) {
                a.progress(dt);
                if (!a.isRunning()) {
                    filter = true;
                }
            });

            if (filter) {
                this.active = new Set([...this.active].filter(t => (t.isRunning())));
            }
        }
    }

    createSettings(settings) {
        let transitionSettings = new TransitionSettings();
        Base.patchObject(transitionSettings, settings);
        return transitionSettings;
    }

    addActive(transition) {
        if (!this.active.size) this.stage._startLoop()
        this.active.add(transition);
    }

    removeActive(transition) {
        this.active.delete(transition);
    }
}

/**
 * Copyright Metrological, 2017
 */

class TransitionSettings {
    constructor() {
        this._timingFunction = 'ease'
        this._timingFunctionImpl = StageUtils.getTimingFunction(this._timingFunction)
        this.delay = 0
        this.duration = 0.2
        this.merger = null
    }

    get timingFunction() {
        return this._timingFunction
    }

    set timingFunction(v) {
        this._timingFunction = v
        this._timingFunctionImpl = StageUtils.getTimingFunction(v)
    }

    get timingFunctionImpl() {
        return this._timingFunctionImpl
    }

    patch(settings) {
        Base.patchObject(this, settings)
    }
}

TransitionSettings.prototype.isTransitionSettings = true


return {
    Application: Application,
    Component: Component,
    Utils: Utils,
    StageUtils: StageUtils,
    EventEmitter: EventEmitter
}
})();