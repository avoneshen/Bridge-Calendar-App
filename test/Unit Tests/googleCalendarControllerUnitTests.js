/* global describe it before beforeEach afterEach */
// Test Libraries

'use strict';

var chai = require('chai');
var rewire = require('rewire');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.should();
var expect = chai.expect;
chai.use(sinonChai);

// Dependencies
var sandbox = sinon.createSandbox();

describe('Validate evaluate records', function() {

  let googleCalendarController;
  let evaluateRecords;
  let dbArray = [];
  let calArray = [];
  let sampleDb = {};
  let sampleCal = {};

  before(function() {
    googleCalendarController = rewire('../../controllers/googleCalendarController');
    evaluateRecords = googleCalendarController.__get__('evaluateRecords');
  });

  afterEach(function() {
    dbArray = [];
    calArray = [];
    sampleDb = {};
    sampleCal = {};
  });

  it('Should evaluate records to insert correctly (when records do not exist in calendar)', function() {
    sampleDb.openingTime = '1999-10-27T12:15:00.000Z';
    sampleDb.summary = 'Test Summary!';
    sampleDb.description = 'Test Description';
    // Must leave the below blank in this case - if the DB record does not exist in cal should have no GID.
    // This does not handle orphaned DB records (with a GID and no matching record).
    sampleDb.gid = '';
    // This isn't the 'no result' test of the cal set but it should not have any matching properties
    sampleCal.openingTime = 'This is not an openingTime';
    sampleCal.summary = 'This is not a summary';
    sampleCal.description = 'This is not a description';
    sampleCal.gid = 'This is not a gid';

    dbArray.push(sampleDb);
    calArray.push(sampleCal);

    let result = evaluateRecords(dbArray, calArray);
    expect(result.recordsToInsert).to.deep.equal(dbArray);

  });

  it('Should evaluate records to update correctly (when records sharing GID defined differently in both).', function() {
    sampleDb.openingTime = '1999-10-27T12:15:00.000Z';
    sampleDb.summary = 'Test Summary!';
    sampleDb.description = 'Test Description';
    // Must match in both
    sampleDb.gid = 'g12345';
    // Opening time is left the same and not checked, though in theory it would work.
    sampleCal.openingTime = '1999-10-27T12:15:00.000Z';
    sampleCal.summary = 'A test summary to be replaced';
    sampleCal.description = 'A test description to be replaced';
    // Must match
    sampleCal.gid = 'g12345';

    dbArray.push(sampleDb);
    calArray.push(sampleCal);

    let result = evaluateRecords(dbArray, calArray);
    expect(result.recordsToUpdate).to.deep.equal(dbArray);
  });

  it('Should evaluate insert list when no action required (records sharing GID identical in both).', function() {
    sampleDb.openingTime = '1999-10-27T12:15:00.000Z';
    sampleDb.summary = 'Test Summary!';
    sampleDb.description = 'Test Description';
    sampleDb.gid = 'g12345';
    sampleCal.openingTime = '1999-10-27T12:15:00.000Z';
    sampleCal.summary = 'Test Summary!';
    sampleCal.description = 'Test Description';
    sampleCal.gid = 'g12345';

    dbArray.push(sampleDb);
    calArray.push(sampleCal);

    let result = evaluateRecords(dbArray, calArray);
    expect(result.recordsToInsert).to.deep.equal([]);
  });

  // Almost identical to above but need to have test fail for only one reason between insert/update.
  it('Should evaluate update list when no action required (records sharing GID identical in both).', function() {
    sampleDb.openingTime = '1999-10-27T12:15:00.000Z';
    sampleDb.summary = 'Test Summary!';
    sampleDb.description = 'Test Description';
    sampleDb.gid = 'g12345';
    sampleCal.openingTime = '1999-10-27T12:15:00.000Z';
    sampleCal.summary = 'Test Summary!';
    sampleCal.description = 'Test Description';
    sampleCal.gid = 'g12345';

    dbArray.push(sampleDb);
    calArray.push(sampleCal);

    let result = evaluateRecords(dbArray, calArray);
    expect(result.recordsToUpdate).to.deep.equal([]);
  });

  it('Should handle an input record with no GID but the same openingTime as an existing record.', function() {
    sampleDb.openingTime = '1999-10-27T12:15:00.000Z';
    sampleDb.summary = 'Test Summary!';
    sampleDb.description = 'Very clearly different test Description';
    sampleDb.gid = '';
    sampleCal.openingTime = '1999-10-27T12:15:00.000Z';
    sampleCal.summary = 'Test Summary!';
    sampleCal.description = 'Test Description';
    sampleCal.gid = 'g12345';

    dbArray.push(sampleDb);
    calArray.push(sampleCal);

    // Tests update of description only, not summary...
    let result = evaluateRecords(dbArray, calArray);
    expect(result.recordsToUpdate[0].description).to.equal('Very clearly different test Description');
  });

  it('Should handle an input record with no GID but the same openingTime as an existing record.', function() {
    sampleDb.openingTime = '1999-10-27T12:15:00.000Z';
    sampleDb.summary = 'Test Summary!';
    sampleDb.description = 'Very clearly different test Description';
    sampleDb.gid = '';
    sampleCal.openingTime = '1999-10-27T12:15:00.000Z';
    sampleCal.summary = 'Test Summary!';
    sampleCal.description = 'Test Description';
    sampleCal.gid = 'g12345';

    dbArray.push(sampleDb);
    calArray.push(sampleCal);

    // Tests update of description only, not summary...
    let result = evaluateRecords(dbArray, calArray);
    expect(result.recordsToUpdate[0].gid).to.equal('g12345');
  });

});

