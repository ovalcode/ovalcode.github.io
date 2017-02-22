function timer(alarmManager, InterruptController, timerName) {
  var myAlarmManager = alarmManager;
  var myname = timerName;
  var myInterruptController = InterruptController;
  var linkedTimer = null; 
  var isEnabled = false;
  var ticksBeforeExpiry = 0;
  var targetReloaded = 0;
  myAlarmManager.addAlarm(this);
  var timerHigh = 255;
  var timerLow = 255;
  var continious = false;
  var localCPU;
  var underflowCountMode = false;
  var underflowCountingEnabled = false;

  this.setCPU = function(cpu) {
    localCPU = cpu;
  }

  this.getUnderflowCountingEnabled() {
    return underflowCountingEnabled;
  }

  this.setLinkedTimer = function (timerToLink) {
    linkedTimer = timerToLink;
  }

  this.getTimerTicks = function() {
    return ticksBeforeExpiry;
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

  this.triggerUnderflowCountEnd = function() {
    if (myname == "A") {
      myInterruptController.interruptTimerA();
    } else {
      myInterruptController.interruptTimerB();
    }
    ticksBeforeExpiry = (timerHigh << 8) | timerLow;
    //ticksBeforeExpiry = ticksBeforeExpiry + myAlarmManager.getResidue();
    if (!continious)
      underflowCountingEnabled = false;
    else {
      targetReloaded = ticksBeforeExpiry;
      ticksBeforeExpiry = targetReloaded+1;      
    }

  }

  function countUnderFlow() {
    if (linkedTimer == null)
      return;
    if (!linkedTimer.getUnderflowCountingEnabled())
      return;

    var ticksBeforeExpiry = linkedTimer.getTicksBeforeExpiry() - 1;
    if (ticksBeforeExpiry > 0) {
      linkedTimer.setTicksBeforeExpiry(ticksBeforeExpiry);
    } else {
      linkedTimer.triggerUnderflowCountEnd();
    }
    //linkedTimer.decrement();
  }

  this.trigger = function() {
    if (myname == "A") {
      myInterruptController.interruptTimerA();
    } else {
      myInterruptController.interruptTimerB();
    }
    ticksBeforeExpiry = (timerHigh << 8) | timerLow;
    //ticksBeforeExpiry = ticksBeforeExpiry + myAlarmManager.getResidue();
    if (!continious)
      isEnabled = false;
    else {
      targetReloaded = ticksBeforeExpiry/* + myAlarmManager.getResidue()*/;
      ticksBeforeExpiry = targetReloaded+1 + myAlarmManager.getResidue();
      
    }
  }

  this.setTimerHigh = function(high) {
    timerHigh = high;
  }

  this.setTimerLow = function(low) {
    timerLow = low;
  }

  this.getTimerHigh = function() {
    var tempTicks = (ticksBeforeExpiry > targetReloaded) ? targetReloaded : ticksBeforeExpiry;
    return (tempTicks >> 8) & 0xff;
  }

  this.getTimerLow = function() {
    var tempTicks = (ticksBeforeExpiry > targetReloaded) ? targetReloaded : ticksBeforeExpiry;
    return (tempTicks & 0xff);
  }

  function setUnderflowCountMode(byteValue) {
    if (myname == "A") {
      underflowCountMode = false;
      return;
    }

    var tempVal = byteValue & 0x60;
    underflowCountMode = tempval == 0x40;
  }

  function setEnabledPhi(enabledBit) {
    var tempEnabled = (enabledBit) ? true : false;
    if ((tempEnabled != isEnabled) && tempEnabled) {
      ticksBeforeExpiry = ticksBeforeExpiry + 3 /*+ localCPU.getLastCPUCycles()*/;
      targetReloaded = ticksBeforeExpiry;
    }
    isEnabled = tempEnabled;
  }

  function setEnabledUnderflowCounting(enabledBit) {
    var tempEnabled = (enabledBit) ? true : false;
    if ((tempEnabled != underflowCountingEnabled) && tempEnabled) {
      ticksBeforeExpiry = ticksBeforeExpiry + 3 /*+ localCPU.getLastCPUCycles()*/;
      targetReloaded = ticksBeforeExpiry;
    }
    underflowCountingEnabled = tempEnabled;
  }

  this.setControlRegister = function (byteValue) {
    if ((byteValue & (1 << 4)) != 0)
      ticksBeforeExpiry = (timerHigh << 8) | timerLow;

    continious = ((byteValue & (1 << 3)) == 0) ? true : false;
    setUnderflowCountMode(byteValue);

    var enabledBit = byteValue & 1;
    if (!underflowCountMode)
      setEnabledPhi(enabledBit);
    else
      setEnabledUnderflowCounting(enabledBit);
  }

  this.getControlRegister = function() {
    var tempValue = 0;
    if (continious)
      tempValue = tempValue | 1 << 3;
    if (!underflowCountMode) {
      if (isEnabled)
        tempValue = tempValue | 1;
    } else {
      if (underflowCountingEnabled)
        tempValue = tempValue | 1;
    }
    return tempValue;
  }

}



