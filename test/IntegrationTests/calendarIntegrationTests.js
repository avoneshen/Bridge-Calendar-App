/* global describe it before after beforeEach afterEach */

'use strict';

// Test Libraries
var chai = require('chai');
var rewire = require('rewire');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.should();
var expect = chai.expect;
chai.use(sinonChai);

// Dependencies
var sandbox = sinon.createSandbox();
var app = require('../../app');

describe('Validate the Google oauth functions', async function() {

  let googleCalendarController;
  let authClient;
  let auth;

  before(function() {
    googleCalendarController = rewire('../../controllers/googleCalendarController');
    auth = googleCalendarController.__get__('returnAuthClient');
  });

  it('Should be able to authenticate to Google Oauth services', async function() {
    try {
      authClient = await auth();
      authClient.should.be.an('object');
    } catch (error) {
      return error;
    }
  });
});

// Optimistic: Primarily checks that the promises resolve and that nothing is thrown
describe('Validate the process functions (optimistic)', async function() {

  let googleCalendarController;
  let returnDatabaseRecords;

  before(function() {
    googleCalendarController = rewire('../../controllers/googleCalendarController');
    returnDatabaseRecords = googleCalendarController.__get__('returnDatabaseRecords');
    app.connectToDB();
  });


  it('Should be able to successfully execute a database query', async function() {
    try {
      let result = await returnDatabaseRecords();
      result.should.be.an('object');
    } catch (error) {
      return error;
    }
  });

  after(function() {
    app.closeConnection();
  });

});

