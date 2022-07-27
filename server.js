const { Client } = require('pg');
const express = require('express');
const bodyParser =require('body-parser');
const app = express();
var cors = require('cors');
app.use(cors({origin: '*'}));
const multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/Users/Kevin/Desktop/ProyectoFinal/servidor/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
const upload = multer({ storage: storage });
app.use(function (req, res, next) {

  // Website you wish to allow to connect
res.setHeader('Access-Control-Allow-Origin', '*');
next();
});
const client = new Client({
  connectionString: "postgres://xbsexgcvagggng:2a067bf8d98f2cdc0654f5e65bab0c4e8f743d7c5e1f435124810c0b2bfc0a9c@ec2-54-225-234-165.compute-1.amazonaws.com:5432/d8hna659m6om1p",
  ssl:{
    rejectUnauthorized: false
  }
})
client.connect(function(err) {
  if (err) throw err;
  console.log("Conectado");
});

app.use(bodyParser.json());

app.use(
  bodyParser.urlencoded({
    extended:true,
  })  
);

app.get('/', (req, res) => {
  res.send('Hello from App Engine!');
});

app.post('/api/login', function(request, response) {
	let correo = request.body.correo;
	let contrasenia = request.body.contrasenia;

  console.log(correo +" "+ contrasenia);

	if (correo && contrasenia) {
		client.query('SELECT * FROM usuario WHERE correo=$1 and contrasenia=$2', [correo, contrasenia], function(error, results, fields) {
      if (error) throw error;
			if (results.rowCount > 0) {
        client.query('insert into registro_sesion(id_usuario) values($1)', [results.rows[0].id_usuario], function(error, results, fields) {
          if (error) throw error;
        });
				response.json({
          "autenticado":true
        });
			} else {
				response.json({
          "autenticado":false
        });
			}			
			response.end();
		});
	} else {
		response.send('Por favor ingresa Usuario y Contraseña!');
		response.end();
	}
});

app.post('/api/register', function(request, response) {
	let id_tipo_usuario = request.body.id_tipo_usuario;
	let nombres = request.body.nombres;
  let apellidos = request.body.apellidos;
	let contrasenia = request.body.contrasenia;
  let correo = request.body.correo;
	if (correo && contrasenia && apellidos && nombres && id_tipo_usuario) {
		client.query('insert into usuario(id_tipo_usuario,nombres,apellidos,contrasenia,correo) values($1,$2,$3,$4,$5)', [id_tipo_usuario,nombres,apellidos,contrasenia, correo], function(error, results, fields) {
      if (error) throw error;
			response.send('Usuario creado!');
		  response.end();
		});
	} else {
		response.send('Por favor ingresa Usuario y Contraseña!');
		response.end();
	}
});

app.get('/api/categorias', function(request, response) {
	client.query('SELECT * from categoria', function(error, results, fields) {
    if (error) throw error;
    response.status(200).json(results.rows)
  });
});

app.get('/api/subcategorias/:categoria', function(request, response) {
	const categoria=parseInt(request.params.categoria);
  client.query('select subcategoria.id_subcategoria,subcategoria.nombre from categoria_subcategoria,categoria,subcategoria where categoria_subcategoria.id_categoria=categoria.id_categoria and categoria_subcategoria.id_subcategoria=subcategoria.id_subcategoria and categoria_subcategoria.id_categoria=$1',[categoria],function(error, results, fields) {
    if (error) throw error;
    response.status(200).json(results.rows)
  });
});

app.get('/api/proyectos', function(request, response) {
	client.query('SELECT * from proyecto', function(error, results, fields) {
    if (error) throw error;
    response.status(200).json(results.rows)
  });
});

app.post("/api/upload", upload.any(), uploadFiles);

function uploadFiles(req, res) {
    console.log(req.files);
    res.json({ message: "Successfully uploaded files" });
}

app.use("/api/download",express.static('./uploads'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});