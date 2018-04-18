// Copyright 2014-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// Sourced from https://github.com/google/google-api-nodejs-client/#google-apis-nodejs-client
// Calendar API developed by Google.

'use strict';

var fs = require('fs');
const util = require('util');
var { google } = require('googleapis');
let moment = require('moment-timezone');
moment.tz.setDefault('Europe / London');
var calendar = google.calendar('v3');
const list = util.promisify(calendar.events.list);
const insert = util.promisify(calendar.events.insert);
const update = util.promisify(calendar.events.update);
const deleteFunc = util.promisify(calendar.events.delete);

const controllerDataLibrary = require('../controllers/controllerDataLibrary');
const bridgeLiftController = require('../controllers/bridgeLiftController');

// process.env - Heroku specific environment variables.
var key = {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.GC_PRIVATE_KEY.replace(/\\n/g, '\n')
};

var bridgeCalendarId = process.env.BRIDGE_CALENDAR_ID;
var maximumRecords = 400;

let googleCalendarController = {};

let authClient = '';

// -------------------------------------------------------
// Authentication Start
// -------------------------------------------------------
// Google Copyright
// Return authClient
async function returnAuthClient() {
  let authClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/calendar'],
    null
  );
  try {
    await authClient.authorize();
    return authClient;
  } catch (error) {
    console.log('Failed to get auth token: ' + error);
    return 'error';
  }
}
// -------------------------------------------------------
// Authentication End
// -------------------------------------------------------

const processGoogleCalendarRecords = async function() {
  try {
    authClient = await returnAuthClient();
    let liftData = await returnDatabaseRecords();
    let calData = await returnDatabaseObjects();
    let recordsToDelete = controllerDataLibrary.EvalAndReturnSingletonRecords(calData, liftData);
    await processRecordsToDelete(recordsToDelete);
    const evaluatedRecordList = evaluateRecords(liftData, calData);
    await processRecordsToUpsert(evaluatedRecordList);
    return 'Calendar sync complete';
  } catch (error) {
    console.log('processGoogleCalendarRecords failed with error: ' + error);
    return error;
  }
};

const purgeCalendarData = async function() {
  try {
    authClient = await returnAuthClient();
    let listReq = new ListRequest(authClient, bridgeCalendarId, maximumRecords);
    console.log('Fetching current calendar data');
    let currentCalendarData = await list(listReq);
    let calData = returnAllListEntryObjects(currentCalendarData);
    console.log('Attempting Purge');
    await deleteRecords(calData);
  } catch (error) {
    console.log('Error Removing Data: ' + error);
  }
};

async function returnDatabaseRecords() {
  let liftData = [];
  try {
    console.log('Select Future Data');
    let unformattedLiftData = await bridgeLiftController.bridgeLift_selectFutureData();
    console.log('Converting DB data to GCal Format...');
    for (const data of unformattedLiftData) {
      let gcRec = new GcalEntry(data.openingTimeIso, data.closingTimeIso, data.summary, data.description, data.gid);
      liftData.push(gcRec);
    }
    console.log('Conversion complete');
    if (liftData.length === 0) {
      throw new Error('no records found in the database');
    }
  } catch (error) {
    console.log('Error fetching data: ' + error);
  }
  return liftData;
}

// @Return: output of the list command, containing all date from the selected calendar.
// currentCalendarData: { data: { items {[0..n of events: {}]} } }
// events: {}, similar to CalendarResource, but refer to documentation
async function returnDatabaseObjects() {
  let calData = [];
  console.log('Creating list request');
  let listReq = new ListRequest(authClient, bridgeCalendarId, maximumRecords);
  console.log('Fetching current calendar data');
  let currentCalendarData = await list(listReq);
  calData = returnAllListEntryObjects(currentCalendarData);
  return calData;
}

// Object returned: https://developers.google.com/google-apps/calendar/v3/reference/events#resource
//  This is a modified version of the following script: https://developers.google.com/calendar/quickstart/nodejs
function returnAllListEntryObjects(input) {
  var entryObjectsArray = [];
  var events = input.data.items;
  if (events.length === 0) {
    console.log('No upcoming events found.');
  } else {
    // Adapted from Google Sample
    for (var i = 0; i < events.length; i++) {
      let event = events[i];
      let start = event.start.dateTime;
      start = moment(start).toISOString();
      let end = event.end.dateTime;
      end = moment(end).toISOString();
      let summary = event.summary;
      let description = event.description;
      let gid = event.id;
      let entryToAdd = new GcalEntry(start, end, summary, description, gid);
      entryObjectsArray.push(entryToAdd);
    }
  }
  return entryObjectsArray;
}
// @param: recordsToDelete: { object } - structure of GcalEntry, see controller in this library. Key fields:
//    recordsToDelete.openingTime: dateTime: dateTime ISO string
//    recordsToDelete.closingTime: dateTime: dateTime ISO string
//    recordsToDelete.summary: string
//    recordsToDelete.description: string
//    recordsToDelete.gid: string
async function processRecordsToDelete(recordsToDelete) {
  if (recordsToDelete.length > 0) {
    console.log('Orphaned Gcal Records Found. Purge Process Beginning...');
    try {
      await deleteRecords(recordsToDelete);
    } catch (error) {
      console.log('Failure deleting records: ' + error);
    }
  } else {
    console.log('No Records to Purge. Beginning calendar update...');
    return false;
  }
}

