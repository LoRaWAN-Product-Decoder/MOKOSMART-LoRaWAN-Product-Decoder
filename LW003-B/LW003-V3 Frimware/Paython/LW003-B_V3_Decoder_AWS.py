import base64,struct,datetime,time,binascii
from decimal import Decimal
from datetime import datetime, timedelta, timezone


# according dev configure how report data format choose, this iBeaconFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have UUID
# bit 4 have Major
# bit 5 have Minor
# bit 6 have RSSI@1M
# bit 7 have Adv raw data
# bit 8 have Response raw data
iBeacon_flag = 0x01FF


# according dev configure how report data format choose, this EddystoneUIDFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have RSSI@0M
# bit 4 have Namespace
# bit 5 have Instance
# bit 6 have Adv raw data
# bit 7 have Response raw data
eddystone_uid_flag = 0xFF

# according dev configure how report data format choose, this EddystoneURLFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have RSSI@0M
# bit 4 have URL
# bit 5 have Adv raw data
# bit 6 have Response raw data
eddystone_url_flag = 0x7F

# according dev configure how report data format choose, this EddystoneTLMFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have TLM Version
# bit 4 have Battery Voltage
# bit 5 have Temperature
# bit 6 have ADV_CNT
# bit 7 have SEC_CNT
# bit 8 have Adv raw data
# bit 9 have Response raw data
eddystone_tlm_flag = 0x03FF

# according dev configure how report data format choose, this BXPiBeaconFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have UUID
# bit 4 have Major
# bit 5 have Minor
# bit 6 have RSSI@1M
# bit 7 have TX Power
# bit 8 have ADV Interval
# bit 9 have Adv raw data
# bit 10 have Response raw data
bxp_iBeacon_flag = 0x03FF

# according dev configure how report data format choose, this BXPDeviceInfoFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have TX Power
# bit 4 have Ranging Data
# bit 5 have ADV Interval
# bit 6 have Battery Voltage
# bit 7 have Device Property
# bit 8 have Switch Status
# bit 9 have Firmware Version
# bit 10 have Device Name
# bit 11 have Adv raw data
# bit 12 have Response raw data
bxp_device_info_flag = 0x07FF

# according dev configure how report data format choose, this BXPACCFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have TX Power
# bit 4 have Ranging Data
# bit 5 have ADV Interval
# bit 6 have Sample Rate
# bit 7 have Full Scale
# bit 8 have Motion Threshold
# bit 9 have 3-axis Data
# bit 10 have Battery Voltage
# bit 11 have Adv raw data
# bit 12 have Response raw data
bxp_acc_flag = 0x1fFF

# according dev configure how report data format choose, this BXPTHFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have TX Power
# bit 4 have Ranging Data
# bit 5 have ADV Interval
# bit 6 have Temperature
# bit 7 have Humidity
# bit 8 have Battery Voltage
# bit 9 have Adv raw data
# bit 10 have Response raw data
bxp_th_flag = 0x07FF

# according dev configure how report data format choose, this BXPButtonFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have Frame Type
# bit 4 have Status Flag
# bit 5 have Trigger Count
# bit 6 have Devcie ID
# bit 7 have Firmware Type
# bit 8 have Device Name
# bit 9 have Full Scale
# bit 10 have Motion Threshold
# bit 11 have 3-axis Data
# bit 12 have Temperature
# bit 13 have Ranging Data
# bit 14 have Battery Voltage
# bit 15 have TX Power
# bit 16 have Adv raw data
# bit 17 have Response raw data
bxp_button_flag = 0x03FFFF

# according dev configure how report data format choose, this BXPTagFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have Sensor Status
# bit 4 have Hall Trigger Event Count
# bit 5 have Motion Trigger Event Count
# bit 6 have 3-axis Data
# bit 7 have Battery Voltage
# bit 8 have Tag ID
# bit 9 have Device Name
# bit 10 have Adv raw data
# bit 11 have Response raw data
bxp_tag_flag = 0x03FF

# according dev configure how report data format choose, this OtherTypeFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have Adv raw data
# bit 4 have Response raw data

other_type_flag = 0x07

turnOff_mode = ['Bluetooth', 'LoRa', 'Button', 'Low Battery'];
info_type = ['Heartbeat', 'Low power triggers reporting', 'Downlink triggers reporting'];

def dict_from_payload(base64_input: str, fport: int = None):
    if fport == 1:
        return parse_port1(base64_input)
    if fport == 2:
        return parse_port2(base64_input)
    if fport == 3:
        return parse_port3(base64_input)
    if fport == 4:
        return parse_port4(base64_input)
    if fport == 5:
        return parse_port5(base64_input)

    return {}

#Port1 解析
def parse_port1(content:str):
    if check_hex(content) == False or (len(content) != 12 and len(content) != 20):
        return param_errorDic

    result_dic = {
        "message":"Success",
        "code":0,
    }
    #电池充电状态
    battery_binary = hex_binary(content[0:2])
    result_dic['charged'] = (battery_binary[0] == '1')
    #电池电量
    result_dic['battery_percentage'] = str(int(('0' + battery_binary[1:]), 2)) + '%'
    #电池电压
    result_dic['voltage'] = str(int(content[2:6],16)) + 'mV'
    #固件版本
    firmware = hex_binary(content[6:8])
    result_dic['firmware'] = 'V' + str(int('000000' + firmware[0:2],2)) + '.' \
                            + str(int('000000' + firmware[2:4],2)) + '.' \
                            + str(int('0000' + firmware[4:],2))
    #硬件版本
    hardware = hex_binary(content[8:10])
    result_dic['hardware'] = 'V' + str(int('0000' + hardware[0:4], 2)) + '.' \
                            + str(int('0000' + hardware[4:], 2))

    #先判断是否有温湿度
    if len(content) == 20:
        # 有温湿度
        result_dic['temperature'] = ('%.2f' % (hex_decimal(content[10:14],16) * 0.01)) + '°C'
        result_dic['humidity'] = ('%.2f' % (int(content[14:18],16) * 0.01)) + '%'
        result_dic['time_zone'] = parse_timezone(content[18:])
    else:
        result_dic['time_zone'] = parse_timezone(content[10:])

    print('Port1 Data')
    print(result_dic)
    return result_dic


