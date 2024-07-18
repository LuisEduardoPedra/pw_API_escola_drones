const { pool } = require('../config');
const Aluno = require('../entities/aluno');

const getAlunosDB = async () => {
    try {
        const { rows } = await pool.query(`
                                            SELECT a.codigo AS aluno_codigo, a.nome AS aluno_nome, 
                                            to_char(a.data_nascimento, 'YYYY-MM-DD') AS data_nascimento,
                                            to_char(a.data_cadastro, 'YYYY-MM-DD') AS data_cadastro, 
                                            a.telefone AS telefone, 
                                            ac.curso_codigo AS curso_codigo, ac.ativo AS curso_ativo, 
                                            c.nome AS curso_nome, ac.curso_nota AS curso_nota, 
                                            ac.frequencia AS curso_frequencia
                                            FROM alunos a
                                            LEFT JOIN alunos_cursos ac ON a.codigo = ac.aluno_codigo
                                            LEFT JOIN cursos c ON ac.curso_codigo = c.codigo
                                            ORDER BY a.nome
                                        `);

        const alunosMap = new Map();

        rows.forEach(row => {
            const aluno = {
                codigo: row.aluno_codigo,
                nome: row.aluno_nome,
                data_nascimento: row.data_nascimento,
                data_cadastro: row.data_cadastro,
                telefone: row.telefone,
                cursos: []
            };

            if (!alunosMap.has(row.aluno_codigo)) {
                alunosMap.set(row.aluno_codigo, aluno);
            }

            if (row.curso_codigo) {
                const curso = {
                    codigo: row.curso_codigo,
                    nome: row.curso_nome,
                    curso_nota: row.curso_nota,
                    frequencia: row.curso_frequencia,
                    ativo: row.curso_ativo
                };
                alunosMap.get(row.aluno_codigo).cursos.push(curso);
            }
        });

        return Array.from(alunosMap.values());
    } catch (err) {
        throw "Erro ao consultar os alunos: " + err.message;
    }
}

const addAlunoDB = async (body) => {
    const client = await pool.connect();
    try {

        const { nome, data_nascimento, data_cadastro, telefone, cursos } = body;
        
        await client.query('BEGIN');

        const alunoResult = await client.query(`
                                                INSERT INTO alunos (nome, data_nascimento, data_cadastro, telefone) 
                                                VALUES ($1, $2, $3, $4)
                                                RETURNING codigo, nome, to_char(data_nascimento, 'YYYY-MM-DD') as data_nascimento, to_char(data_cadastro, 'YYYY-MM-DD') as data_cadastro, telefone
                                                `, [nome, data_nascimento, data_cadastro, telefone]);

        const aluno = alunoResult.rows[0];

        if (cursos && cursos.length > 0) {
            for (let curso of cursos) {
                await client.query(`
                                    INSERT INTO alunos_cursos (aluno_codigo, curso_codigo, curso_nota, frequencia, ativo) 
                                    VALUES ($1, $2, $3, $4, $5)
                                    `, [aluno.codigo, curso.curso_codigo, curso.curso_nota, curso.frequencia, curso.ativo]);
            }
        }

        await client.query('COMMIT');

        return new Aluno(aluno.codigo, aluno.nome, aluno.data_nascimento, aluno.data_cadastro, aluno.telefone, cursos || []);

    } catch (err) {
        await client.query('ROLLBACK');
        throw "Erro ao inserir o aluno: " + err;
    } finally {
        client.release();
    }
}

const updateAlunoDB = async (body) => {
    const client = await pool.connect();
    try {
        const { codigo, nome, data_nascimento, data_cadastro, telefone, cursos } = body;

        await client.query('BEGIN');

        await client.query(`
                            UPDATE alunos SET nome = $2, data_nascimento = $3, data_cadastro = $4, telefone = $5
                            WHERE codigo = $1 
                            `, [codigo, nome, data_nascimento, data_cadastro, telefone]);


        const existingCoursesResult = await client.query(`SELECT curso_codigo FROM alunos_cursos WHERE aluno_codigo = $1`, [codigo]);
        const existingCourses = existingCoursesResult.rows.map(row => row.curso_codigo);

        const newCourses = cursos.map(curso => curso.curso_codigo);
        
        const coursesToRemove = existingCourses.filter(curso => !newCourses.includes(curso));
        
        if (coursesToRemove.length > 0) {
            await client.query(`DELETE FROM alunos_cursos WHERE aluno_codigo = $1 AND curso_codigo = ANY($2::int[])`, [codigo, coursesToRemove]);
        }

        for (let curso of cursos) {
            await client.query(`
            INSERT INTO alunos_cursos (aluno_codigo, curso_codigo, curso_nota, frequencia, ativo) 
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (aluno_codigo, curso_codigo) 
            DO UPDATE SET curso_nota = EXCLUDED.curso_nota, frequencia = EXCLUDED.frequencia, ativo = EXCLUDED.ativo
        `, [codigo, curso.curso_codigo, curso.curso_nota, curso.frequencia, curso.ativo]);
        }

        await client.query('COMMIT');

        return { message: 'Aluno atualizado com sucesso', codigo };

    } catch (err) {
        await client.query('ROLLBACK');
        throw "Erro ao alterar o aluno: " + err;
    } finally {
        client.release();
    }
}

const deleteAlunoDB = async (codigo) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`DELETE FROM alunos_cursos WHERE aluno_codigo = $1`, [codigo]);

        const results = await client.query(`DELETE FROM alunos WHERE codigo = $1`, [codigo]);

        if (results.rowCount == 0) {
            throw `Nenhum registro encontrado com o código ${codigo} para ser removido`;
        }

        await client.query('COMMIT');
        return `Aluno de código ${codigo} removido com sucesso!`;

    } catch (err) {
        await client.query('ROLLBACK');
        throw "Erro ao remover o aluno: " + err;
    } finally {
        client.release();
    }
}

const getAlunoPorCodigoDB = async (codigo) => {
    try {
        const alunoResult = await pool.query(`
                                                SELECT a.codigo, a.nome, to_char(a.data_nascimento, 'YYYY-MM-DD') as data_nascimento, to_char(a.data_cadastro, 'YYYY-MM-DD') as data_cadastro, a.telefone
                                                FROM alunos a 
                                                WHERE a.codigo = $1
                                             `, [codigo]);

        if (alunoResult.rowCount == 0) {
            throw `Nenhum registro encontrado com o código ${codigo}`;
        }

        const aluno = alunoResult.rows[0];

        const cursosResult = await pool.query(`
                                                SELECT ac.curso_codigo, c.nome as curso_nome, c.carga_horaria, ac.curso_nota, ac.frequencia, ac.ativo
                                                FROM alunos_cursos ac
                                                JOIN cursos c ON ac.curso_codigo = c.codigo
                                                WHERE ac.aluno_codigo = $1
                                                `, [codigo]);

        const cursos = cursosResult.rows.map(curso => ({
            curso_codigo: curso.curso_codigo,
            curso_nome: curso.curso_nome,
            carga_horaria: curso.carga_horaria,
            curso_nota: curso.curso_nota,
            frequencia: curso.frequencia,
            ativo: curso.ativo
        }));

        return new Aluno(aluno.codigo, aluno.nome, aluno.data_nascimento, aluno.data_cadastro, aluno.telefone, cursos);

    } catch (err) {
        throw "Erro ao recuperar o aluno: " + err;
    }
}

module.exports = {
    getAlunosDB, addAlunoDB, updateAlunoDB, deleteAlunoDB, getAlunoPorCodigoDB
}