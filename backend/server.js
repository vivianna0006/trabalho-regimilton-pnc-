console.log("--- SERVIDOR INICIADO: VERSÃO COMPLETA E CONSOLIDADA ---");

// Importação dos módulos necessários
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs');
// Middleware: habilita o CORS e permite que o Express leia JSON
app.use(cors());
app.use(express.json());

// --- CONSTANTES E FUNÇÕES AUXILIARES ---
const USERS_DB_FILE = './database.json';
const PRODUCTS_DB_FILE = './estoque.json';
const SALES_DB_FILE = './sales.json';
const TRANSACTIONS_DB_FILE = './cash_transactions.json';

// Importa as bibliotecas (ferramentas) necessárias para o servidor funcionar.
const express = require('express'); // Framework principal para criar o servidor e as rotas.
const bcrypt = require('bcrypt');   // Ferramenta para criptografar senhas de forma segura.
const cors = require('cors');       // Permite que o nosso front-end (noutro endereço) se comunique com este servidor.
const fs = require('fs');           // Módulo do Node.js para interagir com o sistema de ficheiros (ler e escrever ficheiros).




// --- INICIALIZAÇÃO DO APP ---
const app = express(); // Cria a aplicação principal do servidor. A variável 'app' representa o nosso servidor.
const PORT = 3000;     // Define que o nosso servidor irá "ouvir" na porta 3000 do computador.




// --- MIDDLEWARES ---
// Middlewares são "plugins" que o Express usa em todas as requisições.
app.use(cors()); // Ativa o CORS, permitindo a comunicação entre o front-end e o back-end.
app.use(express.json()); // Faz com que o servidor consiga entender os dados em formato JSON que vêm do front-end.




// --- CONSTANTES E FUNÇÕES AUXILIARES ---
const DB_FILE = './database.json'; // Define o nome do nosso "banco de dados" de utilizadores.




// Função para ler os utilizadores do ficheiro de "banco de dados".
const readUsers = () => {
  try { // Tenta executar o código que pode dar erro.
    const data = fs.readFileSync(DB_FILE); // Lê o conteúdo do ficheiro de forma síncrona (o programa para e espera).
    return JSON.parse(data); // Converte o texto do ficheiro (JSON) para um objeto/array JavaScript.
  } catch (error) { // Se ocorrer um erro na "tentativa"...
    // Se o erro for 'ENOENT' (ficheiro não encontrado), significa que é o primeiro acesso.
    if (error.code === 'ENOENT') { return []; } // Em vez de quebrar, retorna uma lista vazia.
    throw error; // Se for outro tipo de erro, lança-o para ser tratado mais tarde.
  }
// Função genérica para ler arquivos JSON
const readData = (filePath) => {
    try {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
};

// Função genérica para escrever em arquivos JSON
const writeData = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// --- ROTAS DA API DE AUTENTICAÇÃO E USUÁRIOS ---
// ------------------------------------------------

// Rota para verificar o status do sistema (se já foi configurado).
app.get('/api/status', (req, res) => {
    try {
        const users = readData(USERS_DB_FILE);
        res.status(200).json({ usersExist: users.length > 0 });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para registrar um novo usuário
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, cargo } = req.body;
        if (!username || !password || !cargo) {
            return res.status(400).json({ message: 'Usuário, senha e cargo são obrigatórios.' });
        }
        const users = readData(USERS_DB_FILE);
        const userExists = users.some(u => u.username === username);
        if (userExists) {
            return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { username, password: hashedPassword, cargo };
        users.push(newUser);
        writeData(USERS_DB_FILE, users);
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error("ERRO DETALHADO NO /api/register:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// Rota de Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = readData(USERS_DB_FILE);
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(400).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            res.status(200).json({ success: true, message: 'Login bem-sucedido!', cargo: user.cargo, username: user.username });
        } else {
            res.status(400).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
    }
});

app.get('/api/users', (req, res) => {
    try {
        const users = readData(USERS_DB_FILE);
        const safeUsers = users.map(user => ({ username: user.username, cargo: user.cargo }));
        res.status(200).json(safeUsers);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao ler a base de dados.' });
    }
});

app.delete('/api/users/:username', (req, res) => {
    try {
        const { username } = req.params;
        let users = readData(USERS_DB_FILE);
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
        writeData(USERS_DB_FILE, updatedUsers);
        res.status(200).json({ message: `Usuário "${username}" excluído com sucesso.` });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
    }
});



// ### ROTAS DA API DE ESTOQUE E PRODUTOS


app.post('/produtos', (req, res) => {
    try {
        const novoProduto = req.body;
        if (!novoProduto.id || !novoProduto.nome || !novoProduto.categoriaNome) {
            return res.status(400).json({ message: 'Dados do produto incompletos.' });
        }
        const produtos = readData(PRODUCTS_DB_FILE);
        const produtoExistente = produtos.find(p => p.id === novoProduto.id);
        if (produtoExistente) {
            return res.status(409).json({ message: 'Um produto com este ID já existe.' });
        }
        produtos.push(novoProduto);
        writeData(PRODUCTS_DB_FILE, produtos);
        res.status(201).json({ message: 'Produto cadastrado com sucesso!', produto: novoProduto });
    } catch (error) {
        console.error('Erro no cadastro do produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao cadastrar o produto.' });
    }
});

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

app.put('/produtos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { tamanho, delta } = req.body;
        let produtos = readData(PRODUCTS_DB_FILE);
        const produtoIndex = produtos.findIndex(p => p.id === id);
        if (produtoIndex === -1) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        const produto = produtos[produtoIndex];
        const quantidadeAtual = produto.tamanhos[tamanho] || 0;
        const novaQuantidade = quantidadeAtual + delta;
        if (novaQuantidade < 0) {
            return res.status(400).json({ message: 'Não é possível remover mais itens do que o disponível em estoque.' });
        }
        produto.tamanhos[tamanho] = novaQuantidade;
        writeData(PRODUCTS_DB_FILE, produtos);
        res.status(200).json({ message: 'Quantidade do produto atualizada com sucesso.', produto });
    } catch (error) {
        console.error('Erro ao atualizar a quantidade:', error);
        res.status(500).json({ message: 'Erro interno ao atualizar a quantidade do produto.' });
    }
});
// ### ROTAS DA API DE VENDAS E CAIXA
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

// ### INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
})}
