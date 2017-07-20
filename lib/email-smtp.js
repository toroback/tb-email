let nodemailer = require("nodemailer");

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
  send(mail){
    return new Promise((resolve, reject) =>{
      this.srv.sendMail(mail, (err, response)=>{
        if(err) reject(err);
        else (resolve(response))
      })

    })
  }
}


module.exports = Client;