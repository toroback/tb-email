
let router = new require('express').Router();

function setupRoutes(App){
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

    App.email.processWebhook(service, req.body)
      .then(resp => res.status(200).json(resp))
      .catch(next);
  }); 

  App.app.use(`${App.baseRoute}/srv/email`, router)

}

module.exports = setupRoutes;