const { pool } = require('../config');
const Curso = require('../entities/curso');

const getCursosDB = async () => {
    try {
        const cursosResult = await pool.query(`
                                            SELECT c.codigo AS curso_codigo, c.nome AS curso_nome, c.descricao AS curso_descricao,
                                            c.valor AS curso_valor, to_char(c.data_cadastro, 'YYYY-MM-DD') AS curso_data_cadastro,
                                            c.carga_horaria AS curso_carga_horaria,
                                            ac.aluno_codigo, a.nome AS aluno_nome, ac.curso_nota, ac.frequencia, ac.ativo AS aluno_ativo
                                            FROM cursos c
                                            LEFT JOIN alunos_cursos ac ON c.codigo = ac.curso_codigo
                                            LEFT JOIN alunos a ON ac.aluno_codigo = a.codigo
                                            ORDER BY c.codigo, ac.aluno_codigo
                                        `);

        const cursos = [];
        let cursoAtual = null;

        cursosResult.rows.forEach(row => {
            if (!cursoAtual || cursoAtual.codigo !== row.curso_codigo) {
                const { curso_codigo, curso_nome, curso_descricao, curso_valor,
                        curso_data_cadastro, curso_carga_horaria } = row;
                cursoAtual = {
                    codigo: curso_codigo,
                    nome: curso_nome,
                    descricao: curso_descricao,
                    valor: curso_valor,
                    data_cadastro: curso_data_cadastro,
                    carga_horaria: curso_carga_horaria,
                    alunos: []
                };
                cursos.push(cursoAtual);
            }

            if (row.aluno_codigo) {
                cursoAtual.alunos.push({
                    codigo: row.aluno_codigo,
                    nome: row.aluno_nome,
                    curso_nota: row.curso_nota,
                    frequencia: row.frequencia,
                    ativo: row.aluno_ativo
                });
            }
        });

        return cursos;
    } catch (err) {
        throw new Error("Erro ao consultar os cursos: " + err.message);
    }
}


const addCursoDB = async (body) => {
    const client = await pool.connect();
    try {
        const { nome, descricao, valor, data_cadastro, carga_horaria, alunos } = body;

        await client.query('BEGIN');

        const cursoResult = await client.query(`
            INSERT INTO cursos (nome, descricao, valor, data_cadastro, carga_horaria) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING codigo, nome, descricao, valor, to_char(data_cadastro, 'YYYY-MM-DD') as data_cadastro, carga_horaria
        `, [nome, descricao, valor, data_cadastro, carga_horaria]);

        const curso = cursoResult.rows[0];

        if (alunos && alunos.length > 0) {
            for (let aluno of alunos) {
                await client.query(`
                    INSERT INTO alunos_cursos (aluno_codigo, curso_codigo, curso_nota, frequencia, ativo) 
                    VALUES ($1, $2, $3, $4, $5)
                `, [aluno.codigo, curso.codigo, aluno.curso_nota, aluno.frequencia, aluno.ativo]);
            }
        }

        await client.query('COMMIT');

        return new Curso(curso.codigo, curso.nome, curso.descricao, curso.valor, curso.data_cadastro, curso.carga_horaria, alunos || []);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erro ao inserir o curso:", err); // Adiciona mais detalhes ao log
        throw new Error("Erro ao inserir o curso: " + err.message); // Melhora a mensagem de erro
    } finally {
        client.release();
    }
};


const updateCursoDB = async (body) => {
    const client = await pool.connect();
    try {
        const { codigo, nome, descricao, valor, data_cadastro, carga_horaria, alunos } = body;

        await client.query('BEGIN');

        await client.query(`
            UPDATE cursos SET nome = $2, descricao = $3, valor = $4, data_cadastro = $5, carga_horaria = $6
            WHERE codigo = $1
        `, [codigo, nome, descricao, valor, data_cadastro, carga_horaria]);

        const existingStudentsResult = await client.query(`SELECT aluno_codigo FROM alunos_cursos WHERE curso_codigo = $1`, [codigo]);
        const existingStudents = existingStudentsResult.rows.map(row => row.aluno_codigo);

        const newStudents = alunos.map(aluno => aluno.codigo);

        const studentsToRemove = existingStudents.filter(aluno => !newStudents.includes(aluno));

        if (studentsToRemove.length > 0) {
            await client.query(`DELETE FROM alunos_cursos WHERE curso_codigo = $1 AND aluno_codigo = ANY($2::int[])`, [codigo, studentsToRemove]);
        }

        for (let aluno of alunos) {
            await client.query(`
                INSERT INTO alunos_cursos (aluno_codigo, curso_codigo, curso_nota, frequencia, ativo)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (aluno_codigo, curso_codigo)
                DO UPDATE SET curso_nota = EXCLUDED.curso_nota, frequencia = EXCLUDED.frequencia, ativo = EXCLUDED.ativo
            `, [aluno.codigo, codigo, aluno.curso_nota, aluno.frequencia, aluno.ativo]);
        }

        await client.query('COMMIT');

        return { message: 'Curso atualizado com sucesso', codigo };

    } catch (err) {
        await client.query('ROLLBACK');
        throw "Erro ao alterar o curso: " + err;
    } finally {
        client.release();
    }
}

const deleteCursoDB = async (codigo) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            DELETE FROM alunos_cursos WHERE curso_codigo = $1
        `, [codigo]);

        const result = await client.query(`
            DELETE FROM cursos WHERE codigo = $1
        `, [codigo]);

        await client.query('COMMIT');

        if (result.rowCount === 0) {
            throw `Nenhum registro encontrado com o código ${codigo} para ser removido`;
        }

        return { message: `Curso de código ${codigo} removido com sucesso!` };

    } catch (err) {
        await client.query('ROLLBACK');
        throw "Erro ao remover o curso: " + err;
    } finally {
        client.release();
    }
}

const getCursoPorCodigoDB = async (codigo) => {
    try {
        const result = await pool.query(`
            SELECT codigo, nome, descricao, valor, to_char(data_cadastro, 'YYYY-MM-DD') as data_cadastro, carga_horaria
            FROM cursos
            WHERE codigo = $1
        `, [codigo]);

        if (result.rowCount === 0) {
            throw `Nenhum registro encontrado com o código ${codigo}`;
        }

        const curso = result.rows[0];

        const alunosResult = await pool.query(`
            SELECT a.codigo as codigo, a.nome as nome, to_char(a.data_nascimento, 'YYYY-MM-DD') as data_nascimento, to_char(a.data_cadastro, 'YYYY-MM-DD') as data_cadastro,
                   a.telefone as telefone, ac.curso_nota as curso_nota, ac.frequencia as frequencia, ac.ativo as ativo
            FROM alunos a
            JOIN alunos_cursos ac ON a.codigo = ac.aluno_codigo
            WHERE ac.curso_codigo = $1
        `, [codigo]);

        const alunos = alunosResult.rows.map(row => ({
            codigo: row.codigo,
            nome: row.nome,
            data_nascimento: row.data_nascimento,
            data_cadastro: row.data_cadastro,
            telefone: row.telefone,
            curso_nota: row.curso_nota,
            frequencia: row.frequencia,
            ativo: row.ativo
        }));

        const cursoCompleto = new Curso(
            curso.codigo,
            curso.nome,
            curso.descricao,
            curso.valor,
            curso.data_cadastro,
            curso.carga_horaria,
            alunos
        );

        return cursoCompleto;

    } catch (err) {
        throw "Erro ao recuperar o curso: " + err;
    }
}

module.exports = {
    getCursosDB, addCursoDB, updateCursoDB, deleteCursoDB, getCursoPorCodigoDB
}