console.log("--- NOVA VERSÃO DO SERVIDOR CARREGADA ---");
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs'); 


const app = express();
const PORT = 3000; 

app.use(cors());

app.use(express.json());


const DB_FILE = './database.json';


const readUsers = () => {
  try {

    const data = fs.readFileSync(DB_FILE);

    return JSON.parse(data);
  } catch (error) {

    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};


const writeUsers = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
app.get('/api/status', (req, res) => {
  try {
    const users = readUsers();
    if (users.length > 0) {

      res.status(200).json({ usersExist: true });
    } else {

      res.status(200).json({ usersExist: false });
    }
  } catch (error) {

    res.status(200).json({ usersExist: false });
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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = { username, password: hashedPassword, cargo: cargo };
    

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
    const safeUsers = users.map(user => {
      return { username: user.username, cargo: user.cargo };
    });
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


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
  // Rota para LER a lista de produtos
app.get('/api/products', (req, res) => {
  try {
    // Lê o conteúdo do arquivo de produtos.
    const productsData = fs.readFileSync('./products.json');
    // Converte o conteúdo para um objeto JavaScript.
    const products = JSON.parse(productsData);
    // Responde com status 200 (OK) e a lista de produtos.
    res.status(200).json(products);
  } catch (error) {
    // Se o arquivo não for encontrado ou houver outro erro...
    console.error("Erro ao ler o arquivo de produtos:", error);
    // ...responde com um erro 500.
    res.status(500).json({ message: 'Erro ao buscar os produtos.' });
  }
});
});