var oneMinute = 60 * 1000;

var tempAccuracy = 2.5;
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
    this.checkConditions();
  } else {
    timers[this.timerID].stop();
    this.servo.sub(true);
  }
}

baseCircuit.checkConditions = function() {
  log.debug("checking conditions", this.deviceID);
  if (!this.isEnabled) {
    return;
  }
  if (!timers[this.timerID].firing) {
     return;
  }

  var addLog = false;
  if (this.isCircleTempDifferenceIncreased() || dev[this.tempSensorInID] < minTemperatureInCircle) {
    this.servo.add();
    addLog = true;
  } else if (this.isCircleTempDifferenceDecreased()) {
    this.servo.sub(false);
    addLog = true;
  }
  if (addLog) {
    log.info("starting temperature regulation", "device_id", this.deviceID, "out_temperature", dev[this.tempSensorOutID], "in_temperature", dev[this.tempSensorInID]);
  }
  startTicker(this.timerID, 5 * oneMinute);
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

  var circuit = this;
  defineRule("rule_"+this.deviceID + "_enabled", {
    whenChanged: this.deviceID+"/enabled",
    then: function (newValue, devName, cellName) {
      circuit.changeEnable(newValue);
    }
  });

  defineRule("rule_timer_" + this.deviceID, {
    asSoonAs: function (){timers[circuit.timerID].firing;},
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
