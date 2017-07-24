
let router = new require('express').Router();


function setupRoutes(App){
  router.use(function(req, res, next){
    req._ctx['service']  = "email";
    req._ctx['resource']  = req.query.service;
    next();
  });

  router.post('/send', (req, res,next)=>{
    res.json({resp:"lo hizo"});
  })


  router.get('/send', (req, res,next)=>{
    res.json({resp:"lo hizo"});
  })

  App.app.use(`${App.baseRoute}/srv/email`, router)

}

module.exports = setupRoutes;