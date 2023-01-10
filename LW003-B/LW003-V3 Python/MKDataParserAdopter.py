
import base64,struct,datetime,time,binascii

from MKToolsModule import *

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
def parse_timezone(timezone:str):
    if check_hex(timezone) == False or len(timezone) != 2:
        return ''
    tempValue = hex_decimal(timezone, 8)
    time_zone = str(tempValue)
    if len(time_zone) == 1:
        time_zone = '0' + time_zone
    if tempValue >= 0:
        return 'UTC+' + time_zone + ':00'
    return 'UTC' + time_zone + ':00'

#解析时间戳，入参为四字节无符号十六进制字符串
def parse_timestamp(timestamp:str):
    if check_hex(timestamp) == False or len(timestamp) != 8:
        return ''
    local_time = time.localtime(int(timestamp, 16))
    return time.strftime('%Y/%m/%d %H:%M:%S', local_time)

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
def parse_beacon(content:str, dataFlag:str):
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
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)])
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
    if binary_low[0] == '1' and binary_high[7] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析Eddystone-UID数据
def parse_eddystone_uid(content:str, dataFlag:str):
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
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)])
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
    if binary[1] == '1' and binary[0] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic



#解析Eddystone-URL数据
def parse_eddystone_url(content:str, dataFlag:str):
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
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)])
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
    if binary[2] == '1' and binary[1] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic

#解析Eddystone-TLM数据
def parse_eddystone_tlm(content:str, dataFlag:str):
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
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)])
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
        result_dic['temperature'] = str(hex_decimal(content[index:(index + 4)],16) * 0.01) + '°C'
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
    if binary_high[7] == '1' and binary_high[6] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析BXP-iBeacon数据
def parse_bxp_beacon(content:str, dataFlag:str):
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
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)])
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
        result_dic['ranging_data'] = str(hex_decimal(content[index:(index + 2)], 8)) + 'dBm'
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
    if binary_high[6] == '1' and binary_high[5] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析BXP-DeviceInfo数据
def parse_bxp_deviceInfo(content:str, dataFlag:str):
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
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)])
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

    if binary_high[4] == '1' and binary_high[3] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析BXP-ACC数据
def parse_bxp_acc(content:str, dataFlag:str):
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
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)])
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
        result_dic['motion_threshold'] = str(int(content[index:(index + 2)],16) * 0.1) + 'g'

        index += 2
        if index >= len(content):
            return result_dic
    if binary_high[5] == '1':
        #3-axis data
        x_data = content[index:(index + 2)]
        index += 2
        y_data = content[index:(index + 2)]
        index += 2
        z_data = content[index:(index + 2)]
        result_dic['axis_data'] = 'X:0x' + x_data + ' Y:0x' + y_data + ' Z:0x' + z_data

        index += 2
        if index >= len(content):
            return result_dic

    if binary_high[4] == '1' and binary_high[3] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析BXP-T&H数据
def parse_bxp_th(content:str, dataFlag:str):
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
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)])
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
        result_dic['temperature'] = str(hex_decimal(content[index:(index + 4)], 16) * 0.01) + '°C'

        index += 4
        if index >= len(content):
            return result_dic
    if binary_high[7] == '1':
        # Humidity
        result_dic['humidity'] = str(int(content[index:(index + 4)], 16) * 0.01) + '%'

        index += 4
        if index >= len(content):
            return result_dic

    if binary_high[6] == '1' and binary_high[5] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data
    return result_dic

#解析BXP-Button数据
def parse_bxp_button(content:str, dataFlag:str):
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
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)])
        index += 8
        if index >= len(content):
            return result_dic
    if binary_low[4] == '1':
        #Frame Type
        frame_index = int(content[index:(index + 2)],16)
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
        result_dic['device_id'] = ascii_string(content[index:(index + device_id_len * 2)])
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
        result_dic['full_scale'] = str(int(content[index:(index + 2)],16))

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
        result_dic['temperature'] = str(hex_decimal(content[index:(index + 4)], 16) * 0.01) + '°C'

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

    if binary_high[7] == '1' and binary_high[6] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析BXP-Tag数据
def parse_bxp_tag(content:str, dataFlag:str):
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
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)])
        index += 8
        if index >= len(content):
            return result_dic
    if binary_low[4] == '1':
        #Sensor Data
        temp_binary = hex_binary(content[index:(index + 2)])
        if temp_binary[7] == '1':
            result_dic['hall_sensor_status'] = 'Magnet away/absen'
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
        result_dic['tag_id'] = ascii_string(content[index:(index + tag_len * 2)])
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

    if binary_high[5] == '1' and binary_high[4] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data

    return result_dic


#解析Unknown数据
def parse_unknown(content:str, dataFlag:str):
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
        result_dic['timestamp'] = parse_timestamp(content[index:(index + 8)])
        index += 8
        if index >= len(content):
            return result_dic
    if binary[4] == '1':

        total_num = int(content[index:(index + 2)], 16)
        index += 2
        data_list = []
        if total_num > 0:
            while total_num > 0:
                temp_binary = hex_binary(content[index:(index + 2)])
                index += 2
                sub_len = int('00' + temp_binary[2:],2)
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

    if binary[3] == '1' and binary[2] == '1':
        #回应包
        adv_data = content[index:]
        result_dic['adv_len'] = str(int(len(adv_data) / 2))
        result_dic['adv_data'] = adv_data
    return result_dic