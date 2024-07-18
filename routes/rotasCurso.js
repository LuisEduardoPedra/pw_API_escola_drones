const { Router } = require('express');

const { getCursos, addCurso, updateCurso, deleteCurso, getCursoPorCodigo } = require('../controllers/cursoController')

const rotasCursos = new Router();

rotasCursos.route('/curso')
    .get(getCursos)
    .post(addCurso)
    .put(updateCurso);

rotasCursos.route('/curso/:codigo')
    .get(getCursoPorCodigo)
    .delete(deleteCurso);

module.exports = { rotasCursos }