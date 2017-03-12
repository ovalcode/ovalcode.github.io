function tape(alarmManager, interruptManager) {
  var myAlarmManager = alarmManager;
  var myInterruptManager = interruptManager;
  var tapeData;
  var posInTape;
  var isEnabled = false;
  var stopping = false;
  var cyclesBeforeStopped = 0;
  var ticksBeforeExpiry = 0;
  var lastScheduledTicks = 0;
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
    var tempEnabled = (bit == 0) ? true : false;
    var stateChanged = oldEnabled != tempEnabled;
    if (stateChanged) {
      if (tempEnabled) {
        ticksBeforeExpiry = ticksBeforeExpiry + 32000;
        isEnabled = true;  
      } else {
        stopping = true;
        cycledBeforeStopped = 32000;
      }
    }

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
    ticksBeforeExpiry = ticksBeforeExpiry + myAlarmManager.getResidue();
    lastScheduledTicks = ticksBeforeExpiry;
  }

  this.getIsEnabled = function() {
    return isEnabled;
  }

  this.getTicksBeforeExpiry = function() {
    return ticksBeforeExpiry;
  }

  this.setTicksBeforeExpiry = function(ticks) {
    var oldTicks = ticksBeforeExpiry;
    if (stopping) {
      cycledBeforeStopped = cycledBeforeStopped - (oldTicks - ticks);
      if (cycledBeforeStopped <= 0) {
        isEnabled = false;
        stopping = false;
      }
    }

    ticksBeforeExpiry = ticks;
  }

  this.trigger = function() {
    console.log("Tape triggered "+posInTape);
    myInterruptManager.interruptFlag1();
    scheduleNextTrigger();
  }

}



