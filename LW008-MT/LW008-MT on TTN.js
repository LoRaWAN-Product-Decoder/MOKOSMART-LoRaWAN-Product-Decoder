
function Decoder(bytes, port) {
    if (bytes.length < 4) {
        return {};
    }
    if (port == 12) {
        //Port 12 极限GPS数据包
        return parse_port12_data(bytes,port);
    }
    var deviceInfo = {};
    //Port
    deviceInfo['port'] = port;
    var workBytes = [bytes[0] & 0x03];
    //工作模式   
    deviceInfo['work_mode'] = bytesToInt(workBytes,0,1);
    //低电状态
    deviceInfo['low_power'] = ((bytes[0] & 0x04) == 0x04);
    //闲置状态
    deviceInfo['idle_state'] = ((bytes[0] & 0x08) == 0x08);
    //移动状态
    deviceInfo['move_state'] = ((bytes[0] & 0x10) == 0x10);
    //定位状态
    deviceInfo['positioning_state'] = ((bytes[0] & 0x20) == 0x20);
    //温度
    var temperature = signedHexToInt(bytesToHexString(bytes,1,1)) + '°C';
    deviceInfo['temperature'] = temperature;
    //帧序号
    var indexValue = [bytes[2] & 0x0f];
    deviceInfo['index'] = bytesToInt(indexValue,0,1);

    var data_dic = {};
    if (port == 1 && (bytes.length == 9)) {
        //Port 1 心跳包
        data_dic = parse_port1_data(bytes.slice(3),port);
    }else if (port == 2 && (bytes.length >= 7)) {
        //Port 2 定位成功数据包
        data_dic = parse_port2_data(bytes.slice(3),port);
    }else if (port == 4 && (bytes.length >= 5)) {
        //Port 4 定位失败数据包
        data_dic = parse_port4_data(bytes.slice(3),port);
    }else if (port == 5 && (bytes.length == 4)) {
        //Port 5 关机信息
        /*
        关机方式:
            0：蓝牙指令关机
            1：lorawan指令关机
            2：电源键关机
            3：低电关机 
        */
        data_dic = {
            'shutdown_type':bytesToInt(bytes,3,1),
        };
    }else if (port == 6 && (bytes.length == 5)) {
        //Port 6 震动检测信息包
        data_dic = {
            'vibrations_number':bytesToInt(bytes,3,2),
        };
    }else if (port == 7 && (bytes.length == 5)) {
        //Port 7 闲置检测包
        data_dic = {
            'idle_time':bytesToInt(bytes,3,2),
        };
    }else if (port == 8 && (bytes.length == 4)) {
        //Port 8 事件信息包
        data_dic = {
            'event_type':bytesToInt(bytes,3,1),
        };
    }else if (port == 9 && (bytes.length == 43)) {
        //Port 9 电池消耗包
        data_dic = parse_port9_data(bytes.slice(3),port);
    }

    deviceInfo['data'] = data_dic;
    console.log(deviceInfo);


    return deviceInfo;
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
    for (let i = 0; i < len; i++) {
        var m = ((len - 1) - i) * 8;
        value = value | bytes[start + i] << m;
    }
    // var value = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | (bytes[start + 3]));
    return value;
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
    time_str += d.getUTCMonth() + 1;
    time_str += "/";
    time_str += d.getUTCDate();
    time_str += " ";

    time_str += d.getUTCHours();
    time_str += ":";
    time_str += d.getUTCMinutes();
    time_str += ":";
    time_str += d.getUTCSeconds()

    return time_str;
}

