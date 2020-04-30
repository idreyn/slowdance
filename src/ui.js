const React = require("react");
const { Text, Color, Box, useInput, useApp } = require("ink");
const { default: TextInput } = require("ink-text-input");
const useStdoutDimensions = require("ink-use-stdout-dimensions");

const { useEffect, useState } = React;

const getShownRange = ({
    pointer,
    totalElements,
    scrollHeight,
    scrollCutoff,
}) => {
    const remainingScrollHeight = scrollHeight - scrollCutoff;
    if (pointer < scrollCutoff) {
        return [0, Math.min(totalElements, scrollHeight)];
    } else if (pointer > totalElements - remainingScrollHeight) {
        const startIndex = Math.max(0, totalElements - scrollHeight + 1);
        return [startIndex, totalElements];
    }
    return [pointer - scrollCutoff, pointer + (scrollHeight - scrollCutoff)];
};

const getColorForStatus = (status) => {
    if (status === "resolved") {
        return "green";
    } else if (status === "rejected") {
        return "red";
    }
    return null;
};

const filterPromises = ({ promises, mode, filterString }) => {
    if (mode === "pending" || mode === "resolved" || mode === "rejected") {
        return promises.filter((p) => p.status === mode);
    } else if (mode === "filter") {
        return promises.filter((p) =>
            p.label.toLowerCase().includes(filterString.toLowerCase())
        );
    }
    return promises;
};

const ControlBarElement = (props) => {
    const {
        activeBgColor = "steelblue",
        activeColor = "black",
        triggerKey,
        label,
        restLabel = "",
        active,
        last,
        onTrigger,
    } = props;

    useInput((input, key) => {
        if (onTrigger) {
            if (input === triggerKey || (triggerKey == "esc" && key.escape)) {
                onTrigger();
            }
        }
    });

    const textColor = active && activeColor;

    return (
        <Text>
            {" "}
            <Color bgKeyword={active && activeBgColor} keyword={textColor}>
                ({triggerKey}) {label}
            </Color>
            {restLabel}
            {!last && " |"}
        </Text>
    );
};

const Slowdance = ({ promises, onExit } = {}) => {
    const [rows, columns] = useStdoutDimensions();
    const { exit } = useApp();
    const [pointer, setPointer] = useState(0);
    const [mode, setMode] = useState("all");
    const [filterString, setFilterString] = useState("");
    const [isScrollLocked, setScrollLocked] = useState(false);
    const [modeBeforeFiltering, setModeBeforeFiltering] = useState(mode);

    const totalHeight = columns - 1;
    const scrollHeight = totalHeight - 1;
    const isFiltering = mode === "filter";
    const filteredPromises = filterPromises({ promises, mode, filterString });

    const [firstPromiseIndex, lastPromiseIndex] = getShownRange({
        pointer,
        totalElements: filteredPromises.length - 1,
        scrollHeight,
        scrollCutoff: Math.floor(scrollHeight / 2),
    });
    const lineNumberPadding = lastPromiseIndex.toString().length;
    const shownPromises = filteredPromises.slice(
        firstPromiseIndex,
        lastPromiseIndex + 1
    );

    useEffect(() => {
        if (!isScrollLocked) {
            setPointer(filteredPromises.length - 1);
        }
    }, [filteredPromises.length]);

    useInput((input, key) => {
        const decrementPointer = () => setPointer(Math.max(pointer - 1, 0));
        const incrementPointer = () =>
            setPointer(Math.min(pointer + 1, filteredPromises.length - 1));
        if (!isFiltering) {
            if (input === "k" || key.upArrow) {
                decrementPointer();
            }
            if (input === "j" || key.downArrow) {
                incrementPointer();
            }
            if (input === "g") {
                setPointer(key.shift ? filteredPromises.length - 1 : 0);
            }
            if (input === "q") {
                exit();
                onExit();
            }
        }
        if (key.upArrow) {
            decrementPointer();
        }
        if (key.downArrow) {
            incrementPointer();
        }
    });

    const handleChangeMode = (mode) => {
        setMode(mode);
        setPointer(0);
    };

    const handleToggleFilter = () => {
        if (isFiltering) {
            setMode(modeBeforeFiltering);
        } else if (mode !== "filter") {
            setModeBeforeFiltering(mode);
            handleChangeMode("filter");
            setFilterString("");
        }
    };

    const renderStatusText = () => {
        return `Showing ${filteredPromises.length} of ${promises.length}`;
    };

    const renderPromise = (promise, index) => {
        const { status, label, value } = promise;
        const pointed = index === pointer;
        return (
            <Text key={index}>
                <Color
                    bgKeyword={pointed && "steelblue"}
                    keyword={pointed && "black"}
                >
                    {pointed ? ">" : " "}
                    {index.toString().padStart(lineNumberPadding)}
                </Color>{" "}
                <Color keyword={getColorForStatus(status)}>
                    [{status}] {label} {value}
                </Color>
            </Text>
        );
    };

    return (
        <Box width={rows} height={totalHeight} flexDirection="column">
            <Box width="100%" flexGrow={1} height={5} flexDirection="column">
                {shownPromises.map((promise, index) =>
                    renderPromise(promise, index + firstPromiseIndex)
                )}
            </Box>
            <Box width="100%">
                {renderStatusText()} |
                {!isFiltering && (
                    <>
                        <ControlBarElement
                            triggerKey="a"
                            active={mode === "all"}
                            onTrigger={() => setMode("all")}
                            label="Show all"
                        />

                        <ControlBarElement
                            triggerKey="p"
                            active={mode === "pending"}
                            onTrigger={() => handleChangeMode("pending")}
                            label="Show pending"
                        />

                        <ControlBarElement
                            triggerKey="r"
                            active={mode === "resolved"}
                            onTrigger={() => handleChangeMode("resolved")}
                            label="Show resolved"
                        />

                        <ControlBarElement
                            triggerKey="e"
                            active={mode === "rejected"}
                            onTrigger={() => handleChangeMode("rejected")}
                            label="Show rejected"
                        />
                        <ControlBarElement
                            triggerKey="l"
                            onTrigger={() => setScrollLocked(!isScrollLocked)}
                            label={isScrollLocked ? "unlock" : "lock"}
                        />
                    </>
                )}
                <ControlBarElement
                    triggerKey={isFiltering ? "esc" : "f"}
                    label="Filter"
                    last
                    active={isFiltering}
                    onTrigger={handleToggleFilter}
                    restLabel={
                        isFiltering && (
                            <>
                                {": "}
                                <TextInput
                                    onChange={setFilterString}
                                    value={filterString}
                                />
                            </>
                        )
                    }
                />
            </Box>
        </Box>
    );
};

module.exports = Slowdance;
