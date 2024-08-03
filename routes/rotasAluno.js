const { Router } = require('express');

const { getAlunos, addAluno, updateAluno, deleteAluno, getAlunoPorCodigo } = require('../controllers/alunoController')
const { verificaJWT } = require('../controllers/segurancaController');

const rotasAlunos = new Router();

rotasAlunos.route('/aluno')
    .get(verificaJWT, getAlunos)
    .post(verificaJWT, addAluno)
    .put(verificaJWT, updateAluno);

rotasAlunos.route('/aluno/:codigo')
    .get(verificaJWT, getAlunoPorCodigo)
    .delete(verificaJWT, deleteAluno);

module.exports = { rotasAlunos }