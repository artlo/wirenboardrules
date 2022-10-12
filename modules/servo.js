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

  log.info("moving_servo_start", this.deviceID, "relay", relayControlID, "difference", difference);
  dev[relayControlID] = true;
  var servo = this;
  setTimeout(function (){
    log.info("moving_servo_finish", servo.deviceID, "relay", relayControlID);
    dev[relayControlID] = false;
  }, difference * 2 * oneMinute / maxPosition); // время полного открытия 120 секунд
};

baseServo.add = function() {
  if (dev[this.positionCellID] < maxPosition) {
    this.changePosition(dev[this.positionCellID] + 1);
    return true;
  }
  return false
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
      }
  });

  this.position = dev[this.deviceID]["position"];
  log("initiate servo", this.deviceID, "at position", this.position);

  var that = this;
  defineRule("rule_" + this.deviceID, {
    whenChanged: that.positionCellID,
    then: function(newValue, devName, cellName) {
      log("rule got", that.deviceID);
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
  return servo;
}

