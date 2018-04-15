
'use strict';

// Original & Revised: Arrays of object with a shared openingTime: { type: Date } structure
exports.EvalAndReturnSingletonRecords = function(original, revised) {
  let recordsToPurge = [];
  if ((original && original.length > 0) && (revised && revised.length)) {
    for (const record of original) {

      let recordFound = false;
      for (const revisedRecord of revised) {
        if (record.openingTime === revisedRecord.openingTime) {
          recordFound = true;
          break;
        }
      }
      if (!recordFound) {
        recordsToPurge.push(record);
      }
    }
    return recordsToPurge;
  } else {
    return [];
  }
};
