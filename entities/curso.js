class Curso {
    constructor (codigo, nome, descricao, valor, data_cadastro, carga_horaria, alunos) {
        this.codigo = codigo;
        this.nome = nome;
        this.descricao = descricao;
        this.valor = valor;
        this.data_cadastro = data_cadastro;
        this.carga_horaria = carga_horaria;
        this.alunos = alunos;
    }
}

module.exports = Curso;