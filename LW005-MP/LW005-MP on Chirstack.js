//LW005-MP Payload Decoder rule
//Creation time:2022-07-20 
//Creator:yujiahang
//Suitable firmware versions:LW005-MP V1.X.X
//Programming languages:Javascript
//Suitable platforms:Chirpstack

function command_format_check(bytes, fPort)
{
    switch(fPort) 
    {
        case 5:
            if (bytes.length === 7) 
                return true;
            break;

        case 6:
            if (bytes.length === 11) 
                return true;
            break;
        
        case 7:
            if (bytes.length === 10) 
                return true;
            break;

        case 8:
            if (bytes.length === 11) 
                return true;
            break;

        case 9:
            if (bytes.length === 10) 
                return true;
            break;

        case 10:
            if (bytes.length === 10) 
                return true;
            break;

        case 11:
            if (bytes.length === 10) 
                return true;
            break;

        case 12:
            if (bytes.length === 11) 
                return true;
            break;

        case 13:
            if (bytes.length === 6) 
                return true;
            break;

        case 14:
            if (bytes.length === 10) 
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

function parse_int16(num)
{
    if (num & 0x8000) 
        return (num-0x10000);
    else
        return num;
}

function parse_int24(num)
{
    if (num & 0x800000) 
        return (num-0x1000000);
    else
        return num;
}

function parse_state(num)
{
    if (num == 1)
    {
        return 'ON';
    }
    else
    {
        return 'OFF';
    }        
}

function parse_time(timestamp, timezone)
{
    timestamp = timestamp + timezone*3600;
    if (timestamp < 0) {
        timestamp = 0;
    }

    var d = new Date(timestamp*1000);
    //d.setUTCSeconds(1660202724);

    var time_str = "";
    time_str += d.getUTCFullYear();
    time_str += "/";
    time_str += d.getUTCMonth()+1;
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

function Decode(fPort, bytes, variables)
{
    var res_data = {};
    var timestamp;

    res_data.fPort = fPort;

    if(command_format_check(bytes, fPort) == false)
    {
        res_data.result = 'Format wrong';
        return res_data;
    }  
    timestamp = bytes[0]<<24 | bytes[1]<<16 | bytes[2]<<8 | bytes[3];
    res_data.time = parse_time(timestamp, bytes[4] * 0.5);
    res_data.timezone = timezone_decode(bytes[4])

    switch(fPort) 
    {
        case 5:
            res_data.AC_output_state = parse_state(bytes[5]);
            //res_data.AC_output_state = bytes[5];
            res_data.plug_load_state = parse_state(bytes[6]);
            //res_data.plug_load_state = bytes[6];
            break;

        case 6:
            res_data.instantaneous_voltage = (bytes[5]<<8 | bytes[6])/10 + 'V';
            res_data.instantaneous_current  = parse_int16(bytes[7]<<8 | bytes[8])/1000 + 'A';
            res_data.instantaneous_current_frequency  = (bytes[9]<<8 | bytes[10])/1000 + 'HZ';
            break;
        
        case 7:
            res_data.instantaneous_active_power = (bytes[5]<<24 | bytes[6]<<16 | bytes[7]<<8 | bytes[8]) / 10 + 'W';
            res_data.instantaneous_power_factor = bytes[9] + '%';
            break;
           
        case 8:
            res_data.total_energy = (bytes[5]<<24 | bytes[6]<<16 | bytes[7]<<8 | bytes[8])/3200 + 'KWH';
            res_data.energy_of_last_hour = (bytes[9]<<8 | bytes[10]) + "KWH";
            break;

        case 9:
            res_data.over_voltage_state = bytes[5];
            res_data.current_instantaneous_voltage = (bytes[6]<<8 | bytes[7])/10 + 'V';
            res_data.over_voltage_threshold = (bytes[8]<<8 | bytes[9])/10 + 'V';
            break;
           
        case 10:
            res_data.sag_voltage_state = bytes[5];
            res_data.current_instantaneous_voltage = (bytes[6]<<8 | bytes[7])/10 + 'V';
            res_data.sag_voltage_threshold = (bytes[8]<<8 | bytes[9])/10 + 'V';
            break;

        case 11:
            res_data.over_current_state = bytes[5];
            res_data.current_instantaneous_current = parse_int16(bytes[6]<<8 | bytes[7])/1000 + 'A';
            res_data.over_current_threshold = (bytes[8]<<8 | bytes[9])/1000 + 'A';
            break;

        case 12:
            res_data.over_load_state = bytes[5];
            res_data.current_instantaneous_power = parse_int24(bytes[6]<<16 | bytes[7]<<8 | bytes[8])/10 + 'W';
            res_data.over_load_threshold = (bytes[9]<<8 | bytes[10])/10 + 'W';
            break;

        case 13:
            if (bytes[5] == 1)
            {
                res_data.load_change_state  = 'load starts working';
            }
            else
            {
                res_data.load_change_state  = 'load starts stop';
            }
            break;
            // res_data.load_change_state  = bytes[5];
        case 14:
            res_data.ac_output_state_after_countdown  = parse_state(bytes[5]);
            res_data.remaining_time_of_countdown_process = (bytes[6]<<24 | bytes[7]<<16 | bytes[8]<<8 | bytes[9]) + 's';
            break;

        default:
           break;
    } 

    return res_data;
}

//res_data = Decoder([0x62, 0xF4, 0xBA, 0xDA, 0x10, 0x00, 0x00], 5);
//res_data = Decoder([0x61, 0xAD, 0x6C, 0x62, 0x10, 0x09, 0x2D, 0xF2, 0x0F, 0xC3, 0x65], 6);
//res_data = Decoder([0x61, 0xAD, 0x6C, 0x62, 0x10, 0x00, 0x00, 0x78, 0xF9, 0x26], 7);
//res_data = Decoder([0x61, 0xAD, 0x6C, 0x44, 0x10, 0x00, 0xB4, 0x1F, 0x3F, 0x01, 0x67], 8);
//console.log(res_data);
//console.log(parse_time(1660202724, 0));