describe('Evaluate process records to delete function', async function() {
  let googleCalendarController;
  let deleteRecordsSpy;
  let revert;
  let processRecordsToDelete;

  beforeEach(function() {
    deleteRecordsSpy = sandbox.stub();
    googleCalendarController = rewire('../../controllers/googleCalendarController');
    revert = googleCalendarController.__set__({ deleteRecords: deleteRecordsSpy });
    processRecordsToDelete = googleCalendarController.__get__('processRecordsToDelete');
  });
  afterEach(function() {
    sandbox.restore();
    revert();
  });

  it('Should call delete records when records are passed through', async function() {
    try {
      let input = {};
      input.openingTime = '1999-10-27T12:15:00.000Z';
      input.summary = 'Test Summary!';
      input.description = 'Test Description';
      input.gid = '';
      await processRecordsToDelete([input]);
      deleteRecordsSpy.should.have.been.calledOnce;
    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });

  it('Should return false when no records are passed through', async function() {
    try {
      let result = await processRecordsToDelete([]);
      result.should.equal(false);
    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });
});

describe('Evaluate processRecordsToUpsert function', async function() {
  let googleCalendarController;
  let insertRecordsAndSaveIdsSpy;
  let updateRecordsSpy;
  let revert;
  let processRecordsToUpsert;
  let evaluatedRecordsList = {
    recordsToInsert: [],
    recordsToUpdate: [],
  };

  beforeEach(function() {
    insertRecordsAndSaveIdsSpy = sandbox.stub();
    updateRecordsSpy = sandbox.stub();
    googleCalendarController = rewire('../../controllers/googleCalendarController');
    revert = googleCalendarController.__set__({
      insertRecordsAndSaveIds: insertRecordsAndSaveIdsSpy,
      updateRecords: updateRecordsSpy,
    });
    processRecordsToUpsert = googleCalendarController.__get__('processRecordsToUpsert');
  });

  afterEach(function() {
    sandbox.restore();
    revert();
    evaluatedRecordsList = {
      recordsToInsert: [],
      recordsToUpdate: [],
    };
  });

  it('It should call insert records once when one record to insert is passed through', async function() {
    try {
      let input = {};
      input.openingTime = '1999-10-27T12:15:00.000Z';
      input.summary = 'Test Summary!';
      input.description = 'Test Description';
      input.gid = '';
      evaluatedRecordsList.recordsToInsert.push(input);
      await processRecordsToUpsert(evaluatedRecordsList);
      insertRecordsAndSaveIdsSpy.should.have.been.calledOnce;
    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });

  it('It should not call update records when one record to insert is passed through', async function() {
    try {
      let input = {};
      input.openingTime = '1999-10-27T12:15:00.000Z';
      input.summary = 'Test Summary!';
      input.description = 'Test Description';
      input.gid = '';
      evaluatedRecordsList.recordsToInsert.push(input);

      await processRecordsToUpsert(evaluatedRecordsList);

      updateRecordsSpy.should.not.have.been.called;
    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });

  it('It should call update records once when one record to update is passed through', async function() {
    try {
      let input = {};
      input.openingTime = '1999-10-27T12:15:00.000Z';
      input.summary = 'Test Summary!';
      input.description = 'Test Description';
      input.gid = '';
      evaluatedRecordsList.recordsToUpdate.push(input);

      await processRecordsToUpsert(evaluatedRecordsList);

      updateRecordsSpy.should.have.been.calledOnce;
    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });

  it('It should not call insert records when one record to update is passed through', async function() {
    try {
      let input = {};
      input.openingTime = '1999-10-27T12:15:00.000Z';
      input.summary = 'Test Summary!';
      input.description = 'Test Description';
      input.gid = '';
      evaluatedRecordsList.recordsToUpdate.push(input);

      await processRecordsToUpsert(evaluatedRecordsList);

      insertRecordsAndSaveIdsSpy.should.not.have.been.called;
    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });


});

/*
describe("Validate the Google oauth functions", async function () {
    let googleCalendarController;

    before(function () {
        googleCalendarController = rewire("../../controllers/googleCalendarController");
        evaluateRecords = googleCalendarController.__get__("evaluateRecords");
    });

    it("Should be able to authenticate to Google Oauth services", async function () {
        try {

        }
        catch (error) {
            return error;
        }
    });
});
*/
