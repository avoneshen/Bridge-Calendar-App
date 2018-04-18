
'use strict';

// The purpose of this script is to clear out Gcal.
var app = require('./app');
var purgeRecords = async function() {
  await app.purgeCalendarRecords();
};
purgeRecords();
