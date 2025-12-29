var devices = require("devices");

defineVirtualDevice("garage_door", {
    "title": "Гаражные ворота",
    cells: {
        "enabled": {
            title: "Открыть/Закрыть",
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

defineVirtualDevice("porch_ligths",{
  "title": "Полсветка крыльца",
  cells: {
    "enabled": {
      title: "Включено",
      type: "switch",
      value: false
    }
  },
});

defineRule({
  whenChanged: "porch_ligths/enabled",
  then: function name(newValue, devName, cellName) {
    log.warning("porch", newValue);
    if (newValue) {
    publish("zigbee2mqtt/" + devices.garage.porch_lighting + "/set", JSON.stringify({state_left: "ON"}),2, false)
    } else {
      publish("zigbee2mqtt/" + devices.garage.porch_lighting + "/set", JSON.stringify({state_left: "OFF"}),2, false)
    }
  }
});

defineRule({
  whenChanged: devices.garage.porch_lighting + "/state_left",
  then: function name(newValue, devName, cellName) {
    var status = false;
    if (newValue == "ON") {
      status = true;
    }
    if (status != dev["porch_ligths/enabled"]) {
      publish("zigbee2mqtt/" + devices.garage.porch_lighting + "/set", JSON.stringify({state_left: "OFF", state_right: "OFF"}),2, false)
    }
  }
});

defineRule({
    whenChanged: "garage_door/enabled",
    then: function (newValue, devName, cellName) {
        dev[devices.garage.doorButton] = true;
        setTimeout(function () {
            dev[devices.garage.doorButton] = false;
        }, 1000);
    }
});

defineRule({
    when: function() {
        return dev[devices.garage.doorSensor] > 1 || dev[devices.garage.doorSensor] < 1
    },
    then: function(newValue, devName, cellName) {
        if (newValue > 1) {
            dev["garage_door/state"] = 2
        } else {
            dev["garage_door/state"] = 1
        }
    }
});
