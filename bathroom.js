var maxHumidity = 65;
var oneMinute = 60 * 1000;

export.firstFloorBathroom = var {
    name: "First Floor",
    conditionDetectorDeviceID: "!!!!!!! DEFINE MODBUS ADDRESS",
    fanRelayID: "K1",
    stopFanTimer: "first_floor_bathroom_fun_pending_timer"
};

export.secondFloorBathroom = var {
    name: "Second Floor",
    conditionDetectorDeviceID: "!!!!!!! DEFINE MODBUS ADDRESS",
    fanRelayID: "K2",
    pendingFanTimer: "second_floor_bathroom_fun_pending_timer"
};

function getHumidity(bathRoom) {
    return dev["wb-msw-v3" + bathRoom.conditionDetectorDeviceID + "/Humidity"]
};

export.getTemperature = function (bathRoom) {
    return dev["wb-msw-v3" + bathRoom.conditionDetectorDeviceID + "/Temperature"]
};

function enableBathRoomFan(bathRoom) {
    if (!timers[bathRoom.pendingFanTimer].firing) {
        return;
    }
    log.Info("bathroom fan runs", bathRoom.name, "humidity", getHumidity(bathRoom), "temperature", getTemperature(bathRoom));
    var deviceID = "wb-mr6cu_11/"+bathRoom.relayID;
    dev[deviceID] = true;
    setTimeout(function() {
        dev[deviceID] = false;
        startTimer(bathRoom.pendingFanTimer, 30 * oneMinute);
        log.info("bathroom fan stops", bathRoom.name, "humidity", getHumidity(bathRoom), "temperature", getTemperature(bathRoom));
    }, 10 * oneMinute);
};

function bathRoomHumidityExceeded(bathRoom) {
    return getHumidity(bathRoom) > maxHumidity;
};

defineRule("first_fl_bath_room_humidity", {
    when: function() {
        return bathRoomHumidityExceeded(firstFloorBathroom);
    },
    then: function() {
        enableBathRoomFan(firstFloorBathroom);
    },
});

defineRule("second_fl_bath_room_humidity", {
    when: function() {
        return bathRoomHumidityExceeded(secondFloorBathroom);
    },
    then: function() {
        enableBathRoomFan(secondFloorBathroom);
    },
});
