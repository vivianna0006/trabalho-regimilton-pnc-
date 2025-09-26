// ===================================================================================
// ==             SERVIDOR STYLLO FASHION MODAS            ==
// ===================================================================================
// Descrio: Este arquivo  o corao do backend. Ele utiliza Node.js e Express
// para criar uma API que gerencia usurios, produtos, vendas e transaes de caixa.
// ===================================================================================

// --- 1. IMPORTAES E CONFIGURAO INICIAL ---
// Documentao: Aqui, importamos todas as ferramentas (mdulos) necessrias.
const express = require('express'); // A framework principal para construir o servidor.
const bcrypt = require('bcrypt');  // Para criptografar e verificar senhas.
const cors = require('cors');    // Para permitir a comunicao entre o frontend e o backend.
const fs = require('fs'); // Mdulo nativo do Node.js para interagir com arquivos.
const path = require('path');       // Facilita a criao de caminhos de arquivo independentes do sistema operacional.
const crypto = require('crypto');    // Gera tokens simples para sesses em memria.
const activeSessions = new Map();

const app = express();
const PORT = 3000;

const USERS_DB_PATH = path.join(__dirname, 'database.json');
const PRODUCTS_DB_FILE = path.join(__dirname, 'estoque.json'); // Centralizamos o uso apenas no 'estoque.json'.
const SALES_DB_FILE = path.join(__dirname, 'sales.json');
const TRANSACTIONS_DB_FILE = path.join(__dirname, 'cash_transactions.json');
app.use(express.json());
app.use(cors());


/**
* L os dados de um arquivo JSON de forma sncrona.
* @param {string} filePath - O caminho para o arquivo JSON.
* @returns {Array} - Um array com os dados do arquivo ou um array vazio se o arquivo no existir.
*/
const readData = (filePath) => {
  try {
    // Tenta ler o arquivo.
    const data = fs.readFileSync(filePath, 'utf8');
    // Converte o texto JSON para um objeto/array JavaScript.
    return JSON.parse(data);
  } catch (error) {
    // Se o erro for 'ENOENT' (File Not Found), significa que o arquivo ainda no existe.
    // Nesse caso, retornamos um array vazio para o sistema no quebrar.
    if (error.code === 'ENOENT') {
      return [];
    }
    // Se for outro tipo de erro, ns o lanamos para ser tratado.
    throw error;
  }
};

/**
* Escreve dados em um arquivo JSON de forma sncrona.
* @param {string} filePath - O caminho para o arquivo JSON.
* @param {object} data - Os dados (objeto/array) a serem salvos.
*/
const writeData = (filePath, data) => {
  // Converte o objeto/array JavaScript para uma string JSON formatada (com 2 espaos de indentao).
  const jsonString = JSON.stringify(data, null, 2);
  // Escreve a string no arquivo.
  fs.writeFileSync(filePath, jsonString, 'utf8');
};


// ===================================================================================
// ==                 ROTAS DA API                 ==
// ===================================================================================

// --- 5.1 ROTAS DE AUTENTICAO E STATUS ---

