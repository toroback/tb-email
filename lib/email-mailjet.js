let mailjet  = require ('node-mailjet');

class Client{

  /**
   * Constructor
   * @param  {Object} options Objeto con la configuracion del servicio
   * @param  {String} options.apiKey ApiKey del servicio
   * @param  {String} options.apiSecret Clave secreta del servicio
   * @param  {String} [options.version] Version a utilizar
   */
  constructor(options){

    let config = {
      // 'perform_api_call': false, // this doesnt work!!
      // SandboxMode: true, // maybe this one does. no it doesn't! :-S
      'version': options.version || 'v3.1'
    }
    this.srv = mailjet.connect(options.apiKey, options.apiSecret, config);

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
   * @param  {String} [data.substitutions] Objeto que contiene pares (key,value) para reempleazar en el template 
   * @return {Promise<Object>}  Promesa con el resultado del envío
   */
  send(data){
    return new Promise((resolve, reject) =>{
      let ret = {}
      
      createMailData(data)
        .then(mail =>{
          ret.request = mail;

          App.log.debug("Sending email:", JSON.stringify(mail));
          if(App.appOptions.develop && App.appOptions.develop.email){
            
            return Promise.resolve(createDevResponse(mail));
          }else{
            return this.srv.post('send').request( { "Messages":[ mail ] } );
          }
        })
        .then(res =>{
          App.log.debug("Email sent:", JSON.stringify(res));

          ret.response = res.body;

          let message = res.body.Messages[0];
          let status = message.Status == 'success' ? 'sent': 'rejected';
          let to  = message.To.map(item => {return {id: item.MessageID, status: status};});
          let cc  = message.Cc.map(item => {return  {id: item.MessageID, status: status};});
          let bcc  = message.Bcc.map(item => {return  {id: item.MessageID, status: status};});

          ret.messages = {to: to, cc: cc, bcc: bcc };
          return ret;
        })
        .catch(err => {
          console.log("Catched error ", JSON.stringify(err));
          ret.error =  JSON.parse(err.response.text);
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


  processWebhook(data){
    return new Promise((resolve, reject) =>{
      App.log.debug("Mailjet webhook", JSON.stringify(data) );
      if(!Array.isArray(data)) data = [data]; //Si no viene como array lo convertimos a array para soportar eventos en grupo
      let ret = data.map(eventData => {
        return {
          status: getEventStatus(eventData.event),
          date: new Date(eventData.time * 1000),
          msgId: eventData.MessageID.toString(),
          // msgId: eventData.mj_message_id,
          email: eventData.email
        };
      });

      
      // let event = data.event;
      // let ret = {
      //   status: getEventStatus(event),
      //   date: new Date(data.time * 1000),
      //   msgId: data.MessageID,
      //   email: data.email
      // };

      resolve(ret);
    });
  }

}

function getEventStatus(event){
/*
ESTOS SON ESTADO... NO EVENTOS
queued -> deferred
sent -> delivered
opened -> opened
clicked -> clicked
bounce -> bounced
spam -> spam
unsub -> unsubscribe
blocked -> dropped (this is mailjet's internal)
hardbounced -> bounced
softbounced -> bounced
deferred -> deferred

Los eventos son:
sent -> delivered
open -> opened
click -> clicked
bounce -> bounced
spam -> spam
unsub -> unsubscribe
blocked -> dropped (this is mailjet's internal)
 */

  switch (event) {
    // case 'queued':
    //   return 'deferred';

    case 'sent':
      return 'delivered';
    
    case 'open':
      return 'opened';  

    case 'click':
      return 'clicked';   

    case 'bounce':
    // case 'hardbounced':
    // case 'softbounced':
      return 'bounced';   

    case 'spam':
      return 'spam';   

    case 'unsub':
      return 'unsubscribe';   

    case 'blocked':
      return 'dropped';   

    // case 'deferred':
    //   return 'deferred';   

    default:
      return 'unknown';
  }
  
}

function createDevResponse(data){
  return {
    "body":{
      "Messages":[
        {
          "Status":"success",
          "CustomID":"",
          "To":(data.To || []).map(item => { return {MessageID: "dev_id_"+ Math.random().toString(36) }}),
          "Cc":(data.Cc || []).map(item => { return {MessageID: "dev_id_"+ Math.random().toString(36) }}),
          "Bcc":(data.Bcc || []).map(item => { return {MessageID: "dev_id_"+ Math.random().toString(36) }})
        }
      ]
    }
  }
}

function createMailData(data){
  return new Promise((resolve, reject) =>{
    let mail = {}

    mail.From = transformAddress(data.from);
    
    mail.To = transformReceivers(data.to);
    mail.Cc = transformReceivers(data.cc);
    mail.Bcc = transformReceivers(data.bcc);
    mail.Subject = data.subject;
    mail.TextPart = data.text;
    mail.HTMLPart = data.html;
    
    mail.TemplateID = data.templateId;

    mail.TemplateLanguage = true;
    
    mail.Variables = data.substitutions;
     
    resolve(mail);
  });
}

function transformAddress(address){
  let ret;
  if(address){
    if(typeof address === "string"){
      ret = {Name: undefined, Email: address.trim()};
    }else{
      ret = {Name: address.name, Email: address.email.trim()};
    } 
  }
  return ret;
}

function transformReceivers(receivers){
  let ret;
  if(receivers){
    if( Array.isArray(receivers)){
      ret = receivers.map(receiver =>{
        return transformAddress(receiver);
      });
    }else if(typeof receivers === "string"){
      ret = transformReceivers(receivers.split(","));
    }else{
      ret = transformReceivers([receivers]);
    }
  }
  return ret;
}

module.exports = Client;