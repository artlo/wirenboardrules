var oneMinute = 60 * 1000;

var tempAccuracy = 1.5;
var minTemperatureInCircle = 40;
var baseCircuit = {};

isEnabledDevice = function () {
  return dev[this.deviceID + "/enabled"];
}

Object.defineProperty(baseCircuit, "isEnabled", { get: isEnabledDevice
                                                 , configurable: false
                                                 , enumerable:   true });

baseCircuit.changeEnable = function (value) {
  if (value) {
    startTicker(this.timerID, 1);
  } else {
    timers[this.timerID].stop();
  }
}

baseCircuit.checkConditions = function() {
  if (!this.isEnabled) {
    return;
  }
  log.info("checking conditions", this.deviceID);

  if (!timers[this.timerID].firing) {
    log.info("time still active", this.deviceID)
    return;
  }

  var addLog = false;
  log.info("conditions", this.deviceID, "out temp", dev[this.tempSensorOutID], "in temp", dev[this.tempSensorInID])

  // if temperature difference more than wish value, it's needed to open servo, because heating needs more power
  // for supporting temperature in circle
  if (this.isCircleTempDifferenceIncreased() || dev[this.tempSensorInID] < minTemperatureInCircle) {
    this.servo.add(2);
    addLog = true;
  // if temperature difference less than wish value, it's needed to close servo, because heating is enough
  // for supporting temperature in circle
  } else if (this.isCircleTempDifferenceDecreased()) {
    this.servo.sub(false);
    addLog = true;
  }
  if (addLog) {
    log.info("starting temperature regulation", "device_id", this.deviceID, "out_temperature", dev[this.tempSensorOutID], "in_temperature", dev[this.tempSensorInID]);
  }
  startTicker(this.timerID, 3 * oneMinute);
}

baseCircuit.isCircleTempDifferenceIncreased = function() {
  return dev[this.tempSensorOutID] - dev[this.tempSensorInID] > dev[this.deviceID]["temperature"] + tempAccuracy;
}

baseCircuit.isCircleTempDifferenceDecreased = function (){
  return dev[this.tempSensorOutID] - dev[this.tempSensorInID] < dev[this.deviceID]["temperature"] - tempAccuracy;
}

baseCircuit.createDevice = function (name) {
  if (this.deviceCreated) {
    log.warning("trying to create device second time", this.deviceID);
    return;
  }

  defineVirtualDevice(this.deviceID, {
    title: name,
    cells: {
      "enabled": {
        type: "switch",
        value: false,
      },
      "temperature": {
        title: {
          "ru": "Разница температур",
        },
        type: "range",
        units: "deg C",
        max: 30,
        value: 15,
        min: 10
      },
      "Подача": {
        type: "temperature",
        value: dev[this.tempSensorOutID]
      },
      "Обратка": {
        type: "temperature",
        value: dev[this.tempSensorInID]
      },
    }
  });

  if (this.isEnabled) {
    this.changeEnable(true);
  };

  var circuit = this;
  defineRule("rule_"+this.deviceID + "_enabled", {
    whenChanged: this.deviceID+"/enabled",
    then: function (newValue, devName, cellName) {
      circuit.changeEnable(newValue);
    }
  });

  defineRule("rule_timer_" + this.deviceID, {
    when: function (){return timers[circuit.timerID].firing;},
    then: function () {circuit.checkConditions();}
  });

  defineRule("rule_" + this.deviceID + "_temp_out", {
    whenChanged: this.tempSensorOutID,
    then: function () {
      dev[circuit.deviceID]["Подача"] = dev[circuit.tempSensorOutID];
    }
  });

  defineRule("rule_" + this.deviceID + "_temp_in", {
    whenChanged: this.tempSensorInID,
    then: function () {
      dev[circuit.deviceID]["Обратка"] = dev[circuit.tempSensorInID];
    }
  });
  this.deviceCreated = true;
}

exports.newCircuit = function (deviceID, servo, tempSensorInID, tempSensorOutID) {
  var circuit = Object.create(baseCircuit);
  circuit.deviceID = "circle_" + deviceID;
  circuit.servo = servo;
  circuit.tempSensorInID = tempSensorInID;
  circuit.tempSensorOutID = tempSensorOutID;
  circuit.timerID = deviceID + "condition_checking_timer";
  circuit.deviceCreated = false;
  return circuit;
}
