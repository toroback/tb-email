/** 
 * @module tb-email 
 * @description 
 * Modulo para almacenamiento.
 *
 * <p>Este módulo permite realizar envíos de emails desde el servidor. </p>
 * <p>
 * @see [Guía de uso]{@tutorial tb-email} para más información.
 * @see [Class API]{@link module:tb-email.Client} (API interno).
 * @see Repositorio en {@link https://github.com/toroback/tb-email|GitHub}.
 * </p>
 * 
 */

let rscPath  = __dirname +'/resources';

let EmailSmtp = require('./lib/email-smtp');
let EmailImap = require('./lib/email-imap');
let EmailSendgrid = require('./lib/email-sendgrid');
let EmailMailjet = require('./lib/email-mailjet');
let utils = require('./lib/utils');

let EmailSchema = null; //Esquema de la coleccion tb.email-sents. Inicializado en la funcion init

/*
options ={
  user:
  pass:
  transport:{
    imap:{
      host:
      port:
      tls:
    }
    smtp:
  }
} 
*/

let moduleConfigId = "emailOptions";
let App;
let log;


/**
 * Clase que representa un cliente de envío de emails
 * @memberOf module:tb-email
 */
class Client {
   /**
   * Crea un cliente de envio de emails
   * @param  {Object} [options]               Objeto con las opciones para el cliente.
   * @param  {Object} options.smtp      Objeto con la configuración del servicio de smtp
   * @param  {String} options.smtp.user Nombre de usuario ó email del servicio
   * @param  {String} options.smtp.pass Contraseña del servicio
   * @param  {Object} [options.transport]     Objeto con la configuración del transport
   * @param  {String} options.transport.imap  Imap del transport
   */
  constructor(options){
    this.clients = [];
    
    if(options.smtp){
      this.smtp = {}
      this.smtp.options = {
        user: options.smtp.user,
        pass: options.smtp.pass
      }
      this.imap = {}
      this.imap.options ={
        user: options.smtp.user,
        pass: options.smtp.pass      
      }
    }
    if(options.sendgrid){
      this.sendgrid = {};
      this.sendgrid.options = options.sendgrid;
    }
    if(options.mailjet){
      this.mailjet = {};
      this.mailjet.options = options.mailjet;
    }
    if (options.transport && options.transport.imap) this.imap.options.transport = options.transport.imap;
  }

  /*
    mail={
      from: Fulano <fulano@gmail.com>, //optional
      to: pepe@gmail.com,
      cc:[],//optional,
      bcc:[],//optional
      subject: "this is an email",
      text: "text email",
      html: "<b> hetml text </b>" //optional
    }
   */
  /**
   * Envia un email
   * @param  {Object} data                                Información del email a enviar
   * @param  {String} data.service                        Servicio por el que enviar el email
   * @param  {String|Object} [data.from]                  Remitente del email 
   * @param  {String} [data.from.name]                    Nombre del remitente del email 
   * @param  {String} [data.from.email]                   Dirección de correo del remitente del email 
   * @param  {String|Object|Array} data.to    Array o lista separada por comas de los destinatarios del email
   * @param  {String} [data.to.name]                      Nombre del destinatario 
   * @param  {String} [data.to.email]                     Email del destinatario 
   * @param  {String} [data.to.uid]                       Id de usuario del que tomar nombre o email
   * @param  {String|Object|Array} [data.cc]  Array o lista separada por comas de los destinatarios cc del email
   * @param  {String} [data.cc.name]                      Nombre del destinatario 
   * @param  {String} [data.cc.email]                     Email del destinatario 
   * @param  {String} [data.cc.uid]                       Id de usuario del que tomar nombre o email
   * @param  {String|Object|Array} [data.bcc] Array o lista separada por comas de los destinatarios bcc del email
   * @param  {String} [data.bcc.name]                     Nombre del destinatario 
   * @param  {String} [data.bcc.email]                     Email del destinatario 
   * @param  {String} [data.bcc.uid]                       Id de usuario del que tomar nombre o email
   * @param  {String} data.subject                        Asunto del email
   * @param  {String} [data.text]                         Texto plano con el contenido del email
   * @param  {String} [data.html]                         Contenido del email en formato html
   * @param  {String} [data.templateId]                   Id del template a utilizar
   * @param  {String} [data.templateLang]                 SOLO smtp - Idioma del email para tomar el template en el idioma correcto. ISO-CODE Por defecto es 'en'
   * @param  {Object} [data.substitutions]                Objeto que contiene pares (key,value) para reempleazar en el template 
   * @param  {Object} [data.serviceData]                  Objeto que contiene pares (key,value) que se enviarán directamente al servicio 
   * @return {Promise<Array<tb.email-sents>>}  Promesa con el resultado del envío
   */
  send(data){
    return new Promise((resolve,reject) => {
      let processedData;
      let savedDocs;
      processEmailData(data)
        .then(res => {  
          processedData = res;
          return saveEmails(processedData);
        })
        .then(docs =>{
          savedDocs = docs;
          return this.getClient(data.service).send(processedData).catch(err =>{
            return err;
          });
        })
        .then(res =>{
          App.log.debug("Send response", JSON.stringify(res));
          let fields = ['to', 'cc', 'bcc'];

          let proms = fields.map( field => {
            return Promise.all(savedDocs[field].map( (item, index) => {
              if(res.messages){
                let message = res.messages[field][index];
                item.sEmailId = message.id;
                item.status = message.status;
              }else{
                item.status = 'rejected';
              }
            
              item.originalRequest = res.request;
              item.originalResponse = res.response || {error: res.error};
              return item.save();
            })); 
          });
          return Promise.all(proms);
          

        })
        .then(res => {
          resolve(res[0].concat(res[1], res[2]));
        })
        .catch(reject);
     
    });
  }

  
  processWebhook(service, data){
    return new Promise((resolve,reject) => {
      this.getClient(service).processWebhook(data)
        .then(res =>{

          //Los hooks pueden trer un array o un objeto dependiendo del servicio.
          // Y al mismo tiempo pueden trae más de un evento para un mismo array, entonces tras procesarlos se guardarán de manera secuencial
  
          if(!Array.isArray(res)) res = [res];
          return saveWebhooksData(service, res);
        })
        .then(res => {resolve({status: "ok"}); })
        .catch(err => {
          App.log.error(err);
          reject(new Error("Server error"));
        });
    });
  }

