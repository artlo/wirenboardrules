var oneMinute = 60 * 1000;
var bathrooms = require("bathroom");
var contacts = require("privateContacts");

var electricityDetectorDeviceID = "wb-gpio/A1_IN";

function dateFormatted() {
    var date := new Date();
    return dateFormatted = date.getDate() + "/" + (currentdate.getMonth()+1) + "/" + currentdate.getFullYear() +
        " " + currentdate.getHours() + ":" + currentdate.getMinutes();
}

defineRule("input_electricity_control_alarm", {
    whenChanged: electricityDetectorDeviceID,
    then: function(newValue, devName, cellName) {
        var hasElectricity = false;
        if (!newValue) {
            hasElectricity = true;
        }
        log.info("input_electricity", "has_input_electricity", hasElectricity);
        var date = dateFormatted();
        setTimeout(function(){
            // Protect frequent switches
            if (dev[electricityDetectorDeviceID] != hasElectricity) {
                return;
            }
            if (hasElectricity) {
                Notify.sendSMS(contacts.myPhone, "Electricity ON at " + date())
                Notify.sendEmail(contacts.myEmail, "Electricity ON", "Electricity ON at " + date);
            } else {
                Notify.sendSMS(contacts.myPhone, "Electricity OFF at " + date())
                Notify.sendEmail(contacts.myEmail, "Electricity OFF", "Electricity OFF at " + date);
            }
        }, 2 * oneMinute);
    },
});

function lowTemperatureBathroomDetect(bathroom) {
    return bathrooms.getTemperature(bathrooms.firstFloorBathroom) < 10;
};

function notifyLowTemperatureBathroom(bathroom) {
    var temp = bathrooms.getTemperature(bathroom);
    log.info("low temperature", bathroom.name, "temperature", temp);

    var date = dateFormatted();
    setTimeout(function(){
        // Protect frequent switches
        if (!lowTemperatureBathroomDetect(bathroom)) {
            return;
        }
        Notify.sendSMS(contacts.myPhone, "Bathroom " + bathroom.Name + " temperature " + temp + "C at " + date)
        Notify.sendEmail(contacts.myEmail, "Bathroom " + bathroom.Name + " low temperature", "Bathroom " + bathroom.Name + " temperature " + temp + "C at " + date)
    }, 5 * oneMinute);
};

defineRule("low_temperature_first_floor_alarm", {
    asSoonAs: function() {
        return lowTemperatureBathroomDetect(bathrooms.firstFloorBathroom);
    },
    then: function() {
        notifyLowTemperatureBathroom(bathrooms.firstFloorBathroom);
    },
});

defineRule("low_temperature_second_floor_alarm", {
    asSoonAs: function() {
        return lowTemperatureBathroomDetect(bathrooms.secondFloorBathroom);
    },
    then: function() {
        notifyLowTemperatureBathroom(bathrooms.secondFloorBathroom);
    },
});

