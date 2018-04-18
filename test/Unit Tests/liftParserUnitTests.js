/* global describe it beforeEach afterEach */
// Test Libraries

'use strict';

var chai = require('chai');
var sinon = require('sinon');
var rewire = require('rewire');
var sinonChai = require('sinon-chai');

chai.should();
var expect = chai.expect;

chai.use(sinonChai);
var sandbox = sinon.createSandbox();

describe('Read command input and return an array of strings containing bridge lifts.', function() {
  let liftParser = require('../../liftParser.js');

  it('Should not fail if an undefined value is passed in and return an empty array.', function() {
    const lifts = undefined;
    const result = liftParser.parseLifts(lifts);
    result.should.deep.equal([]);
  });

  it('Should split a sample input correctly', function() {
    const lifts = '08-Feb-18 Thu 19:45 ## Boat Name Spaced\r\n09-Feb-28 Sat 20:45 ## Boat Name Spaced Two';
    const result = liftParser.parseLifts(lifts);
    result.length.should.equal(2);
  });

  it('Should output the correct values from a split ([0])', function() {
    const lifts = '08-Feb-18 Thu 19:45 ## Boat Name Spaced\r\n09-Feb-28 Sat 20:45 ## Boat Name Spaced Two';
    const result = liftParser.parseLifts(lifts);
    result[0].should.equal('08-Feb-18 Thu 19:45 ## Boat Name Spaced');
  });
  it('Should output the correct values from a split ([1])', function() {
    const lifts = '08-Feb-18 Thu 19:45 ## Boat Name Spaced\r\n09-Feb-28 Sat 20:45 ## Boat Name Spaced Two';
    const result = liftParser.parseLifts(lifts);
    result[1].should.equal('09-Feb-28 Sat 20:45 ## Boat Name Spaced Two');
  });
});

describe('Functions in liftParser to objectify lists should run correctly.', function() {
  let liftParser;
  let unloadableRecordsSpy;
  let revert;

  const sampleData = ['08-Feb-18 Thu 19:45 ## Boat Name Spaced', '09-Feb-28 Sat 20:45 ## Boat Name Spaced Two'];

  // refer to v4 docs for sinon
  beforeEach(function() {
    unloadableRecordsSpy = sandbox.stub();
    liftParser = rewire('../../liftParser');
    revert = liftParser.__set__({ unloadableRecords: unloadableRecordsSpy });
  });

  afterEach(function() {
    sandbox.restore();
    revert();
  });

  it('Should have the correct name in the first record of the objectifyArray product', function() {
    const objectifiedList = liftParser.objectifyArray(sampleData);
    objectifiedList[0].name.should.equal('Boat Name Spaced');
  });

  it('Should have the correct date in the first record of the objectifyArray product', function() {
    const objectifiedList = liftParser.objectifyArray(sampleData);
    objectifiedList[0].openingTime.should.equal('2018-02-08T19:45:00.000Z');
  });

  it('Should have the correct name in the second record of the objectifyArray product', function() {
    const objectifiedList = liftParser.objectifyArray(sampleData);
    objectifiedList[1].name.should.equal('Boat Name Spaced Two');
  });

  it('Should have the correct date in the second record of the objectifyArray product', function() {
    const objectifiedList = liftParser.objectifyArray(sampleData);
    objectifiedList[1].openingTime.should.equal('2028-02-09T20:45:00.000Z');
  });

  it('Should fail-safe on a partial input and call unloadableRecords', function() {
    const testSet = [undefined, {}, 'noSpace'];
    liftParser.objectifyArray(testSet);
    unloadableRecordsSpy.should.have.been.calledOnce;
  });

});

describe('Date parsing in liftParser should run correctly.', function() {
  let liftParser = require('../../liftParser.js');

  it('Should return an ISO String', function() {
    const testDateInput = '29-Oct-18';
    const testTimeInput = '18:00';

    const date = liftParser.parseDateTimeStringsReturnDate(testDateInput, testTimeInput);

    date.should.be.a('string').that.equals('2018-10-29T18:00:00.000Z');
  });

  it('Should fail safe when passed undefined input', function() {
    const date = liftParser.parseDateTimeStringsReturnDate(undefined, undefined);

    date.should.be.a('string').that.equals('');
  });

  it('Should fail safe when passed non date-times input', function() {
    const date = liftParser.parseDateTimeStringsReturnDate(false, false);

    date.should.be.a('string').that.equals('');
  });

  it('Should run ok when called from the entry parser', function() {
    const testInput = '08-Feb-18 Thu 19:45 ## Boat Name Spaced';

    const testParse = liftParser.objectifyCalendarInput(testInput);

    testParse.openingTime.should.be.a('string').that.equals('2018-02-08T19:45:00.000Z');
  });
});

describe('Objectify Input should handle errors correctly', function() {
  let liftParser = require('../../liftParser.js');

  it('Should handle an undefined input', function() {
    const testResult = liftParser.objectifyCalendarInput(undefined);

    expect(testResult).to.equal(undefined);
  });

  it('Should pass when handling a short name', function() {
    const testData = '08-Feb-18 Thu 19:45 ## Boaty';

    const testResult = liftParser.objectifyCalendarInput(testData);

    testResult.name.should.equal('Boaty');

  });

  it('Should fail when passing no name', function() {
    const testResult = liftParser.objectifyCalendarInput('08-Feb-18 Thu 19:45 ##');

    expect(testResult).to.equal(undefined);
  });
});
