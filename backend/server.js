// Escreve uma mensagem na consola do servidor para confirmar que a versão mais recente do ficheiro foi carregada.
console.log("--- VERSÃO DEFINITIVA E COMPLETA DO SERVIDOR CARREGADA ---");




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
};




// Função para escrever os utilizadores no ficheiro de "banco de dados".
const writeUsers = (data) => {
  // Converte o objeto/array JavaScript de volta para texto JSON formatado e escreve-o no ficheiro.
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}




// --- ROTAS DA API ---
// Rotas são os "endereços" que o nosso front-end pode chamar para pedir ou enviar informações.




// Rota para verificar o status do sistema (se já foi configurado).
app.get('/api/status', (req, res) => {
  try {
    const users = readUsers(); // Lê a lista de utilizadores.
    // Responde com sucesso (200) e um JSON a indicar se a lista de utilizadores tem mais de 0 itens.
    res.status(200).json({ usersExist: users.length > 0 });
  } catch (error) {
    // Se houver um erro a ler, assume que não existem utilizadores.
    res.status(200).json({ usersExist: false });
  }
});




// Rota para registar um novo utilizador.
app.post('/api/register', async (req, res) => { // 'async' permite o uso de 'await' para operações demoradas.
  try {
    const { username, password, cargo } = req.body; // Extrai os dados enviados pelo front-end.
    if (!username || !password || !cargo) { // Verifica se todos os campos necessários foram enviados.
      return res.status(400).json({ message: 'Dados incompletos.' }); // Se não, responde com um erro de "Requisição Inválida".
    }
    const users = readUsers(); // Lê a lista de utilizadores existentes.
    if (users.some(u => u.username === username)) { // Verifica se o nome de utilizador já existe.
      return res.status(409).json({ message: 'Este nome de utilizador já está em uso.' }); // Se sim, responde com um erro de "Conflito".
    }
    const hashedPassword = await bcrypt.hash(password, 10); // Criptografa a senha do novo utilizador. 'await' espera a criptografia terminar.
    const newUser = { username, password: hashedPassword, cargo: cargo }; // Cria o novo objeto de utilizador com a senha criptografada.
    users.push(newUser); // Adiciona o novo utilizador à lista.
    writeUsers(users); // Escreve a lista atualizada de volta no ficheiro.
    res.status(201).json({ message: 'Utilizador registado com sucesso!' }); // Responde com sucesso (201 - Criado).
  } catch (error) {
    console.error("ERRO NO REGISTO:", error); // Imprime o erro detalhado na consola do servidor para depuração.
    res.status(500).json({ message: 'Erro interno no servidor.' }); // Responde com um erro genérico de "Erro Interno do Servidor".
  }
});




// Rota de Login (a devolver o username).
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body; // Extrai os dados de login.
    const users = readUsers(); // Lê a lista de utilizadores.
    const user = users.find(u => u.username === username); // Procura pelo utilizador na lista.
    if (!user) { // Se o utilizador não for encontrado...
      return res.status(400).json({ success: false, message: 'Utilizador ou senha inválidos.' }); // ...responde com um erro.
    }
    const isMatch = await bcrypt.compare(password, user.password); // Compara a senha enviada com a senha criptografada guardada.
    if (isMatch) { // Se as senhas corresponderem...
      // ...responde com sucesso e envia de volta o cargo e o nome do utilizador.
      res.status(200).json({ success: true, message: 'Login bem-sucedido!', cargo: user.cargo, username: user.username });
    } else { // Se as senhas não corresponderem...
      res.status(400).json({ success: false, message: 'Utilizador ou senha inválidos.' }); // ...responde com um erro.
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.' }); // Responde a erros inesperados.
  }
});




// Rota para ler a lista de produtos.
app.get('/api/products', (req, res) => {
    try {
        const productsData = fs.readFileSync('./products.json'); // Lê o ficheiro do catálogo de produtos.
        const products = JSON.parse(productsData); // Converte o texto para um objeto/array JavaScript.
        res.status(200).json(products); // Responde com sucesso e a lista de produtos.
    } catch (error) {
        console.error("Erro ao ler o ficheiro de produtos:", error); // Imprime o erro detalhado.
        res.status(500).json({ message: 'Erro ao buscar os produtos.' }); // Responde com um erro.
    }
});




// Rota para registar uma nova venda.
app.post('/api/sales', (req, res) => {
  try {
    const { items, seller } = req.body; // Extrai os itens da venda e o nome do vendedor.
    if (!items || !seller || items.length === 0) { // Valida se os dados da venda estão completos.
      return res.status(400).json({ message: 'Dados da venda incompletos.' }); // Se não, responde com um erro.
    }
    const newSale = { // Cria um novo objeto de venda com um ID único, data, itens e vendedor.
      id: Date.now(), // Usa o timestamp atual como um ID simples e único.
      date: new Date().toISOString(), // Guarda a data e hora atuais no formato padrão ISO.
      items: items,
      seller: seller
    };
    let sales = []; // Prepara uma lista para guardar todas as vendas.
    try {
      const salesData = fs.readFileSync('./sales.json'); // Tenta ler o ficheiro de vendas existente.
      sales = JSON.parse(salesData); // Se existir, carrega as vendas antigas.
    } catch (error) { /* Ignora se o ficheiro não existir, mantendo a lista vazia. */ }
    sales.push(newSale); // Adiciona a nova venda à lista.
    fs.writeFileSync('./sales.json', JSON.stringify(sales, null, 2)); // Escreve a lista atualizada no ficheiro.
    res.status(201).json({ message: 'Venda registada com sucesso!' }); // Responde com sucesso.
  } catch (error) {
    console.error("Erro ao registar a venda:", error); // Imprime o erro detalhado.
    res.status(500).json({ message: 'Erro interno ao registar a venda.' }); // Responde com um erro.
  }
});




// Rota para registar uma nova sangria de caixa.
app.post('/api/sangria', (req, res) => {
  try {
    const { amount, user } = req.body; // Extrai o valor e o utilizador que fez a sangria.
    if (!amount || !user || amount <= 0) { // Valida se os dados são válidos.
      return res.status(400).json({ message: 'O valor da sangria é inválido.' }); // Se não, responde com um erro.
    }
    const newTransaction = { // Cria um novo objeto de transação.
      id: Date.now(),
      type: 'sangria',
      amount: amount,
      user: user,
      date: new Date().toISOString(),
    };
    let transactions = []; // Prepara uma lista para as transações de caixa.
    try {
      const transactionsData = fs.readFileSync('./cash_transactions.json'); // Tenta ler o ficheiro existente.
      transactions = JSON.parse(transactionsData); // Carrega as transações antigas.
    } catch (error) { /* Ignora se o ficheiro não existir. */ }
    transactions.push(newTransaction); // Adiciona a nova transação.
    fs.writeFileSync('./cash_transactions.json', JSON.stringify(transactions, null, 2)); // Escreve a lista atualizada no ficheiro.
    res.status(201).json({ message: 'Sangria registada com sucesso!' }); // Responde com sucesso.
  } catch (error) {
    console.error("Erro ao registar a sangria:", error); // Imprime o erro detalhado.
    res.status(500).json({ message: 'Erro interno ao registar a sangria.' }); // Responde com um erro.
  }
});




// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => { // "Liga" o servidor e fá-lo começar a ouvir na porta 3000.
  console.log(`Servidor rodando na porta http://localhost:${PORT}`); // Imprime uma mensagem de confirmação quando o servidor liga com sucesso.
});