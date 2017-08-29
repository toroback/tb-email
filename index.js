let EmailSmtp = require('./lib/email-smtp');
let EmailImap = require('./lib/email-imap');

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

class Client {
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
  send(mail){
    let client = new EmailSmtp(this.smtp.options)
    return client.send(mail);
  }


  sendFromTemplate(to, templateName, replaceObject){
    return new Promise((resolve,reject) => {
       loadTemplates(templateName, replaceObject)
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
   * @return {[type]}         [description]
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


function loadTemplates(templateName, replaceObject){
  return new Promise((resolve, reject) => {
    let texts = { };
    Promise.all([
      App.res.loadEmail(templateName+".html", replaceObject),
      App.res.loadEmail(templateName+".txt", replaceObject),
      App.res.loadSubject(templateName, replaceObject)
      ])
      .then(resourses =>{
         texts.html = resourses[0];
         texts.text = resourses[1];
         texts.subject = resourses[2];
         resolve(texts); 
      })
      .catch(reject);
  });
}

module.exports = Client;