var basePump = {};

var pwmMaxPower = 5;
var pwmMinPower = 89;
var pwmStop = 98;
var wbPWMOutputMax = 10000;

// percent of full power 0 - stop; 100 - full power
// forceRun - run pump if it was Disabled
basePump.setPower = function (percent, forceRun) {
  if (!dev[this.deviceID]["enabled"] && !forceRun) {
    return;
  }

  var pwmPumpInput = 0;
  if (percent == 0) {
    pwmPumpInput = pwmStop;
  } else {
    pwmPumpInput = pwmMinPower - percent * (pwmMinPower - pwmMaxPower) / 100.0;
  }

  var wbPWMOutput = pwmPumpInput * wbPWMOutputMax / 100.0;
  log.info("set pwm", this.deviceID, "pump pwm percent", pwmPumpInput, "wb pwm width", wbPWMOutput);
  dev[this.wbPWMDeviceID] = wbPWMOutput;
}

// stop PWM, pump will use the manual mode set on operating panel on a pump
basePump.off = function (){
  log.info("pump is switched to manual mode", this.deviceID);
  dev[this.wbPWMDeviceID] = 0;
}

basePump.on = function () {
  dev[this.deviceID]["enabled"] = true;
}

// increase Power in 20%
basePump.increase = function () {
  var current_power = dev[this.deviceID]["power"];
  var new_power = 0;
  if (current_power <= 80) {
    new_power = current_power + 20;
  } else {
    new_power = 100;
  }
  dev[this.deviceID]["power"] = new_power;
}

basePump.decrease = function () {
  var current_power = dev[this.deviceID]["power"];
  if (current_power <= 20) {
    log.info("pump power is minimum", this.deviceID);
    return false;
  }
  dev[this.deviceID]["power"] = current_power - 20;
  return true;
}

basePump.createDevice = function (name) {
  defineVirtualDevice(this.deviceID, {
    title: name,
    cells: {
      "enabled": {
        type: "switch",
        value: false,
      },
      "power": {
        title: {
          "ru": "Мощность насоса",
        },
        type: "range",
        max: 100,
        value: 50
      }
    }
  });

  var that = this;
  defineRule("rule_enabled_" + this.deviceID, {
    whenChanged: this.deviceID + "/enabled",
    then: function (newValue, deviceID, cellID) {
      if (newValue) {
        that.setPower(dev[that.deviceID]["power"], true);
      } else {
        that.off();
      }
    }
  });

  defineRule("rule_power_" + this.deviceID, {
    whenChanged: this.deviceID + "/power",
    then: function (newValue, deviceID, cellID) {
      that.setPower(newValue, false);
    }
  });
};

exports.newPump = function (deviceID, wbDeviceID) {
  var pump = Object.create(basePump);
  pump.deviceID = "pump_" + deviceID;
  pump.wbPWMDeviceID = wbDeviceID;
  return pump;
};
