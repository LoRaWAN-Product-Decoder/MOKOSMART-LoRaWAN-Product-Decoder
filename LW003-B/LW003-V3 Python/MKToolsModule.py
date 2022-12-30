
import base64,struct,datetime,time,binascii

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