def parse_port2(content:str):
    if check_hex(content) == False or len(content) != 18:
        return param_errorDic

    result_dic = {
        "message":"Success",
        "code":0,
    }
    # 电池充电状态
    battery_binary = hex_binary(content[0:2])
    result_dic['charged'] = (battery_binary[0] == '1')
    # 电池电量
    result_dic['battery_percentage'] = str(int(('0' + battery_binary[1:]), 2)) + '%'
    # 电池电压
    result_dic['voltage'] = str(int(content[2:6], 16)) + 'mV'
    # 时间戳
    result_dic['timestamp'] = parse_timestamp(content[6:14],hex_decimal(content[14:16],8))
    # 时区
    result_dic['time_zone'] = parse_timezone(content[14:16])
    # 关机方式 0:蓝牙指令关机 1:lora下行指令关机 2:长按按键5s关机 3:电池没电关机
    result_dic['shutdown_type'] = turnOff_mode[int(content[16:], 16)]

    print('Port2 Data')
    print(result_dic)
    return result_dic

def parse_port3(content:str):
    if check_hex(content) == False or (len(content) != 14 and len(content) != 22):
        return param_errorDic

    result_dic = {
        "message":"Success",
        "code":0,
    }
    #电池充电状态
    battery_binary = hex_binary(content[0:2])
    result_dic['charged'] = (battery_binary[0] == '1')
    #电池电量
    result_dic['battery_percentage'] = str(int(('0' + battery_binary[1:]), 2)) + '%'
    #电池电压
    result_dic['voltage'] = str(int(content[2:6],16)) + 'mV'
    #固件版本
    firmware = hex_binary(content[6:8])
    result_dic['firmware'] = 'V' + str(int('000000' + firmware[0:2],2)) + '.' \
                            + str(int('000000' + firmware[2:4],2)) + '.' \
                            + str(int('0000' + firmware[4:],2))
    #硬件版本
    hardware = hex_binary(content[8:10])
    result_dic['hardware'] = 'V' + str(int('0000' + hardware[0:4], 2)) + '.' \
                            + str(int('0000' + hardware[4:], 2))

    #先判断是否有温湿度
    if len(content) == 22:
        # 有温湿度
        result_dic['temperature'] = ('%.2f' % (hex_decimal(content[10:14], 16) * 0.01)) + '°C'
        result_dic['humidity'] = ('%.2f' % (int(content[14:18], 16) * 0.01)) + '%'
        result_dic['time_zone'] = parse_timezone(content[18:20])
        result_dic['data_type'] = info_type[int(content[20:], 16)]
    else:
        result_dic['time_zone'] = parse_timezone(content[10:12])
        result_dic['data_type'] = info_type[int(content[12:], 16)]

    print('Port3 Data')
    print(result_dic)
    return result_dic


def parse_port4(content:str):
    if check_hex(content) == False or len(content) != 22:
        return param_errorDic

    result_dic = {
        "message":"Success",
        "code":0,
    }
    #电池充电状态
    battery_binary = hex_binary(content[0:2])
    result_dic['charged'] = (battery_binary[0] == '1')
    #电池电量
    result_dic['battery_percentage'] = str(int(('0' + battery_binary[1:]), 2)) + '%'
    #被打断的扫描周期开始时间点
    # 时间戳
    result_dic['scan_timestamp'] = parse_timestamp(content[2:10],hex_decimal(content[10:12],8))
    # 时区
    result_dic['scan_timezone'] = parse_timezone(content[10:12])
    # 被广播打断的时间点
    # 时间戳
    result_dic['stop_timestamp'] = parse_timestamp(content[12:20],hex_decimal(content[20:22],8))
    # 时区
    result_dic['stop_timezone'] = parse_timezone(content[20:22])

    print('Port4 Data')
    print(result_dic)

    return result_dic

def parse_port5(content:str):

    if check_hex(content) == False or len(content) < 14:
        return param_errorDic
    result_dic = {
        "message": "Success",
        "code": 0,
    }
    result_dic['index'] = str(int(content[0:2], 16))
    result_dic['timestamp'] = parse_timestamp(content[2:10],hex_decimal(content[10:12],8))
    result_dic['timezone'] = parse_timezone(content[10:12])
    total_number = int(content[12:14], 16)
    result_dic['total_number'] = str(total_number)
    sub_content = content[14:]
    index = 0
    data_list = []
    if total_number > 0:
        while total_number > 0:
            temp_binary = hex_binary(sub_content[index:(index + 2)])
            index += 2

            temp_len = int(('0' + temp_binary[1:]), 2)
            temp_content = sub_content[index:(index + 2 * temp_len)]
            dic = parse_beacon_datas(temp_content,(temp_binary[0] == '0'),hex_decimal(content[10:12],8))
            # if (temp_binary[0] == '1'):
            #     dic['respons'] = 'Part data not reported'
            # else:
            #     dic['respons'] = 'Data reported normal'
            data_list.append(dic)
            index += (2 * temp_len)
            total_number -= 1

    result_dic['data_list'] = data_list

    print('Port5 Data')
    print(result_dic)

    return result_dic


