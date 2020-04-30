require("@babel/register");

const { Slowdance } = require("./src");

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
                            reject();
                        } else {
                            resolve("done");
                        }
                    }, waitTime);
                }),
                `WillReject: ${willReject} WaitTime: ${waitTime}`
            )
            .catch(() => {});
        setTimeout(addPromise, 500 + Math.random() * 1000);
    };

    addPromise();
};

main();
