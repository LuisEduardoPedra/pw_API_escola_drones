const { Router } = require('express');

const { rotasAlunos } = require('./rotasAluno');
const { rotasCursos } = require('./rotasCurso')

const rotas = new Router();

rotas.use(rotasAlunos);
rotas.use(rotasCursos);

module.exports = rotas;