def parse_beacon_datas(content:str,reported:bool,timezone:int):
    if check_hex(content) == False or (len(content) % 2 != 0):
        return {}
    data_type = int(content[0:2], 16)
    if data_type == 0:
        # iBeacon
        return parse_beacon(content[2:],beacon_flag_parse(iBeacon_flag,4) ,timezone)
    if data_type == 1:
        #Eddystone-UID
        return parse_eddystone_uid(content[2:],beacon_flag_parse(eddystone_uid_flag,2),timezone)
    if data_type == 2:
        #Eddystone-URL:
        return parse_eddystone_url(content[2:],beacon_flag_parse(eddystone_url_flag,2),timezone)
    if data_type == 3:
        #Eddystone-TLM
        return parse_eddystone_tlm(content[2:],beacon_flag_parse(eddystone_tlm_flag,4),timezone)
    if data_type == 4:
        #BXP-iBeacon
        tempValue = bxp_iBeacon_flag
        if (reported == False):
            tempValue = bxp_iBeacon_flag & 0x0e07

        return parse_bxp_beacon(content[2:],beacon_flag_parse(tempValue,4),timezone)
    if data_type == 5:
        #BXP-DeviceInfo
        tempValue = bxp_device_info_flag
        if (reported == False):
            tempValue = bxp_device_info_flag & 0x0bff
        return parse_bxp_deviceInfo(content[2:],beacon_flag_parse(tempValue,4),timezone)
    if data_type == 6:
        #BXP-ACC
        return parse_bxp_acc(content[2:],beacon_flag_parse(bxp_acc_flag,4),timezone)
    if data_type == 7:
        #BXP-T&H
        return parse_bxp_th(content[2:],beacon_flag_parse(bxp_th_flag,4),timezone)
    if data_type == 8:
        #BXP-Button
        tempValue = bxp_button_flag
        if (reported == False):
            tempValue = bxp_button_flag & 0x0301ff
        return parse_bxp_button(content[2:],beacon_flag_parse(tempValue,6),timezone)
    if data_type == 9:
        #BXP-Tag
        tempValue = bxp_tag_flag
        if (reported == False):
            tempValue = bxp_tag_flag & 0x0dff
        return parse_bxp_tag(content[2:],beacon_flag_parse(tempValue,4),timezone)
    if data_type == 10:
        #Unknown
        return parse_unknown(content[2:],beacon_flag_parse(other_type_flag,2),timezone)
    return {}

# 将传进来的flag转换成对应byte_num个字符的十六进制
def beacon_flag_parse(flag_value:int,byte_num:int):
    flag_data = decimal_hex(flag_value)
    remain_len = byte_num - len(flag_data)
    for i in range(0,remain_len):
        flag_data = '0' + flag_data

    return flag_data








param_errorDic = {
    "message":"Params Error",
    "code":9999,
    "result":[]
}

frame_type = ['Single press mode', 'Double press mode', 'Long press mode', 'Abnormal inactivity mode']
sample_rate_list = ['1Hz', '10Hz', '25Hz', '50Hz', '100Hz', '200Hz', '400Hz', '1344Hz', '1620Hz', '5376Hz']
full_scale_list = ['±2g', '±4g', '±8g', '±16g']
url_scheme = ["http://www.", "https://www.", "http://", "https://"]
url_expansion = [".com/", ".org/", ".edu/", ".net/", ".info/", ".biz/", ".gov/", ".com", ".org", ".edu", ".net", ".info", ".biz", ".gov"]

#解析时区，入参为一个字节带符号十六进制字符串
def parse_timezone(time_zone:str):
    if check_hex(time_zone) == False or len(time_zone) != 2:
        return ''
    tempValue = hex_decimal(time_zone, 8) + 24
    time_zone_list = ['UTC-12:00','UTC-11:30','UTC-11:00','UTC-10:30','UTC-10:00','UTC-09:30',
                          'UTC-09:00','UTC-08:30','UTC-08:00','UTC-07:30','UTC-07:00','UTC-06:30',
                          'UTC-06:00','UTC-05:30','UTC-05:00','UTC-04:30','UTC-04:00','UTC-03:30',
                          'UTC-03:00','UTC-02:30','UTC-02:00','UTC-01:30','UTC-01:00','UTC-00:30',
                          'UTC+00:00','UTC+00:30','UTC+01:00','UTC+01:30','UTC+02:00','UTC+02:30',
                          'UTC+03:00','UTC+03:30','UTC+04:00','UTC+04:30','UTC+05:00','UTC+05:30',
                          'UTC+06:00','UTC+06:30','UTC+07:00','UTC+07:30','UTC+08:00','UTC+08:30',
                          'UTC+09:00','UTC+09:30','UTC+10:00','UTC+10:30','UTC+11:00','UTC+11:30',
                          'UTC+12:00','UTC+12:30','UTC+13:00','UTC+13:30','UTC+14:00']
    return time_zone_list[tempValue]

#解析时间戳，入参为四字节无符号十六进制字符串
def parse_timestamp(timestamp:str,time_zone:int):
    if check_hex(timestamp) == False or len(timestamp) != 8:
        return ''
    if time_zone < -24 or time_zone > 28:
        return ''
    ts = int(timestamp,16)
    td = timedelta(hours=(time_zone / 2.0))
    tz = timezone(td)
    dt = datetime.fromtimestamp(ts,tz)
    return dt.strftime('%Y/%m/%d %H:%M:%S')

#解析url的头部
def parse_url_scheme(content:str):
    if check_hex(content) == False or len(content) != 2:
        return ''
    index = int(content, 16)
    if index < 4:
        return url_scheme[index]
    return ascii_string(content)

#解析url的尾部
def parse_url_expansion(content:str):
    if check_hex(content) == False or len(content) != 2:
        return ''
    index = int(content,16)
    if index < 14:
        return url_expansion[index]
    return ascii_string(content)

