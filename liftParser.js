
'use strict';

var liftParser = {};
var moment = require('moment-timezone');
moment.tz.setDefault('Europe / London');
// Sets the OS - determines which newline to use!
const os = 'unix';

// parse results to string array
var parseLifts = function(input) {
  // Newline windows: \r\n
  // Newline linux: 
  let newline;
  if (os === 'unix') {
    newline = '\n';
  } else if (os === 'dos') {
    newline = '\r\n';
  }
  let lifts = input;
  let listToReturn = splitString(lifts, newline);
  return listToReturn;
};

// handle input from string array
function splitString(input, separator) {
  let output = [];
  // input.split fails if an undefined type comes through...
  if (input && !(input === 'undefined')) {
    let stringInput = input.toString();
    output = stringInput.split(separator);
  }
  return output;
};

// produce array of objects [{},{}] from array of strings
var objectifyArray = function(listToObjectify) {
  let objectifiedList = [];
  let unloadableCounter = 0;

  for (let lift of listToObjectify) {
    let liftObject = objectifyCalendarInput(lift);
    if (
      liftObject &&
      (liftObject.name && liftObject.name !== '') &&
      (liftObject.openingTime && liftObject.openingTime !== '')
    ) {
      objectifiedList.push(liftObject);
    } else {
      unloadableCounter++;
    }
  }

  if (unloadableCounter > 0) {
    unloadableRecords(unloadableCounter);
  }

  return objectifiedList;
};

var parseDateTimeStringsReturnDate = function(date, time) {
  let myDate;
  try {
    let dateTime = date + ' ' + time + ':00';
    myDate = moment(dateTime, 'DD-MMM-YY HH:mm:ss').format();
  } catch (error) {
    console.log('Error with input: ' + error);
    console.log('The line will be rejected');
    myDate = false;
  }
  if (myDate && !(myDate === 'undefined' || String(myDate) === 'Invalid date')) {
    return myDate;
  } else {
    return '';
  }
};

// Sample input: "08-Feb-18 Thu 19:45 ## Boat Name Spaced"
// parsed as: date_day_time_tide_name_name_name
var objectifyCalendarInput = function(inputEntry) {
  let vesselName = '';
  let openingDateTime = '';
  let returnLift;
  try {
    let splitInput = splitString(inputEntry, ' ');
    openingDateTime = parseDateTimeStringsReturnDate(splitInput[0], splitInput[2]);
    if (splitInput.length > 4) {
      for (let i = 4; i < splitInput.length; i++) {
        vesselName += splitInput[i];
        if (i + 1 !== splitInput.length) {
          vesselName += ' ';
        }
      }
      returnLift = new Lift(openingDateTime, vesselName);
    }
  } catch (error) {
    console.log('Error when objectifying calendar input.');
  }

  return returnLift;
};

function Lift(dateTime, vesselName) {
  this.openingTime = dateTime;
  this.name = vesselName;
};

var unloadableRecords = function(count) {
  console.log('Warning: ' + count + ' record(s) could not be loaded!');
};

liftParser.parseLifts = parseLifts;
liftParser.objectifyArray = objectifyArray;
liftParser.parseDateTimeStringsReturnDate = parseDateTimeStringsReturnDate;
liftParser.objectifyCalendarInput = objectifyCalendarInput;

module.exports = liftParser;
