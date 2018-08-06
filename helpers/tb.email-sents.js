
let log = App.log.child( { module: 'helper_tb.email-sent' } );

let mongoose  = require('mongoose');
let utils     = require('../lib/utils');

// field hiding from toJSON
function xformFields(doc, ret, options) {
  
}

/// Hooks

// pre validate
function preValidateHook(doc) {
  return new Promise( (resolve, reject) => {
    resolve();
  });
}

// pre save
function preSaveHook(doc) {
  return new Promise( (resolve, reject) => {
    doc._postActions = [ ];

    if ( doc.isNew ) {
      doc.markModified('status'); // so it stores in the log...
    }

    console.log('MODIFIED PATHS');
    console.log(doc.modifiedPaths());

    // check property: status
    if ( doc.isModified('status') ) {

      // push to status log if status changed
      // https://github.com/Automattic/mongoose/issues/5670 (milestone 5.0)
      // doc.log.push({ status: doc.status });
      doc.statusLog = doc.statusLog.concat([{ status: doc.status, cDate: doc.statusDate }]); //this uses $set so no problems
      
      let emailsStatus = utils.emailStatus;
      if(emailsStatus.indexOf(doc.status) > emailsStatus.indexOf(doc.dStatus)){
        doc.dStatus = doc.status; 
      }
    }

    resolve( );
  });
}

// post save
function postSaveHook(doc) {
   return new Promise( (resolve, reject) => {
    resolve(); 
  });
}

module.exports = {
  xformFields: xformFields,
  // hooks
  preValidateHook: preValidateHook,
  preSaveHook: preSaveHook,
  postSaveHook: postSaveHook
};