// @param: dbRecords: { object } - structure of GcalEntry, see controller in this library. Key fields:
//    dbRecord.openingTime: dateTime: dateTime ISO string
//    dbRecord.closingTime: dateTime: dateTime ISO string
//    dbRecord.summary: string
//    dbRecord.description: string
//    dbRecord.gid: string
// @param: calendarRecords: { object } - structure of GcalEntry, see controller in this library. Key fields:
//    calendarRecords.openingTime: dateTime: dateTime ISO string
//    calendarRecords.closingTime: dateTime: dateTime ISO string
//    calendarRecords.summary: string
//    calendarRecords.description: string
//    calendarRecords.gid: string
// @return: returnRecords { recordsToInsert: [ { dbRecord } ], recordsToUpdate: [ { dbRecord } ]}
//    e.g. returnRecords.recordsToInsert[0].openingTime
function evaluateRecords(dbRecords, calendarRecords) {
  let returnRecords = {
    recordsToInsert: [],
    recordsToUpdate: [],
  };
  for (const record of dbRecords) {
    if ((record.gid !== '' && record.gid) && (calendarRecords && calendarRecords.length > 0)) {
      for (const gcRecord of calendarRecords) {
        if (
          (gcRecord.gid === record.gid) &&
          (gcRecord.description !== record.description || gcRecord.summary !== record.summary)
        ) {
          returnRecords.recordsToUpdate.push(record);
        }
      }
    } else {
      // Set flag and ensure no record matches it
      let duplicateRecordFlag = false;
      if (calendarRecords && calendarRecords.length > 0) {
        for (const gcRecord of calendarRecords) {
          if (gcRecord.openingTime === record.openingTime) {
            duplicateRecordFlag = true;
            record.gid = gcRecord.gid;
            break;
          }
        }
      }
      if (duplicateRecordFlag === false) {
        returnRecords.recordsToInsert.push(record);
      } else {
        returnRecords.recordsToUpdate.push(record);
      }
    }
  }
  return returnRecords;
}

// @Param: returnRecords - the output of evaluateRecords:
//  { recordsToInsert: [{ dbRecord }], recordsToUpdate: [{ dbRecord }] }
//    e.g. returnRecords.recordsToInsert[0].openingTime
async function processRecordsToUpsert(evaluatedRecordList) {
  if (evaluatedRecordList.recordsToInsert.length > 0) {
    try {
      console.log('Beginning Record Insert');
      await insertRecordsAndSaveIds(evaluatedRecordList.recordsToInsert);
      console.log('Record Insert Complete');
    } catch (error) {
      console.log('Insert records error: ' + error);
    }
  } else {
    console.log('No records to insert');
  }
  if (evaluatedRecordList.recordsToUpdate.length > 0) {
    try {
      console.log('Beginning Record Update');
      await updateRecords(evaluatedRecordList.recordsToUpdate);
      console.log('Record Update Complete');
    } catch (error) {
      console.log('Update records error: ' + error);
    }
  } else {
    console.log('No records to update');
  }
}

// @Param: returnRecords - individual input of processRecordsToUpsert:
//    dbRecord.openingTime: dateTime: dateTime ISO string
//    dbRecord.closingTime: dateTime: dateTime ISO string
//    dbRecord.summary: string
//    dbRecord.description: string
//    dbRecord.gid: string
async function insertRecordsAndSaveIds(recordsToInsert) {
  let insertedRecords = [];
  for (const record of recordsToInsert) {
    const formattedRecord = new InsertRequest(authClient, bridgeCalendarId, record);
    try {
      console.log('Attempting to insert record: ' + formattedRecord.resource.summary + '...');
      const result = await insert(formattedRecord);
      console.log('...Success');
      record.gid = result.data.id;
      insertedRecords.push(record);
    } catch (error) {
      console.log('Failed to insert record: ' + formattedRecord.resource.summary + '. Error: ' + error);
    }
  }
  try {
    await bridgeLiftController.bridgeLift_updateCollection(insertedRecords);
  } catch (error) {
    console.log('Failure to save Google Calendar Ids to the database. Error: ' + error);
  }
}

