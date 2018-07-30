/**
 * Sent emails by template Model
 * This is information about the emails that have been sent to each user,
 * so we don't repeat them and store time and date and response.
 */

let mongoose  = require('mongoose');
let Schema    = mongoose.Schema;

var helper   = require("../helpers/tb.email-emails");
let utils    = require('../lib/utils');

// TODO: enable edition ONLY for admins
let emailSchema  = new Schema ({
  uid:               { type: Schema.Types.ObjectId },   // user id
  service:           { type: String, enum: utils.emailServices },
  email:             { type: String, required: true, lowercase: true, match: utils.emailRegEx  },
  recType:           { type: String, required: true, enum: ['to', 'cc', 'bcc']},
  recIndex:          { type: Number, required: true}, //Posicion del destinatario dentro del array to, cc o bcc
  emailIndex:        { type: Number}, //Posicion del email para un mismo sEmailId. Usado por sendgrid para identificar un mensaje. El index se asigna a los emails en el siguiente orden 'to'->'cc'->'bcc' 
  name:              { type: String },
  templateId:        { type: String },

  dStatus:           { type: String, enum: utils.emailStatus}, //Stado mas "profundo" que tuvo el mensaje. No se puso como requerido porque solo se asigna en el preSave
  status:            { type: String, required: true, enum: utils.emailStatus, default: 'unknown'},
  statusLog: [ new Schema({
    status: { type: String, required: true },
    cDate:  { type: Date, default: Date.now }
  }, { _id: false }) ],

  sEmailId:          { type: String },
  originalRequest:   { type: Schema.Types.Mixed },  // optional: original request
  originalResponse:  { type: Schema.Types.Mixed } ,// response received, according to service. mixed type (Schema.Types.Mixed)
  data:              { type: Schema.Types.Mixed }   // optional: specific data from <service> that needs to be kept
},
{ timestamps: { createdAt: 'cDate', updatedAt: 'uDate' } }
);

// TODO: verify correct indexing
emailSchema.index({ 'uid': 1, 'templateId': 1 });

// ---> Indexes:
emailSchema.index({ uid: 1 });
emailSchema.index({ email: 1 });
emailSchema.index({ service: 1 , sEmailId: 1});
emailSchema.index({ status: 1 });
emailSchema.index({ templateId: 1 });

// ---> Output:
emailSchema.set('toJSON', { virtuals: true });

// ---> Virtuals:
emailSchema.virtual('user', { ref: 'a2s.user', localField: 'uid', foreignField: '_id', justOne: true });

emailSchema.pre('save', function(next, ctx) {  // this can NOT be an arrow function
  console.log('========>>> HOOK: pre save (tb.email-emails)');
  helper.preSaveHook(this)
    .then(next)
    .catch(next);
});


module.exports = emailSchema; 