describe('Evaluate insertRecordsAndSaveIds', async function() {
  let googleCalendarController;
  let bridgeLiftController;
  let insertSpy;
  let bridgeLift_updateCollectionSpy;
  let revert;
  let insertRecordsAndSaveIds;
  let recordsToInsert = [];

  beforeEach(function() {
    // Setup Spies
    insertSpy = sandbox.stub();
    insertSpy.returns({ data: { id: '12345' } });
    bridgeLift_updateCollectionSpy = sandbox.stub();
    // Import / stub out controllers
    bridgeLiftController = require('../../controllers/bridgeLiftController');
    sandbox.stub(bridgeLiftController, 'bridgeLift_updateCollection').callsFake(bridgeLift_updateCollectionSpy);
    // Rewire functions
    googleCalendarController = rewire('../../controllers/googleCalendarController');
    revert = googleCalendarController.__set__({ insert: insertSpy, authClient: 'stub', bridgeCalendarId: 'stub' });
    insertRecordsAndSaveIds = googleCalendarController.__get__('insertRecordsAndSaveIds');
  });

  afterEach(function() {
    sandbox.restore();
    revert();
    recordsToInsert = [];
  });

  it('Should call insert with a correctly formatted record', async function() {
    try {
      // Input object
      let input = {};
      input.openingTime = '1999-10-27T12:15:00.000Z';
      input.closingTime = '1999-10-27T12:30:00.000Z';
      input.summary = 'Test Summary!';
      input.description = 'Test Description';
      input.gid = '';
      recordsToInsert.push(input);

      // Resource Object
      let sampleResource = {};
      sampleResource.start = { dateTime: '1999-10-27T12:15:00.000Z' };
      sampleResource.end = { dateTime: '1999-10-27T12:30:00.000Z' };
      sampleResource.summary = 'Test Summary!';
      sampleResource.description = 'Test Description';
      sampleResource.anyoneCanAddSelf = false;

      // Req Object
      let sampleInsertRequest = {};
      sampleInsertRequest.auth = 'stub';
      sampleInsertRequest.calendarId = 'stub';
      sampleInsertRequest.sendNotifications = false;
      sampleInsertRequest.resource = sampleResource;

      await insertRecordsAndSaveIds(recordsToInsert);

      insertSpy.should.have.been.calledWith(sampleInsertRequest);
    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });

  it('Should call bridgeLift_updateCollection with the original record', async function() {
    try {
      // Input object
      let input = {};
      input.openingTime = '1999-10-27T12:15:00.000Z';
      input.closingTime = '1999-10-27T12:30:00.000Z';
      input.summary = 'Test Summary!';
      input.description = 'Test Description';
      input.gid = '';
      recordsToInsert.push(input);
      // Return object
      let returnList = [];
      let returnObj = {};
      returnObj.openingTime = '1999-10-27T12:15:00.000Z';
      returnObj.closingTime = '1999-10-27T12:30:00.000Z';
      returnObj.summary = 'Test Summary!';
      returnObj.description = 'Test Description';
      // The value returned by insertSpy
      returnObj.gid = '12345';
      returnList.push(returnObj);

      await insertRecordsAndSaveIds(recordsToInsert);

      bridgeLift_updateCollectionSpy.should.have.been.calledWith(returnList);

    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });
});

describe('Evaluate updateRecords function', async function() {
  let googleCalendarController;
  let updateSpy;
  let revert;
  let updateRecords;

  beforeEach(function() {
    updateSpy = sandbox.stub();
    googleCalendarController = rewire('../../controllers/googleCalendarController');
    revert = googleCalendarController.__set__({ update: updateSpy, authClient: 'stub', bridgeCalendarId: 'stub' });
    updateRecords = googleCalendarController.__get__('updateRecords');
  });
  afterEach(function() {
    sandbox.restore();
    revert();
  });

  it('Should call update when records are passed through', async function() {
    try {
      // Input object
      let input = {};
      input.openingTime = '1999-10-27T12:15:00.000Z';
      input.closingTime = '1999-10-27T12:30:00.000Z';
      input.summary = 'Test Summary!';
      input.description = 'Test Description';
      input.gid = '12345';

      // Resource Object
      let sampleResource = {};
      sampleResource.start = { dateTime: '1999-10-27T12:15:00.000Z' };
      sampleResource.end = { dateTime: '1999-10-27T12:30:00.000Z' };
      sampleResource.summary = 'Test Summary!';
      sampleResource.description = 'Test Description';
      sampleResource.anyoneCanAddSelf = false;

      // Req Object
      let sampleUpdateRequest = {};
      sampleUpdateRequest.auth = 'stub';
      sampleUpdateRequest.calendarId = 'stub';
      sampleUpdateRequest.eventId = '12345';
      sampleUpdateRequest.sendNotifications = false;
      sampleUpdateRequest.resource = sampleResource;

      await updateRecords([input]);
      updateSpy.should.have.been.calledWith(sampleUpdateRequest);
    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });
});

describe('Evaluate deleteRecords function', async function() {
  let googleCalendarController;
  let deleteSpy;
  let revert;
  let deleteRecords;

  beforeEach(function() {
    deleteSpy = sandbox.stub();
    googleCalendarController = rewire('../../controllers/googleCalendarController');
    revert = googleCalendarController.__set__({ deleteFunc: deleteSpy, authClient: 'stub', bridgeCalendarId: 'stub' });
    deleteRecords = googleCalendarController.__get__('deleteRecords');
  });
  afterEach(function() {
    sandbox.restore();
    revert();
  });

  it('Should call delete records when records are passed through', async function() {
    try {
      // Input object
      let input = {};
      input.openingTime = '1999-10-27T12:15:00.000Z';
      input.closingTime = '1999-10-27T12:30:00.000Z';
      input.summary = 'Test Summary!';
      input.description = 'Test Description';
      input.gid = '12345';

      // Req Object
      let sampleDeleteRequest = {};
      sampleDeleteRequest.auth = 'stub';
      sampleDeleteRequest.calendarId = 'stub';
      sampleDeleteRequest.eventId = '12345';

      await deleteRecords([input]);
      deleteSpy.should.have.been.calledWith(sampleDeleteRequest);
    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });
});

describe('Evaluate returnDatabaseObjects function', async function() {
  let googleCalendarController;
  let listSpy;
  let revert;
  let returnDatabaseObjects;

  beforeEach(function() {
    listSpy = sandbox.stub();
    listSpy.returns({
      data: {
        items: [
          {
            id: '12345',
            summary: 'test summary',
            description: 'test description',
            start: {
              dateTime: '2002-10-02T15:00:00.000Z',
            },
            end: {
              dateTime: '2002-10-02T15:15:00.000Z',
            },
          },
        ],
      },
    });
    googleCalendarController = rewire('../../controllers/googleCalendarController');
    revert = googleCalendarController.__set__({
      list: listSpy,
      authClient: 'stub',
      bridgeCalendarId: 'stub',
      maximumRecords: 12345,
    });
    returnDatabaseObjects = googleCalendarController.__get__('returnDatabaseObjects');
  });
  afterEach(function() {
    sandbox.restore();
    revert();
  });

  it('Should call list (stubbed) by manufacturing a query', async function() {
    try {
      // Req Object
      let sampleListRequest = {};
      sampleListRequest.auth = 'stub';
      sampleListRequest.calendarId = 'stub';
      sampleListRequest.maxResults = 12345;
      sampleListRequest.singleEvents = true;
      sampleListRequest.orderBy = 'startTime';

      await returnDatabaseObjects();
      // must use match as minimum date is a date.now
      listSpy.should.have.been.calledWith(sinon.match(sampleListRequest));
    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });

  it('Should call returnDatabaseObjects and return the output of returnAllListEntryObjects', async function() {
    try {
      let sampleGcEntry = {};
      sampleGcEntry.openingTime = '2002-10-02T15:00:00.000Z';
      sampleGcEntry.closingTime = '2002-10-02T15:15:00.000Z';
      sampleGcEntry.summary = 'test summary';
      sampleGcEntry.description = 'test description';
      sampleGcEntry.gid = '12345';

      let testArray = [];
      testArray.push(sampleGcEntry);

      let result = await returnDatabaseObjects();
      result.should.deep.equal(testArray);
    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });
});

/*
describe("Validate the Google oauth functions", async function () {
    it("Should be able to authenticate to Google Oauth services", async function () {
        try {

        }
        catch (error) {
            return error;
        }
    });
});
*/
