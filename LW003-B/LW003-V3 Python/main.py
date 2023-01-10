
import base64,struct,datetime,time,binascii

from MKToolsModule import *
from MKDataParserAdopter import *
from MKPortDataParser import *



#不带温湿度
parse_port1('1a1234dd15f1')
#带温湿度
parse_port1('1a1234dd15e5a0111105')

parse_port2('1a1234637ddf9df203')

#不带温湿度
parse_port3('1a1234dd15f100')
#带温湿度
parse_port3('1a1234dd15e5a011110502')

parse_port4('1a637d9bacf2637d9badf3')

test_data = '0163806af1fe0d'   #帧头+时间戳+本包Beacon数量
mac_rssi_timestamp = '0b16212c3742dd63806af1'   #11字节
adv_data = 'a1a2a3a4a5a6a7a8a9a01101'   #12字节
beacon_data1 = '2d00' + mac_rssi_timestamp + '112233445566778899aabbccddeeff00' + '0cb8' + '000a' + 'f3' + adv_data
beacon_data2 = '2e00' + mac_rssi_timestamp + '112233445566778899aabbccddeeff11' + '0cb7' + '000c' + 'f2' + '0b16212c3742dd63806af10a0b'
uid_data1 = '2901' + mac_rssi_timestamp + 'f0' + 'b1b2b3b4b5b6b7b8b9b0' + 'c1c2c3c4c5c6' + adv_data
url_data1 = '2402' + mac_rssi_timestamp + 'f1' + '0a01434443454647484903' + adv_data
url_data2 = '2402' + mac_rssi_timestamp + 'f5' + '0a02434443454647484904' + adv_data
tlm_data1 = '2503' + mac_rssi_timestamp + 'aa' + '05bb' + 'd033' + '00000033' + '0000000a' + adv_data
bxp_iBeacon_data1 = '2f04' + mac_rssi_timestamp + '112233445566778899aabbccddeeff00' + '0ca0' + '0001' + 'f5' + 'f6' + '16' + adv_data
bxp_device_info_data1 = '2605' + mac_rssi_timestamp + 'a3' + 'f6' + '33' + '0536' + 'aa' + 'a0' + '3501' + '0444454445' + adv_data
bxp_acc_data1 = '2306' + mac_rssi_timestamp + 'a3' + 'f6' + '33' + '0536' + '01' + '00' + '02' + 'aabbcc' + adv_data
bxp_th_data1 = '2107' + mac_rssi_timestamp + 'a3' + 'f6' + '33' + '0536' + 'fea3' + 'aa13' + adv_data
bxp_button_data1 = '3008' + mac_rssi_timestamp + '00' + 'aa' + '3301' + '03474849' + 'aa' + '0443444445' + '02' + 'aabbcc' + 'f2a3' + 'f1' + '3301' + 'f2' + adv_data
bxp_tag_data1 = '3009' + mac_rssi_timestamp + '01' + '1234' + 'aa03' + '123456780302' + 'aa03' + '0432313035' + '054a4b4c4d4e' + adv_data
bxp_other_data1 = '2b0a' + mac_rssi_timestamp + '03' + '050003050607' + '86010203040506' + '4402aabbcc' + adv_data
print(parse_port5(test_data + beacon_data1 + beacon_data2 + uid_data1
                  + url_data1 + url_data2 + tlm_data1 + bxp_iBeacon_data1
                  + bxp_device_info_data1 + bxp_acc_data1 + bxp_th_data1
                  + bxp_button_data1 + bxp_tag_data1 + bxp_other_data1))
