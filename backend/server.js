// ===================================================================================
// ==                          SERVIDOR STYLLO FASHION MODAS                        ==
// ===================================================================================
// Descrição: Este arquivo é o coração do backend. Ele utiliza Node.js e Express
// para criar uma API que gerencia usuários, produtos, vendas e transações de caixa.
// ===================================================================================

// --- 1. IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---
// Documentação: Aqui, importamos todas as ferramentas (módulos) necessárias.
const express = require('express'); // A framework principal para construir o servidor.
const bcrypt = require('bcrypt');   // Para criptografar e verificar senhas.
const cors = require('cors');       // Para permitir a comunicação entre o frontend e o backend.
const fs = require('fs');           // Módulo nativo do Node.js para interagir com arquivos.

// --- 2. CONSTANTES E INICIALIZAÇÃO DO APP ---
// Documentação: Definimos constantes para os nomes dos arquivos de "banco de dados"
// e para a porta onde o servidor vai rodar. Isso facilita a manutenção.
const app = express();
const PORT = 3000;

// Caminhos para os arquivos JSON que funcionam como nosso banco de dados.
const USERS_DB_FILE = './database.json';
const PRODUCTS_DB_FILE = './estoque.json'; // Centralizamos o uso apenas no 'estoque.json'.
const SALES_DB_FILE = './sales.json';
const TRANSACTIONS_DB_FILE = './cash_transactions.json';

// --- 3. MIDDLEWARES ---
// Documentação: Middlewares são funções que o Express executa em todas as
// requisições antes de chegarem às nossas rotas.
app.use(cors()); // Habilita o CORS para todas as rotas.
app.use(express.json()); // Permite que o servidor entenda o formato JSON enviado pelo frontend.

// --- 4. FUNÇÕES AUXILIARES (HELPERS) ---
// Documentação: Criamos funções genéricas para ler e escrever nos arquivos JSON
// para evitar repetição de código (Princípio DRY: Don't Repeat Yourself).

/**
 * Lê os dados de um arquivo JSON de forma síncrona.
 * @param {string} filePath - O caminho para o arquivo JSON.
 * @returns {Array} - Um array com os dados do arquivo ou um array vazio se o arquivo não existir.
 */
const readData = (filePath) => {
    try {
        // Tenta ler o arquivo.
        const data = fs.readFileSync(filePath, 'utf8');
        // Converte o texto JSON para um objeto/array JavaScript.
        return JSON.parse(data);
    } catch (error) {
        // Se o erro for 'ENOENT' (File Not Found), significa que o arquivo ainda não existe.
        // Nesse caso, retornamos um array vazio para o sistema não quebrar.
        if (error.code === 'ENOENT') {
            return [];
        }
        // Se for outro tipo de erro, nós o lançamos para ser tratado.
        throw error;
    }
};

/**
 * Escreve dados em um arquivo JSON de forma síncrona.
 * @param {string} filePath - O caminho para o arquivo JSON.
 * @param {object} data - Os dados (objeto/array) a serem salvos.
 */
const writeData = (filePath, data) => {
    // Converte o objeto/array JavaScript para uma string JSON formatada (com 2 espaços de indentação).
    const jsonString = JSON.stringify(data, null, 2);
    // Escreve a string no arquivo.
    fs.writeFileSync(filePath, jsonString, 'utf8');
};


// ===================================================================================
// ==                                 ROTAS DA API                                  ==
// ===================================================================================

// --- 5.1 ROTAS DE AUTENTICAÇÃO E STATUS ---

