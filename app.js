
'use strict';

const liftParser = require('./liftParser.js');
const execSync = require('child_process').execSync;
const bridgeLiftController = require('./controllers/bridgeLiftController');
const googleCalendarController = require('./controllers/googleCalendarController');
const app = {};

// Set up mongoose connection
var mongoose = require('mongoose');
var mongoDB = 'mongodb://' + process.env.MONGO_USER + process.env.MONGO_PW + process.env.MONGO_URL_SUFFIX;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const fetchLiftsCommand = 'tblifts lifts';

var connectToDB = function() {
  mongoose.connect(mongoDB);
};

// the line break is \r\n from this command
var fetchLifts = function() {
  console.log('Beginning Lift Read...');
  const stdout = execSync(fetchLiftsCommand);
  console.log('Lift Read Complete');
  return stdout;
};

var updateCalendar = async function() {
  try {
    connectToDB();
    let lifts = '';
    lifts = fetchLifts();
    let parsedLifts = liftParser.parseLifts(lifts);
    console.log('Parse Complete');
    // Check parsed lifts isn't an empty array. Trigger the error return if it is
    if (parsedLifts.length === 0) {
      throw new Error('No Input Could be Loaded');
    }

    let objectifiedLifts = liftParser.objectifyArray(parsedLifts);

    // Try and insert...
    console.log('Beginning DB Update...');
    await bridgeLiftController.processRecords(objectifiedLifts);
    console.log('DB Update Complete. Beginning Google Update.');
    await googleCalendarController.processGoogleCalendarRecords();
    // Load Complete!
    console.log('Calendar Update Complete. Closing Connection.');
    closeConnection();
  } catch (error) {
    handleFailure(error);
    closeConnection();
  }
};

var purgeCalendarRecords = async function() {
  try {
    await googleCalendarController.purgeCalendarData();
    closeConnection();
  } catch (error) {
    handleFailure(error);
  }
};

var closeConnection = function() {
  console.log('Closing Database Connection');
  mongoose.connection.close();
};

var handleFailure = function(errorCode) {
  if (errorCode) {
    console.log('Load failed with error: ' + errorCode);
  } else {
    console.log('Load failed, however no error code was passed to the failure handler.');
  }
  return true;
};

app.fetchLifts = fetchLifts;
app.updateCalendar = updateCalendar;
app.handleFailure = handleFailure;
app.closeConnection = closeConnection;
app.connectToDB = connectToDB;
app.purgeCalendarRecords = purgeCalendarRecords;

module.exports = app;
