var oneMinute = 60 * 1000;

var servoCellsDescription = {
    "position": {
        "name": "Позиция",
        "type": "range",
        "max": 10,
        "value": 1,
    },
    "previous_value": {
        "type": "value",
        "readonly": true,
        "value": 0,
    },
};

// -------------- Серво-приводы ------------------
var servo = {
    change: function (name, newValue) {
        switch (name){
            case this.firstFl.deviceID:
                this.firstFl.changePosition(newValue);
                break;
            case this.secondFl.deviceID:
                this.secondFl.changePosition(newValue);
                break;
            default:
                log.error("unknown servo device", name);
        }
    },
    changePosition: function(servo, newValue) {
        var previousValue = dev[servo.deviceID]["previous_value"];
        var controlID = "";
        var difference = 0;
        if (newValue > previousValue) {
            controlID = servo.addControlID;
            difference = newValue - previousValue;
        } else {
            controlID = servo.subControlID;
            difference = previousValue - newValue;
        }
        log.info("move_servo_start", servo.deviceID, "control", controlID, "difference", difference);
        dev[controlID] = true;
        setTimeout(function (){
            log.info("move_servo_finish", servo.deviceID, "control", controlID, "difference");
            dev[controlID] = false;
        }, difference * 2 * oneMinute); // время полного открытия 120 секунд, открытие на одну позицию занимает 9 секунд
        dev[servo.deviceID]["previous_value"] = newValue;
    },
    firstFl: {
        deviceID: "heating_servo_1st",
        addControlID: "wb-gpio/EXT1_R3A1",
        subControlID: "wb-gpio/EXT1_R3A2",
        changePosition: function (newValue) {
            servo.changePosition(this, newValue)
        },
    },
    secondFl: {
        deviceID: "heating_servo_2nd",
        addControlID: "wb-gpio/EXT1_R3A3",
        subControlID: "wb-gpio/EXT1_R3A4",
        changePosition: function (newValue) {
            servo.changePosition(this, newValue)
        },
    }
};

function addServoPosition(servo) {
    if (dev[servo.deviceID]["position"] < 9) {
        dev[servo.deviceID]["position"] += 1;
        return true;
    }
    return false
}

function subServoPosition(servo, full) {
    if (full) {
        log.info("close servo", servo.deviceID)
        dev[servo.deviceID]["position"] = 0;
        return
    }

    if (dev[servo.deviceID]["position"] > 0) {
        dev[servo.deviceID]["position"] -= 1;
        return true;
    }
    return false
}

defineVirtualDevice(servo.firstFl.deviceID, {
    title: "Трехходовой клапан 1 этаж",
    cells: servoCellsDescription,
});

defineVirtualDevice(servo.secondFl.deviceID, {
    title: "Трехходовой клапан 2 этаж",
    cells: servoCellsDescription,
});

function servoPositionChanged(newValue, devName, cellName) {
    servo.change(devName, newValue);
}

defineRule("servo_1st_change", {
    whenChanged: servo.firstFl.deviceID + "/position",
    then: servoPositionChanged,
});

defineRule("servo_2nd_change", {
    whenChanged: servo.secondFl.deviceID + "/position",
    then: servoPositionChanged,
});
// -------------- Серво-приводы ------------------

// -------------- Тепловые контуры ---------------
var tempAccuracy = 3.5;
var circles = {
    heatingEnabledChanged: function(circle, newValue) {
        if (newValue) {
            if (dev[circle.deviceID]["Minimum_IN_temp"] < 30) {
                dev[circle.deviceID]["Minimum_IN_temp"] = 30;
            }
            this.checkOrIncreaseMinimumTemp(circle);
        } else {
            subServoPosition(circle.servo, true);
            dev[circle.deviceID]["Minimum_IN_temp"] = 0;
        }
    },
    heatingMinTempChanged: function(circle, newValue) {
        if (newValue < 30) {
            dev[circle.deviceID]["enabled"] = false;
            return;
        }
        if (!dev[circle.deviceID]["enabled"]) {
            return;
        }
        this.checkOrIncreaseMinimumTemp(circle);
    },
    checkOrIncreaseMinimumTemp: function(circle) {
        var minimumTemp = dev[circle.deviceID]["Minimum_IN_temp"];

        log.info("check minimum temp for", circle.deviceID, "current_temp", dev["wb-w1"][circle.tempSensorInID]);
        if (dev["wb-w1"][circle.tempSensorInID] > minimumTemp) {
            log.info("minimum temp is achieved for", circle.deviceID);
            timers[circle.minimumINTempTicker].stop();
            return;
        }
        addServoPosition(circle.servo);
        startTicker(circle.minimumINTempTicker, 5 * oneMinute);
    },
    isCircleTempDifferenceIncreased: function (circle) {
        return dev["wb-1b"][circle.tempSensorOutID] - dev["wb-1b"][circle.tempSensorInID] > dev[circle.deviceID]["Temperature_Difference"] + tempAccuracy;
    },
    isCircleTempDifferenceDecreased: function (circle) {
        return dev["wb-1b"][circle.tempSensorOutID] - dev["wb-1b"][circle.tempSensorInID] < dev[circle.deviceID]["Temperature_Difference"] - tempAccuracy;
    },
    firstFl: {
        deviceID: "heating_circle_1st_fl",
        tempSensorInID: "28-00000d69284f",
        tempSensorOutID: "28-00000d69284f",
        minimumINTempTicker: "return_water_2nd_fl_timer",
        servo: servo.firstFl,
    },
    secondFl: {
        deviceID: "heating_circle_2nd_fl",
        tempSensorInID: "XXXX2",
        tempSensorOutID: "YYYY2",
        minimumINTempTicker: "return_water_1st_fl_timer",
        servo: servo.secondFl,
    },
};

