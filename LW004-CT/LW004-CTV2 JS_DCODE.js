/*
Before use this document, please set the corresponding parameters according to the device upload content settings.
*/


/*
The follow is guidence for select the content of Tracking part 
bit 0  means device battery level; bit 1 means Host mac ; bit 2 means the raw data of the scanned beacons
if you want upload device battery level, host mac and the raw data of the scanned beacons, alarm_period_data_flag should be 0000 0111, equal to 0x07.
if you just want upload device battery level and host mac, alarm_period_data_flag should be 0000 0011.equal to 0x03.
Pls kindly chang the initial value of the alarm_period_data_flag according your setting about the content of Tracking and location payload
*/
var alarm_period_data_flag = 0x07;


/*
The following are the guidence for select the content of location part
If you want report Location information, report_beacon_choose should be 1 ;If you don't want report Location information, report_beacon_choose should be 0.
report_beacon_num means the quantity of reported location beacons.
*/
var report_beacon_choose = 1;
var report_beacon_num = 4;  //MAX is 4

/*
The following are the guidence for select the content of 3-Axis Payload
bit 0 means Host mac; bit 1 means timestamp
if you want upload Host mac and timestamp, Accelerometer_data_flag should be 0000 0011, equal to 0x03.
if you just want upload Host mac , Accelerometer_data_flag should be 0000 0001, equal to 0x01.
*/
var Accelerometer_data_flag = 0x03; 

/*
The following are the guidence for select the content of SOS Payload
bit 0 means timestamp; bit 1 means Host mac
if you want upload Host mac and timestamp, sos_data_flag be 0000 0011, equal to 0x03.
if you just want upload timestamp , sos_data_flag should be 0000 0001, equal to 0x01.
*/
var sos_data_flag = 0x03;


/*
The following are the guidence for select the content of GPS Payload.
bit 0 means altitude; bit 1 means timestamp; bit 2 means fix mode; bit 3 means PDOP; bit 4 means number of satellites.
*/
var gps_data_flag = 0x1f;



