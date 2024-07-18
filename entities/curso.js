class Curso {
    constructor (codigo, nome, desc, valor, data_cad, carga_horaria, alunos) {
        this.codigo = codigo;
        this.nome = nome;
        this.desc = desc;
        this.valor = valor;
        this.data_cad = data_cad;
        this.carga_horaria = carga_horaria;
        this.alunos = alunos;
    }
}

module.exports = Curso;