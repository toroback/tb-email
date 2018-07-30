let sendgrid = require('@sendgrid/mail');
// let utils = require('./utils');
// 
/*
  options={
    user:"jhon@gmail.com",
    pass: "iwuehfrkwueh"
    transport:{} //Pendiente por hacer
  }

 */
class Client{
  constructor(options){

    sendgrid.setApiKey(options.apiKey);
    if(options.substitutionsWrappers && options.substitutionsWrappers.length == 2){
      sendgrid.setSubstitutionWrappers(options.substitutionsWrappers[0], options.substitutionsWrappers[1]); // Configure the substitution tag wrappers globally
    }else{
      sendgrid.setSubstitutionWrappers('{{', '}}');
    }
    this.srv = sendgrid;
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
   * @param  {Object} [data.substitutions] Objeto que contiene pares (key,value) para reempleazar en el template 
   * @param  {Object} [data.serviceData]   Objeto que contiene pares (key,value) que se enviarán directamente al servicio 
   * @return {Promise<Object>}  Promesa con el resultado del envío
   */
  send(data){
    return new Promise((resolve, reject) =>{
      let ret = {}
      let mailData;
      createMailData(data)
        .then(mail =>{
          mailData = mail;
          ret.request = mail;
          App.log.debug("Sending email:", JSON.stringify(mail));
          if(App.appOptions.develop && App.appOptions.develop.email){
            //Respuesta fake para desarrollo
            return Promise.resolve([{headers:{'x-message-id': ("dev_id_"+ Math.random().toString(36))}, statusCode:202}]);
          }else{
            return this.srv.send(mail);
          }
        })
        .then(res =>{
          App.log.debug("Email sent:", JSON.stringify(res));
          let id = res[0].headers['x-message-id']; 
          let status = res[0].statusCode == 202 ? 'sent': 'rejected';
 
          ret.response = {statusCode: res[0].statusCode, headers: res[0].headers};

          let to  = assertReceiversArray(data.to).map(item => {return {id: id, status: status};});
          let cc  = assertReceiversArray(data.cc).map(item => {return  {id: id, status: status};});
          let bcc  = assertReceiversArray(data.bcc).map(item => {return  {id: id, status: status};});
          
          ret.messages = {to: to, cc: cc, bcc: bcc };
          return ret;
        })
        .catch(err => {
          App.log.error("SendGrid error "+ JSON.stringify(err));
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


/*
  [
      {
        "email": "ezefire@hotmail.com",
        "event": "processed",
        "sg_event_id": "CkE6_yjRTySgVhCpTk4jWw",
        "sg_message_id": "idwCDkLSTSCFwgpTfmlsRw.filter0071p3las1-4496-5B5AC56C-1B.0",
        "smtp-id": "<idwCDkLSTSCFwgpTfmlsRw@ismtpd0007p1lon1.sendgrid.net>",
        "timestamp": 1532675436
      },
      {
        "email": "ezefire@hotmail.com",
        "event": "delivered",
        "ip": "198.37.156.136",
        "response": "250 2.6.0 <idwCDkLSTSCFwgpTfmlsRw@ismtpd0007p1lon1.sendgrid.net> [InternalId=8783208132414, Hostname=BN3NAM04HT214.eop-NAM04.prod.protection.outlook.com] 9326 bytes in 0.569, 15.999 KB/sec Queued mail for delivery -> 250 2.1.5",
        "sg_event_id": "Pi8gMBdxR5mKuQb4n6KoOA",
        "sg_message_id": "idwCDkLSTSCFwgpTfmlsRw.filter0071p3las1-4496-5B5AC56C-1B.0",
        "smtp-id": "<idwCDkLSTSCFwgpTfmlsRw@ismtpd0007p1lon1.sendgrid.net>",
        "timestamp": 1532675438,
        "tls": 1
      },
      {
        "email": "ezefire@gmail.com",
        "event": "processed",
        "sg_event_id": "g4rIVHu0QmOO83ZMTGSbAA",
        "sg_message_id": "idwCDkLSTSCFwgpTfmlsRw.filter0071p3las1-4496-5B5AC56C-1B.1",
        "smtp-id": "<idwCDkLSTSCFwgpTfmlsRw@ismtpd0007p1lon1.sendgrid.net>",
        "timestamp": 1532675436
      },
      {
        "email": "ezefire@gmail.com",
        "event": "delivered",
        "ip": "198.37.156.136",
        "response": "250 2.0.0 OK 1532675438 l12-v6si3323761qkh.133 - gsmtp",
        "sg_event_id": "0rk1tQqiR-658dPv8A8rQQ",
        "sg_message_id": "idwCDkLSTSCFwgpTfmlsRw.filter0071p3las1-4496-5B5AC56C-1B.1",
        "smtp-id": "<idwCDkLSTSCFwgpTfmlsRw@ismtpd0007p1lon1.sendgrid.net>",
        "timestamp": 1532675438,
        "tls": 1
      }
    ]
  
 */
  processWebhook(data){
    return new Promise((resolve, reject) =>{
      App.log.debug("SendGrid webhook", JSON.stringify(data) );
      let ret = data.map(eventData => {
        let event = eventData.event;
        let sMessageId = eventData.sg_message_id.substring(0, eventData.sg_message_id.indexOf('.filter',0));
        let emailIndex = Number(eventData.sg_message_id.split('.').pop());
        return {
          status: getEventStatus(event),
          date: new Date(eventData.timestamp * 1000),
          msgId: sMessageId,
          email: eventData.email,
          emailIndex: emailIndex
        };
      });

      // let event = data.event;
      // let ret = {
      //   status: getEventStatus(event),
      //   date: new Date(data.timestamp * 1000),
      //   msgId: data.sg_message_id,
      //   email: data.email
      // };

      resolve(ret);
    });
  }
}

function getEventStatus(event){
/*
processed -> processed
dropped -> dropped
deferred -> deferred
bounce -> bounced
delivered -> delivered
open -> opened
spam -> spam
unsubscribe -> unsubscribe
click -> clicked
group_unsubscribe -> unsubscribe
group_resubscribe -> unknown
 */

  switch (event) {
    case 'processed':
      return 'processed';

    case 'dropped':
      return 'dropped';   

    case 'deferred':
      return 'deferred';  

    case 'bounce':
      return 'bounced';   
  
    case 'delivered':
      return 'delivered';
    
    case 'open':
      return 'opened';  

    case 'spam':
      return 'spam';   

    case 'unsubscribe':
      return 'unsubscribe';

    case 'click':
      return 'clicked';   

    case 'group_unsubscribe':
      return 'unsubscribe';
  
    case 'group_resubscribe':
      return 'unknown';
   
    default:
      return 'unknown'
  }
  
}

function assertReceiversArray(receivers){
  return receivers ? (Array.isArray(receivers) ? receivers : [receivers] ) : [];
}

function createMailData(data){
  return new Promise((resolve, reject) =>{
    let mail = {}
    let personalizationData = {};

    mail.from = transformAddress(data.from);
    
    personalizationData.to = transformReceivers(data.to);
    personalizationData.cc = transformReceivers(data.cc);
    personalizationData.bcc = transformReceivers(data.bcc);
    personalizationData.subject = data.subject;
    mail.text = data.text;
    mail.html = data.html;

    mail.templateId = data.templateId;

    if(data.serviceData){
      Object.assign(mail, data.serviceData);
    }


    if(data.substitutions){
      if(mail.templateId && mail.templateId.startsWith('d-')){
        personalizationData.dynamic_template_data = data.substitutions;
      }else{
        personalizationData.substitutions = data.substitutions;  
      }
    }
    
    mail.personalizations = [personalizationData];

    resolve(mail);
  });
}

function transformAddress(address){
  let ret;
  if(address){
    if(typeof address === "string"){
      ret = address.trim();
    }else{
      ret = {name: address.name, email: address.email.trim()};
    } 
  }
  return ret;
}

function transformReceivers(receivers){
  let ret;
  if(receivers){
    if(Array.isArray(receivers)){
      ret = receivers.map(receiver =>{
        return transformAddress(receiver);
      });
    }else if(typeof receivers === "string"){
      receivers = receivers.split(",");
      if(receivers.length == 1){
        ret = transformAddress(receivers[0]);
      }else{
        ret = transformReceivers(receivers);
      }
    }else{
      ret = transformAddress(receivers);
    }
  }
  return ret;

}

module.exports = Client;