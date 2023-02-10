function command_format_check(bytes, port)
{
    switch(port) 
    {
        case 5:
            if (bytes.length === 11) 
                return true;
            break;

        case 6:
            if (bytes.length === 11) 
                return true;
            break;
        
        case 7:
            if (bytes.length === 7) 
                return true;
            break;

        default:
           break;
    }

    return false;   
}

function timezone_decode(tz)
{
    var tz_str = "UTC";

    if (tz < 0)
    {
        tz_str +="-";
        tz = -tz;
    }
    else
    {
        tz_str +="+";
    }
    
    if (tz < 20)
    {
        tz_str += "0";
    }

    tz_str += String(parseInt(tz/2));
    tz_str += ":"

    if (tz % 2) 
    {
        tz_str += "30"
    }
    else
    {
        tz_str += "00"
    }
    
    return tz_str;
}

function Decode(fport, bytes)
{
    var res_data = {};

    res_data.port = fport;

    if(command_format_check(bytes, fport) == false)
    {
        res_data.result = 1;
        return res_data;
    }

    res_data.result = 0;
    res_data.timestamp = bytes[0]<<24 | bytes[1]<<16 | bytes[2]<<8 | bytes[3];
    res_data.timezone = timezone_decode(bytes[4]);

    var tem = 0;
    var hum = 0;
    var temp_value ;
    switch(fport) 
    {
        case 5:
        		res_data.packet_type = "heart";
        		temp_value = (bytes[5]&0xc0)>>6;
        		
        		if(temp_value==0x03)
        		{
        			res_data.pir_state = "pir func close";
        		}
        		else
        		{
        			res_data.pir_state = temp_value;
        		}
        		
        		temp_value = (bytes[5]&0x30)>>4;
        		if(temp_value==0x03)
        		{
        			res_data.door_state = "door check func close";
        		}
        		else
        		{
        			res_data.door_state = temp_value;
        		}
        		
        		temp_value = (bytes[5]&0x0c)>>2;
        		if(temp_value==0x03)
        		{
        			res_data.tem_ths_state = "tem threshold alarm func close";
        		}
        		else
        		{
        			res_data.tem_ths_state = temp_value;
        		}
        		
        		temp_value = bytes[5]&0x03;
        		if(temp_value==0x03)
        		{
        			res_data.hum_ths_state = "hum threshold alarm func close";
        		}
        		else
        		{
        			res_data.hum_ths_state = temp_value;
        		}
        		
        		temp_value = ((bytes[6]<<2)+((bytes[7]&0xc0)>>6));
        		if(temp_value==0x03ff)
        		{
        			res_data.tem = "tem monitor func close";
        		}
        		else
        		{
        			temp_value = ((bytes[6]<<2)+((bytes[7]&0xc0)>>6))/10-30;
        			res_data.tem = temp_value.toFixed(1) + "°";
        		}
        		
        		temp_value = (((bytes[7]&0x3f)<<4)+((bytes[8]&0xf0)>>4));
        		if(temp_value==0x03ff)
        		{
        			res_data.hum = "hum monitor func close";
        		}
        		else
        		{
        			temp_value = (((bytes[7]&0x3f)<<4)+((bytes[8]&0xf0)>>4))/10;
        			res_data.hum = temp_value.toFixed(1) + "%";
        		}
        		
        		temp_value = (bytes[8]&0x0c)>>2;
        		if(temp_value==0x03)
        		{
        			res_data.tem_change_state = "tem change alarm func close";
        		}
        		else
        		{
        			res_data.tem_change_state = temp_value;
        		}
        		
        		temp_value = (bytes[8]&0x03);
        		if(temp_value==0x03)
        		{
        			res_data.hum_change_state = "hum change alarm func close";
        		}
        		else
        		{
        			res_data.hum_change_state = temp_value;
        		}
        	/*	
            res_data.pir_state = (bytes[5]&0xc0)>>6;
            res_data.door_state = (bytes[5]&0x30)>>4;
            res_data.tem_ths_state = (bytes[5]&0x0c)>>2;
            res_data.hum_ths_state = bytes[5]&0x03;
            
            tem = ((bytes[6]<<2)+((bytes[7]&0xc0)>>6))/10-30;
            res_data.tem_value = tem.toFixed(1);
            hum = (((bytes[7]&0x3f)<<4)+((bytes[8]&0xf0)>>4))/10;
            res_data.hum_value = hum.toFixed(1);
            res_data.tem_change_state = (bytes[8]&0x0c)>>2;
            res_data.hum_change_state = (bytes[8]&0x03);*/
            res_data.low_batt_state = (bytes[9]&0x80)>>7;
            res_data.door_trigger_num = ((bytes[9]&0x7f)<<8) + bytes[10];
            break;

        case 6:
        		res_data.packet_type = "dev_info";
         		temp_value = (bytes[5]&0xc0)>>6;
        		if(temp_value==0x03)
        		{
        			res_data.pir_state = "pir func close";
        		}
        		else
        		{
        			res_data.pir_state = temp_value;
        		}
        		
        		temp_value = (bytes[5]&0x30)>>4;
        		if(temp_value==0x03)
        		{
        			res_data.door_state = "door check func close";
        		}
        		else
        		{
        			res_data.door_state = temp_value;
        		}
        		
        		temp_value = (bytes[5]&0x0c)>>2;
        		if(temp_value==0x03)
        		{
        			res_data.tem_ths_state = "tem threshold alarm func close";
        		}
        		else
        		{
        			res_data.tem_ths_state = temp_value;
        		}
        		
        		temp_value = bytes[5]&0x03;
        		if(temp_value==0x03)
        		{
        			res_data.hum_ths_state = "hum threshold alarm func close";
        		}
        		else
        		{
        			res_data.hum_ths_state = temp_value;
        		}
        		
        		temp_value = ((bytes[6]<<2)+((bytes[7]&0xc0)>>6));
        		if(temp_value==0x03ff)
        		{
        			res_data.tem = "tem monitor func close";
        		}
        		else
        		{
        			temp_value = ((bytes[6]<<2)+((bytes[7]&0xc0)>>6))/10-30;
        			res_data.tem = temp_value.toFixed(1) + "°";
        		}
        		
        		temp_value = (((bytes[7]&0x3f)<<4)+((bytes[8]&0xf0)>>4));
        		if(temp_value==0x03ff)
        		{
        			res_data.hum = "hum monitor func close";
        		}
        		else
        		{
        			temp_value = (((bytes[7]&0x3f)<<4)+((bytes[8]&0xf0)>>4))/10;
        			res_data.hum = temp_value.toFixed(1) + "%";
        		}
        		
        		temp_value = (bytes[8]&0x0c)>>2;
        		if(temp_value==0x03)
        		{
        			res_data.tem_change_state = "tem change alarm func close";
        		}
        		else
        		{
        			res_data.tem_change_state = temp_value;
        		}
        		
        		temp_value = (bytes[8]&0x03);
        		if(temp_value==0x03)
        		{
        			res_data.hum_change_state = "hum change alarm func close";
        		}
        		else
        		{
        			res_data.hum_change_state = temp_value;
        		}
         /*   res_data.pir_state = (bytes[5]&0xc0)>>6;
            res_data.door_state = (bytes[5]&0x30)>>4;
            res_data.tem_ths_state = (bytes[5]&0x0c)>>2;
            res_data.hum_ths_state = bytes[5]&0x03;
            tem = ((bytes[6]<<2)+((bytes[7]&0xc0)>>6))/10-30;
            res_data.tem_value = tem.toFixed(1);
            hum = (((bytes[7]&0x3f)<<4)+((bytes[8]&0xf0)>>4))/10;
            res_data.hum_value = hum.toFixed(1);
            res_data.tem_change_state = (bytes[8]&0x0c)>>2;
            res_data.hum_change_state = (bytes[8]&0x03);*/
            res_data.low_batt_state = (bytes[9]&0x80)>>7;
            res_data.door_trigger_num = ((bytes[9]&0x7f)<<8) + bytes[10];
            break;

        case 7:
        		res_data.packet_type = "dev_close";
            res_data.low_batt_state = bytes[5]&0x01;
            res_data.low_batt_alarm = ((bytes[5]&0x02)>1);
            res_data.voltage = (bytes[6]+22)/10;
            break;
        default:
           break;
    } 

    return res_data;
}


res_data1 = Decoder([0x62, 0x30, 0xC2, 0xC1, 0x10, 0x0A, 0x8A, 0xAD, 0x1A, 0x10, 0xA5], 5);
res_data2 = Decoder([0x62, 0x31, 0x33, 0xE1, 0x10, 0x4A, 0x8A, 0x2F, 0x5A, 0x10, 0xB5], 6);
res_data3 = Decoder([0x62, 0x2F, 0xF8, 0x53, 0x10, 0x02, 0x0D], 7);

console.log(res_data1);
console.log(res_data2);
console.log(res_data3);

