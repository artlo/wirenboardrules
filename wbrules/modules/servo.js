var maxPosition = 10;
var minPosition = 0;
var oneMinute = 60 * 1000;

var baseServo = {};

function getServoPositionDeviceID() {
  return this.deviceID + "/position";
};

Object.defineProperty(baseServo, 'positionCellID', { get: getServoPositionDeviceID
                                                    , configurable: false
                                                    , enumerable:   true });

baseServo.changePosition = function(newValue) {
  log("change position triggerred", this.deviceID, "new value", newValue, "current value", this.position);
  if (this.inWork || !dev["voltageControl/hasFullVoltage"]) {
    if (this.inWork) {
      log.warning("servo_working_now", this.deviceID);
    } else {
      log.warning("no_power_for_moving_servo", this.deviceID)
    }
    dev[this.positionCellID] = this.position;
    return;
  }
  var previousValue = this.position;
  var relayControlID = "";
  var difference = 0;

  if (newValue > previousValue) {
    relayControlID = this.addControlID;
    difference = newValue - previousValue;
  } else {
    relayControlID = this.subControlID;
    difference = previousValue - newValue;
  }
  if (difference == 0) {
    return;
  }
  this.position = newValue;

  // It's needed to update virtual device position when regulation is performed by direct command: change position
  // it will cause rule run, but nothing will change since the new position and previous position remains unchanged
  dev[this.positionCellID] = newValue;
  dev[this.deviceID]["status"] = "In work";
  log.info("moving_servo_start", this.deviceID, "relay", relayControlID, "difference", difference);
  dev[relayControlID] = true;
  var servo = this;
  this.inWork = this;
  setTimeout(function (){
    log.info("moving_servo_finish", servo.deviceID, "relay", relayControlID);
    servo.inWork = false;
    dev[servo.deviceID]["status"] = "Idle";
    dev[relayControlID] = false;
  }, difference * 2 * oneMinute / maxPosition); // full time opening is 120 seconds
};

baseServo.add = function(count) {
  var possible_add = maxPosition - dev[this.positionCellID];
  var add_count = 0;
  if (count <= possible_add) {
    add_count = count;
  } else {
    if (possible_add > 0) {
      add_count = possible_add;
    } else {
      return false
    }
  }
  this.changePosition(dev[this.positionCellID] + add_count);
  return true;
};

baseServo.sub = function(full) {
  if (full) {
    log.info("close servo", this.deviceID)
    this.changePosition(0);
    return
  }

  if (dev[this.positionCellID] > minPosition) {
    this.changePosition(dev[this.positionCellID] - 1);
    return true;
  }
  return false
};

baseServo.createVirtualDevice = function(title) {
  if (this.deviceCreated) {
    log.warning("trying to create device second time", this.deviceID);
    return;
  }

  defineVirtualDevice(this.deviceID, {
      title: title,
      cells: {
        "position": {
          title: "Позиция",
          type: "range",
          value: 1,
          max: maxPosition - 1,
          min: minPosition
        },
        "status": {
          title: "Статус",
          type: "text",
          value: "Idle",
        },
      }
  });

  this.position = dev[this.deviceID]["position"];
  log("initiate servo", this.deviceID, "at position", this.position);

  var that = this;
  defineRule("rule_" + this.deviceID, {
    when: function () {
      return dev[that.positionCellID] != that.position;
    },
    then: function(newValue, devName, cellName) {
      that.changePosition(newValue);
    }
  });

  this.deviceCreated = true;
}

exports.newServo = function(deviceID, addControlID, subControlID) {
  var servo = Object.create(baseServo);
  servo.deviceID = "servo_" + deviceID;
  servo.addControlID = addControlID;
  servo.subControlID = subControlID;
  servo.position = 0;
  servo.deviceCreated = false;
  servo.inWork = false;
  return servo;
}

