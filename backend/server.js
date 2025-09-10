console.log("--- NOVA VERSÃO DO SERVIDOR CARREGADA ---");

// Importação dos módulos necessários
const express = require('express');
const bcrypt = require('bcrypt'); // Usado para criptografar senhas
const cors = require('cors');     // Permite requisições de outras origens
const fs = require('fs');         // Usado para ler e escrever arquivos

const app = express();
const PORT = 3000;

// Middleware: habilita o CORS para permitir requisições do front-end
app.use(cors());

// Middleware: habilita o Express a ler o corpo das requisições em formato JSON
app.use(express.json());

// Constantes com os nomes dos arquivos do banco de dados
const USERS_DB_FILE = './database.json';
const PRODUCTS_DB_FILE = './estoque.json'; // Arquivo para o estoque

// --- FUNÇÕES PARA GERENCIAR USUÁRIOS (Lógica que você já tinha) ---
// ------------------------------------------------------------------

const readUsers = () => {
    try {
        const data = fs.readFileSync(USERS_DB_FILE);
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') { // Se o arquivo não existir, retorna array vazio
            return [];
        }
        throw error;
    }
};

const writeUsers = (data) => {
    fs.writeFileSync(USERS_DB_FILE, JSON.stringify(data, null, 2));
};

// --- FUNÇÕES PARA GERENCIAR PRODUTOS (ADIÇÃO) ---
// ------------------------------------------------

/**
 * Lê o arquivo de estoque e retorna os produtos. Se o arquivo não existir, cria um vazio.
 */
const readProducts = () => {
    try {
        const data = fs.readFileSync(PRODUCTS_DB_FILE);
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            writeProducts([]); // Cria um arquivo vazio se ele não for encontrado
            return [];
        }
        throw error;
    }
};

/**
 * Salva a lista de produtos no arquivo de estoque.
 * @param {Array} data - Lista de produtos a serem salvas.
 */
const writeProducts = (data) => {
    fs.writeFileSync(PRODUCTS_DB_FILE, JSON.stringify(data, null, 2));
};

// --- ROTAS DE AUTENTICAÇÃO E USUÁRIOS (Lógica que você já tinha) ---
// -----------------------------------------------------------------

app.get('/api/status', (req, res) => {
    try {
        const users = readUsers();
        res.status(200).json({ usersExist: users.length > 0 });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, password, cargo } = req.body;
        if (!username || !password || !cargo) {
            return res.status(400).json({ message: 'Usuário, senha e cargo são obrigatórios.' });
        }
        const users = readUsers();
        const userExists = users.some(u => u.username === username);
        if (userExists) {
            return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { username, password: hashedPassword, cargo };
        users.push(newUser);
        writeUsers(users);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error("ERRO DETALHADO NO /api/register:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = readUsers();
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(400).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            res.status(200).json({ success: true, message: 'Login bem-sucedido!', cargo: user.cargo });
        } else {
            res.status(400).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
    }
});

app.get('/api/users', (req, res) => {
    try {
        const users = readUsers();
        const safeUsers = users.map(user => ({ username: user.username, cargo: user.cargo }));
        res.status(200).json(safeUsers);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao ler a base de dados.' });
    }
});

app.delete('/api/users/:username', (req, res) => {
    try {
        const { username } = req.params;
        let users = readUsers();
        const userExists = users.some(u => u.username === username);
        if (!userExists) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        const admins = users.filter(u => u.cargo === 'Administrador');
        const userToDelete = users.find(u => u.username === username);
        if (admins.length === 1 && userToDelete.cargo === 'Administrador') {
            return res.status(400).json({ message: 'Não é possível excluir o único administrador do sistema.' });
        }
        const updatedUsers = users.filter(u => u.username !== username);
        writeUsers(updatedUsers);
        res.status(200).json({ message: `Usuário "${username}" excluído com sucesso.` });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
    }
});

// --- ROTAS PARA GERENCIAR O ESTOQUE (NOVAS ROTAS) ---
// --------------------------------------------------

/**
 * Rota para **CRIAR** (adicionar) um novo produto.
 * O front-end envia os dados via `fetch` com o método `POST`.
 */
app.post('/produtos', (req, res) => {
    try {
        const novoProduto = req.body;

        // Validação básica para garantir que os dados essenciais estão presentes
        if (!novoProduto.id || !novoProduto.nome || !novoProduto.categoriaNome) {
            return res.status(400).json({ message: 'Dados do produto incompletos.' });
        }

        const produtos = readProducts();

        // Checa se o ID do produto já existe para evitar duplicatas
        const produtoExistente = produtos.find(p => p.id === novoProduto.id);
        if (produtoExistente) {
            return res.status(409).json({ message: 'Um produto com este ID já existe.' });
        }

        // Adiciona o novo produto à lista e salva no arquivo
        produtos.push(novoProduto);
        writeProducts(produtos);

        // Resposta de sucesso (status 201 Created)
        res.status(201).json({ message: 'Produto cadastrado com sucesso!', produto: novoProduto });

    } catch (error) {
        console.error('Erro no cadastro do produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao cadastrar o produto.' });
    }
});

