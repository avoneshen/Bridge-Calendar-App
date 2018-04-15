/* global describe it before after */
// Test Libraries

'use strict';

var chai = require('chai');
const assert = require('assert');
const moment = require('moment');

chai.should();
var expect = chai.expect;
// Dependencies
var app = require('../../app.js');
var BridgeLift = require('../../models/bridgeLift');
var bridgeLiftController = require('../../controllers/bridgeLiftController');
var controllerDataLibrary = require('../../controllers/controllerDataLibrary');

describe('Validate the bridge lift model', async function() {

  let lift;

  before(async function() {
    app.connectToDB();
    try {
      lift = await new BridgeLift({
        name: 'testLift',
        openingTime: moment('27-Oct-99 13:00:00', 'DD-MMM-YY HH:mm:ss').toISOString(),
      });
    } catch (error) {
      console.error('Error creating test record: ' + error);
    }
  });


  it('Should fail if a name is not provided', function(done) {
    let failingLift = new BridgeLift();
    failingLift.validate(function(error) {
      expect(error.errors.name).to.exist;
      done();
    });
  });

  it('Should fail if a time is not provided', function(done) {
    let failingLift = new BridgeLift();
    failingLift.validate(function(error) {
      expect(error.errors.openingTime).to.exist;
      done();
    });
  });

  it('Should return opening time in mongoose format', function(done) {
    // I expect this test will fail late October. This is a design issue?
    let expectedOutput = new Date('October 27, 1999 13:00:00');
    expect(lift.openingTime).to.be.a('date').that.deep.equals(expectedOutput);
    done();
  });

  it('Should return opening time in ISO format', function(done) {
    let expectedOutput = '1999-10-27T12:00:00.000Z';
    lift.openingTimeIso.should.be.a('string').that.equals(expectedOutput);
    done();
  });

  it('Should save opening time in an easy to read format', function(done) {
    let expectedOutput = '27-Oct-99 13:00:00';
    lift.openingTimeHuman.should.be.a('string').that.equals(expectedOutput);
    done();
  });

  it('Should return closing time in ISO format', function(done) {
    let expectedOutput = '1999-10-27T12:15:00.000Z';
    lift.closingTimeIso.should.be.a('string').that.equals(expectedOutput);
    done();
  });

  it('Should return a valid string for Summary', function(done) {
    lift.summary.should.be.a('string').that.equals('Bridge Lift: testLift');
    done();
  });

  it('Should return a valid string for Description', function(done) {
    let expectedString = 'Lift scheduled for: 27-Oct-99 13:00:00, for: testLift.';
    lift.description.should.be.a('string').that.equals(expectedString);
    done();
  });


  after(function() {
    app.closeConnection();
  });
});

// Official doc suggests assert.ok is valid for async functions returning Mongoose promises:
// http://mongoosejs.com/docs/promises.html under 'Queries are not promises'
// Old suite using assert. Could be updated.
describe('Validate the lift controller - old assert-based tests', async function() {

  before(function() {
    app.connectToDB();
  });


  it('Should successfully upsert a record', async function() {
    let object = { name: 'testLift', openingTime: moment('11-Feb-99 13:00:00', 'DD-MMM-YY HH:mm:ss').toISOString() };
    let objectList = [];
    objectList.push(object);
    try {
      let result = await bridgeLiftController.bridgeLift_upsertCollection(objectList);
      assert.ok(result);

    } catch (error) {
      return error;
    }
  });

  it('Should successfully upsert a list of records', async function() {
    let objectList = returnTestObjectList();
    try {
      let result = await bridgeLiftController.bridgeLift_upsertCollection(objectList);
      assert.ok(result);
    } catch (error) {
      return error;
    }
  });

  it('Should successfully update a list of records', async function() {
    let objectList = returnTestObjectList();
    objectList[0].gid = 1;
    objectList[1].gid = 2;
    objectList[2].gid = 3;

    try {
      let result = await bridgeLiftController.bridgeLift_updateCollection(objectList);
      assert.ok(result);
    } catch (error) {
      return error;
    }
  });

  it('Should successfully delete a list of records', async function() {
    let objectList = returnTestObjectList();
    try {
      let result = await bridgeLiftController.bridgeLift_deleteCollection(objectList);
      assert.ok(result);
    } catch (error) {
      return error;
    }
  });

  it('Should select records in the future', async function() {
    try {
      let result = await bridgeLiftController.bridgeLift_selectFutureData();
      assert.ok(result);
    } catch (error) {
      return error;
    }
  });

  it('Should handle an empty (failing) input to update records.', async function() {
    try {
      assert.ok(bridgeLiftController.bridgeLift_updateCollection([undefined]));
    } catch (error) {
      return error;
    }
  });

  it('Should handle an empty (failing) input to update records.', async function() {
    try {
      assert.ok(bridgeLiftController.bridgeLift_updateCollection([undefined]));
    } catch (error) {
      return error;
    }
  });


  after(function() {
    app.closeConnection();
  });

});


describe('Validate the controllerDataLibrary.', function() {
  it('Should function when called with non-matching lists.', function() {
    let sampleOne = [{ openingTime: '2018-02-08T19:45:00.000Z' }];
    let sampleTwo = [{ openingTime: '2018-02-10T20:45:00.000Z' }];
    controllerDataLibrary.EvalAndReturnSingletonRecords(sampleOne, sampleTwo)[0].should.deep.equal(sampleOne[0]);
  });

  it('Should return nothing and fail safe when fully matching inputs are sent in.', function() {
    let sampleOne = [{ openingTime: '2018-02-08T19:45:00.000Z' }];
    let sampleTwo = [{ openingTime: '2018-02-08T19:45:00.000Z' }];
    controllerDataLibrary.EvalAndReturnSingletonRecords(sampleOne, sampleTwo).should.deep.equal([]);
  });
  it('Should return nothing and fail safe when original is a faulty input.', function() {
    let sampleOne;
    let sampleTwo = [{ openingTime: '2018-02-08T19:45:00.000Z' }];
    controllerDataLibrary.EvalAndReturnSingletonRecords(sampleOne, sampleTwo).should.deep.equal([]);
  });
  it('Should return nothing and fail safe when revised is a faulty input.', function() {
    let sampleOne = [{ openingTime: '2018-02-08T19:45:00.000Z' }];
    let sampleTwo;
    controllerDataLibrary.EvalAndReturnSingletonRecords(sampleOne, sampleTwo).should.deep.equal([]);
  });

});

function returnTestObjectList() {
  let objectOne = { name: 'Squall', openingTime: moment('14-Feb-99 13:00:00', 'DD-MMM-YY HH:mm:ss').toISOString() };
  let objectTwo = { name: 'Zell', openingTime: moment('09-Sep-99 13:00:00', 'DD-MMM-YY HH:mm:ss').toISOString() };
  let objectThree = { name: 'Fujin', openingTime: moment('27-Oct-99 13:00:00', 'DD-MMM-YY HH:mm:ss').toISOString() };
  let objectList = [objectOne, objectTwo, objectThree];
  return objectList;
}
