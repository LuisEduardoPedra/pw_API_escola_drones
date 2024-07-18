const { getAlunosDB, addAlunoDB, updateAlunoDB, 
    deleteAlunoDB, getAlunoPorCodigoDB } 
    = require('../usecases/alunoUseCases');

const getAlunos = async (request, response) => {
  await getAlunosDB()
        .then(data => response.status(200).json(data))
        .catch(err => response.status(400).json({
          status : 'error',
          message : 'Erro ao consultar os alunos: ' + err
        }))
}

const addAluno = async (request, response) => {
  await addAlunoDB(request.body)
        .then(data => response.status(200).json({
              status : "success", message : "Aluno criado",
              objeto : data
        }))
        .catch(err => response.status(400).json({
          status : 'error',
          message : err
        }))
}

const updateAluno = async (request, response) => {
  await updateAlunoDB(request.body)
        .then(data => response.status(200).json({
              status : "success", message : "Aluno alterado",
              objeto : data
        }))
        .catch(err => response.status(400).json({
          status : 'error',
          message : err
        }))
}

const deleteAluno = async (request, response) => {
  await deleteAlunoDB(request.params.codigo)
        .then(data => response.status(200).json({
              status : "success", message : data
        }))
        .catch(err => response.status(400).json({
          status : 'error',
          message : err
        }))
}

const getAlunoPorCodigo = async (request, response) => {
  await getAlunoPorCodigoDB(request.params.codigo)
        .then(data => response.status(200).json(data))
        .catch(err => response.status(400).json({
          status : 'error',
          message : err
        }))
}

module.exports = {
  getAlunos, addAluno, updateAluno, deleteAluno, getAlunoPorCodigo
}