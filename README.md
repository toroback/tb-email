# tb-email Reference

Este módulo permite el envío de emails desde el servidor.
 
## Configuración

Para utilizar el servicio de envío de emails es necesario configurar como se explicará a continuación.

### **- Servicios disponibles:**
Para poder utilizar un servicio se utilizarán los identificadores de cada uno de ellos.

Los servicios disponibles para envío de emails son:

- **SMTP**
  + Identificador: "smtp"

- **SendGrid**
  + Identificador: "sendgrid"
  + [Página web](https://sendgrid.com/)

- **MailJet**
  + Identificador: "mailjet"
  + [Página web](https://www.mailjet.com/)

### **- Configuración desde interfaz administrativa:** 

*IMPORTANTE: La configuración desde la interfaz no está disponible para la ultima versión de tb-email*

### **- Configuración manual:**

La configuración manual se realiza sobre una colección en la base de datos llamada "tb.configs".

Para ello hay que añadir un nuevo documento cuyo id sea el "emailOptions" (Ej. "\_id":"emailOptions"). Dicho documento debe tener un objeto para cada uno de los servicios que se quiera configurar cuya clave sea el identificador del servicio. 

#### **- Configuración del servicio SMTP:**

Para configurar SMTP se requerirán los siguientes campos:

| Clave | Tipo | Opcional   | Descripción |
|---|---|:---:|---|
|user|String||Cuenta de correo utilizada para el envio|
|pass|String||Contraseña de la cuenta de correo|

Un ejemplo de configuración del servicio *SMTP* sería el siguiente:

```
{
    "_id" : "emailOptions",
     "smtp" : {
        "user" : "myEmail@gmail.com",
        "pass" : "myPassword"
    },
    …
}
```
  
#### **- Configuración del servicio SendGrid:**

Para configurar SMTP se requerirán los siguientes campos:

| Clave | Tipo | Opcional   | Descripción |
|---|---|:---:|---|
|apiKey|String||ApiKey proporcionada por el servicio|

Un ejemplo de configuración del servicio *SendGrid* sería el siguiente:

```
{
    "_id" : "emailOptions",
    "sendgrid" : {
        "apiKey" : "myApiKey"
    }
    …
}
```

#### **- Configuración del servicio MailJet:**

Para configurar SMTP se requerirán los siguientes campos:

| Clave | Tipo | Opcional   | Descripción |
|---|---|:---:|---|
|apiKey|String||ApiKey proporcionada por el servicio|
|apiSecret|String||Clave secreta proporcionada por el servicio|

Un ejemplo de configuración del servicio *MailJet* sería el siguiente:

```
{
    "_id" : "emailOptions",
    "mailjet" : {
        "apiKey" : "myApiKey",
        "apiSecret" : "myApiSecret"
    }
    …
}
```

## **Modo de uso**

El envío de emails se puede realizar mediante la Class Api del servidor utilizando las funciones de **"App.email"** o a través de una peticion POST al servidor.

## **Funcionalidades**

### **- Envío de un email:**

Para enviar un email simple basta con indicar los destinatarios, el asunto y el texto que se va a enviar. 

Pero en ocaciones es necesario enviar un mismo email a diferentes usuarios y en diferentes momentos, como por ejemplo al registrarse un usuario para pedir validación, o simplemente para recordar una contraseña. 
Para estos casos existe el envío de email desde templates. Que permiten predefinir un contenido de email en formato html permitiendo reemplazar ciertos valores para personalizar el email dependiendo del destinatario.

*Nota:* Para saber más cómo predefinir un email leer "**Creando un email template**".


#### **• REST Api:**

**Petición:**

|HTTP Method|URL|
|:---:|:---|
|POST | `https://[domain]:[port]/api/v[apiVersion]/srv/email` |

**- Parámetros Body:**

| Clave | Tipo | Opcional   | Descripción  |
|---|---|:---:|---|
|service|String| | Servicio por el que enviar el email ('smtp', 'sendgrid', 'mailjet') | 
|from|String/Object| X | Remitente del email. Puede ser un String con la dirección de correo o un objeto | 
|from.name|String| X | Nombre utilizado para el remitente del email| 
|from.email|String| | Direccion de correo del remitente del email | 
|to|String/Object/Array|| String con email o lista separada por comas, Objeto con nombre y dirección o Array de emails y objetos de los destinatarios del email| 
|to.name|String|X|Nombre del destinatario| 
|to.email|String|X|Email del destinatario| 
|to.uid|String|X|Id de usuario del que tomar nombre o email| 
|cc|String/Object/Array|| String con email o lista separada por comas, Objeto con nombre y dirección o Array de emails y objetos de los destinatarios CC del email| 
|cc.name|String|X|Nombre del destinatario| 
|cc.email|String|X|Email del destinatario| 
|cc.uid|String|X|Id de usuario del que tomar nombre o email| 
|bcc|String/Object/Array|| String con email o lista separada por comas, Objeto con nombre y dirección o Array de emails y objetos de los destinatarios BCC del email| 
|bcc.name|String|X|Nombre del destinatario| 
|bcc.email|String|X|Email del destinatario| 
|bcc.uid|String|X|Id de usuario del que tomar nombre o email| 
|subject|String||Asunto del email| 
|text|String|X|Texto plano con el contenido del email| 
|html|String|X|Contenido del email en formato html| 
|templateId|String|X|Id del template a utilizar| 
|templateLang|String|X|SOLO smtp - Idioma del email para tomar el template en el idioma correcto. ISO-CODE Por defecto es 'en'| 
|substitutions|Object|X|Objeto que contiene pares (key,value) para reempleazar en el template | 
|serviceData|Object|X|Objeto que contiene pares (key,value) que se enviarán directo al servicio | 

**- Respuesta:**
   
| Clave | Tipo | Opcional   | Descripción  |
|---|---|:---:|---|
| - |Array<tb.email-sent>| | Array con la información del email siendo enviado a cada destinatario  | 

**- Ejemplo 1: Ejemplo básico**

* Petición:

POST:  `https://a2server.a2system.net:1234/api/v1/srv/email`

* BODY: 

```javascript
  {
    "service":"smtp",
    "from": "\"Fred Foo 👻\" <foo@example.com>", 
    "to": "bar@example.com",
    "subject": "Hello ✔",
    "text": "Hello world?",
    "html": "<b>Hello world?</b>"    
  }
```

**- Ejemplo 2: Uso de template y lista de destinatarios**

* Petición:

POST:  `https://a2server.a2system.net:1234/api/v1/srv/email`

* BODY: 

```javascript
  {
    "service":"smtp",
    "from": "\"Fred Foo 👻\" <foo@example.com>", 
    "to": "bar@example.com, baz@example.com",
    "subject": "Hello ✔",
    "templateId":<myTemplateId> 
  }
```

**- Ejemplo 3: Destinatario como objeto**

* Petición:

POST:  `https://a2server.a2system.net:1234/api/v1/srv/email`

* BODY: 

```javascript
  {
    "service":"smtp",
    "from": "\"Fred Foo 👻\" <foo@example.com>", 
    "to": {"name":"Bar", "email":"bar@example.com"},
    "subject": "Hello ✔",
    "templateId":<myTemplateId> 
  }
```

**- Ejemplo 3: Destinatario como array**

* Petición:

POST:  `https://a2server.a2system.net:1234/api/v1/srv/email`

* Respuesta:
   
| Clave | Tipo | Opcional   | Descripción  |
|---|---|:---:|---|
| - |Array<tb.email-sent>| | Objeto con los datos del envío del  | 

* BODY: 

```javascript
  {
    "service":"smtp",
    "from": "\"Fred Foo 👻\" <foo@example.com>", 
    "to": [{"name":"Bar", "email":"bar@example.com"}, "other@example.com"],
    "subject": "Hello ✔",
    "templateId":<myTemplateId> 
  }
```

#### **• Código Javascript:**

**- Parámetros:**
   
| Clave | Tipo | Opcional   | Descripción  |
|---|---|:---:|---|
|service|String| | Servicio por el que enviar el email ('smtp', 'sendgrid', 'mailjet') | 
|from|String/Object| X | Remitente del email. Puede ser un String con la dirección de correo o un objeto | 
|from.name|String| X | Nombre utilizado para el remitente del email| 
|from.email|String| | Direccion de correo del remitente del email | 
|to|String/Object/Array|| String con email o lista separada por comas, Objeto con nombre y dirección o Array de emails y objetos de los destinatarios del email| 
|to.name|String|X|Nombre del destinatario| 
|to.email|String|X|Email del destinatario| 
|to.uid|String|X|Id de usuario del que tomar nombre o email| 
|cc|String/Object/Array|| String con email o lista separada por comas, Objeto con nombre y dirección o Array de emails y objetos de los destinatarios CC del email| 
|cc.name|String|X|Nombre del destinatario| 
|cc.email|String|X|Email del destinatario| 
|cc.uid|String|X|Id de usuario del que tomar nombre o email| 
|bcc|String/Object/Array|| String con email o lista separada por comas, Objeto con nombre y dirección o Array de emails y objetos de los destinatarios BCC del email| 
|bcc.name|String|X|Nombre del destinatario| 
|bcc.email|String|X|Email del destinatario| 
|bcc.uid|String|X|Id de usuario del que tomar nombre o email| 
|subject|String||Asunto del email| 
|text|String|X|Texto plano con el contenido del email| 
|html|String|X|Contenido del email en formato html| 
|templateId|String|X|Id del template a utilizar| 
|templateLang|String|X|SOLO smtp - Idioma del email para tomar el template en el idioma correcto. ISO-CODE Por defecto es 'en'| 
|substitutions|Object|X|Objeto que contiene pares (key,value) para reempleazar en el template | 
|serviceData|Object|X|Objeto que contiene pares (key,value) que se enviarán directo al servicio | 

**- Respuesta:**
   
| Clave | Tipo | Opcional   | Descripción  |
|---|---|:---:|---|
| - |Array<tb.email-sent>| | Array con la información del email siendo enviado a cada destinatario  | 

**- Ejemplo:**
      
```javascript
var from = "\"Fred Foo 👻\" <foo@example.com>";
var to = "receiver1@gmail.com, receiver2@gmail.com" // tambien se puede utilizar [receiver1@gmail.com, receiver2@gmail.com]
var subject = "Email's subject";
var text = "Email's" content";
var html = "<p>Email's" html content</p>";
var email =   {
    "service":"smtp",
    "from": from, 
    "to": to,
    "subject": subject,
    "text": text,
    "html": html   
  }

App.email.send(email)
  .then(res => {…})
  .catch(err => {…})
```

## **Creando un email template:**

Un email template es un archivo que tiene el contenido de un email para utilizar en distintas ocaciones, como el registro de un usuario, recordar una contraseña, dar la bienvenida, etc…. Para crear un template hay que crear archivos con el contenido del email y el subject y ubicarlos en una ruta específica para que sean reconocidos. Los templates permiten definición de variables que pueden ser reemplazadas en el momento del envío para así poder personalizar el email en función del destinatario.

A continuación veremos cómo crear un template y dónde ubicarlo para cuando utilicemos el servicio 'smtp'.

Para servicios distintos el template debe ser creado en la página web del servicio.

### **- Ubicación de los templates:**

Un template debe estar alojado bajo la carpeta **"resources"** de nuestro servidor. Para ello, si no existía previamente, añadir una carpeta en "**app/**" de manera que quede como a continuación.

```
  root/
    - a2s/
    - app/
      - resources/
        - emails/
```

Una vez creada la carpeta **"resources"** es necesario crear una subcarpeta llamada **"emails"**, donde ubicaremos los distintos templates.

Cada template tendrá un identificador y por cada template existirá una carpeta con los distintos archivos que pertenezcan al template. De esta manera, el identificador del  template debe ser el nombre de la carpeta.

Por ejemplo, si creamos un template cuyo nombre sea "registration". Bajo la carpeta "resources" será necesario crear una carpeta con el nombre "registration", que será donde se almacenen los distintos archivos.


### **- Creando el contenido:**
El contenido de un template puede estar en formato html y/o en texto plano para que se adapte según la necesidad del cliente de email del destinatario.

Para ello podemos crear distintos archivos que contengan los textos en formato html y archivos que contengan el texto en formato de texto plano dependiendo del idioma.

Para referenciar un template se utilizará su identificador. Dicho identificador será el nombre de la carpeta en la que estén alojados los distintos archivos.

Y los nombres de los archivos serán el código del idioma ("en", "es", "fr", etc…) con extensión .html, si el contenido es html, o .txt si el contenido es de texto plano.

**- Ejemplo:**

- Identificador: "registration"

- Ubicación:

```
root/
  - app/
    - resources/
      - emails/
        - resgistration/
          - en.html
          - en.txt
```

- en.html:

```html
<!DOCTYPE html>
<html>
  <body>
    <h1>This is a Heading</h1>

    <p>This is a paragraph. And this is your name: ${name}</p>
  </body>
</html>
```

- en.txt:

```txt  
This is a Heading

This is a paragraph. And this is your name: ${name}
```

Como se pudo ver en el ejemplo anterior, los textos tienen algunas variables para poder ser reemplazadas en el momento del envío.
Estas variables se declaran estableciendo el nombre de la variable entre llaves y comenzando por el símbolo '$'

- Ejemplo: 

  ${name} Declara una variable que se llama 'name'

**NOTA 1**: Si no se crea el template en formato de texto plano se intentará convertir el contenido del archivo html y extraer tomar una versión de texto plano.

**NOTA 2**: Si no se crea contenido en formato html ni en formato de texto plano no se podrá enviar el email.

###  **- Creando el asunto:**
En la mayoría de los casos los emails se mandan con un asunto.
Para declarar el asunto basta con agregar la etiqueta "head" en el archivo html. Esto implica que es necesario que exista el contenido html para poder añadir un asunto.

De esta manera, añadiendo un asunto al ejemplo anterior quedaría de la siguiente manera:

**- Ejemplo:** 

- en.html:

```html
  <!DOCTYPE html>
  <html>
    <head>
      <title>This is the subject, and ${name} is your name</title>
    </head>
    <body>
      <h1>This is a Heading</h1>

      <p>This is a paragraph. And this is your name: ${name}</p>
    </body>
  </html>
```

- en.txt (No tiene asunto):
  
```txt  
This is a Heading

This is a paragraph. And this is your name: ${name}
```

###  **- Reemplazando variables:**
Para reemplazar las variables creadas en los templates basta con pasar un objeto a la función "**sendFromTemplate()**" cuyas claves sean los nombres de las variables y cuyos valores sean los que se van a reemplazar.

Por ejemplo, si en los ejemplos anteriores pasáramos un objeto que indique el valor de "_**name**_" quedaría de la siguiente manera:

**- Ejemplo:**

```javascript
var to = "receiver1@gmail.com" 
var templateId = "registration";  
var params = {
  name: "John"
}
App.email.sendFromTemplate(to,templateId,params, "en")
  .then(res => {…})
  .catch(err => {…})
```


**- Respuesta:**

- en.html:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>This is the subject, and John is your name</title>
  </head>
  <body>
    <h1>This is a Heading</h1>

    <p>This is a paragraph. And this is your name: John</p>
  </body>
</html>
```

- en.txt:
    
```txt  
This is a Heading

This is a paragraph. And this is your name: John
```

## **Modelos**

### tb.email-sent

Modelo de datos que contiene información sobre un email enviado a un cierto destinatario. Si un email fue enviado a más de un destinatario. Apareceran tantos registros con la misma información del email como destinatarios tenga el envío pero indicarán distinta informacion relacionada con cada uno de los destinatarios

| Clave | Tipo | Opcional | Descripción |
|---|---|:---:|---|
|uid|ObjectId||uid Owner user id (a2s.users)|
|service|String||Service type (payoneer, paypal, etc...)|
|email|String||Recipient email address|
|recType|String||Type of the recipient. Values ('to', 'cc', 'bcc')|
|recIndex|Number||Position of the recipient in the array of its type.|
|emailIndex|Number|X|Position of the recipient in the email. It will be the index of a recipient after joining the arrays of every recipients type|
|name|String|X|Name sent with the recipient|
|templateId|String|X|Template Id of the email|
|status|String||Last email status. Values ('unknown', 'pending', 'sent', 'rejected', 'processed', 'deferred', 'bounced', 'delivered', 'dropped', 'opened', 'clicked', 'spam', 'unsubscribe')|
|dStatus|String||Deeper email status. (Ej: If an email was opened and then clicked. The deeper status will be clicked. Because an email can be opened again after a click |
|statusLog|Array||status change logging|
|statusLog.status|String||Email status|
|statusLog.cDate|Date||Email status change timestamp|
|sEmailId|String|X|Identifier of the email sent by the service|
|originalResponse|Object|X|Original response received by client when sending an email|
|originalRequest|Object|X|Original request sent to the client when sending an email|
|data|Object|X|Object with information related with the service|



