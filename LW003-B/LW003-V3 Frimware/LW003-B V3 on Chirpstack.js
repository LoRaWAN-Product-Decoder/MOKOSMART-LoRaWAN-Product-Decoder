/*
according dev config，show report data format choose, this flag must be the same as the device configuration
bit0 refer to the 1st content of the selected beacon type
bit1 refer to the 2nd content of the selected beacon type
............
*/
//If you don't want to change flag, you can export the decoder from MKLoRa APP after configuration is done.You can read "chapter 2.3.4.3 Device Information" of LW003-B APP guide.

var iBeaconFlag = 0x01FF;
var EddystoneUIDFlag = 0xFF;
var EddystoneURLFlag = 0x7F;
var EddystoneTLMFlag = 0x03FF;
var BXPiBeaconFlag = 0x07FF;
var BXPDeviceInfoFlag = 0x1FFF;
var BXPACCFlag = 0x1FFF;
var BXPTHFlag = 0x07FF;
var BXPButtonFlag = 0x03FFFF;
var BXPTagFlag = 0x0FFF;
var OtherTypeFlag = 0x1F;

var shutDownTypeArray = ["Bluetooth command or App", "LoRaWAN Command", "Power button", "Battery run out"];
var beaconTypeArray = ["iBeacon", "Eddystone-UID", "Eddystone-URL", "Eddystone-TLM", "BXP-iBeacon", "BXP-DeviceInfo", "BXP-ACC", "BXP-T&H", "BXP-BUTTON", "BXP-Tag", "Unknown"];
var messageTypeArray = ["Normal heartbeat report", "The device come into low power state", "Other type"];
var sampleRateArray = ["1Hz", "10Hz", "25Hz", "50Hz", "100Hz", "200Hz", "400Hz", "1344Hz", "1620Hz", "5376Hz"];
var fullScaleArray = ["±2g", "±4g", "±8g", "±16g"];
var frameTypeArray = ["Single press mode", "Double press mode", "Long press mode", "Abnormal inactivity mode"];
var urlSchemeArray = ["http://www.", "https://www.", "http://", "https://"];
var urlExpansionArray = [".com/", ".org/", ".edu/", ".net/", ".info/", ".biz/", ".gov/", ".com", ".org", ".edu", ".net", ".info", ".biz", ".gov"];

