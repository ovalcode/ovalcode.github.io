function tape(alarmManager, interruptManager) {
  var myAlarmManager = alarmManager;
  var myInterruptManager = interruptManager;
  var tapeData;
  var posInTape;
  var isEnabled = false;
  var ticksBeforeExpiry = 0;
  myAlarmManager.addAlarm(this);

  this.attachTape = function(file) {
       var reader = new FileReader();
       reader.onload = function(e) {
         var arrayBuffer = reader.result;
         tapeData = new Uint8Array(arrayBuffer);
         posInTape = 0x14;
         scheduleNextTrigger();
         alert("Tape attached");
       }
       reader.readAsArrayBuffer(file);

  }

  this.setMotorOn = function(bit) {
    var oldEnabled = isEnabled;
    isEnabled = (bit == 0) ? true : false;
    //if ((oldEnabled != isEnabled) & isEnabled) {
    //  ticksBeforeExpiry = ticksBeforeExpiry + 32000;
    //}
  }

  function scheduleNextTrigger() {
    var tapeDataByte0 = tapeData[posInTape];
    if (tapeDataByte0 == 0) {
      var tapeDataByte1 = tapeData[posInTape + 1];
      var tapeDataByte2 = tapeData[posInTape + 2];
      var tapeDataByte3 = tapeData[posInTape + 3];
      ticksBeforeExpiry = (tapeDataByte3 << 16) | (tapeDataByte2 << 8) | (tapeDataByte1);
      posInTape = posInTape + 4;
    } else {
      ticksBeforeExpiry = tapeDataByte0 << 3;
      posInTape++;
    }
  }

  this.getIsEnabled = function() {
    return isEnabled;
  }

  this.getTicksBeforeExpiry = function() {
    return ticksBeforeExpiry;
  }

  this.setTicksBeforeExpiry = function(ticks) {
    ticksBeforeExpiry = ticks;
  }

  this.trigger = function() {
    myInterruptManager.interruptFlag1();
    scheduleNextTrigger();
  }

}



