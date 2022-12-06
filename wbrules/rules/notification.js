var contacts = require("privateContacts");

defineRule("no_voltage_temperature_email_notification", {
  when: cron("@hourly"),
  then: function () {
    if (dev["voltageControl"]["hasFullVoltage"]) {
      return;
    }
    var t1st = dev["wb-msw-v3_32/Temperature"];
    var t2nd = dev["wb-msw-v3_35/Temperature"];
    var t1_in = dev["circle_first_floor/Обратка"];
    var t2_in = dev["circle_second_floor/Обратка"];
    for (var i = 0; i < contacts.myEmails.length; i ++ ) {
      Notify.sendEmail(contacts.myEmails[i], "House hourly temperature report", "Ванная первый этаж: {}\nВанная второй этаж: {}\nКонтур отопления первый этаж: {}\nКонтур отопления второй этаж: {}".format(t1st, t2nd, t1_in, t2_in));
    }
  }
});

defineRule("no_voltage_temperature_sms_notification", {
  when: cron("@every 6h"),
  then: function () {
    if (dev["voltageControl"]["hasFullVoltage"]) {
      return;
    }
    var t1st = dev["wb-msw-v3_32/Temperature"];
    var t2nd = dev["wb-msw-v3_35/Temperature"];
    var t1_in = dev["circle_first_floor/Обратка"];
    var t2_in = dev["circle_second_floor/Обратка"];
    for (var i = 0; i < contacts.myPhones.length; i ++ ) {
      Notify.sendSMS(contacts.myPhones[i], "1st fl: {}, 2nd fl: {}, Circle 1st: {}, Circle 2nd: {}".format(t1st, t2nd, t1_in, t2_in));
    }
  },
});

