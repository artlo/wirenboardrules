var devices = require("devices");

defineVirtualDevice("street_gate", {
    "title": "Ворота",
    cells: {
        "open": {
            title: "Открыть",
            type: "pushbutton",
        },
        "close": {
            title: "Закрыть",
            type: "pushbutton",
        },
        "pedestrian": {
            title: "Пешеходный режим",
            type: "pushbutton",
        },
        "state": {
            title: "Состояние двери",
            type: "value",
            value: 1,
            enum: {
                1: {ru: "Закрыто"},
                2: {ru: "Открыто"}
            }
        }
    },
});

defineRule({
    whenChanged: "street_gate/open",
    then: function (newValue, devName, cellName) {
        dev[devices.streetGate.open] = true;
        setTimeout(function () {
            dev[devices.streetGate.open] = false;
        }, 1000);
    }
});

defineRule({
    whenChanged: "street_gate/close",
    then: function (newValue, devName, cellName) {
        dev[devices.streetGate.close] = true;
        setTimeout(function () {
            dev[devices.streetGate.close] = false;
        }, 1000);
    }
});

defineRule({
    whenChanged: "street_gate/pedestrian",
    then: function (newValue, devName, cellName) {
        dev[devices.streetGate.open] = true;
        setTimeout(function () {
            dev[devices.streetGate.open] = false;
        }, 1000);

        // нажать кнопку ручного упарвления для остановки движения ворот
        setTimeout(function () {
            dev[devices.streetGate.sbs] = true;
            setTimeout(function () {
                dev[devices.streetGate.sbs] = false;
            }, 1000);
        }, 5000);
    }
});