function signedHexToInt(hexStr) {
    let twoStr = parseInt(hexStr,16).toString(2); // 将十六转十进制，再转2进制
    let bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 "f"就是4位
    if(twoStr.length < bitNum){
      while(twoStr.length < bitNum){
        twoStr = "0" + twoStr;
      }
    }
    if(twoStr.substring(0,1) == "0"){
      // 正数
      twoStr = parseInt(twoStr,2); // 二进制转十进制
      return twoStr;
    }
    // 负数
    let twoStr_unsign = "";
    twoStr = parseInt(twoStr,2) - 1; // 补码：(负数)反码+1，符号位不变；相对十进制来说也是 +1，但这里是负数，+1就是绝对值数据-1
    twoStr = twoStr.toString(2);
    twoStr_unsign = twoStr.substring(1,bitNum); // 舍弃首位(符号位)
    // 去除首字符，将0转为1，将1转为0   反码
    twoStr_unsign = twoStr_unsign.replace(/0/g, "z");
    twoStr_unsign = twoStr_unsign.replace(/1/g, "0");
    twoStr_unsign = twoStr_unsign.replace(/z/g, "1");
    twoStr = parseInt(-twoStr_unsign, 2);
    return twoStr;
}

String.prototype.format = function () {
    if (arguments.length == 0)
        return this;
    for (var s = this, i = 0; i < arguments.length; i++)
        s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
    return s;
};


/*********************Port Parse*************************/
function parse_port1_data (bytes, port) {
    if (bytes.length != 6 || port != 1) {
        return {};
    }
    //Port 1 心跳
    //0:断电重启 1:蓝牙指令重启 2:lorawan配置重启 3:切换到OFF模式重启
    var reboot_reason = bytesToInt(bytes,0,1);
    //固件版本
    var majorVersion = [(bytes[1] >> 6) & 0x03];
    var minorVersion = [(bytes[1] >> 4) & 0x03];
    var patchVersion = [bytes[1] & 0x0f];
    var firmware_version = 'V' + bytesToInt(majorVersion,0,1) + '.' + bytesToInt(minorVersion,0,1) + '.' + bytesToInt(patchVersion,0,1);
    //活动计数差值
    var activity_count = bytesToInt(bytes,2,4);
    return {
        'reboot_reason':reboot_reason,
        'firmware_version':firmware_version,
        'activity_count':activity_count,
    };
}

function parse_port2_data (bytes, port) {
    //Port 2 定位成功
    if (bytes.length < 4 || port != 2) {
        return {};
    }
    //定位成功的时间与上报间隔之间的时间差
    var time_space = bytesToInt(bytes,0,2);
    //定位成功类型
    /*
        0：WIFI定位成功包（跟定位数据）
        1：WIFI定位成功标志（不跟定位数据，数据通过199端口发送）
        2：蓝牙定位成功包
        3：GPS定位成功包（L76C）
        4：GNSS定位成功包(LR1110)
        5：GNSS定位成功标志（LR1110）
    */
    var position_type = bytesToInt(bytes,2,1);
    var position_data = parse_position_data(bytes.slice(4),position_type);
    return {
        'time_space':time_space,
        'position_type':position_type,
        'position_data':position_data
    };
}

function parse_port4_data (bytes, port) {
    //定位失败
    if (bytes.length < 2 || port != 4) {
        return {};
    }
    //定位失败原因
    /*
        0：WIFI定位时间超时
        1：WIFI定位技术超时
        2：WIFI定位蓝牙广播失败
        3：蓝牙定位时间超时
        4：蓝牙定位技术超时
        5：蓝牙广播不使用蓝牙定位
        6：GNSS定位时间超时
        7：GNSS定位技术超时
        8：GNSS辅助定位超时
        9：GNSS辅助定位星历太旧
        10：PDOP限制
        11：下行定位打断
        12：运动开始定位被运动结束打断
        13：运动结束定位被运动开始打断
    */
    var failed_type = bytesToInt(bytes,0,1);
    //后续数据长度
    var data_len = bytesToInt(bytes,1,1);
    var data_bytes = bytes.slice(2);
    if (failed_type == 0 || failed_type == 1 || failed_type == 2
        || failed_type == 3 || failed_type == 4 || failed_type == 5) {
            var number = (data_len / 7);
            var data_list = [];
            for (var i = 0; i < number; i ++) {
                var sub_bytes = data_bytes.slice((i * 7),(i * 7 + 8));
                var mac_address = bytesToHexString(sub_bytes,0,6);
                var rssi = bytesToInt(sub_bytes,6,1) - 256 + 'dBm';
                var data_dic = {
                    'mac_address':mac_address,
                    'rssi':rssi
                };  
                data_list.push(data_dic);
            }
        return {
            'failed_type':failed_type,
            'data_list':data_list
        }; 
    }
    var data_list = [];
    for (var i = 0;i < data_len; i ++) {
        var stringValue = bytesToHexString(data_bytes,(i * 1),1);
        data_list.push(stringValue);
    }
    return {
        'failed_type':failed_type,
        'data_list':data_list
    };
}

