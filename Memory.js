function memory(allDownloadedCallback, keyboard, timerA, timerB, cia2TimerA, 
                interruptController, cia2InterruptController, tape)
//cia2 -> timer a+interrupt controller in both declaration and global vars
//create cia2 read+write function
//invoke above functions in ioread+iowrite
{
  var mytimerA = timerA;
  var mytimerB = timerB;
  var myCIA2timerA = cia2TimerA;
  var myinterruptController = interruptController;
  var myCIA2interruptController = cia2InterruptController;
  var mytape = tape;
  var mainMem = new Uint8Array(65536);

  for (i = 0; i< 65536; i++) {
    mainMem[i] = (i & 0x40) ? 0xff : 0;
  }
  mainMem[1] = 0xff;

  var IOUnclaimed = new Uint8Array(4096);
  var basicRom = new Uint8Array(8192);
  var kernalRom = new Uint8Array(8192);
  var charRom = new Uint8Array(4192);
  var outstandingDownloads = 3;
  var simulateKeypress = false;
  var keyboardInstance = keyboard;
  var playPressed = false;

  this.togglePlayPresed = function() {
    playPressed = !playPressed;
  }


  function downloadCompleted() {
    outstandingDownloads--;
    if (outstandingDownloads == 0)
      allDownloadedCallback();
  }

  this.setSimulateKeypress = function () {
    simulateKeypress = true;
  }

  this.setVideo = function(video) {
    myVideo = video;
  }


//------------------------------------------------------------------------

var oReqBasic = new XMLHttpRequest();
oReqBasic.open("GET", "basic.bin", true);
oReqBasic.responseType = "arraybuffer";

oReqBasic.onload = function (oEvent) {
  var arrayBuffer = oReqBasic.response; // Note: not oReq.responseText
  if (arrayBuffer) {
    basicRom = new Uint8Array(arrayBuffer);
    downloadCompleted();
  }
};

oReqBasic.send(null);

//------------------------------------------------------------------------

var oReqKernal = new XMLHttpRequest();
oReqKernal.open("GET", "kernal.bin", true);
oReqKernal.responseType = "arraybuffer";

oReqKernal.onload = function (oEvent) {
  var arrayBuffer = oReqKernal.response; // Note: not oReq.responseText
  if (arrayBuffer) {
    kernalRom = new Uint8Array(arrayBuffer);
    downloadCompleted();
  }
};

oReqKernal.send(null);

//------------------------------------------------------------------------

var oReqChar = new XMLHttpRequest();
oReqChar.open("GET", "characters.bin", true);
oReqChar.responseType = "arraybuffer";

oReqChar.onload = function (oEvent) {
  var arrayBuffer = oReqChar.response; // Note: not oReq.responseText
  if (arrayBuffer) {
    charRom = new Uint8Array(arrayBuffer);
    downloadCompleted();
  }
};

oReqChar.send(null);


//------------------------------------------------------------------------

  this.readCharRom = function (address) {
    return charRom[address];
  }

  function ciaRead(address) {
    if (address == 0xdc00) {
      return (~keyboardInstance.getJoyStickByte()) & IOUnclaimed[address & 0xfff] & 0xff;
    } else if (address == 0xdc01) {
      return keyboardInstance.getColumnByte(IOUnclaimed[0xdc00 & 0xfff]);
    } else if (address == 0xdc04) {
      return mytimerA.getTimerLow();
    } else if (address == 0xdc05) {
      return mytimerA.getTimerHigh();
    } else if (address == 0xdc06) {
      return mytimerB.getTimerLow();
    } else if (address == 0xdc07) {
      return mytimerB.getTimerHigh();
    } else if (address == 0xdc0d) {
      return myinterruptController.getInterrupts();
    } else if (address == 0xdc0e) {
      return mytimerA.getControlRegister();
    } else if (address == 0xdc0f) {
      return mytimerB.getControlRegister();
    } else {
      return IOUnclaimed[address & 0xfff];
    }

  }

  function cia2Read(address) {
//  var myCIA2timerA = cia2TimerA;
//  var myCIA2interruptController = cia2InterruptController;

    if (address == 0x4) {
      return myCIA2timerA.getTimerLow();
    } else if (address == 0x5) {
      return myCIA2timerA.getTimerHigh();
    } if (address == 0xd) {
      return myCIA2interruptController.getInterrupts();
    } else if (address == 0xe) {
      return myCIA2timerA.getControlRegister();
    } else {
      return IOUnclaimed[address & 0xfff];
    }

  }

  function ciaWrite(address, byteValue) {
    if (address == 0xdc04) {
      return mytimerA.setTimerLow(byteValue);
    } else if (address == 0xdc05) {
      return mytimerA.setTimerHigh(byteValue);
    } else if (address == 0xdc06) {
      return mytimerB.setTimerLow(byteValue);
    } else if (address == 0xdc07) {
      return mytimerB.setTimerHigh(byteValue);
    } else if (address == 0xdc0d) {
      return myinterruptController.setInterruptMask(byteValue);
    } else if (address == 0xdc0e) {
      return mytimerA.setControlRegister(byteValue);
    } else if (address == 0xdc0f) {
      return mytimerB.setControlRegister(byteValue);
    } else {
      IOUnclaimed[address & 0xfff] = byteValue;
    }
    
  }

  function cia2Write(address, byteValue) {
    if (address == 0x4) {
      return myCIA2timerA.setTimerLow(byteValue);
    } else if (address == 0x5) {
      return myCIA2timerA.setTimerHigh(byteValue);
    } else if (address == 0xd) {
      return myCIA2interruptController.setInterruptMask(byteValue);
    } else if (address == 0xe) {
      return myCIA2timerA.setControlRegister(byteValue);
    } else {
      IOUnclaimed[address & 0xfff] = byteValue;
    }
    
  }

  function kernelEnabled() {
    temp = mainMem[1] & 3;
    return (temp >= 2);
  }

  function IOEnabled() {    
    var temp = mainMem[1] & 3;    
    var temp2 = mainMem[1] & 4;    
    return (temp2 != 0) & (temp != 0);  
  }

  function CharRomEnabled() {    
    var temp = mainMem[1] & 3;    
    var temp2 = mainMem[1] & 4;    
    return (temp2 == 0) & (temp != 0);  
  }


  function basicEnabled() {
    temp = mainMem[1] & 3;
    return (temp == 3);
  }


  this.vicRead = function(address) {
    var topBits = IOUnclaimed[0xd00] & 3;
    topBits = 3 - topBits;
    var effectiveAddress = (topBits << 14) | address;
    if ((effectiveAddress >= 0x9000) & (effectiveAddress < 0xa000)) {
      effectiveAddress = effectiveAddress & 0xfff;
      return charRom[effectiveAddress];
    } else if ((effectiveAddress >= 0x1000) & (effectiveAddress < 0x2000)) {
      effectiveAddress = effectiveAddress & 0xfff;
      return charRom[effectiveAddress];
    } else {
      return mainMem[effectiveAddress];
    }
  }

  function IORead(address) {
    if ((address >= 0xdc00) & (address <= 0xdcff)) {
      return ciaRead(address);
    } else if ((address >= 0xdd00) && (address <= 0xddff) && (address != 0xdd00)) {
      return cia2Read(address & 0xf);
    } else if ((address >= 0xd000) & (address <= 0xd02e)) {
      return myVideo.readReg(address - 0xd000);
    } else if ((address >= 0xd800) & (address <= 0xdbe8)) {
      return myVideo.readColorRAM (address - 0xd800);
    } else {
      return IOUnclaimed[address - 0xd000];
    } 
  }

  function IOWrite(address, value) {
    if ((address >= 0xdc00) & (address <= 0xdcff)) {
      return ciaWrite(address, value);
    } else if ((address >= 0xdd00) && (address <= 0xddff) & (address != 0xdd00)) {
      return cia2Write(address & 0xf, value);
    } else if ((address >= 0xd000) & (address <= 0xd02e)) {
      return myVideo.writeReg(address - 0xd000, value);
    } else if ((address >= 0xd800) & (address <= 0xdbe8)) {
      return myVideo.writeColorRAM (address - 0xd800, value);
    } else {
      IOUnclaimed[address - 0xd000] = value;
      return;
    } 
  }

  this.readMem = function (address) {
    if ((address >= 0xa000) & (address <=0xbfff) & basicEnabled())
      return basicRom[address & 0x1fff];
    else if ((address >= 0xe000) & (address <=0xffff) & kernelEnabled())
      return kernalRom[address & 0x1fff];
    else if ((address >= 0xd000) & (address <= 0xdfff) & (IOEnabled() || CharRomEnabled())) {
      if (IOEnabled()) {
        return IORead(address);
      } else {
        return charRom[address & 0xfff];
      }
    } else if (address == 1) {
      var temp = mainMem[address] & 239;
      if (!playPressed)
        temp = temp | 16;
      return temp;
    }
    return mainMem[address];
  }

  this.testStr = function (from, to) {
    var tempmemstr = "";
    var fromLocation = (from >> 4) << 4;
    var toLocation = ((to >> 4) << 4) + 16;
    for (i = fromLocation; i < (toLocation); i++) {
      if ((i % 16) == 0) {
        labelstr = "";
        labelstr = labelstr + "0000" + i.toString(16);
        labelstr = labelstr.slice(-4);

       tempmemstr = tempmemstr + "\n" + labelstr;
      }
      currentByte = "00" + mymem.readMem(i).toString(16);        
      currentByte = currentByte.slice(-2);
      tempmemstr = tempmemstr + " " + currentByte;
     }
     return tempmemstr;

  }

  this.writeMem = function (address, byteval) {
    if ((address >= 0xd000) & (address <= 0xdfff) & IOEnabled()) {
      IOWrite(address, byteval);
      return;
    } else if (address == 1) {
      var temp = byteval & 32;
      temp = temp >> 5;
      tape.setMotorOn(temp);
    }   
    mainMem[address] = byteval;
  }

}


