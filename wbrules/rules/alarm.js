var temp_emailer_timer = "underfloor_temp_emailer_timer";
var temp_sms_timer = "underfloor_temp_sms_timer";
var dew_point_emailer_timer = "underfloor_dew_point_emailer_timer";
var dew_point_sms_timer = "underfloor_dew_point_sms_timer";
var one_hour = 60 * 60 * 1000;
var contacts = require("privateContacts");
var devices = require("devices")

var alarmTimers = new PersistentStorage("alarms", {global: true});

if (alarmTimers[temp_emailer_timer] === undefined) {
  alarmTimers[temp_emailer_timer] = 0;
}

if (alarmTimers[temp_sms_timer] === undefined) {
  alarmTimers[temp_sms_timer] = 0;
}

if (alarmTimers[dew_point_emailer_timer] === undefined) {
  alarmTimers[dew_point_emailer_timer] = 0;
}

if (alarmTimers[dew_point_sms_timer] === undefined) {
  alarmTimers[dew_point_sms_timer] = 0;
}

defineRule("underfloor_low_temp_alarm", {
  asSoonAs: function () {
    return dev[devices.undefloor.temperature] < 3;
  },
  then: function () {
    var now = Date.now();
    log.warning("undefloor temperature is low", "temperature", dev[devices.undefloor.temperature]);
    if ((now - alarmTimers[temp_emailer_timer]) > 2 * one_hour) {
      for (var i = 0; i < contacts.myEmails.length; i ++) {
        Notify.sendEmail(contacts.myEmails[i], "Underfloor temperature is low", "Underfloor temperature {}".format(dev[devices.undefloor.temperature]));
      }
      alarmTimers[temp_emailer_timer] = now;
    }
    if ((now - alarmTimers[temp_sms_timer]) > 24 * one_hour) {
      for (var i = 0; i < contacts.myPhones.length; i ++) {
        Notify.sendSMS(contacts.myPhones[i], "Underfloor temperature {}".format(dev[devices.undefloor.temperature]));
      }
      alarmTimers[temp_sms_timer] = now;
    }
  },
});

defineRule("underfloor_dew_point_alarm", {
  asSoonAs: function () {
    var t = dev[devices.undefloor.temperature];
    return Math.abs(t - dev["undefloor_dew_point_temperature"]["temperature"]) < 1;
  },
  then: function () {
    var now = Date.now();
    var t = dev[devices.undefloor.temperature];
    var dew_point_t = dev["undefloor_dew_point_temperature"]["temperature"];
    log.warning("underfloor temperature near dew point", "temperature", t, "dew point temperature", dew_point_t);
    if ((now - alarmTimers[dew_point_emailer_timer]) > 3 * one_hour) {
      for (var i = 0; i < contacts.myEmails.length; i ++) {
        Notify.sendEmail(contacts.myEmails[i], "Underfloor temperature dew point coming", "Underfloor temperature {}, dew point temperature {}".format(t, dew_point_t));
      }
      alarmTimers[dew_point_emailer_timer] = now;
    }
    if ((now - alarmTimers[dew_point_sms_timer]) > 24 * one_hour) {
      for (var i = 0; i < contacts.myPhones.length; i ++) {
        Notify.sendSMS(contacts.myPhones[i], "Underfloor temperature {}, dew point temperature {}".format(t, dew_point_t));
      }
      alarmTimers[dew_point_sms_timer] = now;
    }
  },
});

