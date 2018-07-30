let nodemailer = require("nodemailer");
let utils = require('./utils');
/*
  options={
    user:"jhon@gmail.com",
    pass: "iwuehfrkwueh"
    transport:{} //Pendiente por hacer
  }

 */
class Client{
  constructor(options){
    this.user = options.user;
    this.pass = options.pass;
    this.srv  = nodemailer.createTransport({
      auth: {
          "user": this.user,
          "pass": this.pass
      },
      service:this.user //Esto a ver si lo podemos eviar tomando el vamor de common
    },{
      // default values for sendMail method
      from: this.user,
    });    
  }

  /*
    mail={
      to: pepe@gmail.com,
      subject: "this is an email",
      text: "text email",
      html: "<b> hetml text </b>" //optional
    }
   */
    /**
   * Envia un email
   * @param  {Object} data Información del email a enviar
   * @param  {String|Object} [data.from] Remitente del email 
   * @param  {String} [data.from.name] Nombre del remitente del email 
   * @param  {String} [data.from.email] Dirección de correo del remitente del email 
   * @param  {String|String[]|Object|Object[]} data.to Array o lista separada por comas de los destinatarios del email
   * @param  {String} [data.to.name] Nombre del destinatario 
   * @param  {String} data.to.email Email del destinatario 
   * @param  {String|String[]|Object|Object[]} [data.cc] Array o lista separada por comas de los destinatarios cc del email
   * @param  {String} [data.cc.name] Nombre del destinatario 
   * @param  {String} data.cc.email Email del destinatario 
   * @param  {String|String[]|Object|Object[]} [data.bcc] Array o lista separada por comas de los destinatarios bcc del email
   * @param  {String} [data.bcc.name] Nombre del destinatario 
   * @param  {String} data.bcc.email Email del destinatario 
   * @param  {String} data.subject Asunto del email
   * @param  {String} data.text Texto plano con el contenido del email
   * @param  {String} [data.html] Contenido del email en formato html
   * @param  {String} [data.templateId] Id del template a utilizar
   * @param  {String} [data.templateLang] Idioma del email para tomar el template en el idioma correcto. ISO-CODE Por defecto es 'en'
   * @param  {Object} [data.substitutions] Objeto que contiene pares (key,value) para reempleazar en el template 
   * @param  {Object} [data.serviceData]   Objeto que contiene pares (key,value) que se enviarán directamente al servicio 
   * @return {Promise<Object>}  Promesa con el resultado del envío
   * 
   */
  send(data){
    return new Promise((resolve, reject) =>{
      /*
      {
        "accepted":[
          "ezefire@hotmail.com",
          "ezefire@gmail.com",
          "cristian.jimenez@a2system.net",
          "los_registros_arg@yahoo.com"
        ],
        "rejected":[
        ],
        "envelopeTime":281,
        "messageTime":699,
        "messageSize":615,
        "response":"250 2.0.0 OK 1532604221 v5-v6sm2183032wrp.87 - gsmtp",
        "envelope":{
        "from":"no-reply@tourme.com",
        "to":[
        "ezefire@hotmail.com",
        "ezefire@gmail.com",
        "cristian.jimenez@a2system.net",
        "los_registros_arg@yahoo.com"
        ]
        },
        "messageId":"<cdea01fb-0e01-f845-30ee-403db6ada62e@tourme.com>"
      }
       */
      App.log.debug("Orig email data:", JSON.stringify(data));
      let ret = {}
      let mailData;
      createMailData(data)
        .then(mail =>{
          mailData = mail;
          ret.request = mail;
          App.log.debug("Sending email:", JSON.stringify(mail));
          // if(App.appOptions.develop && App.appOptions.develop.email){
          //   //Respuesta fake para desarrollo
          //   return Promise.resolve(createDevResponse(mail));
          // }else{
            return this.srv.sendMail(mail);
          // }
        })
        .then(res =>{
          App.log.debug("Email sent:", JSON.stringify(res));
          let messageId = res.messageId;
          ret.response = res;

          let accepted = res.accepted || [];
          let rejected = res.rejected || [];

          let to  = forceArray(mailData.to).map(item => {return {id: messageId, status: getReceiverResStatus(item, accepted, rejected)};});
          let cc  = forceArray(mailData.cc).map(item => {return  {id: messageId, status: getReceiverResStatus(item, accepted, rejected)};});
          let bcc  = forceArray(mailData.bcc).map(item => {return  {id: messageId, status: getReceiverResStatus(item, accepted, rejected)};});
          
          ret.messages = {to: to, cc: cc, bcc: bcc };
          return ret;
        })
        .catch(err => {
          console.log("Catched error ", JSON.stringify(err));
          ret.error = err;
        })
        .then(res => {
          if(ret.error){
            reject(ret);
          }else{
            resolve(ret);
          }
        });
    });
  }

}

function getReceiverResStatus(receiver, acceptedOnes, rejectedOnes){
  let email = getReceiverEmail(receiver);

  let status = 'rejected';

  if(acceptedOnes.includes(email)){
    status = 'sent';
  }

  return status;

}

function getReceiverEmail(receiver){
  return receiver ? (typeof receiver === "string" ? receiver : receiver.address) : undefined;
}

function createDevResponse(data){
  let emails = getRecipientsEmails(data);
  let accepted = emails.filter(utils.validateEmail);
  let rejected = emails.filter(item => {return !utils.validateEmail(item)});
  return {
    "accepted":accepted,
    "rejected":rejected,
    "envelopeTime":484,
    "messageTime":807,
    "messageSize":561,
    "response":"250 2.0.0 OK 1532604404 d8-v6sm841964wrv.68 - gsmtp",
    "envelope":{
    "from":getReceiverEmail(data.from),
    "to":accepted
    },
    "messageId":"dev_id_"+ Math.random().toString(36)
  }
}


function getRecipientsEmails(data){
  let to = data.to || [];
  let cc = data.cc || [];
  let bcc = data.bcc || [];

  let emails = [];

  to.concat(cc, bcc).forEach( item => {
    let email = getReceiverEmail(item);
    if(!emails.includes(email)){
      emails.push(email);
    }
  });

  return emails;
}

function forceArray(receivers){
  return receivers ? (Array.isArray(receivers) ? receivers : [receivers] ) : [];
}

function createMailData(data){
  return new Promise((resolve, reject) =>{
    let mail = {}

    mail.from = transformAddress(data.from);
    
    mail.to = transformReceivers(data.to);
    mail.cc = transformReceivers(data.cc);
    mail.bcc = transformReceivers(data.bcc);
    mail.subject = data.subject;
    mail.text = data.text;
    mail.html = data.html;

    if(data.serviceData){
      Object.assign(mail, data.serviceData);
    }

    if(data.templateId){
      utils.loadTemplates(data.templateId, data.substitutions, data.templateLang)
        .then(texts =>{
          mail.subject = texts.subject || mail.subject;
          mail.text    = texts.text || mail.text;
          mail.html    = texts.html || mail.html;

          resolve(mail);
        })
        .catch(reject); 
    }else{
      resolve(mail);
    }

  });
}

function transformAddress(address){
  let ret;
  if(address){
    if(typeof address === "string"){
      ret = address;
    }else{
      ret = {name: address.name, address: address.email};
    } 
  }
  return ret;
}

function transformReceivers(receivers){
  let ret;
  if(receivers && Array.isArray(receivers)){
    ret = receivers.map(receiver =>{
      return transformAddress(receiver);
    });
  }else{
    ret = transformAddress(receivers);
  }
  return ret;
}

module.exports = Client;