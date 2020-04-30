const React = require("react");
const importJsx = require("import-jsx");
const throttle = require("lodash.throttle");
const { render } = require("ink");

const SlowdanceUi = importJsx("./ui");

class Slowdance {
    constructor(options) {
        const { onExit } = options || {};
        this._onExit = onExit;
        this._promises = [];
        this._render = throttle(this._doRender.bind(this), 100);
    }

    _doRender() {
        render(
            <SlowdanceUi
                promises={this._promises}
                onExit={() => {
                    if (this._onExit) {
                        this._onExit();
                    }
                }}
            />
        );
    }

    wrapPromise(
        promise,
        { label, labelError = false, labelResult = (x) => x } = {}
    ) {
        const promiseState = {
            labelError,
            labelResult,
            label,
            status: "pending",
        };
        this._promises.push(promiseState);
        this._doRender();
        return promise
            .catch((err) => {
                promiseState.status = "rejected";
                promiseState.error = err;
                this._doRender();
                throw err;
            })
            .then((result) => {
                promiseState.status = "resolved";
                promiseState.result = result;
                this._doRender();
                return result;
            });
    }

    start() {
        this._doRender();
    }
}

module.exports = { Slowdance };
