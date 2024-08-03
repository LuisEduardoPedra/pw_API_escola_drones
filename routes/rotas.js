const { Router } = require('express');

const { login } = require('../controllers/segurancaController');
const { rotasAlunos } = require('./rotasAluno');
const { rotasCursos } = require('./rotasCurso')

const rotas = new Router();

rotas.route('/login').post(login);

rotas.use(rotasAlunos);
rotas.use(rotasCursos);

module.exports = rotas;