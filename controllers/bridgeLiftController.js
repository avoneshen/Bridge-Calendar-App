
'use strict';

var BridgeLift = require('../models/bridgeLift');
var controllerDataLibrary = require('../controllers/controllerDataLibrary');

// Handles input from the command line (Ruby Script).
exports.processRecords = async function(input) {
  console.log('Processing Records...');
  try {
    let databaseLifts = exports.bridgeLift_selectFutureData();
    let recordsToPurge = controllerDataLibrary.EvalAndReturnSingletonRecords(databaseLifts, input);
    if (recordsToPurge.length > 0) {
      console.log('Records Found. Purge Process Beginning...');
      exports.bridgeLift_deleteCollection(recordsToPurge);
    } else {
      console.log('No Records to Purge. Beginning Update...');
    }
    await exports.bridgeLift_upsertCollection(input);
  } catch (error) {
    console.log('processRecords failed with error: ' + error);
    return error;
  }
};

// Insert or update records in the input array. Joins on openingTime.
exports.bridgeLift_upsertCollection = async function(array) {
  console.log('Upserting...');
  for (const lift of array) {
    console.log('Upserting: ' + lift.name + ', scheduled for: ' + lift.openingTime);
    let dateObject = {
      name: lift.name,
      openingTime: lift.openingTime,
      gid: lift.gid,
    };
    let queryObject = {
      openingTime: lift.openingTime,
    };
    let upsertLift = BridgeLift.findOneAndUpdate(queryObject, dateObject, { upsert: true });
    try {
      await upsertLift.exec();
    } catch (error) {
      console.log('Error when processing lift time: ' + lift.openingTime + ', Error: ' + error);
    }

  }
  console.log('Upserting Complete.');
  return 'done';
};

// Populates the GID field of existing records.
exports.bridgeLift_updateCollection = async function(array) {
  for (const lift of array) {
    console.log('Updating GID of: ' + lift.summary + ', scheduled for: ' + lift.openingTime);
    let dateObject = {
      gid: lift.gid,
    };
    let queryObject = {
      openingTime: lift.openingTime,
    };
    let updateLift = BridgeLift.findOneAndUpdate(queryObject, dateObject);
    try {
      await updateLift.exec();
    } catch (error) {
      console.log('Error when processing lift time: ' + lift.openingTime + ', Error: ' + error);
    }
  }
};

// Selects any lifts scheduled after the time this call is made.
exports.bridgeLift_selectFutureData = async function() {
  let now = new Date();
  console.log('building query...');
  let liftQuery = BridgeLift.find({ openingTime: { $gt: now } }).sort({ openingTime: 1 });
  let results = [];
  try {
    console.log('executing query...');
    results = await liftQuery.exec();
    console.log('exec complete...');
  } catch (error) {
    console.log('Error when fetching future data, error: ' + error);
    results = [];
  }
  return results;
};

// Find and remove records from the input. Finds records based on array.openingTime.
exports.bridgeLift_deleteCollection = async function(array) {
  console.log('Deleting...');
  for (const lift of array) {
    console.log('Deleting: ' + lift.name + ', scheduled for: ' + lift.openingTime);
    let queryObject = {
      openingTime: lift.openingTime,
    };
    let deleteLift = BridgeLift.find(queryObject).remove();
    try {
      await deleteLift.exec();
    } catch (error) {
      console.log('Error when processing lift time: ' + lift.openingTime + ', Error: ' + error);
    }
  }
  console.log('Deletion Complete.');
};
