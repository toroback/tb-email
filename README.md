# tb-email Reference

Este módulo permite el envío de emails desde el servidor.
 
## Configuración

Para utilizar el servicio de envío de emails es necesario configurarlo como se explicará a continuación.

#### - **Configuración de la cuenta principal:**

+ **Configuración desde A2Server:** 

  Desde la interfaz web de administración seleccionar la aplicación que se va a configurar.

  Una vez en ella acceder a la sección **"Configuración"** y luego a la pestaña **"Email"**.

  En dicha pestaña se puede configurar una cuenta de email que será utilizada parar enviar los emails desde el servidor.

  Los campos que hay que completar son:
    - Dirección de correo.
    - Contraseña.


+ **Configuración manual:**

  La configuración manual se realiza en el archivo **"config.json"**.

  Para ello hay que añadir el objeto "emailOptions", si no se tenía enteriormente, y agregar un objeto cuya clave sea "configSmtp" que contendrá usuario y contraseña de la cuenta de email que se utilizará, además es necesario incluir el servicio de la cuenta que se está utilizando. Al completarlo, debería quedar de la siguiente manera:

  ```javascript
  "emailOptions":{
    "configSmtp":{
      "user":"myEmail@gmail.com",
      "pass":"myPassword",
      "service": "gmail"
    }
  }
  ```

## **Modo de uso**

El envío de emails se puede realizar únicamente mediante llamadas internas al servidor utilizando las funciones de **"App.email"**.


## **Funcionalidades**

###  **- Envío de un email:**

-  **Código Javascript:**

    - Parámetros:
   
      | Clave | Tipo | Opcional   | Descripción  |
      |---|---|:---:|---|
      |from|String| X | Remitente del email | 
      |to|String/Array||Array o lista separada por comas de los destinatarios del email| 
      |cc|String/Array|X|Array o lista separada por comas de los destinatarios cc del email| 
      |bcc|String/Array|X|Array o lista separada por comas de los destinatarios bcc del email| 
      |subject|String||Asunto del email| 
      |text|String||Texto plano con el contenido del email| 
      |html|String|X|Contenido del email en formato html| 

    - Ejemplo:
    
      - Petición
      
      ```javascript
      var to = "receiver1@gmail.com, receiver2@gmail.com" // tambien se puede utilizar [receiver1@gmail.com, receiver2@gmail.com]
      var subject = "Email's subject";
      var text = "Email's" content";
      var html = "<p>Email's" html content</p>";
      var email = {
        to      : to,
        subject : subject,
        text    : text,
        html    : html
      }
    
      App.email.send(email)
        .then(res => {…})
        .catch(err => {…})
      ```

###  **- Envío de email desde template:**

En ocaciones es necesario enviar un mismo email a diferentes usuarios y en diferentes momentos, como por ejemplo al registrarse un usuario para pedir validación, o simplemente para recordar una contraseña. 
Para estos casos existe el envío de email desde templates. Que permiten predefinir un contenido de email en formato html permitiendo reemplazar ciertos valores para personalizar el email dependiendo del destinatario.

Para saber más cómo predefinir un email leer "Creando un email template".

Para enviar un email desde un template es necesario indicar los destinatarios, el identificador del template, los valores a reemplazar y el idioma. A continuación veremos cómo.

-  **Código Javascript:**

  - Parámetros:
    | Clave | Tipo | Opcional   | Descripción  |
    |---|---|:---:|---|
    |to|String/Array||Array o lista separada por comas de los destinatarios del email| 
    |templateName|String||Identificador del template a utilizar| 
    |replaceObject|Object|X|Objeto que contiene pares (key,value) para reempleazar en el email | 
    |lang|String|X| Idioma del email| 

  - Ejemplo:
    
    - Petición
      
    ```javascript
    var to = "receiver1@gmail.com" 
    var templateId = "registration";  
    var params = {
      fName: "John",
      lName: "Smith"
    }
    App.email.sendFromTemplate(to,templateId,params, "en")
      .then(res => {…})
      .catch(err => {…})
    ```


##  **Creando un email template:**
Un email template es un archivo que tiene el contenido de un email para utilizar en distintas ocaciones, como el registro de un usuario, recordar una contraseña, dar la bienvenida, etc….
Para crear un template hay que crear archivos con el contenido del email y el subject y ubicarlos en una ruta específica para que sean reconocidos. 
Los templates permiten definicion de variables que pueden ser reemplazadas en el momento del envío para asi poder personalizar el email en función del destinatario.

A continuación veremos cómo crear un template y dónde ubicarlo.

####  **- Ubicación de los templates:**
Un template debe estar alojado bajo la carpeta **"resources"** de nuestro servidor. Para ello, si no existia previamente, añadir una carpeta en "app/" de manera que quede como a continuación.

  ```
    root/
      - a2s/
      - app/
        - resources/
  ```

Una vez creada la carpeta **"resources"**, en ella ubicaremos los distintos templates.

Cada template tendrá un identificador y por cada template existirá una carpeta con los distintos archivos que pertenezcan al template. De esta manera, el identificador del  template debe ser el nombre de la carpeta.

Por ejemplo, si creamos un template cuyo nombre sea "registration". Bajo la carpeta "resources" será neceario crear una carpeta con el nombre "registration", que será donde se almacenen los distintos archivos.


####  **- Creando el contenido:**
El contenido de un template puede estar en formato html y/o en texto plano para que se adapte segun la necesidad del cliente de email del destinatario.

Para ello podemos crear distintos archivos que contenga los texto en formato html y archivos que contengan el texto en formato de texto plano dependiendo del idioma.

Para referenciar un template se utilizará su identificador. Dicho identificador será el nombre de la carpeta en la que estén alojados los distintos archivos.

Y los nombres de los archivos serán el código del idioma ("en", "es", "fr", etc…) con extensión .html, si el contenido es html, o .txt si el contenido es de texto plano.

- Ejemplo: 

  - Identificador: "registration"

  - Ubicación:

    ```
      root/
        - app/
          - resources/
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
    hello ${name} text from file


Como se pudo ver en el ejemplo anterior, los textos tienen algunas variables para poder ser reemplazadas en el momento del envío.
Estas variables se declaran estableciendo el nombre de la varible entre llaves y comezando por el símbolo '$'

  - Ejemplo: 
    ${name} Declara una variable que se llama 'name'


NOTA: Si el texto plano no se especifica se intentará tomar una version de texto plano del contenido html. Y si no se espeficica ningún texto no se podrá enviar el email.


####  **- Creando el asunto:**
En la mayoría de los casos los emails se mandan con un asunto.
Para declarar el asunto basta con agregar la etiqueta "head" en el archivo html. Esto implica que es necesario que exista el contenido html para poder añadir un asunto.

De esta manera, añadiendo un asunto al ejemplo anterior quedaría de la siguiente manera:

- Ejemplo: 
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

  - en.txt:
  
    hello ${name} text from file

####  **- Reemplazando variables:**
Para reemplazar las variables creadas en los templates basta con pasar un objeto a la funcion "sendFromTemplate()" cuyas claves sean los nombres de las variables y cuyos valores sean los que se van a reemplazar.

Por ejemplo, si en los ejemplos anteriores pasáramos un objeto que indique el valor de "name" quedaría de la siguiente manera:

  - Ejemplo:
  
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


  - Respuesta:
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
    
      hello John text from file