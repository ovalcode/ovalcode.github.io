function timer(alarmManager, InterruptController, timerName) {
  var myAlarmManager = alarmManager;
  var myname = timerName;
  var myInterruptController = InterruptController; 
  var isEnabled = false;
  var ticksBeforeExpiry = 0;
  myAlarmManager.addAlarm(this);
  var timerHigh = 255;
  var timerLow = 255;
  var continious = false;
  var localCPU;

  this.setCPU = function(cpu) {
    localCPU = cpu;
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
    if (myname == "A") {
      myInterruptController.interruptTimerA();
    } else {
      myInterruptController.interruptTimerB();
    }
    ticksBeforeExpiry = (timerHigh << 8) | timerLow;
    if (!continious)
      isEnabled = false;
  }

  this.setTimerHigh = function(high) {
    timerHigh = high;
  }

  this.setTimerLow = function(low) {
    timerLow = low;
  }

  this.getTimerHigh = function() {
    var tempTicks = ticksBeforeExpiry - localCPU.getLastCPUCycles();
    return (ticksBeforeExpiry >> 8) & 0xff;
  }

  this.getTimerLow = function() {
    var tempTicks = ticksBeforeExpiry - localCPU.getLastCPUCycles();
    return (ticksBeforeExpiry & 0xff);
  }

  this.setControlRegister = function (byteValue) {
    if ((byteValue & (1 << 4)) != 0)
      ticksBeforeExpiry = (timerHigh << 8) | timerLow;

    continious = ((byteValue & (1 << 3)) == 0) ? true : false;

    var tempEnabled = ((byteValue & 1) == 1) ? true : false;
    if ((tempEnabled != isEnabled) && tempEnabled) {
      ticksBeforeExpiry = ticksBeforeExpiry + 3 + localCPU.getLastCPUCycles();
    }
    isEnabled = tempEnabled;
  
  }

  this.getControlRegister = function() {
    var tempValue = 0;
    if (continious)
      tempValue = tempValue | 1 << 3;
    if (isEnabled)
      tempValue = tempValue | 1;
    return tempValue;
  }

}



