
let path = require('path');
let htmlparser = require("htmlparser2"); 
let htmlToText = require('html-to-text');

const emailsDir ='/email';
const defLang = 'en_us';
const defLang2 = 'en';

//Estados de un email
/*
// newly inserted:
pending
// on api call:
sent
rejected
// on webhooks:
processed
bounced
deferred
delivered
opened
clicked
spam
unsubscribe
dropped
// on unknown webhook:
unknown
 */
const emailStatus = ['unknown', 
                     'pending', 'sent',  'rejected',
                     'processed', 'deferred', 'bounced', 'delivered', 'dropped', 'opened', 'clicked', 'spam', 'unsubscribe'];

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


function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

module.exports = {
  loadTemplates: loadTemplates,
  validateEmail: validateEmail,
  emailServices: ['mailjet', 'sendgrid', 'smtp'],
  emailStatus:   emailStatus
};
