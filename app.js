const ffi = require('ffi-napi');

// Please note: If installing ffi-napi is giving issues, installing node-gyp and windows-build-tools globally might help.

const flagUSB = 1;

// This converts JSString to CString
function TEXT(text) {
  return Buffer.from(`${text}\0`, 'ucs2');
}

// This initializes the DLL functions
const app = ffi.Library('./dlls2/proRFL.dll', {
  GetDLLVersion: ['int', ['string']],
  initializeUSB: ['int', ['int']],
  Buzzer: ['int', ['int', 'int']],
  ReadCard: ['int', ['int', 'string']],
  GuestCard: [
    'int',
    [
      'int',
      'int',
      'int',
      'int',
      'int',
      'int',
      'string',
      'string',
      'string',
      'string'
    ]
  ],
  CardErase: ['int', ['int', 'int', 'string']],
  LimitCard: ['int', ['int', 'int', 'int', 'int', 'string', 'string', 'string']]
  /* GetCardTypeByCardDataStr: ['int', ['string', 'string']],
  GetGuestLockNoByCardDataStr: ['int', ['int', 'string', 'string']] */
});

// This get's the DLL version
const getDLLVersion = () => {
  // For some strange reasons, that number works.
  const string = TEXT('1280000000');
  const version = app.GetDLLVersion(string);
  if (version === 0) {
    console.log('DLL Version: ', String(string));
  } else {
    console.log('An error occurred!', String(string));
  }
};

// This function initializes the USB
const initializePluggedUSB = () => {
  st = app.initializeUSB(flagUSB);
  console.log('st', st);
  if (st === 0) {
    console.log('Success!');
  } else {
    console.log('Failure');
  }
};

// This function buzzess the RF Writer
const buzzerClicked = () => {
  const result = app.Buzzer(flagUSB, 50);
  console.log('res', result);
  if (result !== 0) {
    console.log('Beep Failure', String(result));
  }
};

// This function gets the Hex String of a card
const getBufferHexStr = () => {
  let bufCard = TEXT('128000000000000000000000000000');

  if (readGuestCard() === true) {
    app.ReadCard(flagUSB, bufCard);
    return String(bufCard);
  } else {
    return 'Error! Could not read card!';
  }
};

// This function gets the Id of a card
const getCardId = () => {
  let bufCard = TEXT('1280000000000000000000000000');

  if (readGuestCard() === true) {
    app.ReadCard(flagUSB, bufCard);
    return String(bufCard).slice(24, 32);
  } else {
    return 'Error! Could not read card!';
  }
};

// This function details of a guest card
const readGuestCard = () => {
  let bufCard = TEXT('128');
  const res = app.ReadCard(flagUSB, bufCard);
  if (res !== 0) {
    return false;
  }

  if (String(bufCard).slice(0, 6) !== '551501') {
    return false;
  }
  return true;
};

// This function issues the guest card.
// TODO: This is the bone of contention
const issueCard = () => {
  // fUsB
  const hotelId = 8; // dIsColD
  const cardNo = 1; // Place a limit that it can't exceed 16 and atleast 1
  const dia = 5; //TODO: 1. I don't understand. 2. Place a limit that it can't exceed 255
  const deadbolt = 1; // LLock -> Create a radio button to choose which deadbolt option you want
  const pdoors = 1; // public door
  const startDate = '2102241248';
  const endDate = '2102280100';
  const lockNo = '01000101'; // TODO: Get it in the card lock management system maybe I'll use roomId
  const bufHexStr = getBufferHexStr();

  if (readGuestCard() !== true) {
    return 'Error! Could not read guest card.';
  }

  const res = app.GuestCard(
    flagUSB,
    hotelId,
    cardNo,
    dia,
    deadbolt,
    pdoors,
    startDate,
    endDate,
    lockNo,
    bufHexStr
  );

  buzzerClicked();

  console.log('bufHexStr', String(bufHexStr));
  console.log('res', res);

  if (res === 0) {
    console.log('Card issued successfully!');
  } else {
    console.log('An error occured while issuing card.');
  }
};

