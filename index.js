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


let EmailSmtp = require('./lib/email-smtp');
let EmailImap = require('./lib/email-imap');
var path = require('path');
let htmlparser = require("htmlparser2"); 
let htmlToText = require('html-to-text');

const emailsDir ='/email';
const defLang = 'en_us';
const defLang2 = 'en';
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
   * @param  {String} options.user            Nombre de usuario ó email del servicio
   * @param  {String} options.pass            Contraseña del servicio
   * @param  {Object} [options.transport]     Objeto con la configuración del transport
   * @param  {String} options.transport.imap  Imap del transport
   */
  constructor(options){
    this.smtp = {}
    this.smtp.options = {
      user: options.user,
      pass: options.pass
    }
    this.imap = {}
    this.imap.options ={
      user: options.user,
      pass: options.pass      
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
   * @param  {Object} mail Información del email a enviar
   * @param  {String} [mail.from] Remitente del email 
   * @param  {String|String[]} mail.to Array o lista separada por comas de los destinatarios del email
   * @param  {String|String[]} [mail.cc] Array o lista separada por comas de los destinatarios cc del email
   * @param  {String|String[]} [mail.bcc] Array o lista separada por comas de los destinatarios bcc del email
   * @param  {String} mail.subject Asunto del email
   * @param  {String} mail.text Texto plano con el contenido del email
   * @param  {String} [mail.html] Contenido del email en formato html
   * @return {Promise<Object>}  Promesa con el resultado del envío
   */
  send(mail){
    let client = new EmailSmtp(this.smtp.options)
    return client.send(mail);
  }

  /**
   * Envía un email desde un template preconfigurado
   * @param  {String|String[]} to     Array o lista separada por comas de los destinatarios del email
   * @param  {String} templateName    Identificador del template a utilizar. 
   * @param  {Object} [replaceObject] Objeto que contiene pares (key,value) para reempleazar en el email 
   * @param  {String} [lang]          Idioma del email
   * @return {Promise<Object>}  Promesa con el resultado del envío
   */
  sendFromTemplate(to, templateName, replaceObject, lang){
    return new Promise((resolve,reject) => {
       loadTemplates(templateName, replaceObject, lang)
        .then(texts =>
          this.send({
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
      let client = new EmailImap(this.imap.options)
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
      // setupAcl();
      // setupRoutes();
      // setupModels();
     
      if(App.emailOptions && App.emailOptions.configSmtp){
        App.email = new Client({user: App.emailOptions.configSmtp.user,pass: App.emailOptions.configSmtp.pass});
      }else{
        log.warn('Email: email options needs to be configured.')  
      }
      resolve();

    });
  }

}


function loadTemplates(templateName, replaceObject, lang = "en"){
  return new Promise((resolve, reject) =>{
    let texts = {};
    Promise.all([
      loadEmail(templateName, ".html", replaceObject, lang).catch(err => Promise.resolve()),
      loadEmail(templateName, ".txt", replaceObject, lang).catch(err => Promise.resolve())
    ])
      .then(results =>{
        texts.html = results[0];
        texts.text = results[1];

        if(!texts.html && !texts.text)
          throw new Error("Cannot find resource with key: "+ templateName);

        let prom = [];
        if(texts.html){
          prom.push(parseHtmlTitle(texts.html))
          if(!texts.text)
            prom.push(htmlToPlainText(texts.html));
        }
        
        return Promise.all(prom);
      })
      .then(results =>{
        if(results.length > 0){
          texts.subject = results[0];
          if(results.length > 1)
            texts.text = results[1];
        }
        resolve(texts);
      })
      .catch(reject);
  });
}

function parseHtmlTitle(theHtml) {
  return new Promise((resolve, reject) => {
    let isTitle = false;
    let title;

    let parser = new htmlparser.Parser({
        onopentag:  (name) => { if(name === 'title') isTitle = true; },
        ontext:     (text) => { if (isTitle) title = text; },
        onclosetag: (name) => { 
          if(name === 'title') {
            isTitle = false;
            parser.parseComplete();
          }
        }
    }, {decodeEntities: true});
    parser.write(theHtml);
    resolve(title);
  });
  
}


/**
 * Carga un recurso de tipo email
 * @private
 * @param  {String} fileName El nombre del archivo incluyendo la extensión
 * @param  {Object} params   Objeto con los parámetros del texto a reemplazar
 * @return {String}          El recurso cargado
 */
function loadEmail(fileName, ext, params, lang){
  return App.res.loadText(path.join(emailsDir, fileName, lang+ext), params)
    .catch(err => {
      if(lang != defLang && lang != defLang2){
        return loadEmail(fileName, ext, params, defLang);
      }else if (lang === defLang) {
        return loadEmail(fileName, ext, params, defLang2);
      }else{
        return Promise.reject(err);
      }
    });
}



function htmlToPlainText(html){
  return new Promise((resolve, reject) => {
    var text = htmlToText.fromString(html, {
        wordwrap: 130
    });

    resolve(text);
  });
}



module.exports = Client;





