let Imap = require('imap'),
    inspect = require('util').inspect,
    EventEmitter = require('events')

class Client extends EventEmitter{
  constructor(options){
    super()
    let conOptions ={
      user     : options.user,
      password : options.pass      
    }
    //colocamos las opciones de conexión
    if (options.transport){
      Object.assign(conOptions, options.transport);
    }else{
      Object.assign(conOptions, getConOptions(options.user))
    }

    this.srv = new Imap(conOptions)

    this.srv.once('ready',()=>{
      this.emit('ready');
      //console.log("ready")
    })
    this.srv.once('error',(err)=>{
      this.emit('error', err);
      //console.error(err)
    })
    this.srv.once('end',()=>{
      this.emit('end');
      //console.log("end")
    })
    this.srv.connect(); //this.srv.destroy() o end()
  }

  get(options){
    let opt   = options   || {};
    let box   = opt.box   || 'INBOX';
    let query = opt.query || ['NEW'];
    return new Promise((resolve, reject)=>{
      let imap = this.srv;
      imap.openBox(box, true, (err, box)=>{
        let res = [];
        if (err) reject(err);
        else{
          imap.search(query, function(err, results) {
            //let limit = opt.limit || box.messages.total+':1';
            let lr = limitResult(opt.limit, results); //limitamos la consulta
            var f = imap.seq.fetch(lr, {
              bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)','TEXT'],
              struct: true
            });
            f.on('message', function(msg, seqno) {
              let mail = {};
              //console.log('Message #%d', seqno);
              var prefix = '(#' + seqno + ') ';
              msg.on('body', function(stream, info) {
                var buffer = '';
                stream.on('data', function(chunk) {
                  buffer += chunk.toString('utf8');
                });
                stream.once('end', function() {
                  if (info.which !== 'TEXT') mail.header = Imap.parseHeader(buffer);
                  else{
                    mail.body = buffer;
                  }
                });
              });
              msg.once('attributes', function(attrs) {
                //Object.assign(mail, inspect(attrs, false, 8));
                //console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
              });
              msg.once('end', function() {
                res.push(mail)
              });
            });
            f.once('end', ()=>{
              resolve(res)
            })
          })
        }

      });
    })
  }
}

//limita el resultado de la busqueda conservando tantos elementos del arreglo
// positivo desde el inicio, negativo desde el final
function limitResult(limit, results){
  let res;
  if(limit){
    if (limit > 0) res = results.slice(0,limit);
    else res = results.slice(limit);
  }else res = results;
  return res;
}

//esta funcion se usará para buscar valores default según la cuenta de correo
function getConOptions(user){
  let server = user.split("@")[1];
  let res = {}
  if (server = 'gmail'){
    Object.assign(res,{
      host: 'imap.gmail.com',
      port: 993,
      tls: true
    })
  }
  return res;
}

module.exports = Client;    