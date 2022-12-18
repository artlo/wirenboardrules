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

  var voltage_params = controller.hasInputVoltage();
  dev[controllerDeviceID]["hasFullVoltage"] = voltage_params["has_full_voltage"];

  defineRule("full_voltage_changed_rule", {
    asSoonAs: function () {
      return controller.hasInputVoltage()["full_voltage"];
    },
    then: function (newValue, devName, cellName) {
      var ts = Date.now();
      voltageStorage["has_voltage"] = newValue;
      controller.has_voltage = newValue;
      var date = new Date(0);
      dev[controllerDeviceID]["hasFullVoltage"] = newValue;
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

baseController.hasInputVoltage = function () {
  var has_any_phase_voltage = false;
  var has_full_voltage = true;
  var has_input_voltage = true;
  var all_devices = [this.phase_one_device_id, this.phase_two_device_id, this.phase_three_device_id];
  for (var i = 0; i < all_devices.length; i++) {
    var v = dev[all_devices[i]];
    if (v < 190) {
      has_full_voltage = false;
    }
    if (v < 100) {
      has_input_voltage = false;
    } else {
      has_any_phase_voltage = true;
    }
  }
  return {has_full_voltage: has_full_voltage, has_any_phase_voltage: has_any_phase_voltage, has_input_voltage: has_input_voltage}
}

exports.VoltageController = function () {
  return initController("voltageControl", devices.voltage.phaseOne, devices.voltage.phaseTwo, devices.voltage.phaseThree);
}
