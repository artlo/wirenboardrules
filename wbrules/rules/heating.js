var servo = require("servo");
var circuit = require("heating_circuit");
var devices = require("devices");
var pumps = require("pump");

var pumpFirstFloor = pumps.newPump("first_floor", devices.pumps.floorOneControl);
pumpFirstFloor.createDevice("Насос первый этаж");

var pumpSecondFloor = pumps.newPump("second_floor", devices.pumps.floorTwoControl);
pumpSecondFloor.createDevice("Насос второй этаж");

var servoFirstFloor = servo.newServo("first_floor", devices.servoRelay.floorOneOpen, devices.servoRelay.floorOneClose);
servoFirstFloor.createVirtualDevice("Трехходовой клапан 1 этаж");

var servoSecondFloor = servo.newServo("second_floor", devices.servoRelay.floorTwoOpen, devices.servoRelay.floorTwoClose);
servoSecondFloor.createVirtualDevice("Трехходовой клапан 2 этаж");

var circuitFirstFloor = circuit.newCircuit("first_floor", servoFirstFloor, pumpFirstFloor, devices.boilerTempSensors.floorOneIn, devices.boilerTempSensors.floorOneOut);
circuitFirstFloor.createDevice("Контур отопления 1 этаж");

var circuitFirstFloor = circuit.newCircuit("second_floor", servoSecondFloor, pumpSecondFloor, devices.boilerTempSensors.floorTwoIn, devices.boilerTempSensors.floorTwoOut);
circuitFirstFloor.createDevice("Контур отопления 2 этаж");
