class Aluno {
    constructor (codigo, nome, data_nascimento, data_cadastro, telefone, cursos) {
        this.codigo = codigo;
        this.nome = nome;
        this.data_nascimento = data_nascimento;
        this.data_cadastro = data_cadastro;
        this.telefone = telefone;
        this.cursos = cursos;
    }
}

module.exports = Aluno;