function BytesToStr(bytes, start, len)
{	
	var str = "";	
	for(var i = 0; i < len; i++)			
		str += String.fromCharCode(bytes[start+i]);		
	return str;
}
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
	var data_type = ["period_data","alarm_data","dev_info","accelerometer_data","gps_data","SOS_mode_data"];
	var alarm_remind = ["remind_close","remind_led","remind_shake","remind_led_shake"];
	var dev_info = {};
	var parse_len = 1;
	dev_info.data_type = data_type[bytes[0]];
	if(bytes[0]==0 || bytes[0]==1)
	{
		if(alarm_period_data_flag&0x01)
		{
			dev_info.batt_level = bytes[parse_len++];
		}
		
		year = bytes[parse_len]*256 + bytes[parse_len+1];
		parse_len += 2;
		mon = bytes[parse_len++];
		days = bytes[parse_len++];
		hour = bytes[parse_len++];
		minute = bytes[parse_len++];
		sec = bytes[parse_len++];
		dev_info.utc_time = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec;

		if(alarm_period_data_flag&0x02)
		{
			dev_info.dev_mac = substringBytes(bytes, parse_len, 6);
			parse_len += 6;
		}

		dev_info.contact_mac = substringBytes(bytes, parse_len, 6);
		parse_len += 6;

		dev_info.contact_rssi = bytes[parse_len++]-256 + "dBm";

		var beacon_len = 0;
		if(report_beacon_choose)
		{
			beacon_len = report_beacon_num*7;
			var datas = [];
			for(var i=0 ; i<report_beacon_num ; i++)
			{
				var data = {};
				rssi = bytes[bytes.length-(report_beacon_num-i)*7+6];
				if(rssi!=0)
				{
	  				data.beacon_mac = substringBytes(bytes, bytes.length-(report_beacon_num-i)*7, 6);
	  				data.beacon_rssi =rssi -256 +"dBm"; 
	  				datas.push(data);
				}
				else
				  	break;
			}
			dev_info.beacon_data = datas;
		}

		if(alarm_period_data_flag&0x04)
		{
			dev_info.contact_adv_len = bytes.length - parse_len - beacon_len;
			dev_info.contact_adv_data =  substringBytes(bytes, parse_len, dev_info.contact_adv_len);
		}
		
	}
	else if(bytes[0]==2)
	{
		dev_info.batt_level = bytes[parse_len++];
		dev_info.alarm_remind = alarm_remind[bytes[parse_len++]];
		dev_info.dev_mac = substringBytes(bytes, parse_len, 6);
		parse_len+=6;
		ver_major = (bytes[parse_len]>>4)&0x0f;
		ver_minor = bytes[parse_len]&0x0f;
		ver_patch = bytes[parse_len+1];
		dev_info.ver = "V" + ver_major + "." + ver_minor + "." + ver_patch;
		parse_len += 2;
		if((bytes.length-parse_len))
		{
			dev_info.dev_name = BytesToStr(bytes,parse_len,bytes.length-parse_len);
		}
	}
	else if(bytes[0]==3)
	{
		if(Accelerometer_data_flag&0x02)
		{
			year = bytes[parse_len]*256 + bytes[parse_len+1];
			parse_len += 2;
			mon = bytes[parse_len++];
			days = bytes[parse_len++];
			hour = bytes[parse_len++];
			minute = bytes[parse_len++];
			sec = bytes[parse_len++];
			dev_info.utc_time = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec;
		}
		if(Accelerometer_data_flag&0x01)
		{
			dev_info.dev_mac = substringBytes(bytes, parse_len, 6);
			parse_len+=6;
		}
		dev_info.asix_x = bytes[parse_len]*256 + bytes[parse_len+1] +"mg";
		parse_len +=2;
		dev_info.asix_y = bytes[parse_len]*256 + bytes[parse_len+1] +"mg";
		parse_len +=2;
		dev_info.asix_z = bytes[parse_len]*256 + bytes[parse_len+1] +"mg";
		parse_len +=2;
	}
	else if(bytes[0] == 4)
	{
		if(gps_data_flag&0x02)
		{
			year = bytes[parse_len]*256 + bytes[parse_len+1];
			parse_len += 2;
			mon = bytes[parse_len++];
			days = bytes[parse_len++];
			hour = bytes[parse_len++];
			minute = bytes[parse_len++];
			sec = bytes[parse_len++];
			dev_info.utc_time = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec;
		}
		dev_info.latitude = bytes[parse_len] + bytes[parse_len+1]*256 + bytes[parse_len+2]*256*256 + bytes[parse_len+3]*256*256*256;
		parse_len += 4;
		dev_info.longitude = bytes[parse_len] + bytes[parse_len+1]*256 + bytes[parse_len+2]*256*256 + bytes[parse_len+3]*256*256*256;
		parse_len += 4;

		if(dev_info.latitude>0x80000000)
			dev_info.latitude -= 0x100000000;
		if(dev_info.longitude>0x80000000)
			dev_info.longitude -= 0x100000000;
		dev_info.latitude = dev_info.latitude*90/8388607;
		dev_info.longitude = dev_info.longitude*180/8388607;

		if(gps_data_flag & 0x01)
		{
			dev_info.altitude = bytes[parse_len]*256 + bytes[parse_len+1] + ((bytes[parse_len+2]>>4)&0x0f)/10;
			if(bytes[parse_len +2]&0x0f)
				dev_info.altitude = 0-dev_info.altitude;
			parse_len += 3;
		}
		if(gps_data_flag&0x08)
			dev_info.pdop = bytes[parse_len++];
		if(gps_data_flag&0x04)
		{
			var fix_state = ["no fix","2D fix","3D fix"];
			dev_info.fix_state = fix_state[(bytes[parse_len]>>4)&0x0f-1];
		}
		if(gps_data_flag&0x10)
			dev_info.satellites_num = bytes[parse_len]&0x0f;	
	}
	else if(bytes[0] == 5)
	{
		dev_info.batt_level = bytes[parse_len++];
		if(sos_data_flag&0x01)
		{
			year = bytes[parse_len]*256 + bytes[parse_len+1];
			parse_len += 2;
			mon = bytes[parse_len++];
			days = bytes[parse_len++];
			hour = bytes[parse_len++];
			minute = bytes[parse_len++];
			sec = bytes[parse_len++];
			dev_info.utc_time = year + "-" + mon + "-" + days + " " + hour + ":" + minute + ":" + sec;
		}
		if(sos_data_flag&0x02)
		{
			dev_info.dev_mac = substringBytes(bytes, parse_len, 6);
			parse_len+=6;
		}

		dev_info.latitude = bytes[parse_len] + bytes[parse_len+1]*256 + bytes[parse_len+2]*256*256 + bytes[parse_len+3]*256*256*256;
		parse_len += 4;
		dev_info.longitude = bytes[parse_len] + bytes[parse_len+1]*256 + bytes[parse_len+2]*256*256 + bytes[parse_len+3]*256*256*256;
		parse_len += 4;

		if(dev_info.latitude>0x80000000)
			dev_info.latitude -= 0x100000000;
		if(dev_info.longitude>0x80000000)
			dev_info.longitude -= 0x100000000;
		dev_info.latitude = dev_info.latitude*90/8388607;
		dev_info.longitude = dev_info.longitude*180/8388607;

		dev_info.contact_mac = substringBytes(bytes, parse_len, 6);
		parse_len += 6;

		dev_info.contact_rssi = bytes[parse_len++]-256 + "dBm";

		if(report_beacon_choose)
		{
			var datas = [];
			for(var i=0 ; i<report_beacon_num ; i++)
			{
				var data = {};
				rssi = bytes[bytes.length-(report_beacon_num-i)*7+6];
				if(rssi!=0)
				{
	  				data.beacon_mac = substringBytes(bytes, bytes.length-(report_beacon_num-i)*7, 6);
	  				data.beacon_rssi =rssi -256 +"dBm"; 
	  				datas.push(data);
				}
				else
				  	break;
			}
			dev_info.beacon_data = datas;
		}
	}
	return dev_info;
}