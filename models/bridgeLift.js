
'use strict';

var moment = require('moment');
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BridgeLiftSchema = new Schema(
  {
    name: { type: String, max: 255, required: true },
    openingTime: { type: Date, required: true },
    gid: { type: String },
  }
);

BridgeLiftSchema.virtual('summary')
  .get(function() {
    return 'Bridge Lift: ' + this.name;
  });

BridgeLiftSchema.virtual('description')
  .get(function() {
    let eventDescription = 'Lift scheduled for: ' + this.openingTimeHuman + ', for: ' + this.name + '.';
    return eventDescription;
  });

BridgeLiftSchema.virtual('openingTimeIso')
  .get(function() {
    let open = this.openingTime;
    let openTime = open.toISOString();
    return openTime;
  });

BridgeLiftSchema.virtual('openingTimeHuman')
  .get(function() {
    let open = this.openingTime;
    let openTime = moment(open).format('DD-MMM-YY HH:mm:ss');
    return openTime;
  });

BridgeLiftSchema.virtual('closingTimeIso')
  .get(function() {
    let openPlusFifteenMinutes = moment(this.openingTime);
    openPlusFifteenMinutes.add(15, 'minutes');
    let closingTime = openPlusFifteenMinutes.toISOString();
    return closingTime;
  });

module.exports = mongoose.model('BridgeLift', BridgeLiftSchema);
