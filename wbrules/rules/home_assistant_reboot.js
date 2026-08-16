// Правило: если значение в MQTT-топике не меняется дольше заданного времени,
// включить реле на 20 секунд (импульс).
//
// Подписка на "сырой" MQTT-топик через trackMqtt.
// Заменить плейсхолдеры на свои значения:
//   MONITORED_TOPIC              - MQTT-топик, за значением которого следим
//   relayTopic - каким реле управляем

var devices = require("devices");

var MONITORED_TOPIC = devices.ha.mqtt_status_topic;  // пример топика

var NO_CHANGE_TIMEOUT_S = 5 * 60;         // 5 минут без изменений
var RELAY_PULSE_S       = 20;             // держать реле включённым 20 секунд

var relayTopic = devices.ha.reboot_relay;

var lastValue       = null;  // последнее полученное значение
var noChangeTimerId = null;  // таймер "нет изменений"
var pulseTimerId    = null;  // таймер импульса реле

// Запуск/перезапуск таймера ожидания изменений
function armNoChangeTimer() {
    if (noChangeTimerId !== null) {
        clearTimeout(noChangeTimerId);
    }
    noChangeTimerId = setTimeout(function () {
        log.info("Значение '{}' не менялось {} c — включаю реле на {} c",
            MONITORED_TOPIC, NO_CHANGE_TIMEOUT_S, RELAY_PULSE_S);
        pulseRelay();
        // После срабатывания снова ждём следующий период тишины
        armNoChangeTimer();
    }, NO_CHANGE_TIMEOUT_S * 1000);
}

// Включить реле на RELAY_PULSE_S секунд
function pulseRelay() {
    dev[relayTopic] = true;

    if (pulseTimerId !== null) {
        clearTimeout(pulseTimerId);
    }
    pulseTimerId = setTimeout(function () {
        dev[relayTopic] = false;
        pulseTimerId = null;
        log.info("Реле '{}' выключено после импульса", relayTopic);
    }, RELAY_PULSE_S * 1000);
}

// Подписка на MQTT-топик напрямую
trackMqtt(MONITORED_TOPIC, function (message) {
    // message.topic  - имя топика
    // message.value  - полученная payload (строка)
    if (message.value !== lastValue) {
        lastValue = message.value;
        // Значение изменилось — сбрасываем таймер тишины
        armNoChangeTimer();
    }
});

// Запускаем таймер сразу при загрузке правил
armNoChangeTimer();