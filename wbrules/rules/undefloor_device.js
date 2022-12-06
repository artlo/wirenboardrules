var devices = require("devices");

function dewPoint(t, h) {
  var a = 17.27;
  var b = 237.7;

  var l = Math.log(h/100);
  var T = a * t / (b + t);
  return parseFloat((b * (T + l) / (a - (T + l))).toFixed(2));
}

defineVirtualDevice("undefloor_dew_point_temperature", {
  title: "Температура точки росы подполом",
  cells: {
    "temperature": {
      title: {
        "ru": "Температура точки росы",
      },
      type: "temperature",
      units: "deg C",
      value: 0,
    },
  },
});

defineRule("undefloor_temperature_change", {
  whenChanged: devices.undefloor.temperature,
  then: function (newValue, devName, cellName)  {
    dev["undefloor_dew_point_temperature"]["temperature"] = dewPoint(newValue, dev[devices.undefloor.humidity]);
  },
});
