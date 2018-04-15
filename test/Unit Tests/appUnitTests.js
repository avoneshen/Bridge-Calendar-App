/* global describe it beforeEach afterEach */
// Test Libraries

'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var rewire = require('rewire');

chai.should();
var expect = chai.expect;

chai.use(sinonChai);

// Dependencies
var googleCalendarController = require('../../controllers/googleCalendarController');
var sandbox = sinon.createSandbox();

// Not covered in NYC due to this issue: https://github.com/istanbuljs/nyc/issues/747
// Test is covered, however.
describe('App.js failure is handled correctly', function() {

  let app = require('../../app');

  it('Should not fail if an error code is provided', function() {
    expect(function() { app.handleFailure('Test Error Message'); }).to.not.Throw();
  });
  it('Should not fail if an empty error code is passed through', function() {
    expect(function() { app.handleFailure(''); }).to.not.Throw();
  });
  it('Should not fail if there is no error code provided', function() {
    expect(function() { app.handleFailure(); }).to.not.Throw();
  });
});

describe('Routes invoked from googleCalendarController process correctly (stubbed)', async function() {

  let app;
  let handleFailureSpy;
  let revert;

  // refer to v4 docs for sinon
  beforeEach(function() {
    handleFailureSpy = sandbox.stub();
    sandbox.stub(googleCalendarController, 'purgeCalendarData').rejects('Test Failure Message');
    app = rewire('../../app');
    revert = app.__set__({ handleFailure: handleFailureSpy });
  });

  afterEach(function() {
    sandbox.restore();
    revert();
  });

  it('Should execute correctly', async function() {
    try {
      await app.purgeCalendarRecords();
      handleFailureSpy.should.have.been.calledOnce;
    } catch (error) {
      console.error('Promise handling error: ' + error);
      expect.fail();
    }
  });


});

// test controller data library

/*
    describe("", function () {
        it("", function (done) {

            done();
        });
    });

    for (const lift of results) {
        console.log("Found: " + lift.name + ", Time: " + lift.openingTime);
    }
*/
