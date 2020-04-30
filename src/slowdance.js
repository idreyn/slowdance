const React = require("react");
const { render } = require("ink");
const importJsx = require("import-jsx");

const SlowdanceUi = importJsx("./ui");

class Slowdance {
    constructor({ onExit }) {
        this._onExit = onExit;
        this._promises = [];
    }

    _render() {
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

    wrapPromise(promise, label) {
        const promiseState = { label, status: "pending" };
        this._promises.push(promiseState);
        this._render();
        return promise
            .catch((err) => {
                promiseState.status = "rejected";
                promiseState.error = err;
                this._render();
                throw err;
            })
            .then((value) => {
                promiseState.status = "resolved";
                promiseState.value = value;
                this._render();
                return value;
            });
    }

    start() {
        this._render();
    }
}

module.exports = { Slowdance };