/**
 * Rota para **LISTAR** produtos.
 * Permite buscar por categoria/subcategoria ou por um termo de busca geral.
 */
app.get('/produtos', (req, res) => {
    try {
        // Pega os parâmetros da URL, como /produtos?categoria=Blusas&subcategoria=Masculina
        const { categoria, subcategoria, termo } = req.query;
        let produtos = readProducts();
        
        // Se houver um termo de busca, filtra por ele (nome, descrição ou ID)
        if (termo) {
            const termoLower = termo.toLowerCase();
            produtos = produtos.filter(p =>
                p.nome.toLowerCase().includes(termoLower) ||
                p.descricao.toLowerCase().includes(termoLower) ||
                p.id.toLowerCase().includes(termoLower)
            );
        } else if (categoria) {
            // Se houver categoria, filtra por ela e pela subcategoria (se existir)
            produtos = produtos.filter(p => p.categoriaNome === categoria);
            if (subcategoria) {
                produtos = produtos.filter(p => p.subcategoriaNome === subcategoria);
            }
        }

        // Retorna a lista de produtos filtrada
        res.status(200).json(produtos);

    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ message: 'Erro ao buscar os produtos.' });
    }
});

/**
 * Rota para **ATUALIZAR** a quantidade de um produto.
 * Recebe o ID do produto na URL e a alteração no corpo da requisição.
 */
app.put('/produtos/:id', (req, res) => {
    try {
        // Pega o ID da URL, como /produtos/PROD001
        const { id } = req.params;
        // Pega o tamanho e o valor (delta) para alterar do corpo da requisição
        const { tamanho, delta } = req.body;
        
        let produtos = readProducts();

        // Encontra o índice do produto na lista
        const produtoIndex = produtos.findIndex(p => p.id === id);
        if (produtoIndex === -1) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        const produto = produtos[produtoIndex];
        const quantidadeAtual = produto.tamanhos[tamanho] || 0;
        const novaQuantidade = quantidadeAtual + delta;

        // Impede que a quantidade fique negativa
        if (novaQuantidade < 0) {
            return res.status(400).json({ message: 'Não é possível remover mais itens do que o disponível em estoque.' });
        }

        // Atualiza a quantidade e salva a lista de volta no arquivo
        produto.tamanhos[tamanho] = novaQuantidade;
        writeProducts(produtos);

        // Retorna uma resposta de sucesso com o produto atualizado
        res.status(200).json({ message: 'Quantidade do produto atualizada com sucesso.', produto });

    } catch (error) {
        console.error('Erro ao atualizar a quantidade:', error);
        res.status(500).json({ message: 'Erro interno ao atualizar a quantidade do produto.' });
    }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
// ---------------------------------
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});