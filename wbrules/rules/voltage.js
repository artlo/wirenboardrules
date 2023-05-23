var contacts = require("privateContacts");
var voltage = require("voltage");

var oneMinute = 60 * 1000;

var controller = voltage.VoltageController();

defineRule("notify_voltage_disabled", {
  asSoonAs: function () {
    return !dev["voltageControl/hasFullVoltage"] && (Date.now() - controller.voltage_disables_at) > 30 * oneMinute;
  },
  then: function () {
    log.info("notify about voltage absence");
    var msg = "Voltage disables at {}".format(dev[controller.device_id]["lastTimeVoltageDisabled"]);
    for (var i = 0; i < contacts.myPhones.length; i++) {
      Notify.sendSMS(contacts.myPhones[i], msg);
    }
    var t1st = dev["wb-msw-v3_32/Temperature"];
    var t2nd = dev["wb-msw-v3_35/Temperature"];
    var t1_in = dev["circle_first_floor/Обратка"];
    var t2_in = dev["circle_second_floor/Обратка"];
    var emailMsg = "{}\n Температура Ванная первый этаж: {}\nТемпература ванная второй этаж: {}\nТемператру контуров температуры: {}, {}".format(msg, t1st, t2nd, t1_in, t2_in);
    for (var i = 0; i < contacts.myEmails.length; i++) {
      Notify.sendEmail(contacts.myEmails[i], "Voltage is disabled", emailMsg);
    }
  },
});