def parse_url(content:str):
    if len(content) == 0 or (len(content) % 2 != 0):
        return ''
    header = content[0:2]
    url_content = parse_url_scheme(header)
    total_number = int((len(content) - 2) / 2)

    for i in range(0,total_number):
        url_content += parse_url_expansion(content[(2 + i * 2):(4 + i * 2)])
    return url_content




#解析beacon数据
def parse_beacon(content:str, dataFlag:str, timeZone:int):
    if check_hex(content) == False or len(content) == 0:
        return {}
    if check_hex(dataFlag) == False or len(dataFlag) != 4:
        return {}
    binary_high = hex_binary(dataFlag[0:2])
    binary_low = hex_binary(dataFlag[2:4])
    index = 0;
    result_dic = {
        'type':'iBeacon'
    }
    if binary_low[7] == '1' and len(content) >= 12:
        #MAC数据
        result_dic['mac'] = content[index:(index + 12)].upper()
        index += 12
        if index >= len(content):
            return result_dic
    if binary_low[6] == '1':
        #RSSI
        result_dic['rssi'] = str(hex_decimal(content[index:(index + 2)],8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[5] == '1':
        #timestamp
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)],timeZone)
        index += 8
        if index >= len(content):
            return result_dic
    if binary_low[4] == '1':
        #uuid
        result_dic['uuid'] = content[index:(index + 32)].upper()
        index += 32
        if index >= len(content):
            return result_dic
    if binary_low[3] == '1':
        #major
        result_dic['major'] = str(int(content[index:(index + 4)],16))
        index += 4
        if index >= len(content):
            return result_dic
    if binary_low[2] == '1':
        #minor
        result_dic['minor'] = str(int(content[index:(index + 4)],16))
        index += 4
        if index >= len(content):
            return result_dic
    if binary_low[1] == '1':
        #rssi@1m
        result_dic['rssi_1m'] = str(hex_decimal(content[index:(index + 2)],8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[0] == '1' or binary_high[7] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析Eddystone-UID数据
def parse_eddystone_uid(content:str, dataFlag:str, timeZone:int):
    if check_hex(content) == False or len(content) == 0:
        return {}
    if check_hex(dataFlag) == False or len(dataFlag) != 2:
        return {}
    binary = hex_binary(dataFlag)
    index = 0;
    result_dic = {
        'type':'Eddystone-UID'
    }
    if binary[7] == '1' and len(content) >= 12:
        # MAC数据
        result_dic['mac'] = content[index:(index + 12)].upper()
        index += 12
        if index >= len(content):
            return result_dic
    if binary[6] == '1':
        # RSSI
        result_dic['rssi'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary[5] == '1':
        # timestamp
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)],timeZone)
        index += 8
        if index >= len(content):
            return result_dic
    if binary[4] == '1':
        # rssi@0m
        result_dic['rssi_0m'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary[3] == '1':
        #namespace
        result_dic['namespace'] = content[index:(index + 20)]
        index += 20
        if index >= len(content):
            return result_dic
    if binary[2] == '1':
        #instance
        result_dic['instance_id'] = content[index:(index + 12)]
        index += 12
        if index >= len(content):
            return result_dic
    if binary[1] == '1' or binary[0] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic



#解析Eddystone-URL数据
def parse_eddystone_url(content:str, dataFlag:str, timeZone:int):
    if check_hex(content) == False or len(content) == 0:
        return {}
    if check_hex(dataFlag) == False or len(dataFlag) != 2:
        return {}
    binary = hex_binary(dataFlag)
    index = 0;
    result_dic = {
        'type':'Eddystone-URL'
    }
    if binary[7] == '1' and len(content) >= 12:
        # MAC数据
        result_dic['mac'] = content[index:(index + 12)].upper()
        index += 12
        if index >= len(content):
            return result_dic
    if binary[6] == '1':
        # RSSI
        result_dic['rssi'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary[5] == '1':
        # timestamp
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)],timeZone)
        index += 8
        if index >= len(content):
            return result_dic
    if binary[4] == '1':
        # rssi@0m
        result_dic['rssi_0m'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary[3] == '1':
        #url
        url_len = int(content[index:(index + 2)],16)
        index += 2
        result_dic['url'] = parse_url(content[index:(index + url_len * 2)])
        index += (url_len * 2)
        if index >= len(content):
            return result_dic
    if binary[2] == '1' or binary[1] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic

#解析Eddystone-TLM数据
def parse_eddystone_tlm(content:str, dataFlag:str, timeZone:int):
    if check_hex(content) == False or len(content) == 0:
        return {}
    if check_hex(dataFlag) == False or len(dataFlag) != 4:
        return {}
    binary_high = hex_binary(dataFlag[0:2])
    binary_low = hex_binary(dataFlag[2:4])
    index = 0;
    result_dic = {
        'type':'Eddystone-TLM'
    }
    if binary_low[7] == '1' and len(content) >= 12:
        #MAC数据
        result_dic['mac'] = content[index:(index + 12)].upper()
        index += 12
        if index >= len(content):
            return result_dic
    if binary_low[6] == '1':
        #RSSI
        result_dic['rssi'] = str(hex_decimal(content[index:(index + 2)],8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[5] == '1':
        #timestamp
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)],timeZone)
        index += 8
        if index >= len(content):
            return result_dic
    if binary_low[4] == '1':
        #TLM Version
        version = int(content[index:index + 2],16)
        if version == 0:
            result_dic['tlm_version'] = 'Unencrypted TLM'
        else:
            result_dic['tlm_version'] = 'Encrypted TLM'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[3] == '1':
        #Battery Voltage
        result_dic['batt_v'] = str(int(content[index:(index + 4)],16)) + 'mV'
        index += 4
        if index >= len(content):
            return result_dic
    if binary_low[2] == '1':
        #Temperature
        hightValue = int(content[index:(index + 2)],16)
        lowValue = int(content[(index + 2):(index + 4)],16)
        resultValue = hightValue + ((lowValue * 1.0) / 256.0)
        result_dic['temperature'] = ('%.2f' % resultValue) + '°C'
        index += 4
        if index >= len(content):
            return result_dic
    if binary_low[1] == '1':
        #ADV_CNT
        result_dic['adv_cnt'] = str(int(content[index:(index + 8)],16))
        index += 8
        if index >= len(content):
            return result_dic
    if binary_low[0] == '1':
        #SEC_CNT
        result_dic['sec_cnt'] = str(int(content[index:(index + 8)],16))
        index += 8
        if index >= len(content):
            return result_dic
    if binary_high[7] == '1' or binary_high[6] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析BXP-iBeacon数据