function parse_port9_data (bytes, port) {
    if (bytes.length != 40 || port != 9) {
        return {};
    }
    //设备工作时间
    var work_times = bytesToInt(bytes,0,4);
    //蓝牙广播次数
    var adv_times = bytesToInt(bytes,4,4);
    //Flash读写次数
    var flash_write_times = bytesToInt(bytes,8,4);
    //三轴唤醒时长
    var axis_wakeup_times = bytesToInt(bytes,12,4);
    //蓝牙定位时长
    var ble_postion_times = bytesToInt(bytes,16,4);
    //WIFI定位时长
    var wifi_postion_times = bytesToInt(bytes,20,4);
    //GPS定位时长
    var gps_postion_times = bytesToInt(bytes,24,4);
    //lorawan发送次数
    var lora_send_times = bytesToInt(bytes,28,4);
    //lorawan发送接收功耗
    var lora_power = bytesToInt(bytes,32,4);
    //电池总消耗
    var battery_value = bytesToInt(bytes,36,4);
    return {
        'work_times':work_times,
        'adv_times':adv_times,
        'flash_write_times':flash_write_times,
        'axis_wakeup_times':axis_wakeup_times,
        'ble_postion_times':ble_postion_times,
        'wifi_postion_times':wifi_postion_times,
        'gps_postion_times':gps_postion_times,
        'lora_send_times':lora_send_times,
        'lora_power':lora_power,
        'battery_value':battery_value
    };
}

function parse_port12_data (bytes, port) {
    //Port 12 极限GPS数据包
    if (port != 12 || (bytes.length != 11)) {
        return {};
    }
    var data_dic = {'port':port};
    //设备状态
    var work_bytes = [bytes[0] & 0x03];
    //工作模式   
    data_dic['work_mode'] = bytesToInt(work_bytes,0,1);
    //低电状态
    data_dic['low_power'] = ((bytes[0] & 0x04) == 0x04);
    //闲置状态
    data_dic['idle_state'] = ((bytes[0] & 0x08) == 0x08);
    //移动状态
    data_dic['move_state'] = ((bytes[0] & 0x10) == 0x10);
    //定位状态
    data_dic['positioning_state'] = ((bytes[0] & 0x20) == 0x20);

    var sub_dic = {};

    //电池与下行技术
    var ack_bytes = [bytes[1] & 0x0f];
    //ACK
    sub_dic['ack'] = bytesToInt(ack_bytes,0,1);
    var battery_bytes = [(bytes[1] >> 4) & 0x0f];
    sub_dic['battery_value'] = bytesToInt(battery_bytes,0,1) * 0.1 + 2.2;

    //纬度
    sub_dic['latitude'] = Number(signedHexToInt(bytesToHexString(bytes,2,4)) * 0.0000001).toFixed(7)
    + '°';
    //经度
    sub_dic['longitude'] = Number(signedHexToInt(bytesToHexString(bytes,6,4)) * 0.0000001).toFixed(7)
    + '°';
    //PDOP
    sub_dic['podp'] = bytesToInt(bytes,10,1);

    data_dic['data'] = sub_dic;
    console.log(data_dic);
    return data_dic;
}

