var devices = require("devices")

var baseController = {}

var oneMinute = 60 * 1000;
var oneHour = 60 * oneMinute;

var voltageStorage = new PersistentStorage("voltage_storage", {global: true});

function initController(controllerDeviceID, phaseOneDeviceID, phaseTwoDeviceID, phaseThreeDeviceID) {
  var controller = Object.create(baseController);
  controller.device_id = controllerDeviceID;
  controller.phase_one_device_id = phaseOneDeviceID;
  controller.phase_two_device_id = phaseTwoDeviceID;
  controller.phase_three_device_id = phaseThreeDeviceID;
  controller.has_phase_one = dev[phaseOneDeviceID] > 190;
  controller.has_phase_two = dev[phaseTwoDeviceID] > 190;
  controller.has_phase_three = dev[phaseThreeDeviceID] > 190;
  if (voltageStorage["ts_voltage_disabled"] === undefined) {
    controller.voltage_disables_at = 0;
  } else {
    controller.voltage_disables_at = voltageStorage["ts_voltage_disabled"];
  }

  defineVirtualDevice(controllerDeviceID, {
    title: "Контроль входного напряжения",
    cells: {
      lastTimeVoltageDisabled: {
        title: "Время последнего отключения напряжения",
        type: "text",
        value: "",
      },
      lastTimeVoltageEnabled: {
        title: "Время последнего включения напряжения",
        type: "text",
        value: "",
      },
      lastTimeVoltageAbsenceDuration: {
        title: "Продолжительность последнего отключения",
        type: "text",
        value: "",
      },
      hasFullVoltage: {
        title: "Наличие напряжения в доме",
        type: "switch",
        value: 0,
      },
    },
  });

  dev[controllerDeviceID]["hasFullVoltage"] = controller.hasFullVoltage(dev[phaseOneDeviceID], controller.has_phase_two, controller.has_phase_three);

  defineRule(controllerDeviceID + "_phaseOne_changed", {
    whenChanged: controller.phase_one_device_id,
    then: function (newValue, devName, cellName) {
      dev[controllerDeviceID]["hasFullVoltage"] = controller.hasFullVoltage(newValue, controller.has_phase_two, controller.has_phase_three)
      controller.has_phase_one = newValue > 190;
    }
  });

  defineRule(controllerDeviceID + "_phaseTwo_changed", {
    whenChanged: controller.phase_two_device_id,
    then: function (newValue, devName, cellName) {
      dev[controllerDeviceID]["hasFullVoltage"] = controller.hasFullVoltage(newValue, controller.has_phase_one, controller.has_phase_three)
      controller.has_phase_two = newValue > 190;
    }
  });

  defineRule(controllerDeviceID + "_phaseThree_changed", {
    whenChanged: controller.phase_three_device_id,
    then: function (newValue, devName, cellName) {
      dev[controllerDeviceID]["hasFullVoltage"] = controller.hasFullVoltage(newValue, controller.has_phase_one, controller.has_phase_two)
      controller.has_phase_three = newValue > 190;
    }
  });

  defineRule("full_voltage_changed_rule", {
    whenChanged: "voltageControl/hasFullVoltage",
    then: function (newValue, devName, cellName) {
      var ts = Date.now();
      voltageStorage["has_voltage"] = newValue;
      controller.has_voltage = newValue;
      var date = new Date(0);
      date.setMilliseconds(ts);
      if (!newValue) {
        controller.voltage_disables_at = ts;
        voltageStorage["ts_voltage_disabled"] = ts;
        dev[controllerDeviceID]["lastTimeVoltageDisabled"] = date.toUTCString();
      } else {
        dev[controllerDeviceID]["lastTimeVoltageEnabled"] = date.toUTCString();
        var duration = ts - voltageStorage["ts_voltage_disabled"];
        var hours = Math.round(duration / oneHour);
        var minutes = Math.round((duration - hours * oneHour) / oneMinute);
        dev[controllerDeviceID]["lastTimeVoltageAbsenceDuration"] = "{}h {}m".format(hours, minutes);
      }
    }
  });
  return controller;
}

baseController.hasFullVoltage = function (phase_value, another_phase_1, another_phase_2) {
  return phase_value > 190 && another_phase_1 && another_phase_2;
}

exports.VoltageController = function () {
  return initController("voltageControl", devices.voltage.phaseOne, devices.voltage.phaseTwo, devices.voltage.phaseThree);
}