var heatingCycleCells = {
    "enabled": {
        "type": "switch",
        "value": false,
    },
    "Temperature_Difference": {
        "type": "range",
        "max": 40,
        "value": 20
    },
    "Minimum_IN_temp": {
        "type": "range",
        "max": 60,
        "value": 30
    },
};

defineVirtualDevice(circles.firstFl.deviceID, {
    "title": "Обогрев первый этаж",
    cells: heatingCycleCells,
});

defineVirtualDevice(circles.secondFl.deviceID, {
    "title": "Обогрев второй этаж",
    cells: heatingCycleCells,
});

defineRule("heating_1st_floor/enabled", {
    whenChanged: circles.firstFl.deviceID + "/enabled",
    then: function (newValue, devName, cellName) {
        circles.heatingEnabledChanged(circles.firstFl, newValue);
    },
});

defineRule("heating_2nd_floor/enabled", {
    whenChanged: circles.secondFl.deviceID + "/enabled",
    then: function (newValue, devName, cellName) {
        circles.heatingEnabledChanged(circles.secondFl, newValue);
    },
});

defineRule("heating_1st_floor/Minimum_IN_temp", {
    whenChanged: circles.firstFl.deviceID + "/Minimum_IN_temp",
    then: function (newValue, devName, cellName) {
        circles.heatingMinTempChanged(circles.firstFl, newValue);
    },
});

defineRule("heating_2nd_floor/Minimum_IN_temp", {
    whenChanged: circles.secondFl.deviceID + "/Minimum_IN_temp",
    then: function (newValue, devName, cellName) {
        circles.heatingMinTempChanged(circles.secondFl, newValue);
    },
});

defineRule("check_min_temp_1st_fl_timer", {
    when: function () {timers[circles.firstFl.minimumINTempTicker].firing;},
    then: function () {
        circles.checkOrIncreaseMinimumTemp(circles.firstFl);
    },
});

defineRule("check_min_temp_2nd_fl_timer", {
    when: function () {timers[circles.secondFl.minimumINTempTicker].firing;},
    then: function () {
        circles.checkOrIncreaseMinimumTemp(circles.secondFl);
    },
});

function addServoDueTempDifference(circle) {
    log.info("add_servo_due_for_circle", circle.deviceID, "out_temp", dev["wb-w1"][circle.tempSensorOutID], "in_temp", dev["wb-1b"][circle.tempSensorInID]);
    addServoPosition(circle.servo);
}
defineRule("first_fl_circle_temp_range_exceeded", {
    when: function() {circles.isCircleTempDifferenceIncreased(circles.firstFl)},
    then: function (){
        addServoDueTempDifference(circles.firstFl);
    },
});
defineRule("second_fl_circle_temp_range_exceeded", {
    when: function() {circles.isCircleTempDifferenceIncreased(circles.secondFl)},
    then: function (){
        addServoDueTempDifference(circles.secondFl);
    },
});
function subServoDueTempDifference(circle) {
    log.info("sub_servo_due_for_circle", circle.deviceID, "out_temp", dev["wb-w1"][circle.tempSensorOutID], "in_temp", dev["wb-1b"][circle.tempSensorInID]);
    subServoPosition(circle.servo);
}
defineRule("first_fl_circle_temp_in_range", {
    when: function() {circles.isCircleTempDifferenceDecreased(circles.firstFl)},
    then: function (){
        subServoDueTempDifference(circles.firstFl)
    },
});
defineRule("second_fl_circle_temp_in_range", {
    when: function() {circles.isCircleTempDifferenceDecreased(circles.secondFl)},
    then: function (){
        subServoDueTempDifference(circles.secondFl);
    },
});
// -------------- Тепловые контуры ---------------