function Decode(fPort, bytes) {
    var dev_info = {};
    dev_info.port = fPort;
    var date = new Date();
    var timestamp = Math.trunc(date.getTime() / 1000);
    var offsetHours = Math.abs(Math.floor(date.getTimezoneOffset() / 60));
    dev_info.timestamp = timestamp;
    dev_info.time = parse_time(timestamp, offsetHours);
    if (fPort == 1 || fPort == 3) {
        // port 1:Turn on info/port 3:Device info
        dev_info.battery_charging_status = bytes[0] & 0x80 ? "in charging" : "no charging";
        dev_info.battery_level = (bytes[0] & 0x7F) + "%";
        dev_info.battery_voltage = bytesToInt(bytes, 1, 2) + "mV";
        var firmware_ver_major = (bytes[3] >> 6) & 0x03;
        var firmware_ver_minor = (bytes[3] >> 4) & 0x03;
        var firmware_ver_patch = bytes[3] & 0x0f;
        dev_info.firmware_version = "V" + firmware_ver_major + "." + firmware_ver_minor + "." + firmware_ver_patch;
        var hardware_ver_major = (bytes[4] >> 4) & 0x0f;
        var hardware_ver_patch = bytes[4] & 0x0f;
        dev_info.hardware_version = "V" + hardware_ver_major + "." + hardware_ver_patch;
        var length = bytes.length;
        if ((fPort == 1 && length > 6) || (fPort == 3 && length > 7)) {
            var temperature = bytesToInt(bytes, 5, 2);
            if (temperature > 0x8000)
                dev_info.temperature = "-" + (0x10000 - temperature) / 100 + "°C";
            else
                dev_info.temperature = temperature / 100 + "°C";
            dev_info.humility = bytesToInt(bytes, 7, 2) / 100 + "%";
            dev_info.timezone = timezone_decode(bytes[9]);
            if (fPort == 3) {
                dev_info.message_type = messageTypeArray[bytes[10]];
            }
        } else {
            dev_info.timezone = timezone_decode(bytes[5]);
            if (fPort == 3) {
                dev_info.message_type = messageTypeArray[bytes[6]];
            }
        }
    } else if (fPort == 2) {
        // Turn off info
        dev_info.battery_charging_status = bytes[0] & 0x80 ? "in charging" : "no charging";
        dev_info.battery_level = (bytes[0] & 0x7F) + "%";
        dev_info.battery_voltage = bytesToInt(bytes, 1, 2) + "mV";
        dev_info.timestamp = parse_time(bytesToInt(bytes, 3, 4), bytes[7] * 0.5);
        dev_info.timezone = timezone_decode(bytes[7]);
        dev_info.shutdown_type = shutDownTypeArray[bytes[8]];
    } else if (fPort == 4) {
        // Adv event info
        dev_info.battery_charging_status = bytes[0] & 0x80 ? "in charging" : "no charging";
        dev_info.battery_level = (bytes[0] & 0x7F) + "%";
        dev_info.scan_cycle_start_timestamp = parse_time(bytesToInt(bytes, 1, 4), bytes[5] * 0.5);
        dev_info.scan_cycle_start_timezone = timezone_decode(bytes[5]);
        dev_info.adv_interrupt_timestamp = parse_time(bytesToInt(bytes, 6, 4), bytes[10] * 0.5);
        dev_info.adv_interrupt_timezone = timezone_decode(bytes[10]);
    } else if (fPort == 5) {
        // Scan data info
        dev_info.packet_sequence = bytes[0];
        dev_info.payload_reporting_timestamp = parse_time(bytesToInt(bytes, 1, 4), bytes[5] * 0.5);
        dev_info.payload_reporting_timezone = timezone_decode(bytes[5]);
        dev_info.beacon_number = bytes[6];
        var parse_len = 7;
        var datas = [];
        for (var i = 0; i < dev_info.beacon_number; i++) {
            var data = {};
            var beacon_len = 0;
            var no_response_package = bytes[parse_len] & 0x80;
            var current_data_len = bytes[parse_len++] & 0x7F;
            var beacon_type = bytes[parse_len++];
            beacon_len++;
            if (beacon_type == 0) {
                // iBeaconFlag
                var flag = iBeaconFlag;
                data.beacon_type = beaconTypeArray[beacon_type];
                if (flag & 0x01) {
                    data.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
                    parse_len += 6;
                    beacon_len += 6;
                }
                if (flag & 0x02) {
                    data.rssi = bytes[parse_len++] - 256 + "dBm";
                    beacon_len += 1;
                }
                if (flag & 0x04) {
                    data.current_time = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    data.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    parse_len += 4;
                    beacon_len += 4;
                }
                // ================
                if (flag & 0x08) {
                    var uuid1 = bytesToHexString(bytes, parse_len, 4);
                    parse_len += 4;
                    var uuid2 = bytesToHexString(bytes, parse_len, 2);
                    parse_len += 2;
                    var uuid3 = bytesToHexString(bytes, parse_len, 2);
                    parse_len += 2;
                    var uuid4 = bytesToHexString(bytes, parse_len, 2);
                    parse_len += 2;
                    var uuid5 = bytesToHexString(bytes, parse_len, 6);
                    parse_len += 6;
                    var uuid = uuid1 + "-" + uuid2 + "-" + uuid3 + "-" + uuid4 + "-" + uuid5;
                    data.uuid = uuid.toUpperCase();
                    beacon_len += 16;
                }
                if (flag & 0x10) {
                    data.major = bytesToInt(bytes, parse_len, 2);
                    parse_len += 2;
                    beacon_len += 2;
                }
                if (flag & 0x20) {
                    data.minor = bytesToInt(bytes, parse_len, 2);
                    parse_len += 2;
                    beacon_len += 2;
                }
                if (flag & 0x40) {
                    var rangingData = bytes[parse_len++];
                    data.rssi_1m = rangingData == 0 ? "0dBm" : rangingData - 256 + "dBm";
                    beacon_len++;
                }
                if (flag & 0x0180) {
                    data.raw_data_length = current_data_len - beacon_len;
                    data.raw_data = bytesToHexString(bytes, parse_len, data.raw_data_length).toUpperCase();
                    parse_len += data.raw_data_length;
                }
                datas.push(data);
            } else if (beacon_type == 1) {
                // EddystoneUIDFlag
                var flag = EddystoneUIDFlag;
                data.beacon_type = beaconTypeArray[beacon_type];
                if (flag & 0x01) {
                    data.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
                    parse_len += 6;
                    beacon_len += 6;
                }
                if (flag & 0x02) {
                    data.rssi = bytes[parse_len++] - 256 + "dBm";
                    beacon_len += 1;
                }
                if (flag & 0x04) {
                    data.current_time = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    data.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    parse_len += 4;
                    beacon_len += 4;
                }
                // ================
                if (flag & 0x08) {
                    item.rssi_0m = signedHexToInt(bytesToHexString(bytes, parse_len, 1));
                    parse_len++;
                    beacon_len++;
                }
                if (flag & 0x10) {
                    data.namespace = "0x" + bytesToHexString(bytes, parse_len, 10).toUpperCase();
                    parse_len += 10;
                    beacon_len += 10;
                }
                if (flag & 0x20) {
                    data.instance_id = "0x" + bytesToHexString(bytes, parse_len, 6).toUpperCase();
                    parse_len += 6;
                    beacon_len += 6;
                }
                if (flag & 0xC0) {
                    data.raw_data_length = current_data_len - beacon_len;
                    data.raw_data = bytesToHexString(bytes, parse_len, data.raw_data_length).toUpperCase();
                    parse_len += data.raw_data_length;
                }
                datas.push(data);
            } else if (beacon_type == 2) {
                // EddystoneURLFlag
                var flag = EddystoneURLFlag;
                data.beacon_type = beaconTypeArray[beacon_type];
                if (flag & 0x01) {
                    data.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
                    parse_len += 6;
                    beacon_len += 6;
                }
                if (flag & 0x02) {
                    data.rssi = bytes[parse_len++] - 256 + "dBm";
                    beacon_len += 1;
                }
                if (flag & 0x04) {
                    data.current_time = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    data.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    parse_len += 4;
                    beacon_len += 4;
                }
                // ================
                if (flag & 0x08) {
                    item.rssi_0m = signedHexToInt(bytesToHexString(bytes, parse_len, 1));
                    parse_len++;
                    beacon_len++;
                }
                if (flag & 0x10) {
                    var length = bytes[parse_len++];
                    beacon_len++;
                    var urlSchemeDesc = urlSchemeArray[bytes[parse_len++]];
                    beacon_len++;
                    var urlExpansionValue = bytes[parse_len + length - 2];
                    if (urlExpansionValue > 13) {
                        data.url = urlSchemeDesc + bytesToString(bytes, parse_len, length - 1);
                    } else {
                        var urlExpansionDesc = urlExpansionArray[urlExpansionValue];
                        data.url = urlSchemeDesc + bytesToString(bytes, parse_len, length - 2) + urlExpansionDesc;
                    }
                    parse_len += length - 1;
                    beacon_len += length - 1;
                }
                if (flag & 0x60) {
                    data.raw_data_length = current_data_len - beacon_len;
                    data.raw_data = bytesToHexString(bytes, parse_len, data.raw_data_length).toUpperCase();
                    parse_len += data.raw_data_length;
                }
                datas.push(data);
            } else if (beacon_type == 3) {
                // EddystoneTLMFlag
                var flag = EddystoneTLMFlag;
                data.beacon_type = beaconTypeArray[beacon_type];
                if (flag & 0x01) {
                    data.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
                    parse_len += 6;
                    beacon_len += 6;
                }
                if (flag & 0x02) {
                    data.rssi = bytes[parse_len++] - 256 + "dBm";
                    beacon_len += 1;
                }
                if (flag & 0x04) {
                    data.current_time = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    data.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    parse_len += 4;
                    beacon_len += 4;
                }
                // ================
                if (flag & 0x08) {
                    data.tlm_version = bytes[parse_len++] == 0 ? "Unencrypted TLM" : "Encrypted TLM";
                    beacon_len++;
                }
                if (flag & 0x10) {
                    data.battery_voltage = bytesToInt(bytes, parse_len, 2) + "mV";
                    parse_len += 2;
                    beacon_len += 2;
                }
                if (flag & 0x20) {
                    var tempInt = bytes[parse_len++];
                    beacon_len++;
                    var tempDecimal = bytes[parse_len++];
                    beacon_len++;
                    tempInt = tempInt > 128 ? tempInt - 256 : tempInt;
                    tempDecimal = tempDecimal / 256;
                    var temperature = (tempInt + tempDecimal).toFixed(1);
                    data.temperature = temperature + "°C";
                }
                if (flag & 0x40) {
                    data.adv_cnt = bytesToInt(bytes, parse_len, 4);
                    parse_len += 4;
                    beacon_len += 4;
                }
                if (flag & 0x80) {
                    data.sec_cnt = bytesToInt(bytes, parse_len, 4);
                    parse_len += 4;
                    beacon_len += 4;
                }
                if (flag & 0x0300) {
                    data.raw_data_length = current_data_len - beacon_len;
                    data.raw_data = bytesToHexString(bytes, parse_len, data.raw_data_length).toUpperCase();
                    parse_len += data.raw_data_length;
                }
                datas.push(data);
            } else if (beacon_type == 4) {
                // BXPiBeaconFlag
                var flag = BXPiBeaconFlag;
                data.beacon_type = beaconTypeArray[beacon_type];
                if (flag & 0x01) {
                    data.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
                    parse_len += 6;
                    beacon_len += 6;
                }
                if (flag & 0x02) {
                    data.rssi = bytes[parse_len++] - 256 + "dBm";
                    beacon_len += 1;
                }
                if (flag & 0x04) {
                    data.current_time = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    data.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    parse_len += 4;
                    beacon_len += 4;
                }
                // ================
                if (!no_response_package) {
                    if (flag & 0x08) {
                        var uuid1 = bytesToHexString(bytes, parse_len, 4);
                        parse_len += 4;
                        var uuid2 = bytesToHexString(bytes, parse_len, 2);
                        parse_len += 2;
                        var uuid3 = bytesToHexString(bytes, parse_len, 2);
                        parse_len += 2;
                        var uuid4 = bytesToHexString(bytes, parse_len, 2);
                        parse_len += 2;
                        var uuid5 = bytesToHexString(bytes, parse_len, 6);
                        parse_len += 6;
                        var uuid = uuid1 + "-" + uuid2 + "-" + uuid3 + "-" + uuid4 + "-" + uuid5;
                        data.uuid = uuid.toUpperCase();
                        beacon_len += 16;
                    }
                    if (flag & 0x10) {
                        data.major = bytesToInt(bytes, parse_len, 2);
                        parse_len += 2;
                        beacon_len += 2;
                    }
                    if (flag & 0x20) {
                        data.minor = bytesToInt(bytes, parse_len, 2);
                        parse_len += 2;
                        beacon_len += 2;
                    }
                    if (flag & 0x40) {
                        var rangingData = bytes[parse_len++];
                        data.rssi_1m = rangingData == 0 ? "0dBm" : rangingData - 256 + "dBm";
                        beacon_len++;
                    }
                    if (flag & 0x80) {
                        var tx_power = bytes[parse_len] < 128 ? bytes[parse_len++] : bytes[parse_len++] - 256;
                        data.tx_power = tx_power + "dBm";
                        beacon_len++;
                    }
                    if (flag & 0x0100) {
                        data.adv_interval = bytes[parse_len++] * 100 + "ms";
                        beacon_len++;
                    }
                }
                if (flag & 0x0600) {
                    data.raw_data_length = current_data_len - beacon_len;
                    data.raw_data = bytesToHexString(bytes, parse_len, data.raw_data_length).toUpperCase();
                    parse_len += data.raw_data_length;
                }
                datas.push(data);
            } else if (beacon_type == 5) {
                // BXPDeviceInfoFlag
                var flag = BXPDeviceInfoFlag;
                data.beacon_type = beaconTypeArray[beacon_type];
                if (flag & 0x01) {
                    data.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
                    parse_len += 6;
                    beacon_len += 6;
                }
                if (flag & 0x02) {
                    data.rssi = bytes[parse_len++] - 256 + "dBm";
                    beacon_len += 1;
                }
                if (flag & 0x04) {
                    data.current_time = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    data.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    parse_len += 4;
                    beacon_len += 4;
                }
                // ================
                if (flag & 0x08) {
                    var tx_power = bytes[parse_len] < 128 ? bytes[parse_len++] : bytes[parse_len++] - 256;
                    data.tx_power = tx_power + "dBm";
                    beacon_len++;
                }
                if (flag & 0x10) {
                    var rangingData = bytes[parse_len++];
                    data.ranging_data = rangingData == 0 ? "0dBm" : rangingData - 256 + "dBm";
                    beacon_len++;
                }
                if (flag & 0x20) {
                    data.adv_interval = bytes[parse_len++] * 100 + "ms";
                    beacon_len++;
                }
                if (flag & 0x40) {
                    data.battery_voltage = bytesToInt(bytes, parse_len, 2) + "mV";
                    parse_len += 2;
                    beacon_len += 2;
                }
                // ================
                if (flag & 0x80) {
                    data.password_verification_status = (bytes[parse_len] & 0x02) ? "Disabled" : "Enabled";
                    data.ambient_light_sensor_status = (bytes[parse_len] & 0x04) ? "Equipped" : "Not equipped";
                    parse_len++;
                    beacon_len++;
                }
                if (flag & 0x0100) {
                    data.connectable_switch_status = (bytes[parse_len] & 0x01) ? "Connectable" : "Unconnectable";
                    data.ambient_light_switch_status = (bytes[parse_len] & 0x02) ? "Ambient light detected" : "Ambient light not detected";
                    parse_len++;
                    beacon_len++;
                }
                if (flag & 0x0200) {
                    var firmware_ver_major = bytes[parse_len] >> 4;
                    var firmware_ver_minor = bytes[parse_len++] & 0x0F;
                    var firmware_ver_patch = bytes[parse_len++];
                    data.firmware_version = "V" + firmware_ver_major + "." + firmware_ver_minor + "." + firmware_ver_patch;
                    beacon_len += 2;
                }
                if (!no_response_package) {
                    if (flag & 0x0400) {
                        var length = bytes[parse_len++];
                        beacon_len++;
                        data.device_name = bytesToString(bytes, parse_len, length);
                        parse_len += length;
                        beacon_len += length;
                    }
                }
                if ((flag & 0x1800)) {
                    data.raw_data_length = current_data_len - beacon_len;
                    data.raw_data = bytesToHexString(bytes, parse_len, data.raw_data_length).toUpperCase();
                    parse_len += data.raw_data_length;
                }
                datas.push(data);
            } else if (beacon_type == 6) {
                // BXPACCFlag
                var flag = BXPACCFlag;
                data.beacon_type = beaconTypeArray[beacon_type];
                if (flag & 0x01) {
                    data.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
                    parse_len += 6;
                    beacon_len += 6;
                }
                if (flag & 0x02) {
                    data.rssi = bytes[parse_len++] - 256 + "dBm";
                    beacon_len += 1;
                }
                if (flag & 0x04) {
                    data.current_time = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    data.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    parse_len += 4;
                    beacon_len += 4;
                }
                // ================
                if (flag & 0x08) {
                    var tx_power = bytes[parse_len] < 128 ? bytes[parse_len++] : bytes[parse_len++] - 256;
                    data.tx_power = tx_power + "dBm";
                    beacon_len++;
                }
                if (flag & 0x10) {
                    var rangingData = bytes[parse_len++];
                    data.ranging_data = rangingData == 0 ? "0dBm" : rangingData - 256 + "dBm";
                    beacon_len++;
                }
                if (flag & 0x20) {
                    data.adv_interval = bytes[parse_len++] * 100 + "ms";
                    beacon_len++;
                }
                if (flag & 0x40) {
                    data.battery_voltage = bytesToInt(bytes, parse_len, 2) + "mV";
                    parse_len += 2;
                    beacon_len += 2;
                }
                // ================
                if (flag & 0x80) {
                    data.sample_rate = sampleRateArray[bytes[parse_len++]];
                    beacon_len++;
                }
                if (flag & 0x0100) {
                    data.full_scale = fullScaleArray[bytes[parse_len++]];
                    beacon_len++;
                }
                if (flag & 0x0200) {
                    data.motion_threshold = bytes[parse_len++] / 10 + "g";
                    beacon_len++;
                }
                if (flag & 0x0400) {
                    var x_axis = "0x" + bytesToHexString(bytes, parse_len, 2);
                    parse_len += 2;
                    beacon_len += 2;
                    var y_axis = "0x" + bytesToHexString(bytes, parse_len, 2);
                    parse_len += 2;
                    beacon_len += 2;
                    var z_axis = "0x" + bytesToHexString(bytes, parse_len, 2);
                    parse_len += 2;
                    beacon_len += 2;
                    data.axis_data = "X:" + x_axis + " Y:" + y_axis + " Z:" + z_axis
                }
                if ((flag & 0x1800)) {
                    data.raw_data_length = current_data_len - beacon_len;
                    data.raw_data = bytesToHexString(bytes, parse_len, data.raw_data_length).toUpperCase();
                    parse_len += data.raw_data_length;
                }
                datas.push(data);
            } else if (beacon_type == 7) {
                // BXPTHFlag
                var flag = BXPTHFlag;
                data.beacon_type = beaconTypeArray[beacon_type];
                if (flag & 0x01) {
                    data.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
                    parse_len += 6;
                    beacon_len += 6;
                }
                if (flag & 0x02) {
                    data.rssi = bytes[parse_len++] - 256 + "dBm";
                    beacon_len += 1;
                }
                if (flag & 0x04) {
                    data.current_time = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    data.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    parse_len += 4;
                    beacon_len += 4;
                }
                // ================
                if (flag & 0x08) {
                    var tx_power = bytes[parse_len] < 128 ? bytes[parse_len++] : bytes[parse_len++] - 256;
                    data.tx_power = tx_power + "dBm";
                    beacon_len++;
                }
                if (flag & 0x10) {
                    var rangingData = bytes[parse_len++];
                    data.ranging_data = rangingData == 0 ? "0dBm" : rangingData - 256 + "dBm";
                    beacon_len++;
                }
                if (flag & 0x20) {
                    data.adv_interval = bytes[parse_len++] * 100 + "ms";
                    beacon_len++;
                }
                if (flag & 0x40) {
                    data.battery_voltage = bytesToInt(bytes, parse_len, 2) + "mV";
                    parse_len += 2;
                    beacon_len += 2;
                }
                // ================
                if (flag & 0x80) {
                    var temperature = bytesToInt(bytes, parse_len, 2);
                    if (temperature > 0x8000)
                        data.temperature = "-" + (0x10000 - temperature) / 10 + "°C";
                    else
                        data.temperature = temperature / 10 + "°C";
                    parse_len += 2;
                    beacon_len += 2;
                }
                if (flag & 0x0100) {
                    data.humility = bytesToInt(bytes, parse_len, 2) / 10 + "%";
                    parse_len += 2;
                    beacon_len += 2;
                }
                if ((flag & 0x0600)) {
                    data.raw_data_length = current_data_len - beacon_len;
                    data.raw_data = bytesToHexString(bytes, parse_len, data.raw_data_length).toUpperCase();
                    parse_len += data.raw_data_length;
                }
                datas.push(data);
            } else if (beacon_type == 8) {
                // BXPButtonFlag
                var flag = BXPButtonFlag;
                data.beacon_type = beaconTypeArray[beacon_type];
                if (flag & 0x01) {
                    data.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
                    parse_len += 6;
                    beacon_len += 6;
                }
                if (flag & 0x02) {
                    data.rssi = bytes[parse_len++] - 256 + "dBm";
                    beacon_len += 1;
                }
                if (flag & 0x04) {
                    data.current_time = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    data.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    parse_len += 4;
                    beacon_len += 4;
                }
                // ================
                if (flag & 0x08) {
                    data.frame_type = frameTypeArray[bytes[parse_len++] & 0x03];
                    beacon_len++;
                }
                if (flag & 0x10) {
                    data.password_verification_status = (bytes[parse_len] & 0x01) ? "Password verification enabled" : "Password verification disabled";
                    data.alarm_triggered_status = (bytes[parse_len] & 0x02) ? "Alarm be triggered" : "Alarm not be triggered";
                    parse_len++;
                    beacon_len++;
                }
                if (flag & 0x20) {
                    data.trigger_count = bytesToInt(bytes, parse_len, 2);
                    parse_len += 2;
                    beacon_len += 2;
                }
                if (flag & 0x40) {
                    var length = bytes[parse_len++];
                    beacon_len++;
                    data.device_id = bytesToHexString(bytes, parse_len, length);
                    parse_len += length;
                    beacon_len += length;
                }
                if (flag & 0x80) {
                    data.firmware_type = bytes[parse_len++];
                    beacon_len++;
                }
                if (flag & 0x0100) {
                    var length = bytes[parse_len++];
                    beacon_len++;
                    data.device_name = bytesToString(bytes, parse_len, length);
                    parse_len += length;
                    beacon_len += length;
                }
                if (!no_response_package) {
                    if (flag & 0x0200) {
                        data.full_scale = fullScaleArray[bytes[parse_len++]];
                        beacon_len++;
                    }
                    if (flag & 0x0400) {
                        data.motion_threshold = bytesToInt(bytes, parse_len, 2);
                        parse_len += 2;
                        beacon_len += 2;
                    }
                    if (flag & 0x0800) {
                        var x_axis = "0x" + bytesToHexString(bytes, parse_len, 2);
                        parse_len += 2;
                        beacon_len += 2;
                        var y_axis = "0x" + bytesToHexString(bytes, parse_len, 2);
                        parse_len += 2;
                        beacon_len += 2;
                        var z_axis = "0x" + bytesToHexString(bytes, parse_len, 2);
                        parse_len += 2;
                        beacon_len += 2;
                        data.axis_data = "X:" + x_axis + " Y:" + y_axis + " Z:" + z_axis
                    }
                    if (flag & 0x1000) {
                        item.temperature = Number(signedHexToInt(bytesToHexString(bytes, parse_len, 2)) * 0.1).toFixed(1);
                        parse_len += 2;
                        beacon_len += 2;
                    }
                    if (flag & 0x2000) {
                        var rangingData = bytes[parse_len++];
                        data.ranging_data = rangingData == 0 ? "0dBm" : rangingData - 256 + "dBm";
                        beacon_len++;
                    }
                    if (flag & 0x4000) {
                        data.battery_voltage = bytesToInt(bytes, parse_len, 2) + "mV";
                        parse_len += 2;
                        beacon_len += 2;
                    }
                    if (flag & 0x8000) {
                        var tx_power = bytes[parse_len] < 128 ? bytes[parse_len++] : bytes[parse_len++] - 256;
                        data.tx_power = tx_power + "dBm";
                        beacon_len++;
                    }
                }
                if ((flag & 0x030000)) {
                    data.raw_data_length = current_data_len - beacon_len;
                    data.raw_data = bytesToHexString(bytes, parse_len, data.raw_data_length).toUpperCase();
                    parse_len += data.raw_data_length;
                }
                datas.push(data);
            } else if (beacon_type == 9) {
                // BXPTagFlag
                var flag = BXPTagFlag;
                data.beacon_type = beaconTypeArray[beacon_type];
                if (flag & 0x01) {
                    data.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
                    parse_len += 6;
                    beacon_len += 6;
                }
                if (flag & 0x02) {
                    data.rssi = bytes[parse_len++] - 256 + "dBm";
                    beacon_len += 1;
                }
                if (flag & 0x04) {
                    data.current_time = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    data.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    parse_len += 4;
                    beacon_len += 4;
                }
                // ================
                if (flag & 0x08) {
                    data.hall_sensor_status = bytes[parse_len] & 0x01 ? "Magnet away/absent" : "Magnet approach/present";
                    data.accelerometer_sensor_status = bytes[parse_len] & 0x02 ? "In move" : "In static";
                    data.accelerometer_sensor_equipped_status = bytes[parse_len] & 0x04 ? "Equipped" : "Not equipped";
                    parse_len++;
                    beacon_len++;
                }
                if (flag & 0x10) {
                    data.hall_trigger_event_count = bytesToInt(bytes, parse_len, 2);
                    parse_len += 2;
                    beacon_len += 2;
                }
                if (flag & 0x20) {
                    data.motion_trigger_event_count = bytesToInt(bytes, parse_len, 2);
                    parse_len += 2;
                    beacon_len += 2;
                }
                if (flag & 0x40) {
                    var x_axis = "0x" + bytesToHexString(bytes, parse_len, 2);
                    parse_len += 2;
                    beacon_len += 2;
                    var y_axis = "0x" + bytesToHexString(bytes, parse_len, 2);
                    parse_len += 2;
                    beacon_len += 2;
                    var z_axis = "0x" + bytesToHexString(bytes, parse_len, 2);
                    parse_len += 2;
                    beacon_len += 2;
                    data.axis_data = "X:" + x_axis + " Y:" + y_axis + " Z:" + z_axis
                }
                if (flag & 0x80) {
                    data.battery_voltage = bytesToInt(bytes, parse_len, 2) + "mV";
                    parse_len += 2;
                    beacon_len += 2;
                }
                if (flag & 0x0100) {
                    var length = bytes[parse_len++];
                    beacon_len++;
                    data.tag_id = bytesToHexString(bytes, parse_len, length);
                    parse_len += length;
                    beacon_len += length;
                }
                if (!no_response_package) {
                    if (flag & 0x0200) {
                        var length = bytes[parse_len++];
                        beacon_len++;
                        data.device_name = bytesToString(bytes, parse_len, length);
                        parse_len += length;
                        beacon_len += length;
                    }
                }
                if ((flag & 0x0C00)) {
                    data.raw_data_length = current_data_len - beacon_len;
                    data.raw_data = bytesToHexString(bytes, parse_len, data.raw_data_length).toUpperCase();
                    parse_len += data.raw_data_length;
                }
                datas.push(data);
            } else if (beacon_type == 10) {
                // OtherTypeFlag
                var flag = OtherTypeFlag;
                data.beacon_type = beaconTypeArray[beacon_type];
                if (flag & 0x01) {
                    data.mac = bytesToHexString(bytes, parse_len, 6).toLowerCase();
                    parse_len += 6;
                    beacon_len += 6;
                }
                if (flag & 0x02) {
                    data.rssi = bytes[parse_len++] - 256 + "dBm";
                    beacon_len += 1;
                }
                if (flag & 0x04) {
                    data.current_time = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    data.timestamp = parse_time(bytesToInt(bytes, parse_len, 4), bytes[5] * 0.5);
                    parse_len += 4;
                    beacon_len += 4;
                }
                // ================
                var blockNum = bytes[parse_len++];
                beacon_len++;
                if (blockNum > 0) {
                    var dataBlocks = [];
                    while (blockNum > 0) {
                        var dataBlock = {};
                        var dataBlockLength = bytes[parse_len++];
                        beacon_len++;
                        if ((dataBlockLength >> 6) & 0x01) {
                            dataBlock.error = "type error";
                            parse_len++;
                            beacon_len++;
                            dataBlocks.push(dataBlock);
                            blockNum--;
                            continue;
                        }
                        if ((dataBlockLength >> 6) & 0x02) {
                            dataBlock.error = "length error";
                            parse_len++;
                            beacon_len++;
                            dataBlocks.push(dataBlock);
                            blockNum--;
                            continue;
                        }
                        dataBlockLength = dataBlockLength & 0x3F;
                        dataBlock.length = dataBlockLength;
                        dataBlock.type = bytesToHexString(bytes, parse_len, 1).toUpperCase();
                        parse_len++;
                        beacon_len++;
                        dataBlock.data = bytesToHexString(bytes, parse_len, dataBlockLength - 1).toUpperCase();
                        parse_len += dataBlockLength - 1;
                        beacon_len += dataBlockLength - 1;
                        dataBlocks.push(dataBlock);
                        blockNum--;
                    }
                    // data.dataBlocks = JSON.stringify(dataBlocks);
                    data.dataBlocks = dataBlocks;
                }
                if ((flag & 0x18)) {
                    data.raw_data_length = current_data_len - beacon_len;
                    data.raw_data = bytesToHexString(bytes, parse_len, data.raw_data_length).toUpperCase();
                    parse_len += data.raw_data_length;
                }
                datas.push(data);
            }
        }
        dev_info.scan_data = datas;
    }
    return dev_info;
}


