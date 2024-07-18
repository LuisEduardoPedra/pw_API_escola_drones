const { Router } = require('express');

const { getAlunos, addAluno, updateAluno, deleteAluno, getAlunoPorCodigo } = require('../controllers/alunoController')

const rotasAlunos = new Router();

rotasAlunos.route('/aluno')
    .get(getAlunos)
    .post(addAluno)
    .put(updateAluno);

rotasAlunos.route('/aluno/:codigo')
    .get(getAlunoPorCodigo)
    .delete(deleteAluno);

module.exports = { rotasAlunos }