
'use strict';

// Original & Revised: Arrays of object with a shared openingTime: { type: Date } structure
exports.EvalAndReturnSingletonRecords = function(original, revised) {
  let recordsToPurge = [];
  // Checks that original / revised lists exist and have records
  if ((original && original.length > 0) && (revised && revised.length)) {
    for (const record of original) {

      let recordFound = false;

      for (const revisedRecord of revised) {
        let recDate = Date.parse(record.openingTime);
        let revDate = Date.parse(revisedRecord.openingTime);
        if (recDate === revDate) {
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
