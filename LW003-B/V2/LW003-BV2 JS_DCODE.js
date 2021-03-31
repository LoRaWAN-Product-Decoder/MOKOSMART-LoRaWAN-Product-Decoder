//LW003-B V2 Payload Decoder rule
//Creation time：2021-03-26
//Creator:ShengHui Yan
//Suitable firmware versions：
//Programming languages：Javascript
//Suitable platforms：TTN



/*
Before use this document, please set the corresponding parameters according to the device upload content settings.
*/

/*
The follow is guidence for select the content of Payload
bit 0 means the response packet of the scanned beacons; bit 1 means the advertise packet of the scanned beacons ; bit 2 means the rssi of the scanned beacons;
bit 3 means the mac of the scanned beacons; bit 4 means the timestamp;
If the corresponding bit is 1, the corresponding data will be  reported.
For example,if flag = 0x1F, because 0x1F equal 0001 1111, so it means that reponse packer ,advertise packet ,rssi ,mac and timestamp will be uploaded.
Pls change the value of flag ,according to your choice.
*/
var flag = 0x1F;



function substringBytes(bytes, start, len)
{
	var char = [];
	for(var i = 0; i < len; i++)
	{
		char.push("0x"+ bytes[start+i].toString(16) < 0X10 ? ("0"+bytes[start+i].toString(16)) : bytes[start+i].toString(16) );
	}
	return char.join("");
}
function Decoder(bytes, port)
{
	var region = ["AS923","AU915","CN470","CN779","EU433","EU868","KR920","IN865","US915","RU864"];
	var dev_info = {};
	if(port == 1)
	{
		dev_info.batt_level = bytes[0] + "%";
		dev_info.batt_v = bytes[1]*256 + bytes[2] + "mV";
		ver_major = (bytes[3]>>6)&0x03;
		ver_mijor = (bytes[3]>>4)&0x03;
		ver_patch = bytes[3]&0x0f;
		dev_info.ver = "V" + ver_major+"."+ver_mijor+"."+ver_patch;
		dev_info.sensitivity = bytes[4] + "mg";
		dev_info.demolition_state = bytes[5];
		dev_info.temperature = (bytes[6]*256 + bytes[7])/100 + "°C";
		dev_info.humility = (bytes[8]*256 + bytes[9])/100+"%";
		dev_info.region = region[bytes[10]];
	}
	else if(port == 2)
	{
		dev_info.head = bytes[0];
		dev_info.beacon_num = bytes[1];
		var parse_len = 2;
		var datas = [];
		for(var i = 0; i < dev_info.beacon_num; i++)
		{
			var data = {};
			var beacon_len = 0;
			var current_data_len = bytes[parse_len++];
			if(flag&0x10)
			{
				year = bytes[parse_len]*256 + bytes[parse_len+1];
				parse_len += 2;
				mon = bytes[parse_len++];
				days = bytes[parse_len++];
				hour = bytes[parse_len++];
				minute = bytes[parse_len++];
				sec = bytes[parse_len++];
				data.utc_time = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec;
				beacon_len +=7;
			}
			if(flag&0x08)
			{
				data.mac = substringBytes(bytes, parse_len, 6);
				parse_len += 6;
				beacon_len +=6;
			}
			if(flag&0x04)
			{
				data.rssi = bytes[parse_len++]-256 +"dBm";
				beacon_len +=1;
			}
			if(flag&0x03)
			{
				data.adv_len = current_data_len-beacon_len ;
				data.adv_data = substringBytes(bytes, parse_len, data.adv_len);
				parse_len += data.adv_len;
			}
			datas.push(data);
		}
		dev_info.scan_data = datas;
	}
	else if(port == 4)
	{
		var parse_len = 0;
		dev_info.beacon_num = bytes[4];
		if(dev_info.beacon_num)
		{
			parse_len += 5;
			var datas = [];
			for(var i = 0; i < dev_info.beacon_num; i++)
			{
				var data = {};
				var beacon_len = 0;
				var current_data_len = bytes[parse_len++];
				
				year = bytes[parse_len]*256 + bytes[parse_len+1];
				parse_len += 2;
				mon = bytes[parse_len++];
				days = bytes[parse_len++];
				hour = bytes[parse_len++];
				minute = bytes[parse_len++];
				sec = bytes[parse_len++];
				data.utc_time = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec;
				beacon_len +=7;
				
				data.mac = substringBytes(bytes, parse_len, 6);
				parse_len += 6;
				beacon_len +=6;
				
				data.rssi = bytes[parse_len++]-256 +"dBm";
				beacon_len +=1;
				
				data.adv_len = current_data_len-beacon_len ;
				data.adv_data = substringBytes(bytes, parse_len, data.adv_len);
				parse_len += data.adv_len;
				
				datas.push(data);
			}
			dev_info.store_data = datas;
		}
		else
		{
			dev_info.total_num = bytes[5]*256 + bytes[6];
		}
	}
	return dev_info;
} 