function parse_position_data (bytes,type) {
    if (((type == 0) || (type == 2))) {
        //type=0:WIFI定位成功数据
        //type=2://蓝牙定位成功数据
        var number = (bytes.length / 7);
        var data_list = [];
        for (var i = 0; i < number; i ++) {
            var sub_bytes = bytes.slice((i * 7),(i * 7 + 8));
            var mac_address = bytesToHexString(sub_bytes,0,6);
            var rssi = bytesToInt(sub_bytes,6,1) - 256 + 'dBm';
            var data_dic = {
                'mac_address':mac_address,
                'rssi':rssi
            }; 
            data_list.push(data_dic);
        }
        return data_list;
    }
    if (type == 3) {
        //GPS定位成功数据
        //L76C定位成功数据，实际位置经纬度
        var number = (bytes.length / 9);
        var data_list = [];
        for (var i = 0; i < number; i ++) {
            var sub_bytes = bytes.slice((i * 9),(i * 9 + 10)); 
            var latitude = Number(signedHexToInt(bytesToHexString(sub_bytes,0,4)) * 0.0000001).toFixed(7)
             + '°';
            var longitude = Number(signedHexToInt(bytesToHexString(sub_bytes,4,4)) * 0.0000001).toFixed(7) + '°';
            var podp = bytesToInt(sub_bytes,8,1) * 0.1;
            var data_dic = {
                'latitude':latitude,
                'longitude':longitude,
                'podp':podp
            };
            data_list.push(data_dic);
        } 
        return data_list;
    }
    if (type == 4) {
        //GNSS定位成功数据
        return bytes;
    }
    //WIFI定位成功标志
    //WIFI定位成功事件，后续定位数据通过199端口通过stream协议发送
    //GNSS定位成功标志
    //GNSS定位成功事件，后续定位数据，DAS数据通过Port199端口stream协议发送
    return [];
}
/*********************Port Parse*************************/

var port_data1 = [0xf5,0xe4,0xa0,0x03,0x43,0x00,0x00,0xff,0xff];
Decoder(port_data1,1);

var port_data2 = [0xf5,0xe5,0xa0,0x00,0x64,0x00,0x0e,0xaa,0xbb,0xaa,0xbb,0xaa,0xbb,0xe4,0xaa,0xbb,0xaa,0xbb,0xaa,0xbb,0xe5];
var port_data22 = [0xf5,0xe5,0xa0,0x00,0x64,0x01,0x00];
var port_data222 = [0xf5,0xe5,0xa0,0x00,0x64,0x03,0x12,0xff,0xff,0xff,0x00,0xaa,0xbb,0x00,0x00,0x0f,0xf0,0xff,0xff,0x00,0xa0,0xbb,0x00,0x00,0x0d];
Decoder(port_data2,2);
Decoder(port_data22,2);
Decoder(port_data222,2);

var port_data4 = [0xf5,0xe5,0xa0,0x00,0x0e,0xaa,0xbb,0xaa,0xbb,0xaa,0xbb,0xe4,0xaa,0xbb,0xaa,0xbb,0xaa,0xbb,0xe5];
var port_data44 = [0xf5,0xe5,0xa0,0x06,0x0e,0xaa,0xbb,0xaa,0xbb,0xaa,0xbb,0xe4,0xaa,0xbb,0xaa,0xbb,0xaa,0xbb,0xe5];
Decoder(port_data4,4);
Decoder(port_data44,4);

var port_data5 = [0xf5,0xe5,0xa0,0x01];
var port_data55 = [0xf5,0xe5,0xa0,0x03];
Decoder(port_data5,5);
Decoder(port_data55,5);

var port_data6 = [0xf5,0xe5,0xa0,0x01,0x01];
Decoder(port_data6,6);

var port_data7 = [0xf5,0xe5,0xa0,0x00,0x64];
Decoder(port_data7,7);

var port_data8 = [0xf5,0xe5,0xa0,0x01];
Decoder(port_data8,8);

var port_data9 = [0xf5,0xe5,0xa0,0x00,0x00,0x00,0x64,0x00,0x00,0x00,0x65,0x00,0x00,0x00,0x66,0x00,0x00,0x00,0x67,0x00,0x00,0x00,0x68,0x00,0x00,0x00,0x69,0x00,0x00,0x00,0x6a,0x00,0x00,0x00,0x6b,0x00,0x00,0x00,0x6c,0x00,0x00,0x00,0x6d];
Decoder(port_data9,9);

var port_data12 = [0xf4,0xa3,0xff,0xff,0xff,0x00,0x0f,0xff,0xff,0x00,0x0a];
Decoder(port_data12,12);