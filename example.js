require("@babel/register");

const Slowdance = require("./src");

const main = () => {
    const slowdance = new Slowdance({
        onExit: () => {
            process.exit(0);
        },
    });
    slowdance.start();

    const addPromise = () => {
        const willReject = Math.random() > 0.5;
        const waitTime = 500 + Math.round(Math.random() * 5000);
        slowdance
            .wrapPromise(
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (willReject) {
                            reject("nope");
                        } else {
                            resolve("yep");
                        }
                    }, waitTime);
                }),
                {
                    label: `WillReject: ${willReject} WaitTime: ${waitTime}`,
                    labelError: (err) => `Error: ${err}`,
                    labelResult: (res) => `Success: ${res}`,
                }
            )
            .catch(() => {});
        setTimeout(addPromise, 500 + Math.random() * 1000);
    };

    addPromise();
};

main();
