
'use strict';

// The purpose of this script is to run the updateCalendar command of app.js
// This is what we call with the Heroku scheduler.
var app = require('./app');
var executeApp = async function() {
  await app.updateCalendar();
};
executeApp();