// Rota para verificar se já existe algum usuário cadastrado (para a tela de setup).
app.get('/api/status', (req, res) => {
    try {
        const users = readData(USERS_DB_FILE);
        res.status(200).json({ usersExist: users.length > 0 });
    } catch (error) {
        console.error("Erro em /api/status:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para registrar o primeiro administrador ou novos funcionários.
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, cargo } = req.body;
        if (!username || !password || !cargo) {
            return res.status(400).json({ message: 'Usuário, senha e cargo são obrigatórios.' });
        }

        const users = readData(USERS_DB_FILE);
        if (users.some(u => u.username === username)) {
            return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { username, password: hashedPassword, cargo };
        users.push(newUser);
        writeData(USERS_DB_FILE, users);

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error("Erro em /api/register:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// Rota de Login.
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = readData(USERS_DB_FILE);
        const user = users.find(u => u.username === username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }

        res.status(200).json({
            success: true,
            message: 'Login bem-sucedido!',
            cargo: user.cargo,
            username: user.username
        });
    } catch (error) {
        console.error("Erro em /api/login:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});


// --- 5.2 ROTAS DE PRODUTOS / ESTOQUE ---

/**
 * Rota GET para buscar produtos.
 * Esta rota é flexível e pode filtrar por categoria, subcategoria ou por um termo de busca.
 * Query Params:
 * - `categoria`: Filtra por nome da categoria.
 * - `subcategoria`: Filtra por nome da subcategoria (usado em conjunto com `categoria`).
 * - `termo`: Busca pelo termo no ID, nome ou descrição do produto.
 */
app.get('/produtos', (req, res) => {
    try {
        const { categoria, subcategoria, termo } = req.query;
        let produtos = readData(PRODUCTS_DB_FILE);

        if (termo) {
            const termoLower = termo.toLowerCase();
            produtos = produtos.filter(p =>
                p.nome.toLowerCase().includes(termoLower) ||
                p.descricao.toLowerCase().includes(termoLower) ||
                p.id.toLowerCase().includes(termoLower)
            );
        } else if (categoria) {
            produtos = produtos.filter(p => p.categoriaNome === categoria);
            if (subcategoria) {
                produtos = produtos.filter(p => p.subcategoriaNome === subcategoria);
            }
        }
        
        res.status(200).json(produtos);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ message: 'Erro ao buscar os produtos.' });
    }
});

// Rota GET para buscar um único produto por ID.
app.get('/produtos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const produtos = readData(PRODUCTS_DB_FILE);
        const produto = produtos.find(p => p.id === id);

        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        
        res.status(200).json(produto);
    } catch (error) {
        console.error('Erro ao buscar um produto por ID:', error);
        res.status(500).json({ message: 'Erro interno ao buscar o produto.' });
    }
});

// Rota para cadastrar um novo produto.
app.post('/produtos', (req, res) => {
    try {
        const novoProduto = req.body;
        // Validação básica dos dados recebidos.
        if (!novoProduto.id || !novoProduto.nome || !novoProduto.categoriaNome) {
            return res.status(400).json({ message: 'Dados do produto incompletos (ID, Nome e Categoria são obrigatórios).' });
        }

        const produtos = readData(PRODUCTS_DB_FILE);
        if (produtos.some(p => p.id === novoProduto.id)) {
            return res.status(409).json({ message: 'Já existe um produto com este ID.' });
        }

        produtos.push(novoProduto);
        writeData(PRODUCTS_DB_FILE, produtos);

        res.status(201).json({ message: 'Produto cadastrado com sucesso!', produto: novoProduto });
    } catch (error) {
        console.error('Erro no cadastro do produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao cadastrar o produto.' });
    }
});

// **ROTA ATUALIZADA:** Agora recebe o objeto de 'tamanhos' completo para atualização.
app.put('/produtos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { tamanhos, ...rest } = req.body;

        let produtos = readData(PRODUCTS_DB_FILE);
        const produtoIndex = produtos.findIndex(p => p.id === id);

        if (produtoIndex === -1) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        
        // Cria um novo objeto de produto, mesclando os dados existentes com as alterações.
        const produtoAtualizado = {
            ...produtos[produtoIndex],
            ...rest
        };

        // Se a propriedade 'tamanhos' existe no corpo da requisição,
        // ela substitui o objeto de tamanhos inteiro no produto.
        if (tamanhos) {
            produtoAtualizado.tamanhos = tamanhos;
        }
        
        // Substitui o produto antigo pelo produto atualizado no array.
        produtos[produtoIndex] = produtoAtualizado;
        
        writeData(PRODUCTS_DB_FILE, produtos);

        res.status(200).json(produtoAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar o produto:', error);
        res.status(500).json({ message: 'Erro interno ao atualizar o produto.' });
    }
});

// Rota para excluir um produto.
// Recebe o ID do produto a ser excluído via parâmetro na URL.
app.delete('/produtos/:id', (req, res) => {
    try {
        const { id } = req.params; // Captura o ID do produto da URL.
        let produtos = readData(PRODUCTS_DB_FILE); // Lê todos os produtos do estoque.

        // Encontra o índice do produto a ser excluído.
        const produtoIndex = produtos.findIndex(p => p.id === id);

        // Se o produto não for encontrado, retorna um erro 404.
        if (produtoIndex === -1) {
            return res.status(404).json({ message: 'Produto não encontrado para exclusão.' });
        }

        // Usa splice para remover o produto do array.
        // O `splice(produtoIndex, 1)` remove 1 elemento a partir do índice encontrado.
        produtos.splice(produtoIndex, 1);

        // Salva o array de produtos atualizado (sem o produto excluído) no arquivo.
        writeData(PRODUCTS_DB_FILE, produtos);

        // Retorna uma resposta de sucesso.
        res.status(200).json({ message: 'Produto excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ message: 'Erro interno ao tentar excluir o produto.' });
    }
});


// --- 5.3 ROTAS DE VENDAS E TRANSAÇÕES DE CAIXA ---

// Rota para registrar uma nova venda.
app.post('/api/sales', (req, res) => {
    try {
        const { items, seller } = req.body;
        if (!items || !seller || items.length === 0) {
            return res.status(400).json({ message: 'Dados da venda incompletos.' });
        }

        const newSale = {
            id: Date.now(),
            date: new Date().toISOString(),
            items: items,
            seller: seller
        };

        const sales = readData(SALES_DB_FILE);
        sales.push(newSale);
        writeData(SALES_DB_FILE, sales);

        res.status(201).json({ message: 'Venda registrada com sucesso!' });
    } catch (error) {
        console.error("Erro ao registrar a venda:", error);
        res.status(500).json({ message: 'Erro interno ao registrar a venda.' });
    }
});

// Rota para registrar uma nova sangria de caixa.
app.post('/api/sangria', (req, res) => {
    try {
        const { amount, user } = req.body;
        if (!amount || !user || amount <= 0) {
            return res.status(400).json({ message: 'O valor da sangria é inválido.' });
        }

        const newTransaction = {
            id: Date.now(),
            type: 'sangria',
            amount: amount,
            user: user,
            date: new Date().toISOString(),
        };

        const transactions = readData(TRANSACTIONS_DB_FILE);
        transactions.push(newTransaction);
        writeData(TRANSACTIONS_DB_FILE, transactions);

        res.status(201).json({ message: 'Sangria registrada com sucesso!' });
    } catch (error) {
        console.error("Erro ao registrar a sangria:", error);
        res.status(500).json({ message: 'Erro interno ao registrar a sangria.' });
    }
});


// ===================================================================================
// ==                          INICIALIZAÇÃO DO SERVIDOR                            ==
// ===================================================================================

app.listen(PORT, () => {
    console.log(`--- Servidor Styllo Fashion Modas ---`);
    console.log(`--> Status: Online`);
    console.log(`--> Ouvindo em http://localhost:${PORT}`);
    console.log(`-----------------------------------`);
});