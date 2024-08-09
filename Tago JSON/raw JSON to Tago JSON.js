function toTagoFormat(object_item, group) {
    const result = [];
  
    result.push(loadObj('msg_id',object_item['msg_id'],group));
    result.push(loadObj('mac',object_item['device_info']['mac'],group));
    result.push(loadObj('mqtt_topic',object_item['metadata']['mqtt_topic'],group));
  
    const beaconList = object_item['data'];
  
    for (var i = 0; i < beaconList.length; i ++) {
      const obj = beaconList[i];
      for (const key in obj) {
        const tempKey = 'beacon_' + i + '_' + key;
        result.push(loadObj(tempKey,obj[key],group));
      }
    }
  
    return result;
}
  
function loadObj(key,value,groupID) {
    return {
      variable:key,
      value:value,
      group:groupID
    };
}
  
// Check if what is being stored is the ttn_payload.
// Payload is an environment variable. Is where what is being inserted to your device comes in.
if (!payload[0].variable) {
// Get a unique group for the incoming data.
    const group = payload[0].group || String(new Date().getTime());
    
    payload = toTagoFormat(payload[0], group);
}