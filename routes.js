
let express = require('express');
let router = express.Router();
let bodyParser = require('body-parser');

var rawBodySaver = function (req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}

function setupRoutes(App){

  // router.use(bodyParser.json({ verify: rawBodySaver }));
  // router.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
  // router.use(bodyParser.raw({ verify: rawBodySaver, type: function () { return true } }));



  router.use(function(req, res, next){
    req._ctx['service']  = "email";
    req._ctx['resource']  = req.query.service;
    next();
  });



  // router.post('/send', (req, res,next)=>{
  //   res.json({resp:"lo hizo"});
  // })


  // router.get('/send', (req, res,next)=>{
  //   res.json({resp:"lo hizo"});
  // })

  router.post('', (req, res,next)=>{
    
    var emailData = req.body;
    App.email.send(emailData)
      .then(resp => res.status(200).json(resp) )
      .catch(next);

    // res.json({resp:"lo hizo"});
  })


  

  router.post("/webhook",function(req, res, next){
    let service = req.query.service;
    // App.log.debug("NEW WEBHOOK RECEIVED", JSON.stringify(Object.keys(req)) );
    let data = req.body;
    if(service == 'mailjet'){ //Si es mailjet tomamos el raw data y reemplazamos el messageId que viene como number y lo transformamos a string para evitar que el parseo lo redondee
      if(req.rawBody){
        App.log.debug("NEW WEBHOOK RECEIVED rawBody", req.rawBody );
        let pattern = /\"MessageID\":[\s]*([0-9]+),/g;
        let replaced = req.rawBody.toString().replace( pattern , "\"MessageID\":\"$1\",");
        App.log.debug("NEW WEBHOOK RECEIVED replaced", replaced.toString() );
        data = JSON.parse(replaced);
      }
    }

    App.email.processWebhook(service, data)
      .then(resp => res.status(200).json(resp))
      .catch(next);
  }); 

  // var rawBodySaver = function (req, res, buf, encoding) {
  //   console.log("bodyParser called");
  //   if (buf && buf.length) {
  //     req.rawBody = buf.toString(encoding || 'utf8');
  //   }
  // }
  // App.app.use(`${App.baseRoute}/srv/emailwebhook`, bodyParser.json({ verify: rawBodySaver }));  
  App.app.use(`${App.baseRoute}/srv/email`, router)


}

module.exports = setupRoutes;