// @Param: returnRecords - individual input of processRecordsToUpsert:
//    dbRecord.openingTime: dateTime: dateTime ISO string
//    dbRecord.closingTime: dateTime: dateTime ISO string
//    dbRecord.summary: string
//    dbRecord.description: string
//    dbRecord.gid: string
async function updateRecords(recordsToUpdate) {
  for (const record of recordsToUpdate) {
    const formattedRecord = new UpdateRequest(authClient, bridgeCalendarId, record);
    try {
      console.log('Attempting to update record: ' + formattedRecord.resource.summary + '...');
      await update(formattedRecord);
      console.log('...Successfully updated record: ' + formattedRecord.resource.summary);
    } catch (error) {
      console.log('Failed to update record: ' + formattedRecord.resource.summary + '. Error: ' + error);
    }
  }
}

// @Param: returnRecords - individual input of processRecordsToUpsert:
//    dbRecord.openingTime: dateTime: dateTime ISO string
//    dbRecord.closingTime: dateTime: dateTime ISO string
//    dbRecord.summary: string
//    dbRecord.description: string
//    dbRecord.gid: string
async function deleteRecords(recordsToDelete) {
  for (const record of recordsToDelete) {
    const formattedRecord = new DeleteRequest(authClient, bridgeCalendarId, record);
    try {
      console.log('Attempting to delete record: ' + formattedRecord.eventId + '...');
      await deleteFunc(formattedRecord);
      console.log('...Successfully deleted record: ' + formattedRecord.eventId);
    } catch (error) {
      console.log('Failed to delete record: ' + formattedRecord.eventId + '. Error: ' + error);
    }
  }
}

// -------------------------------------------------------
// Object Constructors Start
// -------------------------------------------------------

// Gcal Object Constructor - matching the records in my calendar
// Can be returned to bridge calendar controller for use in the update function
// ID, Name, Start Date
function GcalEntry(openTime, closeTime, eventSummary, eventDescription, eventGid) {
  this.openingTime = openTime;
  this.closingTime = closeTime;
  this.summary = eventSummary;
  this.description = eventDescription;
  this.gid = eventGid;
}


// @param: authorisation: object: authenticated google.auth.jwt
// @param: calendarId: string: key of the calendar
// @param: maxRecords: number of future records to return
function ListRequest(authorisation, calId, maxRecords) {
  this.auth = authorisation;
  this.calendarId = calId;
  this.maxResults = maxRecords;
  this.timeMin = (new Date()).toISOString();
  this.singleEvents = true;
  this.orderBy = 'startTime';
}

// @param: calEntry: { object }
//    calEntry.openingTime: dateTime: dateTime ISO string
// Opening time uses moment.format for local time
//    calEntry.closingTime: dateTime ISO string
//    calEntry.summary: string
//    calEntry.description: string
//    calEntry.gid: string
function CalendarResource(calEntry) {
  this.start = {
    dateTime: moment(calEntry.openingTime).format(),
  };
  this.end = {
    dateTime: moment(calEntry.closingTime).format(),
  };
  this.summary = calEntry.summary;
  this.description = calEntry.description;
  this.anyoneCanAddSelf = false;
}

// @param: authorisation: object: authenticated google.auth.jwt
// @param: calendarId: string: key of the calendar
// @param: calRecord: object: CalendarResource object
function InsertRequest(authorisation, calId, calRecord) {
  this.auth = authorisation;
  this.calendarId = calId;
  this.sendNotifications = false;
  this.resource = new CalendarResource(calRecord);
}

// @param: authorisation: object: authenticated google.auth.jwt
// @param: calendarId: string: key of the calendar
// @param: calRecord: object: CalendarResource object
function UpdateRequest(authorisation, calId, calRecord) {
  this.auth = authorisation;
  this.calendarId = calId;
  this.eventId = calRecord.gid;
  this.sendNotifications = false;
  this.resource = new CalendarResource(calRecord);
}

// @param: authorisation: object: authenticated google.auth.jwt
// @param: calendarId: string: key of the calendar
// @param: calRecord: object: CalendarResource object
function DeleteRequest(authorisation, calId, calRecord) {
  this.auth = authorisation;
  this.calendarId = calId;
  this.eventId = calRecord.gid;
}

// -------------------------------------------------------
// Object Constructors End
// -------------------------------------------------------
googleCalendarController.processGoogleCalendarRecords = processGoogleCalendarRecords;
googleCalendarController.purgeCalendarData = purgeCalendarData;
module.exports = googleCalendarController;