function bytesToHexString(bytes, start, len) {
    var char = [];
    for (var i = 0; i < len; i++) {
        var data = bytes[start + i].toString(16);
        var dataHexStr = ("0x" + data) < 0x10 ? ("0" + data) : data;
        char.push(dataHexStr);
    }
    return char.join("");
}

function bytesToString(bytes, start, len) {
    var char = [];
    for (var i = 0; i < len; i++) {
        char.push(String.fromCharCode(bytes[start + i]));
    }
    return char.join("");
}

function bytesToInt(bytes, start, len) {
    var value = 0;
    for (var i = 0; i < len; i++) {
        var m = ((len - 1) - i) * 8;
        value = value | bytes[start + i] << m;
    }
    // var value = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | (bytes[start + 3]));
    return value;
}

function signedHexToInt(hexStr) {
    var twoStr = parseInt(hexStr, 16).toString(2); // 将十六转十进制，再转2进制
    var bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 "f"就是4位
    if (twoStr.length < bitNum) {
        while (twoStr.length < bitNum) {
            twoStr = "0" + twoStr;
        }
    }
    if (twoStr.substring(0, 1) == "0") {
        // 正数
        twoStr = parseInt(twoStr, 2); // 二进制转十进制
        return twoStr;
    }
    // 负数
    var twoStr_unsign = "";
    twoStr = parseInt(twoStr, 2) - 1; // 补码：(负数)反码+1，符号位不变；相对十进制来说也是 +1，但这里是负数，+1就是绝对值数据-1
    twoStr = twoStr.toString(2);
    twoStr_unsign = twoStr.substring(1, bitNum); // 舍弃首位(符号位)
    // 去除首字符，将0转为1，将1转为0   反码
    twoStr_unsign = twoStr_unsign.replace(/0/g, "z");
    twoStr_unsign = twoStr_unsign.replace(/1/g, "0");
    twoStr_unsign = twoStr_unsign.replace(/z/g, "1");
    twoStr = parseInt(-twoStr_unsign, 2);
    return twoStr;
}

