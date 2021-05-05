//因为bytes的格式为base64编码格式，将bytes的格式转为单个元素为一个字节的十六进制数的数组
function base64_to_hexarray(bytes) {
  var a = bytes.length; //取payload的长度
  var bytesarray = [];  //定义一个新的数组变量
  for(b =0; b < a;b++)   //将bytes中的值挨个取到新的数组变量中
  {
    if(bytes[b]<16)
    {
      bytesarray[b] = (0 + (bytes[b].toString(16))).toUpperCase(); //base64取值时，若值为0X，则0 会被省略掉，所以判断下数字若为小于16，则需加0
    }
    else
    { 
      bytesarray[b] = bytes[b].toString(16).toUpperCase();
    }
  }
  return bytesarray;  //返回新数组
}