def parse_bxp_beacon(content:str, dataFlag:str, timeZone:int):
    if check_hex(content) == False or len(content) == 0:
        return {}
    if check_hex(dataFlag) == False or len(dataFlag) != 4:
        return {}
    binary_high = hex_binary(dataFlag[0:2])
    binary_low = hex_binary(dataFlag[2:4])
    index = 0;
    result_dic = {
        'type':'BXP-iBeacon'
    }
    if binary_low[7] == '1' and len(content) >= 12:
        #MAC数据
        result_dic['mac'] = content[index:(index + 12)].upper()
        index += 12
        if index >= len(content):
            return result_dic
    if binary_low[6] == '1':
        #RSSI
        result_dic['rssi'] = str(hex_decimal(content[index:(index + 2)],8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[5] == '1':
        #timestamp
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)],timeZone)
        index += 8
        if index >= len(content):
            return result_dic
    if binary_low[4] == '1':
        #UUID
        result_dic['uuid'] = content[index:(index + 32)].upper()
        index += 32
        if index >= len(content):
            return result_dic
    if binary_low[3] == '1':
        #major
        result_dic['major'] = str(int(content[index:(index + 4)],16))
        index += 4
        if index >= len(content):
            return result_dic
    if binary_low[2] == '1':
        #minor
        result_dic['minor'] = str(int(content[index:(index + 4)],16))
        index += 4
        if index >= len(content):
            return result_dic
    if binary_low[1] == '1':
        #rssi@1m
        result_dic['RSSI@1M'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[0] == '1':
        #Tx Power
        result_dic['tx_power'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_high[7] == '1':
        #ADV Interval
        result_dic['adv_interval'] = str(int(content[index:(index + 2)],16) * 100) + 'ms'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_high[6] == '1' or binary_high[5] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析BXP-DeviceInfo数据
def parse_bxp_deviceInfo(content:str, dataFlag:str, timeZone:int):
    if check_hex(content) == False or len(content) == 0:
        return {}
    if check_hex(dataFlag) == False or len(dataFlag) != 4:
        return {}
    binary_high = hex_binary(dataFlag[0:2])
    binary_low = hex_binary(dataFlag[2:4])
    index = 0
    result_dic = {
        'type':'BXP-DeviceInfo'
    }
    if binary_low[7] == '1' and len(content) >= 12:
        #MAC数据
        result_dic['mac'] = content[index:(index + 12)].upper()
        index += 12
        if index >= len(content):
            return result_dic
    if binary_low[6] == '1':
        #RSSI
        result_dic['rssi'] = str(hex_decimal(content[index:(index + 2)],8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[5] == '1':
        #timestamp
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)],timeZone)
        index += 8
        if index >= len(content):
            return result_dic
    if binary_low[4] == '1':
        #Tx Power
        result_dic['tx_power'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[3] == '1':
        #Ranging Data
        result_dic['ranging_data'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[2] == '1':
        #ADV Interval
        result_dic['adv_interval'] = str(int(content[index:(index + 2)],16) * 100) + 'ms'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[1] == '1':
        # Battery Voltage
        result_dic['batt_v'] = str(int(content[index:(index + 4)], 16)) + 'mV'
        index += 4
        if index >= len(content):
            return result_dic
    if binary_low[0] == '1':
        #Device Property
        tempBinary = hex_binary(content[index:(index + 2)])
        password = tempBinary[6:8]
        if password == '00':
            result_dic['password_verification_status'] = 'Enabled'
        elif password == '10':
            result_dic['password_verification_status'] = 'Disabled'

        if tempBinary[5] == '1':
            result_dic['ambient_light_sensor_status'] = 'Equipped'
        else:
            result_dic['ambient_light_sensor_status'] = 'Not equipped'

        index += 2
        if index >= len(content):
            return result_dic
    if binary_high[7] == '1':
        # Switch Status
        tempBinary = hex_binary(content[index:(index + 2)])
        if tempBinary[7] == '1':
            result_dic['connectable_status'] = 'Connectable'
        else:
            result_dic['connectable_status'] = 'Unconnectable'

        if tempBinary[6] == '1':
            result_dic['ambient_light_status'] = 'Ambient light detected'
        else:
            result_dic['ambient_light_status'] = 'Ambient light not detected'

        index += 2
        if index >= len(content):
            return result_dic
    if binary_high[6] == '1':
        #Firmware Version
        tempHightBinary = hex_binary(content[index:(index + 2)])
        hightVer = str(int('0000' + tempHightBinary[0:4], 2))
        centerVer = str(int('0000' + tempHightBinary[4:], 2))
        index += 2
        tempLowBinary = str(int(content[index:(index + 2)],16))

        result_dic['firmware_version'] = 'V' + hightVer + '.' + centerVer + '.' + tempLowBinary

        index += 2
        if index >= len(content):
            return result_dic
    if binary_high[5] == '1':
        #device name
        name_len = int(content[index:(index + 2)], 16)
        index += 2
        result_dic['device_name'] = ascii_string(content[index:(index + name_len * 2)])
        index += (name_len * 2)
        if index >= len(content):
            return result_dic

    if binary_high[4] == '1' or binary_high[3] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析BXP-ACC数据
def parse_bxp_acc(content:str, dataFlag:str, timeZone:int):
    if check_hex(content) == False or len(content) == 0:
        return {}
    if check_hex(dataFlag) == False or len(dataFlag) != 4:
        return {}
    binary_high = hex_binary(dataFlag[0:2])
    binary_low = hex_binary(dataFlag[2:4])
    index = 0
    result_dic = {
        'type':'BXP-ACC'
    }
    if binary_low[7] == '1' and len(content) >= 12:
        #MAC数据
        result_dic['mac'] = content[index:(index + 12)].upper()
        index += 12
        if index >= len(content):
            return result_dic
    if binary_low[6] == '1':
        #RSSI
        result_dic['rssi'] = str(hex_decimal(content[index:(index + 2)],8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[5] == '1':
        #timestamp
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)],timeZone)
        index += 8
        if index >= len(content):
            return result_dic
    if binary_low[4] == '1':
        #Tx Power
        result_dic['tx_power'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[3] == '1':
        #Ranging Data
        result_dic['ranging_data'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[2] == '1':
        #ADV Interval
        result_dic['adv_interval'] = str(int(content[index:(index + 2)],16) * 100) + 'ms'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[1] == '1':
        # Battery Voltage
        result_dic['batt_v'] = str(int(content[index:(index + 4)], 16)) + 'mV'
        index += 4
        if index >= len(content):
            return result_dic
    if binary_low[0] == '1':
        #Sample Rate
        rate_index = int(content[index:(index + 2)],16)
        result_dic['sample_rate'] = sample_rate_list[rate_index]

        index += 2
        if index >= len(content):
            return result_dic
    if binary_high[7] == '1':
        # Full Scale
        scale_index = int(content[index:(index + 2)], 16)
        result_dic['full_scale'] = full_scale_list[scale_index]

        index += 2
        if index >= len(content):
            return result_dic
    if binary_high[6] == '1':
        #Motion Threshold
        result_dic['motion_threshold'] = ('%.1f' % (int(content[index:(index + 2)], 16) * 0.1)) + 'g'

        index += 2
        if index >= len(content):
            return result_dic
    if binary_high[5] == '1':
        #3-axis data
        x_data = content[index:(index + 4)]
        index += 4
        y_data = content[index:(index + 4)]
        index += 4
        z_data = content[index:(index + 4)]
        result_dic['axis_data'] = 'X:0x' + x_data + ' Y:0x' + y_data + ' Z:0x' + z_data

        index += 4
        if index >= len(content):
            return result_dic

    if binary_high[4] == '1' or binary_high[3] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析BXP-T&H数据
def parse_bxp_th(content:str, dataFlag:str, timeZone:int):
    if check_hex(content) == False or len(content) == 0:
        return {}
    if check_hex(dataFlag) == False or len(dataFlag) != 4:
        return {}
    binary_high = hex_binary(dataFlag[0:2])
    binary_low = hex_binary(dataFlag[2:4])
    index = 0
    result_dic = {
        'type':'BXP-T&H'
    }
    if binary_low[7] == '1' and len(content) >= 12:
        #MAC数据
        result_dic['mac'] = content[index:(index + 12)].upper()
        index += 12
        if index >= len(content):
            return result_dic
    if binary_low[6] == '1':
        #RSSI
        result_dic['rssi'] = str(hex_decimal(content[index:(index + 2)],8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[5] == '1':
        #timestamp
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)],timeZone)
        index += 8
        if index >= len(content):
            return result_dic
    if binary_low[4] == '1':
        #Tx Power
        result_dic['tx_power'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[3] == '1':
        #Ranging Data
        result_dic['ranging_data'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[2] == '1':
        #ADV Interval
        result_dic['adv_interval'] = str(int(content[index:(index + 2)],16) * 100) + 'ms'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[1] == '1':
        # Battery Voltage
        result_dic['batt_v'] = str(int(content[index:(index + 4)], 16)) + 'mV'
        index += 4
        if index >= len(content):
            return result_dic
    if binary_low[0] == '1':
        #Temperature
        result_dic['temperature'] = ('%.1f' % (hex_decimal(content[index:(index + 4)], 16) * 0.1)) + '°C'

        index += 4
        if index >= len(content):
            return result_dic
    if binary_high[7] == '1':
        # Humidity
        result_dic['humidity'] = ('%.1f' % (int(content[index:(index + 4)], 16) * 0.1)) + '%'

        index += 4
        if index >= len(content):
            return result_dic

    if binary_high[6] == '1' or binary_high[5] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data
    return result_dic

#解析BXP-Button数据
def parse_bxp_button(content:str, dataFlag:str, timeZone:int):
    if check_hex(content) == False or len(content) == 0:
        return {}
    if check_hex(dataFlag) == False or len(dataFlag) != 6:
        return {}
    binary_high = hex_binary(dataFlag[0:2])
    binary_center = hex_binary(dataFlag[2:4])
    binary_low = hex_binary(dataFlag[4:6])
    index = 0
    result_dic = {
        'type':'BXP-BUTTON'
    }
    if binary_low[7] == '1' and len(content) >= 12:
        #MAC数据
        result_dic['mac'] = content[index:(index + 12)].upper()
        index += 12
        if index >= len(content):
            return result_dic
    if binary_low[6] == '1':
        #RSSI
        result_dic['rssi'] = str(hex_decimal(content[index:(index + 2)],8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[5] == '1':
        #timestamp
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)],timeZone)
        index += 8
        if index >= len(content):
            return result_dic
    if binary_low[4] == '1':
        #Frame Type
        frame_index = int(content[index:(index + 2)],16) - 32
        result_dic['frame_type'] = frame_type[frame_index]

        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[3] == '1':
        #Status Flag
        temp_data = hex_binary(content[index:(index + 2)])
        if temp_data[7] == '1':
            result_dic['password_verification_status'] = 'Enabled'
        else:
            result_dic['password_verification_status'] = 'Disabled'
        if temp_data[6] == '1':
            result_dic['alarm_triggered_status'] = 'Alarm be triggered'
        else:
            result_dic['alarm_triggered_status'] = 'Alarm not be triggered'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[2] == '1':
        #Trigger Count
        result_dic['trigger_count'] = str(int(content[index:(index + 4)],16))
        index += 4

        if index >= len(content):
            return result_dic
    if binary_low[1] == '1':
        # DeviceID
        device_id_len = int(content[index:(index + 2)], 16)
        index += 2
        result_dic['device_id'] = content[index:(index + device_id_len * 2)].upper()
        index += (device_id_len * 2)
        if index >= len(content):
            return result_dic
    if binary_low[0] == '1':
        #Firmware Type
        result_dic['firmware_type'] = str(int(content[index:(index + 2)],16))

        index += 2
        if index >= len(content):
            return result_dic
    if binary_center[7] == '1':
        # Device Name
        name_len = int(content[index:(index + 2)], 16)
        index += 2
        result_dic['device_name'] = ascii_string(content[index:(index + name_len * 2)])
        index += (name_len * 2)
        if index >= len(content):
            return result_dic
    if binary_center[6] == '1':
        # Full Scale
        result_dic['full_scale'] = full_scale_list[int(content[index:(index + 2)],16)]

        index += 2
        if index >= len(content):
            return result_dic
    if binary_center[5] == '1':
        #Motion Threshold
        result_dic['motion_threshold'] = str(int(content[index:(index + 4)],16))

        index += 4
        if index >= len(content):
            return result_dic
    if binary_center[4] == '1':
        #3-axis data
        x_data = content[index:(index + 4)]
        index += 4
        y_data = content[index:(index + 4)]
        index += 4
        z_data = content[index:(index + 4)]
        result_dic['axis_data'] = 'X:0x' + x_data + ' Y:0x' + y_data + ' Z:0x' + z_data

        index += 4
        if index >= len(content):
            return result_dic
    if binary_center[3] == '1':
        #Temperature
        hightValue = int(content[index:(index + 2)], 16)
        lowValue = int(content[(index + 2):(index + 4)], 16)
        resultValue = hightValue + ((lowValue * 1.0) / 256.0)
        result_dic['temperature'] = ('%.2f' % resultValue) + '°C'

        index += 4
        if index >= len(content):
            return result_dic

    if binary_center[2] == '1':
        #Ranging Data
        result_dic['ranging_data'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic

    if binary_center[1] == '1':
        # Battery Voltage
        result_dic['batt_v'] = str(int(content[index:(index + 4)], 16)) + 'mV'
        index += 4
        if index >= len(content):
            return result_dic

    if binary_center[0] == '1':
        #Tx Power
        result_dic['tx_power'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic

    if binary_high[7] == '1' or binary_high[6] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析BXP-Tag数据
def parse_bxp_tag(content:str, dataFlag:str, timeZone:int):
    if check_hex(content) == False or len(content) == 0:
        return {}
    if check_hex(dataFlag) == False or len(dataFlag) != 4:
        return {}
    binary_high = hex_binary(dataFlag[0:2])
    binary_low = hex_binary(dataFlag[2:4])
    index = 0
    result_dic = {
        'type':'BXP-Tag'
    }
    if binary_low[7] == '1' and len(content) >= 12:
        #MAC数据
        result_dic['mac'] = content[index:(index + 12)].upper()
        index += 12
        if index >= len(content):
            return result_dic
    if binary_low[6] == '1':
        #RSSI
        result_dic['rssi'] = str(hex_decimal(content[index:(index + 2)],8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary_low[5] == '1':
        #timestamp
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)],timeZone)
        index += 8
        if index >= len(content):
            return result_dic
    if binary_low[4] == '1':
        #Sensor Data
        temp_binary = hex_binary(content[index:(index + 2)])
        if temp_binary[7] == '1':
            result_dic['hall_sensor_status'] = 'Magnet away/absent'
        else:
            result_dic['hall_sensor_status'] = 'Magnet approach/present'

        if temp_binary[6] == '1':
            result_dic['acc_sensor_status'] = 'In move'
        else:
            result_dic['acc_sensor_status'] = 'In static'

        if temp_binary[5] == '1':
            result_dic['acc_equipped_status'] = 'Equipped'
        else:
            result_dic['acc_equipped_status'] = 'Not equipped'

        index += 2
        if index >= len(content):
            return result_dic

    if binary_low[3] == '1':
        #Hall Trigger Event Count
        result_dic['hall_trigger_event_count'] = str(int(content[index:(index + 4)],16))
        index += 4
        if index >= len(content):
            return result_dic
    if binary_low[2] == '1':
        #Motion Trigger Event Count
        result_dic['motion_trigger_event_count'] = str(int(content[index:(index + 4)],16))
        index += 4
        if index >= len(content):
            return result_dic
    if binary_low[1] == '1':
        #3-axis data
        x_data = content[index:(index + 4)]
        index += 4
        y_data = content[index:(index + 4)]
        index += 4
        z_data = content[index:(index + 4)]
        result_dic['axis_data'] = 'X:0x' + x_data + ' Y:0x' + y_data + ' Z:0x' + z_data

        index += 4
        if index >= len(content):
            return result_dic
    if binary_low[0] == '1':
        # Battery Voltage
        result_dic['batt_v'] = str(int(content[index:(index + 4)], 16)) + 'mV'
        index += 4
        if index >= len(content):
            return result_dic

    if binary_high[7] == '1':
        #tag id
        tag_len = int(content[index:(index + 2)], 16)
        index += 2
        result_dic['tag_id'] = content[index:(index + tag_len * 2)].upper()
        index += (tag_len * 2)
        if index >= len(content):
            return result_dic
    if binary_high[6] == '1':
        #device name
        name_len = int(content[index:(index + 2)], 16)
        index += 2
        result_dic['device_name'] = ascii_string(content[index:(index + name_len * 2)])
        index += (name_len * 2)
        if index >= len(content):
            return result_dic

    if binary_high[5] == '1' or binary_high[4] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析Unknown数据
def parse_unknown(content:str, dataFlag:str, timeZone:int):
    if check_hex(content) == False or len(content) == 0:
        return {}
    if check_hex(dataFlag) == False or len(dataFlag) != 2:
        return {}
    binary = hex_binary(dataFlag[0:])
    index = 0
    result_dic = {
        'type':'Unknown'
    }
    if binary[7] == '1' and len(content) >= 12:
        #MAC数据
        result_dic['mac'] = content[index:(index + 12)].upper()
        index += 12
        if index >= len(content):
            return result_dic
    if binary[6] == '1':
        #RSSI
        result_dic['rssi'] = str(hex_decimal(content[index:(index + 2)],8)) + 'dBm'
        index += 2
        if index >= len(content):
            return result_dic
    if binary[5] == '1':
        #timestamp
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)],timeZone)
        index += 8
        if index >= len(content):
            return result_dic

    #原始数据解析
    total_num = int(content[index:(index + 2)], 16)
    index += 2
    data_list = []
    if total_num > 0:
        while total_num > 0:
            temp_binary = hex_binary(content[index:(index + 2)])
            index += 2
            sub_len = int('00' + temp_binary[2:], 2)
            temp_data_dic = {}
            if temp_binary[0:2] == '10':
                temp_data_dic['error'] = 'length error'
            elif temp_binary[0:2] == '01':
                temp_data_dic['error'] = 'type error'

            sub_content = content[index:(index + 2 * sub_len)]
            temp_data_dic['type'] = sub_content[0:2].upper()
            temp_data_dic['data'] = sub_content[2:].upper()

            data_list.append(temp_data_dic)

            index += (2 * sub_len)
            total_num -= 1
    result_dic['data_blocks'] = data_list
    if index >= len(content):
        return result_dic

    if binary[4] == '1' or binary[3] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data
    return result_dic






hex_tuple = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F']
hex_key = {
    "0":"0000","1":"0001","2":"0010",
    "3":"0011","4":"0100","5":"0101",
    "6":"0110","7":"0111","8":"1000",
    "9":"1001","A":"1010","a":"1010",
    "B":"1011","b":"1011","C":"1100",
    "c":"1100","D":"1101","d":"1101",
    "E":"1110","e":"1110","F":"1111",
    "f":"1111",
}

#判断字符串是否是十六进制
def check_hex(hex: str):
    temp_char = hex.upper()
    for s in temp_char:
        if s in hex_tuple:
            pass
        else:
            return False

    return True


# 将十六进制转换成二进制
def hex_binary(hex: str):
    if check_hex(hex) == False:
        return ''

    value_hex = ''

    if len(hex) % 2 != 0:
        value_hex = '0' + hex
    else:
        value_hex = hex

    binary_string = ''
    for s in value_hex:
        binary_string += hex_key[s]

    return binary_string

#有符号十六进制转十进制
#width:指定宽度，一个字节指定8，两个字节16，四个字节32
def hex_decimal(hex:str,width:int):
    dec_data = int(hex, 16)
    if dec_data > 2 ** (width - 1) - 1:
        dec_data = 2 ** width - dec_data
        dec_data = 0 - dec_data

    return dec_data


# 十六进制字符转ASCII码
def ascii_string(ascii_code:str):
    if check_hex(ascii_code) == False or (len(ascii_code) % 2 != 0):
        return ''
    temp_index = 0
    ascii_string = ''
    for s in ascii_code:
        if temp_index >= len(ascii_code):
            break
        data = ascii_code[temp_index:temp_index + 2]
        ascii_string += bytes.decode(binascii.unhexlify(data))
        temp_index += 2
    return ascii_string

def decimal_hex(decimal:int):
    tempValue = str(hex(decimal)).replace('0x', '');
    current_len = len(tempValue)
    if (current_len % 2 != 0):
        tempValue = '0' + tempValue

    return tempValue



#dict_from_payload('280E5AC3220708132e0E',1)
#dict_from_payload('a80E5A63BBB0F20E03',2)
#dict_from_payload('c50F12C3220E02',3)
#dict_from_payload('2863BBB0DBe863BBB0Dc1c',4)
#dict_from_payload('0163BBFD3C0E042E0AC4A4F46BF1AFB263BBFD3308020106031605AA02160006094C5730303709092D5049522D46314141FF41FF41FF2E0AF1635F1D9F15BD63BBFD3408020106031604AA02160006094C5730303509092D4D502D3946313541FF41FF41FF3E0ADC223A3AA177BD63BBFD3408020106031605AA02160006094C5730303709092D5049522D41313703FF05AA07FFF1FFFFFFFF0009FF04DC223A3AA177012E0ADB2B3D3A5C3BC263BBFD3408020106031604AA02160006094C5730303509092D4D502D3543334241FF41FF41FF',5)