// Rota para verificar se j existe algum usurio cadastrado (para a tela de setup).
app.get('/api/status', (req, res) => {
  try {
     const users = readData(USERS_DB_PATH);
     const hasManager = users.some(user => {
        if (!user || typeof user.cargo !== 'string') {
            return false;
        }
        const normalizedCargo = user.cargo.trim().toLowerCase();
        return normalizedCargo === 'gerente' || normalizedCargo === 'administrador';
    });
        res.status(200).json({ usersExist: hasManager });
  } catch (error) {
    console.error("Erro em /api/status:", error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para registrar o primeiro administrador ou novos funcionrios.
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, cargo } = req.body;
        if (!username || !password || !cargo) {
            return res.status(400).json({ message: 'Usuario, senha e cargo sao obrigatorios.' });
        }

        const users = readData(USERS_DB_PATH);
        if (users.length > 0) {
            const authToken = req.header('x-auth-token');
            const session = authToken ? activeSessions.get(authToken) : null;
            const isAdminSession = session && typeof session.cargo === 'string' && session.cargo.toLowerCase() === 'administrador';

            if (!isAdminSession) {
                return res.status(403).json({ message: 'Apenas administradores autenticados podem cadastrar usuarios.' });
            }
        }

        if (users.some(u => u.username === username)) {
            return res.status(409).json({ message: 'Este nome de usuário ja esta em uso.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { username, password: hashedPassword, cargo };
        users.push(newUser);
        writeData(USERS_DB_PATH, users);

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
        const users = readData(USERS_DB_PATH);
        const user = users.find(u => u.username === username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Usuário ou senha invalidos.' });
        }

        for (const [tokenValue, session] of activeSessions.entries()) {
            if (session.username === user.username) {
                activeSessions.delete(tokenValue);
            }
        }

        const token = crypto.randomUUID();
        activeSessions.set(token, {
            username: user.username,
            cargo: user.cargo,
            issuedAt: Date.now()
        });

        res.status(200).json({
            success: true,
            message: 'Login bem-sucedido!',
            cargo: user.cargo,
            username: user.username,
            token
        });
    } catch (error) {
        console.error("Erro em /api/login:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});// --- 5.2 ROTAS DE PRODUTOS / ESTOQUE ---

/**
* Rota GET para buscar produtos.
* Esta rota  flexvel e pode filtrar por categoria, subcategoria ou por um termo de busca.
* Query Params:
* - `categoria`: Filtra por nome da categoria.
* - `subcategoria`: Filtra por nome da subcategoria (usado em conjunto com `categoria`).
* - `termo`: Busca pelo termo no ID, nome ou descrio do produto.
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

// Rota GET para buscar um nico produto por ID.
app.get('/produtos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const produtos = readData(PRODUCTS_DB_FILE);
    const produto = produtos.find(p => p.id === id);

    if (!produto) {
      return res.status(404).json({ message: 'Produto no encontrado.' });
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
    // Validao bsica dos dados recebidos.
    if (!novoProduto.id || !novoProduto.nome || !novoProduto.categoriaNome) {
      return res.status(400).json({ message: 'Dados do produto incompletos (ID, Nome e Categoria so obrigatrios).' });
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

// **ROTA ATUALIZADA:** Agora recebe o objeto de 'tamanhos' completo para atualizao.
app.put('/produtos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { tamanhos, ...rest } = req.body;

    let produtos = readData(PRODUCTS_DB_FILE);
    const produtoIndex = produtos.findIndex(p => p.id === id);

    if (produtoIndex === -1) {
      return res.status(404).json({ message: 'Produto no encontrado.' });
    }
        
        // Cria um novo objeto de produto, mesclando os dados existentes com as alteraes.
        const produtoAtualizado = {
            ...produtos[produtoIndex],
            ...rest
        };

    // Se a propriedade 'tamanhos' existe no corpo da requisio,
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
// Recebe o ID do produto a ser excludo via parmetro na URL.
app.delete('/produtos/:id', (req, res) => {
  try {
    const { id } = req.params; // Captura o ID do produto da URL.
    let produtos = readData(PRODUCTS_DB_FILE); // L todos os produtos do estoque.

    // Encontra o ndice do produto a ser excludo.
    const produtoIndex = produtos.findIndex(p => p.id === id);

    // Se o produto no for encontrado, retorna um erro 404.
    if (produtoIndex === -1) {
      return res.status(404).json({ message: 'Produto no encontrado para excluso.' });
    }

    // Usa splice para remover o produto do array.
    // O `splice(produtoIndex, 1)` remove 1 elemento a partir do ndice encontrado.
    produtos.splice(produtoIndex, 1);

    // Salva o array de produtos atualizado (sem o produto excludo) no arquivo.
    writeData(PRODUCTS_DB_FILE, produtos);

    // Retorna uma resposta de sucesso.
    res.status(200).json({ message: 'Produto excludo com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ message: 'Erro interno ao tentar excluir o produto.' });
  }
});


// --- 5.3 ROTAS DE VENDAS E TRANSAES DE CAIXA ---

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
      return res.status(400).json({ message: 'O valor da sangria  invlido.' });
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
// ==             INICIALIZAO DO SERVIDOR              ==
// ===================================================================================

app.listen(PORT, () => {
  console.log(`--- Servidor Styllo Fashion Modas ---`);
  console.log(`--> Status: Online`);
  console.log(`--> Ouvindo em http://localhost:${PORT}`);
  console.log(`-----------------------------------`);
});
















