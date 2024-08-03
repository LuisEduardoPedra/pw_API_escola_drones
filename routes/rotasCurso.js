const { Router } = require('express');

const { getCursos, addCurso, updateCurso, deleteCurso, getCursoPorCodigo } = require('../controllers/cursoController')
const { verificaJWT } = require('../controllers/segurancaController');

const rotasCursos = new Router();

rotasCursos.route('/curso')
    .get(verificaJWT, getCursos)
    .post(verificaJWT, addCurso)
    .put(verificaJWT, updateCurso);

rotasCursos.route('/curso/:codigo')
    .get(verificaJWT, getCursoPorCodigo)
    .delete(verificaJWT, deleteCurso);

module.exports = { rotasCursos }