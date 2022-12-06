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

  if (dev[this.deviceID]["power"] == percent && !forceRun) {
    return;
  }

  var pwmPumpInput = 0;
  if (percent == 0) {
    pwmPumpInput = pwmStop;
  } else {
    pwmPumpInput = pwmMinPower - percent * (pwmMinPower - pwmMaxPower) / 100.0;
  }

  dev[this.deviceID]["power"] = percent;
  var wbPWMOutput = pwmPumpInput * wbPWMOutputMax / 100.0;
  log.info("set pwm", this.deviceID, "pump pwm percent", pwmPumpInput, "wb pwm width", wbPWMOutput);
  dev[this.wbPWMDeviceID] = wbPWMOutput;
}

// stop PWM, pump will use the manual mode set on operating panel on a pump
basePump.off = function (){
  log.info("pump is switched to manual mode", this.deviceID);
  dev[this.wbPWMDeviceID] = 0;
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
};
