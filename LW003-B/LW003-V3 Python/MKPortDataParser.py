import base64,struct,datetime,time,binascii

from MKToolsModule import *
from MKDataParserAdopter import  *


# according dev config锛宻how report data format choose, this iBeaconFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have UUID
# bit 4 have Major
# bit 5 have Minor
# bit 6 have RSSI@1M
# bit 7 have Adv raw data
# bit 8 have Response raw data
iBeacon_flag = '01FF'


# according dev config锛宻how report data format choose, this EddystoneUIDFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have RSSI@0M
# bit 4 have Namespace
# bit 5 have Instance
# bit 6 have Adv raw data
# bit 7 have Response raw data
eddystone_uid_flag = 'FF'

# according dev config锛宻how report data format choose, this EddystoneURLFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have RSSI@0M
# bit 4 have URL
# bit 5 have Adv raw data
# bit 6 have Response raw data
eddystone_url_flag = '7F'

# according dev config锛宻how report data format choose, this EddystoneTLMFlag must be the same as the device
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
eddystone_tlm_flag = '03FF'

# according dev config锛宻how report data format choose, this BXPiBeaconFlag must be the same as the device
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
bxp_iBeacon_flag = '07FF'

# according dev config锛宻how report data format choose, this BXPDeviceInfoFlag must be the same as the device
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
bxp_device_info_flag = '1FFF'

# according dev config锛宻how report data format choose, this BXPACCFlag must be the same as the device
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
bxp_acc_flag = '1FFF'

# according dev config锛宻how report data format choose, this BXPTHFlag must be the same as the device
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
bxp_th_flag = '07FF'

# according dev config锛宻how report data format choose, this BXPButtonFlag must be the same as the device
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
bxp_button_flag = '03FFFF'

# according dev config锛宻how report data format choose, this BXPTagFlag must be the same as the device
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
bxp_tag_flag = '0FFF'

# according dev config锛宻how report data format choose, this OtherTypeFlag must be the same as the device
# bit 0 have MAC
# bit 1 have Rssi
# bit 2 have Timestamp
# bit 3 have Adv raw data
# bit 4 have Response raw data

other_type_flag = '1F'

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
    result_dic['battery_percentage'] = str(int(('0' + battery_binary[1:]), 2))
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
        result_dic['temperature'] = str(hex_decimal(content[10:14],16) * 0.01) + '°C'
        result_dic['humidity'] = str(int(content[14:18],16) * 0.01) + '%'
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
    result_dic['battery_percentage'] = str(int(('0' + battery_binary[1:]), 2))
    # 电池电压
    result_dic['voltage'] = str(int(content[2:6], 16)) + 'mV'
    # 时间戳
    result_dic['timestamp'] = parse_timestamp(content[6:14])
    # 时区
    result_dic['time_zone'] = parse_timezone(content[14:16])
    # 关机方式 0:蓝牙指令关机 1:lora下行指令关机 2:长按按键5s关机 3:电池没电关机
    result_dic['shutdown_type'] = str(int(content[16:], 16))

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
    result_dic['battery_percentage'] = str(int(('0' + battery_binary[1:]), 2))
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
        result_dic['temperature'] = str(hex_decimal(content[10:14],16) * 0.01) + '°C'
        result_dic['humidity'] = str(int(content[14:18],16) * 0.01) + '%'
        result_dic['time_zone'] = parse_timezone(content[18:20])
        result_dic['data_type'] = str(int(content[20:], 16))
    else:
        result_dic['time_zone'] = parse_timezone(content[10:12])
        result_dic['data_type'] = str(int(content[12:], 16))

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
    result_dic['battery_percentage'] = str(int(('0' + battery_binary[1:]), 2))
    #被打断的扫描周期开始时间点
    # 时间戳
    result_dic['scan_timestamp'] = parse_timestamp(content[2:10])
    # 时区
    result_dic['scan_timezone'] = parse_timezone(content[10:12])
    # 被广播打断的时间点
    # 时间戳
    result_dic['stop_timestamp'] = parse_timestamp(content[12:20])
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
    result_dic['timestamp'] = parse_timestamp(content[2:10])
    result_dic['timezone'] = str(hex_decimal(content[10:12], 8))
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
            dic = parse_beacon_datas(temp_content)
            if (temp_binary[0] == '1'):
                dic['respons'] = 'Part data not reported'
            else:
                dic['respons'] = 'Data reported normal'
            data_list.append(dic)
            index += (2 * temp_len)
            total_number -= 1

    result_dic['data_list'] = data_list
    return result_dic


def parse_beacon_datas(content:str):
    if check_hex(content) == False or (len(content) % 2 != 0):
        return {}
    data_type = int(content[0:2], 16)
    if data_type == 0:
        # iBeacon
        return parse_beacon(content[2:], iBeacon_flag)
    if data_type == 1:
        #Eddystone-UID
        return parse_eddystone_uid(content[2:],eddystone_uid_flag)
    if data_type == 2:
        #Eddystone-URL:
        return parse_eddystone_url(content[2:],eddystone_url_flag)
    if data_type == 3:
        #Eddystone-TLM
        return parse_eddystone_tlm(content[2:],eddystone_tlm_flag)
    if data_type == 4:
        #BXP-iBeacon
        return parse_bxp_beacon(content[2:],bxp_iBeacon_flag)
    if data_type == 5:
        #BXP-DeviceInfo
        return parse_bxp_deviceInfo(content[2:],bxp_device_info_flag)
    if data_type == 6:
        #BXP-ACC
        return parse_bxp_acc(content[2:],bxp_acc_flag)
    if data_type == 7:
        #BXP-T&H
        return parse_bxp_th(content[2:],bxp_th_flag)
    if data_type == 8:
        #BXP-Button
        return parse_bxp_button(content[2:],bxp_button_flag)
    if data_type == 9:
        #BXP-Tag
        return parse_bxp_tag(content[2:],bxp_tag_flag)
    if data_type == 10:
        #Unknown
        return parse_unknown(content[2:],other_type_flag)
    return {}