// Reads the guest card
const readGuestCardClicked = () => {
  if (readGuestCard() !== true) {
    return 'Error! Could not read guest card.';
  }
  console.log('Card Id: ', getCardId());
};

// This erases all the details on a card
const eraseCard = () => {
  if (readGuestCard() !== true) {
    return 'Error! Could not read guest card.';
  }

  const hotelId = 1;
  const bufHexStr = getBufferHexStr();
  console.log('beforeHex', bufHexStr);

  const res = app.CardErase(flagUSB, hotelId, bufHexStr);
  // buzzerClicked();
  if (res === 0) {
    console.log('Card erased successfully!');
  } else {
    console.log('An error occured while issuing card.');
  }
};

// This limits the card
const limitCard = () => {
  const hotelId = 1; // DlsCoID
  const cardNo = 1;
  const dai = 1; // GuestId
  const startTime = '202108021647';
  const lCardNo = '123';
  const bufHexStr = getBufferHexStr();

  if (readGuestCard() !== true) {
    return 'Error! Could not read guest card.';
  }

  const res = app.LimitCard(
    flagUSB,
    hotelId,
    cardNo,
    dai,
    startTime,
    lCardNo,
    bufHexStr
  );

  console.log('res', res);
};

// This gets the guest card type
const getCardType = () => {
  const bufCard = getBufferHexStr();
  const cardType = TEXT('16');

  if (readGuestCard() !== true) {
    return 'Error! Could not read guest card.';
  }

  const res = app.GetCardTypeByCardDataStr(bufCard, cardType);

  if (res !== 0) {
    console.log('Invalid Data String');
  } else {
    const value = String(cardType).slice(0, 1);
    console.log(value);
    let cardTypeStr;
    switch (value) {
      case '0':
        cardTypeStr = 'System Card';
        break;
      case '1':
        cardTypeStr = 'Record Card';
        break;
      case '2':
        cardTypeStr = 'Room No. Setting Card';
        break;
      case '3':
        cardTypeStr = 'Time Setting Card';
        break;
      case '4':
        cardTypeStr = 'Limit Card';
        break;
      case '5':
        cardTypeStr = 'Group No. Setting Card';
        break;
      case '6':
        cardTypeStr = 'Guest Card';
        break;
      case '7':
        cardTypeStr = 'Check-Out Card';
        break;
      case '8':
        cardTypeStr = 'Group Card';
        break;
      case '9':
        cardTypeStr = 'Unknown Card Type';
        break;
      case 'A':
        cardTypeStr = 'Emergency Card';
        break;
      case 'B':
        cardTypeStr = 'Master Card';
        break;
      case 'C':
        cardTypeStr = 'Building Card';
        break;
      case 'D':
        cardTypeStr = 'Floor Card';
        break;
      case 'E':
        cardTypeStr = 'Unknown Card';
        break;
      case 'F':
        cardTypeStr = 'Blank Card';
        break;
    }
    console.log(cardTypeStr);
  }
};

const getGuestLockNo = () => {
  const hotelId = 1;
  const lockNo = TEXT('16');
  const bufCard = getBufferHexStr();

  if (readGuestCard() !== true) {
    return 'Error! Could not read guest card.';
  }

  const res = app.GetGuestLockNoByCardDataStr(hotelId, bufCard, lockNo);
  console.log('res', res);
  console.log('lockNo', String(lockNo));
};

// getGuestLockNo();
// getCardType();
// limitCard();
// console.log(eraseCard());
// issueCard();
console.log(getBufferHexStr());
console.log(getCardId());
// readGuestCardClicked();
// buzzerClicked();
// initializePluggedUSB();
// getDLLVersion();
// getGuestLockNo();
// eraseCard();
