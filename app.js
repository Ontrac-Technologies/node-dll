const ffi = require('ffi-napi');

const flagUSB = 1;

// Convert JSString to CString
function TEXT(text) {
  return Buffer.from(`${text}\0`, 'ucs2');
}

const app = ffi.Library('./dlls/proRFL.dll', {
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

const getDLLVersion = () => {
  const string = TEXT('1280000000');
  const version = app.GetDLLVersion(string);
  if (version === 0) {
    console.log('DLL Version: ', String(string));
  } else {
    console.log('An error occurred!', String(string));
  }
};

const initializePluggedUSB = () => {
  st = app.initializeUSB(flagUSB);
  console.log('st', st);
  if (st === 0) {
    console.log('Success!');
  } else {
    console.log('Failure');
  }
};

const buzzerClicked = () => {
  const result = app.Buzzer(flagUSB, 50);
  console.log('res', result);
  if (result !== 0) {
    console.log('Beep Failure', String(result));
  }
};

const getBufferHexStr = () => {
  let bufCard = TEXT('128000000000000000000000000000');

  if (readGuestCard() === true) {
    app.ReadCard(flagUSB, bufCard);
    return String(bufCard);
  } else {
    return 'Error! Could not read card!';
  }
};

const getCardId = () => {
  let bufCard = TEXT('1280000000000000000000000000');

  if (readGuestCard() === true) {
    app.ReadCard(flagUSB, bufCard);
    return String(bufCard).slice(24, 32);
  } else {
    return 'Error! Could not read card!';
  }
};

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

const issueCard = () => {
  // fUsB
  const hotelId = 1; // dIsColD
  const cardNo = 1; // Place a limit that it can't exceed 16 and atleast 1
  const dia = 1; //TODO: 1. I don't understand. 2. Place a limit that it can't exceed 255
  const deadbolt = 1; // LLock -> Create a radio button to choose which deadbolt option you want
  const pdoors = 0; // public door
  const startDate = TEXT('2102081248');
  const endDate = TEXT('2102100100');
  const lockNo = TEXT(2); // TODO: Get it in the card lock management system maybe I'll use roomId
  const bufHexStr = TEXT(getBufferHexStr());

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

const readGuestCardClicked = () => {
  if (readGuestCard() !== true) {
    return 'Error! Could not read guest card.';
  }
  console.log('Card Id: ', getCardId());
};

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

const limitCard = () => {
  // fUSB
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
// console.log(getBufferHexStr());
// console.log(getCardId());
// readGuestCardClicked();
// buzzerClicked();
// initializePluggedUSB();
getDLLVersion();
// getGuestLockNo();