function timezone_decode(tz) {
    var tz_str = "UTC";
    tz = tz > 128 ? tz - 256 : tz;
    if (tz < 0) {
        tz_str += "-";
        tz = -tz;
    } else {
        tz_str += "+";
    }

    if (tz < 20) {
        tz_str += "0";
    }

    tz_str += String(parseInt(tz / 2));
    tz_str += ":"

    if (tz % 2) {
        tz_str += "30"
    } else {
        tz_str += "00"
    }

    return tz_str;
}

function parse_time(timestamp, timezone) {
    timezone = timezone > 64 ? timezone - 128 : timezone;
    timestamp = timestamp + timezone * 3600;
    if (timestamp < 0) {
        timestamp = 0;
    }

    var d = new Date(timestamp * 1000);
    //d.setUTCSeconds(1660202724);

    var time_str = "";
    time_str += d.getUTCFullYear();
    time_str += "/";
    time_str += formatNumber(d.getUTCMonth() + 1);
    time_str += "/";
    time_str += formatNumber(d.getUTCDate());
    time_str += " ";

    time_str += formatNumber(d.getUTCHours());
    time_str += ":";
    time_str += formatNumber(d.getUTCMinutes());
    time_str += ":";
    time_str += formatNumber(d.getUTCSeconds());

    return time_str;
}

function get_timestamp(timestamp) {
    if (timestamp < 0) {
        timestamp = 0;
    }
    return timestamp * 1000;
}

function formatNumber(number) {
    return number < 10 ? "0" + number : number;
}

String.prototype.format = function () {
    if (arguments.length == 0)
        return this;
    for (var s = this, i = 0; i < arguments.length; i++)
        s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
    return s;
};
