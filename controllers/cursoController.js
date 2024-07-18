const { getCursosDB, addCursoDB, updateCursoDB, deleteCursoDB, getCursoPorCodigoDB } = require('../usecases/cursoUseCases')

const getCursos = async (request, response) => {
    await getCursosDB()
        .then(data => response.status(200).json({
            status: "success",
            message: "Cursos recuperados",
            objeto: data
        }))
        .catch(err => response.status(400).json({
            status: 'error',
            message: err
        }));
}

const addCurso = async (request, response) => {
    await addCursoDB(request.body)
        .then(data => response.status(200).json({
            status: "success",
            message: "Curso criado",
            objeto: data
        }))
        .catch(err => response.status(400).json({
            status: 'error',
            message: err
        }));
}

const updateCurso = async (request, response) => {
    await updateCursoDB(request.body)
        .then(data => response.status(200).json({
            status: "success",
            message: "Curso atualizado",
            objeto: data
        }))
        .catch(err => response.status(400).json({
            status: 'error',
            message: err
        }));
}

const deleteCurso = async (request, response) => {
    const { codigo } = request.params;
    await deleteCursoDB(codigo)
        .then(data => response.status(200).json({
            status: "success",
            message: data.message
        }))
        .catch(err => response.status(400).json({
            status: 'error',
            message: err
        }));
}

const getCursoPorCodigo = async (request, response) => {
    const { codigo } = request.params;
    try {
        const curso = await getCursoPorCodigoDB(codigo);
        response.status(200).json(curso);
    } catch (err) {
        response.status(400).json({
            status: 'error',
            message: err
        });
    }
}


module.exports = {
    getCursos, addCurso, updateCurso, deleteCurso, getCursoPorCodigo
}