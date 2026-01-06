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
var shutDownTypeArray = ['Bluetooth command or App', 'LoRaWAN Command', 'Power button', 'Battery run out'];
var beaconTypeArray = ['iBeacon', 'Eddystone-UID', 'Eddystone-URL', 'Eddystone-TLM', 'BXP-iBeacon', 'BXP-DeviceInfo', 'BXP-ACC', 'BXP-T&H', 'BXP-BUTTON', 'BXP-Tag', 'Unknown'];
var messageTypeArray = ['Normal heartbeat report', 'The device come into low power state', 'Other type'];
var sampleRateArray = ['1Hz', '10Hz', '25Hz', '50Hz', '100Hz', '200Hz', '400Hz', '1344Hz', '1620Hz', '5376Hz'];
var fullScaleArray = ['±2g', '±4g', '±8g', '±16g'];
var frameTypeArray = ['Single press mode', 'Double press mode', 'Long press mode', 'Abnormal inactivity mode'];
var urlSchemeArray = ['http://www.', 'https://www.', 'http://', 'https://'];
var urlExpansionArray = ['.com/', '.org/', '.edu/', '.net/', '.info/', '.biz/', '.gov/', '.com', '.org', '.edu', '.net', '.info', '.biz', '.gov'];
function Decoder(bytes, fPort, groupID) {
    var payloadList = [];
    if (fPort == 1) {
        return parse_port1_data(bytes, groupID);
    }
    if (fPort == 2) {
        return parse_port2_data(bytes, groupID);
    }
    if (fPort == 3) {
        var tempList = parse_port1_data(bytes.slice(0, bytes.length - 1), groupID);
        var message_type = messageTypeArray[bytes[bytes.length - 1]];
        tempList.push(getPayloadData('message_type', message_type, groupID));
        return tempList;
    }
    if (fPort == 4) {
        return parse_port4_data(bytes, groupID);
    }
    if (fPort == 5) {
        return parse_port5_data(bytes, groupID);
    }
    return payloadList;
}
/*********************Port Parse*************************/
function parse_port1_data(bytes, groupID) {
    var tempList = [];
    var charging = bytes[0] & 0x80 ? 'in charging' : 'no charging';
    tempList.push(getPayloadData('battery_charging_status', charging, groupID));
    var battery_level = (bytes[0] & 0x7F).toString() + '%';
    tempList.push(getPayloadData('battery_level', battery_level, groupID));
    var battery_voltage = bytesToInt(bytes, 1, 2).toString() + 'mV';
    tempList.push(getPayloadData('battery_voltage', battery_voltage, groupID));
    var firmware_ver_major = ((bytes[3] >> 6) & 0x03).toString();
    var firmware_ver_minor = ((bytes[3] >> 4) & 0x03).toString();
    var firmware_ver_patch = (bytes[3] & 0x0f).toString();
    ;
    var firmware_version = 'V' + firmware_ver_major + '.' + firmware_ver_minor + '.' + firmware_ver_patch;
    tempList.push(getPayloadData('firmware_version', firmware_version, groupID));
    var hardware_ver_major = ((bytes[4] >> 4) & 0x0f).toString();
    var hardware_ver_patch = (bytes[4] & 0x0f).toString();
    var hardware_version = 'V' + hardware_ver_major + '.' + hardware_ver_patch;
    tempList.push(getPayloadData('hardware_version', hardware_version, groupID));
    if (bytes.length == 10) {
        var temperature = (signedHexToInt(bytesToHexString(bytes, 5, 2)) * 0.01).toString() + '°C';
        tempList.push(getPayloadData('temperature', temperature, groupID));
        var humidity = (bytesToInt(bytes, 7, 2) * 0.01).toString() + '%';
        tempList.push(getPayloadData('humidity', humidity, groupID));
        var timezone = timezone_decode(bytes[9]);
        tempList.push(getPayloadData('timezone', timezone, groupID));
    }
    else if (bytes.length == 6) {
        var timezone = timezone_decode(bytes[5]);
        tempList.push(getPayloadData('timezone', timezone, groupID));
    }
    return tempList;
}
function parse_port2_data(bytes, groupID) {
    var tempList = [];
    var charging = bytes[0] & 0x80 ? 'in charging' : 'no charging';
    tempList.push(getPayloadData('battery_charging_status', charging, groupID));
    var battery_level = (bytes[0] & 0x7F).toString() + '%';
    tempList.push(getPayloadData('battery_level', battery_level, groupID));
    var battery_voltage = bytesToInt(bytes, 1, 2).toString() + 'mV';
    tempList.push(getPayloadData('battery_voltage', battery_voltage, groupID));
    var timestamp = parse_time(bytesToInt(bytes, 3, 4), bytes[7] * 0.5);
    tempList.push(getPayloadData('timestamp', timestamp, groupID));
    var timezone = timezone_decode(bytes[7]);
    tempList.push(getPayloadData('timezone', timezone, groupID));
    var shutdown_type = shutDownTypeArray[bytes[8]];
    tempList.push(getPayloadData('shutdown_type', shutdown_type, groupID));
    return tempList;
}
function parse_port4_data(bytes, groupID) {
    var tempList = [];
    var charging = bytes[0] & 0x80 ? 'in charging' : 'no charging';
    tempList.push(getPayloadData('battery_charging_status', charging, groupID));
    var battery_level = (bytes[0] & 0x7F).toString() + '%';
    tempList.push(getPayloadData('battery_level', battery_level, groupID));
    var disrupt_scan_period_start_timestamp = parse_time(bytesToInt(bytes, 1, 4), bytes[5] * 0.5);
    tempList.push(getPayloadData('disrupt_scan_period_start_timestamp', disrupt_scan_period_start_timestamp, groupID));
    var disrupt_scan_period_start_timezone = timezone_decode(bytes[5]);
    tempList.push(getPayloadData('disrupt_scan_period_start_timezone', disrupt_scan_period_start_timezone, groupID));
    var scan_disrupt_timestamp = parse_time(bytesToInt(bytes, 6, 4), bytes[10] * 0.5);
    tempList.push(getPayloadData('scan_disrupt_timestamp', scan_disrupt_timestamp, groupID));
    var scan_disrupt_timezone = timezone_decode(bytes[10]);
    tempList.push(getPayloadData('scan_disrupt_timezone', scan_disrupt_timezone, groupID));
    return tempList;
}
function parse_port5_data(bytes, groupID) {
    var tempList = [];
    var parse_index = 0;
    var packet_index = bytes[parse_index];
    tempList.push(getPayloadData('packet_index', packet_index, groupID));
    parse_index++;
    var payload_reporting_timestamp = parse_time(bytesToInt(bytes, parse_index, 4), bytes[parse_index + 4] * 0.5);
    tempList.push(getPayloadData('payload_reporting_timestamp', payload_reporting_timestamp, groupID));
    parse_index += 4;
    var timezone = bytes[parse_index];
    var payload_reporting_timezone = timezone_decode(timezone);
    tempList.push(getPayloadData('payload_reporting_timezone', payload_reporting_timezone, groupID));
    parse_index++;
    var totalNumber = bytes[parse_index];
    parse_index++;
    for (var i = 0; i < totalNumber; i++) {
        var no_response_package = ((bytes[parse_index] & 0x80) == 0x80);
        var length_1 = bytes[parse_index] & 0x7F;
        parse_index++;
        var tempBytes = bytes.slice(parse_index, parse_index + length_1);
        var beaconList = parse_scan_data(tempBytes, no_response_package, timezone, groupID);
        parse_index += length_1;
        tempList = tempList.concat(beaconList);
    }
    return tempList;
}
/*
    bytes: 当前Beacon数据
    no_response_package: 无回应包导致部分数据未上报标志位
    timezone: 当前时区
    groupID: groupID
*/
function parse_scan_data(bytes, no_response_package, timezone, groupID) {
    var tempList = [];
    var parse_index = 0;
    var type = bytes[parse_index];
    var beacon_type = beaconTypeArray[type];
    tempList.push(getPayloadData('beacon_type', beacon_type, groupID));
    parse_index++;
    if (type == 0) {
        //iBeacon
        var beacon_list = parse_iBeacon_data(bytes.slice(parse_index), timezone, groupID);
        return tempList.concat(beacon_list);
    }
    if (type == 1) {
        //UID
        var beacon_list = parse_uid_data(bytes.slice(parse_index), timezone, groupID);
        return tempList.concat(beacon_list);
    }
    if (type == 2) {
        //URL        
        var beacon_list = parse_url_data(bytes.slice(parse_index), timezone, groupID);
        return tempList.concat(beacon_list);
    }
    if (type == 3) {
        //TLM
        var beacon_list = parse_tlm_data(bytes.slice(parse_index), timezone, groupID);
        return tempList.concat(beacon_list);
    }
    if (type == 4) {
        //BXP-iBeacon        
        var beacon_list = parse_bxp_iBeacon_data(bytes.slice(parse_index), no_response_package, timezone, groupID);
        return tempList.concat(beacon_list);
    }
    if (type == 5) {
        //BXP-DeviceInfo
        var beacon_list = parse_bxp_deviceInfo_data(bytes.slice(parse_index), no_response_package, timezone, groupID);
        return tempList.concat(beacon_list);
    }
    if (type == 6) {
        //BXP-ACC
        var beacon_list = parse_bxp_acc_data(bytes.slice(parse_index), no_response_package, timezone, groupID);
        return tempList.concat(beacon_list);
    }
    if (type == 7) {
        //BXP-T&H
        var beacon_list = parse_bxp_th_data(bytes.slice(parse_index), no_response_package, timezone, groupID);
        return tempList.concat(beacon_list);
    }
    if (type == 8) {
        //BXP-BUTTON
        var beacon_list = parse_bxp_button_data(bytes.slice(parse_index), no_response_package, timezone, groupID);
        return tempList.concat(beacon_list);
    }
    if (type == 9) {
        //BXP-BUTTON
        var beacon_list = parse_bxp_tag_data(bytes.slice(parse_index), no_response_package, timezone, groupID);
        return tempList.concat(beacon_list);
    }
    if (type == 10) {
        //Unknown
        var beacon_list = parse_other_type_data(bytes.slice(parse_index), no_response_package, timezone, groupID);
        return tempList.concat(beacon_list);
    }
    return tempList;
}
function parse_iBeacon_data(bytes, timezone, groupID) {
    var tempList = [];
    var flag = iBeaconFlag;
    var parse_index = 0;
    if (flag & 0x01) {
        var mac = bytesToHexString(bytes, parse_index, 6).toLowerCase();
        tempList.push(getPayloadData('mac', mac, groupID));
        parse_index += 6;
    }
    if (flag & 0x02) {
        var rssi = (bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('rssi', rssi, groupID));
        parse_index++;
    }
    if (flag & 0x04) {
        var timestamp = parse_time(bytesToInt(bytes, parse_index, 4), timezone * 0.5);
        tempList.push(getPayloadData('timestamp', timestamp, groupID));
        parse_index += 4;
    }
    if (flag & 0x08) {
        var uuid1 = bytesToHexString(bytes, parse_index, 4);
        parse_index += 4;
        var uuid2 = bytesToHexString(bytes, parse_index, 2);
        parse_index += 2;
        var uuid3 = bytesToHexString(bytes, parse_index, 2);
        parse_index += 2;
        var uuid4 = bytesToHexString(bytes, parse_index, 2);
        parse_index += 2;
        var uuid5 = bytesToHexString(bytes, parse_index, 6);
        parse_index += 6;
        var uuid = uuid1 + '-' + uuid2 + '-' + uuid3 + '-' + uuid4 + '-' + uuid5;
        uuid = uuid.toUpperCase();
        tempList.push(getPayloadData('uuid', uuid, groupID));
    }
    if (flag & 0x10) {
        var major = bytesToInt(bytes, parse_index, 2);
        tempList.push(getPayloadData('major', major, groupID));
        parse_index += 2;
    }
    if (flag & 0x20) {
        var minor = bytesToInt(bytes, parse_index, 2);
        tempList.push(getPayloadData('minor', minor, groupID));
        parse_index += 2;
    }
    if (flag & 0x40) {
        var rangingData = bytes[parse_index];
        var rssi_1m = (rangingData == 0 ? '0dBm' : (rangingData - 256).toString() + 'dBm');
        tempList.push(getPayloadData('rssi_1m', rssi_1m, groupID));
        parse_index++;
    }
    if (flag & 0x0180) {
        var raw_data_length = bytes.length - parse_index - 1;
        var raw_data = bytesToHexString(bytes, parse_index, raw_data_length).toUpperCase();
        tempList.push(getPayloadData('raw_data', raw_data, groupID));
    }
    return tempList;
}
function parse_uid_data(bytes, timezone, groupID) {
    var tempList = [];
    var flag = EddystoneUIDFlag;
    var parse_index = 0;
    if (flag & 0x01) {
        var mac = bytesToHexString(bytes, parse_index, 6).toLowerCase();
        tempList.push(getPayloadData('mac', mac, groupID));
        parse_index += 6;
    }
    if (flag & 0x02) {
        var rssi = (bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('rssi', rssi, groupID));
        parse_index++;
    }
    if (flag & 0x04) {
        var timestamp = parse_time(bytesToInt(bytes, parse_index, 4), timezone * 0.5);
        tempList.push(getPayloadData('timestamp', timestamp, groupID));
        parse_index += 4;
    }
    if (flag & 0x08) {
        var rssi_0m = signedHexToInt(bytesToHexString(bytes, parse_index, 1));
        tempList.push(getPayloadData('rssi_0m', rssi_0m, groupID));
        parse_index++;
    }
    if (flag & 0x10) {
        var namespace = '0x' + bytesToHexString(bytes, parse_index, 10).toUpperCase();
        tempList.push(getPayloadData('namespace', namespace, groupID));
        parse_index += 10;
    }
    if (flag & 0x20) {
        var instance_id = '0x' + bytesToHexString(bytes, parse_index, 6).toUpperCase();
        tempList.push(getPayloadData('instance_id', instance_id, groupID));
        parse_index += 6;
    }
    if (flag & 0xC0) {
        var raw_data_length = bytes.length - parse_index - 1;
        var raw_data = bytesToHexString(bytes, parse_index, raw_data_length).toUpperCase();
        tempList.push(getPayloadData('raw_data', raw_data, groupID));
    }
    return tempList;
}
function parse_url_data(bytes, timezone, groupID) {
    var tempList = [];
    var flag = EddystoneURLFlag;
    var parse_index = 0;
    if (flag & 0x01) {
        var mac = bytesToHexString(bytes, parse_index, 6).toLowerCase();
        tempList.push(getPayloadData('mac', mac, groupID));
        parse_index += 6;
    }
    if (flag & 0x02) {
        var rssi = (bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('rssi', rssi, groupID));
        parse_index++;
    }
    if (flag & 0x04) {
        var timestamp = parse_time(bytesToInt(bytes, parse_index, 4), timezone * 0.5);
        tempList.push(getPayloadData('timestamp', timestamp, groupID));
        parse_index += 4;
    }
    if (flag & 0x08) {
        var rssi_0m = signedHexToInt(bytesToHexString(bytes, parse_index, 1));
        tempList.push(getPayloadData('rssi_0m', rssi_0m, groupID));
        parse_index++;
    }
    if (flag & 0x10) {
        var url_length = bytes[parse_index];
        parse_index++;
        var urlSchemeDesc = urlSchemeArray[bytes[parse_index]];
        parse_index++;
        var urlExpansionValue = bytes[parse_index + url_length - 2];
        var url = '';
        if (urlExpansionValue > 13) {
            url = urlSchemeDesc + bytesToString(bytes, parse_index, length - 1);
        }
        else {
            var urlExpansionDesc = urlExpansionArray[urlExpansionValue];
            url = urlSchemeDesc + bytesToString(bytes, parse_index, length - 2) + urlExpansionDesc;
        }
        parse_index += (url_length - 1);
    }
    if (flag & 0x60) {
        var raw_data_length = bytes.length - parse_index - 1;
        var raw_data = bytesToHexString(bytes, parse_index, raw_data_length).toUpperCase();
        tempList.push(getPayloadData('raw_data', raw_data, groupID));
    }
    return tempList;
}
function parse_tlm_data(bytes, timezone, groupID) {
    var tempList = [];
    var flag = EddystoneTLMFlag;
    var parse_index = 0;
    if (flag & 0x01) {
        var mac = bytesToHexString(bytes, parse_index, 6).toLowerCase();
        tempList.push(getPayloadData('mac', mac, groupID));
        parse_index += 6;
    }
    if (flag & 0x02) {
        var rssi = (bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('rssi', rssi, groupID));
        parse_index++;
    }
    if (flag & 0x04) {
        var timestamp = parse_time(bytesToInt(bytes, parse_index, 4), timezone * 0.5);
        tempList.push(getPayloadData('timestamp', timestamp, groupID));
        parse_index += 4;
    }
    if (flag & 0x08) {
        var tlm_version = bytes[parse_index] == 0 ? 'Unencrypted TLM' : 'Encrypted TLM';
        tempList.push(getPayloadData('tlm_version', tlm_version, groupID));
        parse_index++;
    }
    if (flag & 0x10) {
        var battery_voltage = (bytesToInt(bytes, parse_index, 2)).toString() + 'mV';
        tempList.push(getPayloadData('battery_voltage', battery_voltage, groupID));
        parse_index += 2;
    }
    if (flag & 0x20) {
        var tempInt = bytes[parse_index];
        parse_index++;
        var tempDecimal = bytes[parse_index];
        parse_index++;
        tempInt = tempInt > 128 ? tempInt - 256 : tempInt;
        tempDecimal = tempDecimal / 256;
        var temperature = ((tempInt + tempDecimal).toFixed(1)).toString() + '°C';
        tempList.push(getPayloadData('temperature', temperature, groupID));
        parse_index += 2;
    }
    if (flag & 0x40) {
        var adv_cnt = bytesToInt(bytes, parse_index, 4);
        tempList.push(getPayloadData('adv_cnt', adv_cnt, groupID));
        parse_index += 4;
    }
    if (flag & 0x80) {
        var sec_cnt = bytesToInt(bytes, parse_index, 4);
        tempList.push(getPayloadData('sec_cnt', sec_cnt, groupID));
        parse_index += 4;
    }
    if (flag & 0x0300) {
        var raw_data_length = bytes.length - parse_index - 1;
        var raw_data = bytesToHexString(bytes, parse_index, raw_data_length).toUpperCase();
        tempList.push(getPayloadData('raw_data', raw_data, groupID));
    }
    return tempList;
}
function parse_bxp_iBeacon_data(bytes, no_response_package, timezone, groupID) {
    var tempList = [];
    var flag = BXPiBeaconFlag;
    var parse_index = 0;
    if (flag & 0x01) {
        var mac = bytesToHexString(bytes, parse_index, 6).toLowerCase();
        tempList.push(getPayloadData('mac', mac, groupID));
        parse_index += 6;
    }
    if (flag & 0x02) {
        var rssi = (bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('rssi', rssi, groupID));
        parse_index++;
    }
    if (flag & 0x04) {
        var timestamp = parse_time(bytesToInt(bytes, parse_index, 4), timezone * 0.5);
        tempList.push(getPayloadData('timestamp', timestamp, groupID));
        parse_index += 4;
    }
    if (!no_response_package) {
        if (flag & 0x08) {
            var uuid1 = bytesToHexString(bytes, parse_index, 4);
            parse_index += 4;
            var uuid2 = bytesToHexString(bytes, parse_index, 2);
            parse_index += 2;
            var uuid3 = bytesToHexString(bytes, parse_index, 2);
            parse_index += 2;
            var uuid4 = bytesToHexString(bytes, parse_index, 2);
            parse_index += 2;
            var uuid5 = bytesToHexString(bytes, parse_index, 6);
            parse_index += 6;
            var uuid = uuid1 + '-' + uuid2 + '-' + uuid3 + '-' + uuid4 + '-' + uuid5;
            uuid = uuid.toUpperCase();
            tempList.push(getPayloadData('uuid', uuid, groupID));
            parse_index += 16;
        }
        if (flag & 0x10) {
            var major = bytesToInt(bytes, parse_index, 2);
            tempList.push(getPayloadData('major', major, groupID));
            parse_index += 2;
        }
        if (flag & 0x20) {
            var minor = bytesToInt(bytes, parse_index, 2);
            tempList.push(getPayloadData('minor', minor, groupID));
            parse_index += 2;
        }
        if (flag & 0x40) {
            var rangingData = bytes[parse_index];
            var rssi_1m = rangingData == 0 ? '0dBm' : (rangingData - 256).toString() + 'dBm';
            tempList.push(getPayloadData('rssi_1m', rssi_1m, groupID));
            parse_index++;
        }
        if (flag & 0x80) {
            var tx_power = (bytes[parse_index] < 128 ? bytes[parse_index] : bytes[parse_index] - 256).toString() + 'dBm';
            tempList.push(getPayloadData('tx_power', tx_power, groupID));
            parse_index++;
        }
        if (flag & 0x0100) {
            var adv_interval = (bytes[parse_index] * 100).toString() + 'ms';
            parse_index++;
        }
    }
    if (flag & 0x0600) {
        var raw_data_length = bytes.length - parse_index - 1;
        var raw_data = bytesToHexString(bytes, parse_index, raw_data_length).toUpperCase();
        tempList.push(getPayloadData('raw_data', raw_data, groupID));
    }
    return tempList;
}
function parse_bxp_deviceInfo_data(bytes, no_response_package, timezone, groupID) {
    var tempList = [];
    var flag = BXPDeviceInfoFlag;
    var parse_index = 0;
    if (flag & 0x01) {
        var mac = bytesToHexString(bytes, parse_index, 6).toLowerCase();
        tempList.push(getPayloadData('mac', mac, groupID));
        parse_index += 6;
    }
    if (flag & 0x02) {
        var rssi = (bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('rssi', rssi, groupID));
        parse_index++;
    }
    if (flag & 0x04) {
        var timestamp = parse_time(bytesToInt(bytes, parse_index, 4), timezone * 0.5);
        tempList.push(getPayloadData('timestamp', timestamp, groupID));
        parse_index += 4;
    }
    if (flag & 0x08) {
        var tx_power = (bytes[parse_index] < 128 ? bytes[parse_index] : bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('tx_power', tx_power, groupID));
        parse_index++;
    }
    if (flag & 0x10) {
        var rangingData = bytes[parse_index];
        var ranging_data = rangingData == 0 ? '0dBm' : (rangingData - 256).toString() + 'dBm';
        tempList.push(getPayloadData('ranging_data', ranging_data, groupID));
        parse_index++;
    }
    if (flag & 0x20) {
        var adv_interval = (bytes[parse_index] * 100).toString() + 'ms';
        tempList.push(getPayloadData('adv_interval', adv_interval, groupID));
        parse_index++;
    }
    if (flag & 0x40) {
        var battery_voltage = (bytesToInt(bytes, parse_index, 2)).toString() + 'mV';
        tempList.push(getPayloadData('battery_voltage', battery_voltage, groupID));
        parse_index += 2;
    }
    // ================
    if (flag & 0x80) {
        var password_verification_status = (bytes[parse_index] & 0x02) ? 'Disabled' : 'Enabled';
        tempList.push(getPayloadData('password_verification_status', password_verification_status, groupID));
        var ambient_light_sensor_status = (bytes[parse_index] & 0x04) ? 'Equipped' : 'Not equipped';
        tempList.push(getPayloadData('ambient_light_sensor_status', ambient_light_sensor_status, groupID));
        parse_index++;
    }
    if (flag & 0x0100) {
        var connectable_switch_status = (bytes[parse_index] & 0x01) ? 'Connectable' : 'Unconnectable';
        tempList.push(getPayloadData('connectable_switch_status', connectable_switch_status, groupID));
        var ambient_light_switch_status = (bytes[parse_index] & 0x02) ? 'Ambient light detected' : 'Ambient light not detected';
        tempList.push(getPayloadData('ambient_light_switch_status', ambient_light_switch_status, groupID));
        parse_index++;
    }
    if (flag & 0x0200) {
        var firmware_ver_major = bytes[parse_index] >> 4;
        parse_index++;
        var firmware_ver_minor = bytes[parse_index] & 0x0F;
        parse_index++;
        var firmware_ver_patch = bytes[parse_index];
        parse_index++;
        var firmware_version = 'V' + firmware_ver_major + '.' + firmware_ver_minor + '.' + firmware_ver_patch;
        tempList.push(getPayloadData('firmware_version', firmware_version, groupID));
    }
    if (!no_response_package) {
        if (flag & 0x0400) {
            var length = bytes[parse_index];
            parse_index++;
            var device_name = bytesToString(bytes, parse_index, length);
            tempList.push(getPayloadData('device_name', device_name, groupID));
            parse_index += length;
        }
    }
    if ((flag & 0x1800)) {
        var raw_data_length = bytes.length - parse_index - 1;
        var raw_data = bytesToHexString(bytes, parse_index, raw_data_length).toUpperCase();
        tempList.push(getPayloadData('raw_data', raw_data, groupID));
    }
    return tempList;
}
function parse_bxp_acc_data(bytes, no_response_package, timezone, groupID) {
    var tempList = [];
    var flag = BXPACCFlag;
    var parse_index = 0;
    if (flag & 0x01) {
        var mac = bytesToHexString(bytes, parse_index, 6).toLowerCase();
        tempList.push(getPayloadData('mac', mac, groupID));
        parse_index += 6;
    }
    if (flag & 0x02) {
        var rssi = (bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('rssi', rssi, groupID));
        parse_index++;
    }
    if (flag & 0x04) {
        var timestamp = parse_time(bytesToInt(bytes, parse_index, 4), timezone * 0.5);
        tempList.push(getPayloadData('timestamp', timestamp, groupID));
        parse_index += 4;
    }
    if (flag & 0x08) {
        var tx_power = (bytes[parse_index] < 128 ? bytes[parse_index] : bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('tx_power', tx_power, groupID));
        parse_index++;
    }
    if (flag & 0x10) {
        var rangingData = bytes[parse_index];
        var ranging_data = rangingData == 0 ? '0dBm' : (rangingData - 256).toString() + 'dBm';
        tempList.push(getPayloadData('ranging_data', ranging_data, groupID));
        parse_index++;
    }
    if (flag & 0x20) {
        var adv_interval = (bytes[parse_index] * 100).toString() + 'ms';
        tempList.push(getPayloadData('adv_interval', adv_interval, groupID));
        parse_index++;
    }
    if (flag & 0x40) {
        var battery_voltage = (bytesToInt(bytes, parse_index, 2)).toString() + 'mV';
        tempList.push(getPayloadData('battery_voltage', battery_voltage, groupID));
        parse_index += 2;
    }
    // ================
    if (flag & 0x80) {
        var sample_rate = sampleRateArray[bytes[parse_index]];
        tempList.push(getPayloadData('sample_rate', sample_rate, groupID));
        parse_index++;
    }
    if (flag & 0x0100) {
        var full_scale = fullScaleArray[bytes[parse_index]];
        tempList.push(getPayloadData('full_scale', full_scale, groupID));
        parse_index++;
    }
    if (flag & 0x0200) {
        var motion_threshold = (bytes[parse_index] / 10).toString() + 'g';
        tempList.push(getPayloadData('motion_threshold', motion_threshold, groupID));
        parse_index++;
    }
    if (flag & 0x0400) {
        var x_axis = '0x' + bytesToHexString(bytes, parse_index, 2);
        parse_index += 2;
        var y_axis = '0x' + bytesToHexString(bytes, parse_index, 2);
        parse_index += 2;
        var z_axis = '0x' + bytesToHexString(bytes, parse_index, 2);
        parse_index += 2;
        var axis_data = 'X:' + x_axis + ' Y:' + y_axis + ' Z:' + z_axis;
        tempList.push(getPayloadData('axis_data', axis_data, groupID));
    }
    if ((flag & 0x1800)) {
        var raw_data_length = bytes.length - parse_index - 1;
        var raw_data = bytesToHexString(bytes, parse_index, raw_data_length).toUpperCase();
        tempList.push(getPayloadData('raw_data', raw_data, groupID));
    }
    return tempList;
}
function parse_bxp_th_data(bytes, no_response_package, timezone, groupID) {
    var tempList = [];
    var flag = BXPTHFlag;
    var parse_index = 0;
    if (flag & 0x01) {
        var mac = bytesToHexString(bytes, parse_index, 6).toLowerCase();
        tempList.push(getPayloadData('mac', mac, groupID));
        parse_index += 6;
    }
    if (flag & 0x02) {
        var rssi = (bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('rssi', rssi, groupID));
        parse_index++;
    }
    if (flag & 0x04) {
        var timestamp = parse_time(bytesToInt(bytes, parse_index, 4), timezone * 0.5);
        tempList.push(getPayloadData('timestamp', timestamp, groupID));
        parse_index += 4;
    }
    if (flag & 0x08) {
        var tx_power = (bytes[parse_index] < 128 ? bytes[parse_index] : bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('tx_power', tx_power, groupID));
        parse_index++;
    }
    if (flag & 0x10) {
        var rangingData = bytes[parse_index];
        var ranging_data = rangingData == 0 ? '0dBm' : (rangingData - 256).toString() + 'dBm';
        tempList.push(getPayloadData('ranging_data', ranging_data, groupID));
        parse_index++;
    }
    if (flag & 0x20) {
        var adv_interval = (bytes[parse_index] * 100).toString() + 'ms';
        tempList.push(getPayloadData('adv_interval', adv_interval, groupID));
        parse_index++;
    }
    if (flag & 0x40) {
        var battery_voltage = (bytesToInt(bytes, parse_index, 2)).toString() + 'mV';
        tempList.push(getPayloadData('battery_voltage', battery_voltage, groupID));
        parse_index += 2;
    }
    // ================
    if (flag & 0x80) {
        var temperature_value = bytesToInt(bytes, parse_index, 2);
        var temperature = '';
        if (temperature_value > 0x8000)
            temperature = '-' + ((0x10000 - temperature_value) / 10).toString() + '°C';
        else {
            temperature = (temperature_value / 10).toString() + '°C';
        }
        tempList.push(getPayloadData('temperature', temperature, groupID));
        parse_index += 2;
    }
    if (flag & 0x0100) {
        var humility = (bytesToInt(bytes, parse_index, 2) / 10).toString() + '%';
        tempList.push(getPayloadData('humility', humility, groupID));
        parse_index += 2;
    }
    if ((flag & 0x0600)) {
        var raw_data_length = bytes.length - parse_index - 1;
        var raw_data = bytesToHexString(bytes, parse_index, raw_data_length).toUpperCase();
        tempList.push(getPayloadData('raw_data', raw_data, groupID));
    }
    return tempList;
}
function parse_bxp_button_data(bytes, no_response_package, timezone, groupID) {
    var tempList = [];
    var flag = BXPiBeaconFlag;
    var parse_index = 0;
    if (flag & 0x01) {
        var mac = bytesToHexString(bytes, parse_index, 6).toLowerCase();
        tempList.push(getPayloadData('mac', mac, groupID));
        parse_index += 6;
    }
    if (flag & 0x02) {
        var rssi = (bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('rssi', rssi, groupID));
        parse_index++;
    }
    if (flag & 0x04) {
        var timestamp = parse_time(bytesToInt(bytes, parse_index, 4), timezone * 0.5);
        tempList.push(getPayloadData('timestamp', timestamp, groupID));
        parse_index += 4;
    }
    if (flag & 0x08) {
        var frame_type = frameTypeArray[bytes[parse_index] & 0x03];
        tempList.push(getPayloadData('frame_type', frame_type, groupID));
        parse_index++;
    }
    if (flag & 0x10) {
        var password_verification_status = (bytes[parse_index] & 0x01) ? 'Password verification enabled' : 'Password verification disabled';
        tempList.push(getPayloadData('password_verification_status', password_verification_status, groupID));
        var alarm_triggered_status = (bytes[parse_index] & 0x02) ? 'Alarm be triggered' : 'Alarm not be triggered';
        tempList.push(getPayloadData('alarm_triggered_status', alarm_triggered_status, groupID));
        parse_index++;
    }
    if (flag & 0x20) {
        var trigger_count = bytesToInt(bytes, parse_index, 2);
        tempList.push(getPayloadData('trigger_count', trigger_count, groupID));
        parse_index += 2;
    }
    if (flag & 0x40) {
        var length = bytes[parse_index];
        parse_index++;
        var device_id = bytesToHexString(bytes, parse_index, length);
        tempList.push(getPayloadData('device_id', device_id, groupID));
        parse_index += length;
    }
    if (flag & 0x80) {
        var firmware_type = bytes[parse_index];
        tempList.push(getPayloadData('firmware_type', firmware_type, groupID));
        parse_index++;
    }
    if (flag & 0x0100) {
        var length = bytes[parse_index];
        parse_index++;
        var device_name = bytesToString(bytes, parse_index, length);
        tempList.push(getPayloadData('device_name', device_name, groupID));
        parse_index += length;
    }
    if (!no_response_package) {
        if (flag & 0x0200) {
            var full_scale = fullScaleArray[bytes[parse_index]];
            tempList.push(getPayloadData('full_scale', full_scale, groupID));
            parse_index++;
        }
        if (flag & 0x0400) {
            var motion_threshold = bytesToInt(bytes, parse_index, 2);
            tempList.push(getPayloadData('motion_threshold', motion_threshold, groupID));
            parse_index += 2;
        }
        if (flag & 0x0800) {
            var x_axis = '0x' + bytesToHexString(bytes, parse_index, 2);
            parse_index += 2;
            var y_axis = '0x' + bytesToHexString(bytes, parse_index, 2);
            parse_index += 2;
            var z_axis = '0x' + bytesToHexString(bytes, parse_index, 2);
            parse_index += 2;
            var axis_data = 'X:' + x_axis + ' Y:' + y_axis + ' Z:' + z_axis;
            tempList.push(getPayloadData('axis_data', axis_data, groupID));
        }
        if (flag & 0x1000) {
            var temperature = Number(signedHexToInt(bytesToHexString(bytes, parse_index, 2)) * 0.1).toFixed(1);
            parse_index += 2;
            tempList.push(getPayloadData('temperature', temperature, groupID));
        }
        if (flag & 0x2000) {
            var ranging_data = bytes[parse_index] == 0 ? '0dBm' : bytes[parse_index] - 256 + 'dBm';
            tempList.push(getPayloadData('ranging_data', ranging_data, groupID));
            parse_index++;
        }
        if (flag & 0x4000) {
            var battery_voltage = bytesToInt(bytes, parse_index, 2).toString() + 'mV';
            tempList.push(getPayloadData('battery_voltage', battery_voltage, groupID));
            parse_index += 2;
        }
        if (flag & 0x8000) {
            var tx_power_value = bytes[parse_index] < 128 ? bytes[parse_index] : bytes[parse_index] - 256;
            var tx_power = tx_power_value.toString() + 'dBm';
            tempList.push(getPayloadData('tx_power', tx_power, groupID));
            parse_index++;
        }
    }
    if ((flag & 0x030000)) {
        var raw_data_length = bytes.length - parse_index - 1;
        var raw_data = bytesToHexString(bytes, parse_index, raw_data_length).toUpperCase();
        tempList.push(getPayloadData('raw_data', raw_data, groupID));
    }
    return tempList;
}
function parse_bxp_tag_data(bytes, no_response_package, timezone, groupID) {
    var tempList = [];
    var flag = BXPTHFlag;
    var parse_index = 0;
    if (flag & 0x01) {
        var mac = bytesToHexString(bytes, parse_index, 6).toLowerCase();
        tempList.push(getPayloadData('mac', mac, groupID));
        parse_index += 6;
    }
    if (flag & 0x02) {
        var rssi = (bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('rssi', rssi, groupID));
        parse_index++;
    }
    if (flag & 0x04) {
        var timestamp = parse_time(bytesToInt(bytes, parse_index, 4), timezone * 0.5);
        tempList.push(getPayloadData('timestamp', timestamp, groupID));
        parse_index += 4;
    }
    if (flag & 0x08) {
        var hall_sensor_status = bytes[parse_index] & 0x01 ? 'Magnet away/absent' : 'Magnet approach/present';
        tempList.push(getPayloadData('hall_sensor_status', hall_sensor_status, groupID));
        var accelerometer_sensor_status = bytes[parse_index] & 0x02 ? 'In move' : 'In static';
        tempList.push(getPayloadData('accelerometer_sensor_status', accelerometer_sensor_status, groupID));
        var accelerometer_sensor_equipped_status = bytes[parse_index] & 0x04 ? 'Equipped' : 'Not equipped';
        tempList.push(getPayloadData('accelerometer_sensor_equipped_status', accelerometer_sensor_equipped_status, groupID));
        parse_index++;
    }
    if (flag & 0x10) {
        var hall_trigger_event_count = bytesToInt(bytes, parse_index, 2);
        tempList.push(getPayloadData('hall_trigger_event_count', hall_trigger_event_count, groupID));
        parse_index += 2;
    }
    if (flag & 0x20) {
        var motion_trigger_event_count = bytesToInt(bytes, parse_index, 2);
        tempList.push(getPayloadData('motion_trigger_event_count', motion_trigger_event_count, groupID));
        parse_index += 2;
    }
    if (flag & 0x40) {
        var x_axis = '0x' + bytesToHexString(bytes, parse_index, 2);
        parse_index += 2;
        var y_axis = '0x' + bytesToHexString(bytes, parse_index, 2);
        parse_index += 2;
        var z_axis = '0x' + bytesToHexString(bytes, parse_index, 2);
        parse_index += 2;
        var axis_data = 'X:' + x_axis + ' Y:' + y_axis + ' Z:' + z_axis;
        tempList.push(getPayloadData('axis_data', axis_data, groupID));
    }
    if (flag & 0x80) {
        var battery_voltage = bytesToInt(bytes, parse_index, 2) + 'mV';
        tempList.push(getPayloadData('battery_voltage', battery_voltage, groupID));
        parse_index += 2;
    }
    if (flag & 0x0100) {
        var length = bytes[parse_index];
        parse_index++;
        var tag_id = bytesToHexString(bytes, parse_index, length);
        tempList.push(getPayloadData('tag_id', tag_id, groupID));
        parse_index += length;
    }
    if (!no_response_package) {
        if (flag & 0x0200) {
            var length = bytes[parse_index];
            parse_index++;
            var device_name = bytesToString(bytes, parse_index, length);
            tempList.push(getPayloadData('device_name', device_name, groupID));
            parse_index += length;
        }
    }
    if ((flag & 0x0C00)) {
        var raw_data_length = bytes.length - parse_index - 1;
        var raw_data = bytesToHexString(bytes, parse_index, raw_data_length).toUpperCase();
        tempList.push(getPayloadData('raw_data', raw_data, groupID));
    }
    return tempList;
}
function parse_other_type_data(bytes, no_response_package, timezone, groupID) {
    var tempList = [];
    var flag = BXPTHFlag;
    var parse_index = 0;
    if (flag & 0x01) {
        var mac = bytesToHexString(bytes, parse_index, 6).toLowerCase();
        tempList.push(getPayloadData('mac', mac, groupID));
        parse_index += 6;
    }
    if (flag & 0x02) {
        var rssi = (bytes[parse_index] - 256).toString() + 'dBm';
        tempList.push(getPayloadData('rssi', rssi, groupID));
        parse_index++;
    }
    if (flag & 0x04) {
        var timestamp = parse_time(bytesToInt(bytes, parse_index, 4), timezone * 0.5);
        tempList.push(getPayloadData('timestamp', timestamp, groupID));
        parse_index += 4;
    }
    var blockNum = bytes[parse_index];
    parse_index++;
    for (var i = 0; i < blockNum; i++) {
        var firstByte = bytes[parse_index];
        parse_index++;
        var tempLength = firstByte & 0x3F;
        var code = (firstByte >> 6) & 0x03;
        var tempBytes = bytes.slice(parse_index, parse_index + tempLength);
        var type = bytesToHexString(tempBytes, 0, 1).toUpperCase();
        tempList.push(getPayloadData('block_' + i.toString() + '_type', type, groupID));
        if (code == 0) {
            var data = bytesToHexString(tempBytes, 1, tempBytes.length - 1).toUpperCase();
            tempList.push(getPayloadData('block_' + i.toString() + '_datar', data, groupID));
        }
        else if (code == 1) {
            tempList.push(getPayloadData('block_' + i.toString() + '_error', 'type error', groupID));
        }
        else if (code == 2) {
            tempList.push(getPayloadData('block_' + i.toString() + '_error', 'length error', groupID));
        }
        parse_index += tempLength;
    }
    if ((flag & 0x18)) {
        var raw_data_length = bytes.length - parse_index - 1;
        var raw_data = bytesToHexString(bytes, parse_index, raw_data_length).toUpperCase();
        tempList.push(getPayloadData('raw_data', raw_data, groupID));
    }
    return tempList;
}
/*
    整型数组指定部分转换成对应的Hex字符串
    bytes:里面全部为整数,
    start:开始转换的位置
    len:需要转换的长度
*/
function bytesToHexString(bytes, start, len) {
    if (bytes.length == 0 || start >= bytes.length || (start + len) > bytes.length)
        return '';
    var hexStr = '';
    for (var i = 0; i < len; i++) {
        var tempBytes = bytes[start + i];
        var data = tempBytes.toString(16);
        if (tempBytes < 16) {
            data = '0' + data;
        }
        hexStr += data;
    }
    return hexStr;
}
/*
    整型数组指定部分十六进制转换成对应的10进制整数
    bytes:里面全部为整数,
    start:开始转换的位置
    len:需要转换的长度
*/
function bytesToInt(bytes, start, len) {
    if (bytes.length == 0 || start >= bytes.length || (start + len) > bytes.length)
        return 0;
    var value = 0;
    for (var i = 0; i < len; i++) {
        var m = ((len - 1) - i) * 8;
        value = value | bytes[start + i] << m;
    }
    return value;
}
function timezone_decode(tz) {
    var tz_str = 'UTC';
    tz = tz > 128 ? tz - 256 : tz;
    if (tz < 0) {
        tz_str += '-';
        tz = -tz;
    }
    else {
        tz_str += '+';
    }
    if (tz < 20) {
        tz_str += '0';
    }
    tz_str += String(tz / 2);
    tz_str += ':';
    if (tz % 2) {
        tz_str += '30';
    }
    else {
        tz_str += '00';
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
    var time_str = '';
    time_str += d.getUTCFullYear();
    time_str += '-';
    time_str += formatNumber(d.getUTCMonth() + 1);
    time_str += '-';
    time_str += formatNumber(d.getUTCDate());
    time_str += ' ';
    time_str += formatNumber(d.getUTCHours());
    time_str += ':';
    time_str += formatNumber(d.getUTCMinutes());
    time_str += ':';
    time_str += formatNumber(d.getUTCSeconds());
    return time_str;
}
function formatNumber(number) {
    return number < 10 ? '0' + number.toString() : number.toString();
}
/*
    有符号十六进制字符串转十进制
*/
function signedHexToInt(hexStr) {
    var twoStr = parseInt(hexStr, 16).toString(2); // 将十六转十进制，再转2进制
    
    var bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 'f'就是4位
    if (twoStr.length < bitNum) {
        while (twoStr.length < bitNum) {
            twoStr = '0' + twoStr;
        }
    }
    if (twoStr.substring(0, 1) == '0') {
        // 正数
        return parseInt(twoStr, 2); // 二进制转十进制
    }
    // 负数
    var twoStr_unsign = '';
    var tempValue = parseInt(twoStr, 2) - 1; // 补码：(负数)反码+1，符号位不变；相对十进制来说也是 +1，但这里是负数，+1就是绝对值数据-1
    twoStr_unsign = tempValue.toString(2).substring(1, bitNum); // 舍弃首位(符号位)
    // 去除首字符，将0转为1，将1转为0   反码
    twoStr_unsign = twoStr_unsign.replace(/0/g, 'z');
    twoStr_unsign = twoStr_unsign.replace(/1/g, '0');
    twoStr_unsign = twoStr_unsign.replace(/z/g, '1');
    return parseInt('-' + twoStr_unsign, 2);
}
function getPayloadData(type, value, groupID) {
    return {
        'variable': type,
        'value': value,
        'group': groupID,
    };
}
var payloadd = payload.find(function (x) { return ["payload_raw", "payload", "data"].includes(x.variable); });
var portt = payload.find(function (x) { return ["port", "fport", "f_port"].includes(x.variable); });
if (payloadd.value && portt.value) {
    try {
        // Convert the data from Hex to Javascript Buffer.
        var buffer = hexToNumberArray(payloadd.value);
        // payload.push(...Decoder(buffer, port.value, payload_raw.group));
        payload = payload.concat(Decoder(buffer, portt.value, payloadd.group));
    }
    catch (e) {
        
    }
}
function hexToNumberArray(hexString) {
    var buffer = Buffer.from(hexString, 'hex');
    return Array.from(buffer, function (byte) { return byte; });
}
