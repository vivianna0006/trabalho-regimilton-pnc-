console.log("--- VERSÃO DEFINITIVA E COMPLETA DO SERVIDOR CARREGADA ---");

const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs'); 

// --- INICIALIZAÇÃO DO APP ---
const app = express();
const PORT = 3000; 

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- CONSTANTES E FUNÇÕES AUXILIARES ---
const DB_FILE = './database.json';

// Função para ler os utilizadores do ficheiro de "banco de dados".
const readUsers = () => {
  try {
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
  } catch (error) {
    // Se o ficheiro não for encontrado, retorna uma lista vazia.
    if (error.code === 'ENOENT') { return []; }
    throw error;
  }
};

// Função para escrever os utilizadores no ficheiro de "banco de dados".
const writeUsers = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- ROTAS DA API ---

// Rota para verificar o status do sistema (se já foi configurado).
app.get('/api/status', (req, res) => {
  try {
    const users = readUsers();
    res.status(200).json({ usersExist: users.length > 0 });
  } catch (error) {
    res.status(200).json({ usersExist: false });
  }
});

// Rota para registar um novo utilizador.
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, cargo } = req.body;
    if (!username || !password || !cargo) {
      return res.status(400).json({ message: 'Dados incompletos.' });
    }
    const users = readUsers();
    if (users.some(u => u.username === username)) {
      return res.status(409).json({ message: 'Este nome de utilizador já está em uso.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, password: hashedPassword, cargo: cargo };
    users.push(newUser);
    writeUsers(users);
    res.status(201).json({ message: 'Utilizador registado com sucesso!' });
  } catch (error) {
    console.error("ERRO NO REGISTO:", error); 
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// Rota de Login (a devolver o username).
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Utilizador ou senha inválidos.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      res.status(200).json({ success: true, message: 'Login bem-sucedido!', cargo: user.cargo, username: user.username });
    } else {
      res.status(400).json({ success: false, message: 'Utilizador ou senha inválidos.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});

// Rota para ler a lista de produtos.
app.get('/api/products', (req, res) => {
    try {
        const productsData = fs.readFileSync('./products.json');
        const products = JSON.parse(productsData);
        res.status(200).json(products);
    } catch (error) {
        console.error("Erro ao ler o ficheiro de produtos:", error);
        res.status(500).json({ message: 'Erro ao buscar os produtos.' });
    }
});

// Rota para registar uma nova venda.
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
    let sales = [];
    try {
      const salesData = fs.readFileSync('./sales.json');
      sales = JSON.parse(salesData);
    } catch (error) { /* Ignora se o ficheiro não existir */ }
    sales.push(newSale);
    fs.writeFileSync('./sales.json', JSON.stringify(sales, null, 2));
    res.status(201).json({ message: 'Venda registada com sucesso!' });
  } catch (error) {
    console.error("Erro ao registar a venda:", error);
    res.status(500).json({ message: 'Erro interno ao registar a venda.' });
  }
});

// Rota para registar uma nova sangria de caixa.
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
    let transactions = [];
    try {
      const transactionsData = fs.readFileSync('./cash_transactions.json');
      transactions = JSON.parse(transactionsData);
    } catch (error) { /* Ignora se o ficheiro não existir */ }
    transactions.push(newTransaction);
    fs.writeFileSync('./cash_transactions.json', JSON.stringify(transactions, null, 2));
    res.status(201).json({ message: 'Sangria registada com sucesso!' });
  } catch (error) {
    console.error("Erro ao registar a sangria:", error);
    res.status(500).json({ message: 'Erro interno ao registar a sangria.' });
  }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});