  /**@deprecated Usar send()
   * Envía un email desde un template preconfigurado
   * @param  {String|String[]} to     Array o lista separada por comas de los destinatarios del email
   * @param  {String} templateName    Identificador del template a utilizar. 
   * @param  {Object} [substitutions] Objeto que contiene pares (key,value) para reempleazar en el email 
   * @param  {String} [lang]          Idioma del email
   * @return {Promise<Object>}  Promesa con el resultado del envío
   */
  sendFromTemplate(to, templateName, substitutions, lang){
    return new Promise((resolve,reject) => {
       utils.loadTemplates(templateName, substitutions, lang)
        .then(texts =>
          this.send({
            service : "smtp", 
            to      : to,
            subject : texts.subject,
            text    : texts.text,
            html    : texts.html
          })
        )
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Get email from email repository
   * @param  {mixed} options {
   *    query:[] //[ 'UNSEEN', ['SINCE', 'JUL 1, 2017']],
   *    limit:#  // -5 last five, 2 first two
   *    box: 'INBOX'
   *    }
   * @return {Promise<Object>} Una promesa con el resultado
   */
  get(options){
    return new Promise((resolve,reject)=>{
      // let client = new EmailImap(this.imap.options)
      let client = this.getClient('imap');
      client.once('ready',()=>{
        client.get(options)
        .then(resolve)
        .catch(reject)
      })
      client.once('error',(err)=>{
        reject(err);
      })
      client.once('end',()=>{
        //console.log("fin");
      })        
    })
      
  }

  getClient(service){
    let client;
    if(this.clients && this.clients[service]){
      client = this.clients[service];
    }
    if(!client){
      switch (service) {
        case 'smtp':
          // if(!this.smtp) throw new App.err.notFound("Email service not configured:" + service);
          if(this.smtp && this.smtp.options.user && this.smtp.options.pass)
            client = new EmailSmtp(this.smtp.options);
          break;
        case 'imap':
          if(this.imap && this.imap.options.user && this.imap.options.pass) 
            client = new EmailImap(this.imap.options);   
          break;
        case 'sendgrid':
          if(this.sendgrid && this.sendgrid.options.apiKey) 
            client = new EmailSendgrid(this.sendgrid.options);   
          break;
        case 'mailjet':
          if(this.mailjet && this.mailjet.options.apiKey && this.mailjet.options.apiSecret) 
            client = new EmailMailjet(this.mailjet.options);   
          break;
        default:
          throw new App.err.notFound("Email service not supported:" + service);
          // return undefined;
          // statements_def
          break;
      }
    }
    
    // check
    if ( !client ) {
      let msg;
      switch ( service ) {
        case 'smtp':     { msg = 'SMTP library not initialized. Configure emailOptions.smtp.user and emailOptions.smtp.pass' } break;
        case 'imap':     { msg = 'IMAP library not initialized. Configure emailOptions.smtp.user and emailOptions.smtp.pass' } break;
        case 'mailjet':  { msg = 'MailJet library not initialized. Configure emailOptions.mailjet.apiKey and apiSecret?' } break;
        case 'sendgrid': { msg = 'SendGrid library not initialized. Configure emailOptions.sendgrid.apiKey?' } break;
      }
      throw App.err.badImplementation(msg);
    }
    this.clients[service] = client;

    return client
  } 

  /**
   * Setup del módulo. Debe ser llamado antes de crear una instancia
   * @param {Object} _app Objeto App del servidor
   * @return {Promise} Una promesa
   */
  static setup(app){
    return new Promise((resolve,reject)=>{
      App = app;
      log = App.log.child({module:'email'});

      log.debug("iniciando Módulo email");

      require("./routes")(app);
      
      loadConfigOptions()
        .then(emailOptions =>{
          if(emailOptions){
            App.email = new Client(emailOptions);  
          }else{
            log.warn('Email: email options needs to be configured.')  
          }

          resolve();
        })
        .catch(reject);

    });
  }

  //INFO: EL init no se puso como static como el resto de modulos porque este modulo instancia un unico objeto y lo asigna en App.email. Con lo que el metodo init sería de la instancia para que se utilice igual
  /**
   * Inicializa los modelos del módulo
   * @return {Promise} Una promesa
   */
   init(){
    return new Promise( (resolve, reject) => {
      App.db.setModel('tb.email-sents',rscPath + '/tb.email-sents');
      EmailSchema = App.db.model('tb.email-sents');
      resolve();
    });
  }


}

function processEmailData(data){
  return new Promise((resolve, reject) => {
    if(!data) throw App.err.badRequest("Email data not provided");
    if(!data.service) throw App.err.badRequest("Service not provided");
    if(isEmtyArrayOrUndefined(data.to) && isEmtyArrayOrUndefined(data.cc) && isEmtyArrayOrUndefined(data.bcc)) throw App.err.badRequest("'to','cc' or 'bcc' field must be provided"); 
    if(!data.text && !data.html && !data.templateId) throw App.err.badRequest("'text','html' or 'templateId' field must be provided"); 


    Promise.all([
        processRecipients(data.to),
        processRecipients(data.cc),
        processRecipients(data.bcc)
      ])
      .then(res=>{
        data.to = res[0];
        data.cc = res[1];
        data.bcc = res[2];

        resolve(data)
      })
      .catch(reject);
    // resolve(data);
  });
}

function isEmtyArrayOrUndefined(field){
  if(field == undefined){
    return true;
  }else if(Array.isArray(field) && field.length == 0){
    return true;
  }
  return false;
}

/**
 * Normaliza un array de destinatarios. 
 */
function processRecipients(recipients){
  return new Promise((resolve, reject) => {
    if(recipients !== undefined){
      let prom;
      if(typeof recipients === "string"){ 
        //Si es string se comprueba si es una lista separada por comas y se convierte a array de strings. Si no, es que es un email.
        // let arr = recipients.split(',').map(item => item.trim());
        let arr = recipients.split(',');
        prom = arr.length == 1 ? processRecipient(arr[0]) : processRecipients(arr);
      }else if(Array.isArray(recipients)){
        //Si es un array se procesan los distintos elementos. Que pueden ser objeto o string.
        prom = Promise.all(recipients.map(processRecipient))
      }else if(typeof recipients === 'object'){
        //Si es un objeto se procesa el objeto individualmente
        prom = processRecipient(recipients)
      }

      if(!prom) reject(App.err.badRequest('Invalid recipients type'));
      else{
        prom.then(resolve)
          .catch(reject);
      }
    }else{
      resolve();
    }
  });
}

/**
 * Normaliza un destinatario. 
 */
function processRecipient(recipient){
  return new Promise((resolve, reject) => {
    if(typeof recipient === "string"){
      recipient = recipient.trim();
      if(!utils.validateEmail(recipient)) {
        reject(invalidRecipientError(recipient));
      }else{
        //Si el recipiente es un string es un email.
        resolve(recipient);
      }
    }else if(typeof recipient === 'object'){
      if(recipient.email && !utils.validateEmail(recipient.email)){
        reject(invalidRecipientError(recipient.email));
      }else{
        if(!recipient.email && !recipient.uid){
          reject(App.err.badRequest('Invalid recipient. \'email\' or \'uid\' field must be provided'));
        }else{
          //Si es un objeto puede contener email, name y uid.
          if(recipient.email && recipient.name || !recipient.uid){
            //Si ya se tiene email y nombre o no hubiera uid de donde tomar esos datos se devuelve el objeto
            resolve(recipient);
          }else if(recipient.uid){
            //Si no hay email o no hay name pero si hay uid, se busca el usuario y se intenta tomar el nombre y el email de él
            getUser(recipient.uid)
              .then(user =>{
                recipient.name = recipient.name || user.fname || user.name;
                recipient.email = recipient.email || (user.email ? user.email.login : undefined);
                resolve(recipient);
              })
              .catch(reject);
          }
        }
      }
    }else{
      //Si es otro tipo error
      reject(App.err.badRequest('Invalid recipient type' + JSON.stringify(recipient)));
    }
  });
}

function invalidRecipientError(recipient){
  return App.err.badRequest("Invalid recipient '" + recipient+ "'");
}

function getUser(uid){
  return App.db.model('users').findById(uid, 'name fname email');
}

function saveEmails(data){
  return new Promise((resolve, reject) =>{
    let commonData = {
      service: data.service,
      templateId: data.templateId,
      status: "pending"
    }
    let positionInEmail = 0;
    let fields = ['to', 'cc', 'bcc'];

    let proms = fields.map( field => {
      return Promise.all(forceArray(data[field]).map((recipient, index) => {
        let prom = saveRecipient(commonData, field, index, positionInEmail, recipient);
        positionInEmail += 1;
        return prom;
      }));
    });

    Promise.all(proms)
      .then(res =>  resolve({to: res[0], cc: res[1], bcc: res[2] }) )
      .catch(reject);
  });
}


//Funcion que se asegura que la respuesta sea un array. Si el parametro es un array devuelve el array, si es solo un elemento deveulve un array con el elemento y si es undefined devuelve un array vacióío
function forceArray(receivers){
  return receivers ? (Array.isArray(receivers) ? receivers : [receivers] ) : [];
}

function saveRecipient(baseData, recType, recIndex, emailIndex, recipient){

  return new Promise((resolve, reject) =>{
    let data = Object.assign({},baseData);
    data.recType = recType;
    data.recIndex = recIndex;
    data.emailIndex = emailIndex;
    if(typeof recipient === "string"){
      data.email = recipient;
    }else{
      data.email = recipient.email;
      data.uid   = recipient.uid;
      data.name  = recipient.name;
    }

    let emailObj = new EmailSchema(data);
    emailObj.save()
      .then(resolve)
      .catch(reject);
  });
}

function saveWebhooksData(service, arr){
  return new Promise((resolve, reject) =>{
    saveSingleWebhooksData(service, arr, 0, err =>{
      if(err) reject(err);
      else resolve();
    });
      
  });
}

function saveSingleWebhooksData(service, arr, index, cb){
  if(arr && arr.length && index < arr.length){
    let data = arr[index];
    let query = {service: service, sEmailId: data.msgId};
    if(data.emailIndex) query.emailIndex = data.emailIndex;
    
    EmailSchema.findOne(query)
      .then(doc =>{
        if(doc){
          doc.status = data.status;
          doc.statusDate = data.date;
          doc.markModified('status');
          // doc.statusTime... como setear algo asi para que se asigne al statusLog
          return doc.save();
        }else{
          App.log.warn("tb.email-sents for webhook not found:"+ JSON.stringify(data));
        }
      })
      .then(res =>{
        saveSingleWebhooksData(service, arr, index+1, cb);
      })
      .catch(cb)
  }else{
    cb();
  }
}

function loadConfigOptions(){
  return new Promise((resolve, reject) => {
    let Config = App.db.model('tb.configs');
    Config.findById(moduleConfigId)
     .then( options => { 
      if(!options){
        reject(new Error(moduleConfigId +' not configured'));
      }else{
        resolve(options.toJSON());
      }
    });
  });
}


module.exports = Client;





