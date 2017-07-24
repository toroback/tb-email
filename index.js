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
      require("./routes")(app);
      // setupAcl();
      // setupRoutes();
      // setupModels();
      console.log("iniciando Módulo email");
      resolve();
    })
  }

}

module.exports = Client;