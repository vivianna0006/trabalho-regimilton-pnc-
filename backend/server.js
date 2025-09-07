// backend/server.js (VERSÃO FINAL E CORRIGIDA)

const express = require('express');
const fs = require('fs');
const fsp = require('fs').promises;
const cors = require('cors');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = 3000;

const DB_FILE = './database.json';
const ESTOQUE_FILE = './estoque.json';
const SALES_FILE = './sales.json';
const TRANSACTIONS_FILE = './cash_transactions.json';

app.use(cors());
app.use(express.json());

// --- Funções de Leitura/Escrita Simplificadas ---
const readDB = async () => JSON.parse(await fsp.readFile(DB_FILE, 'utf-8'));
const writeDB = async (data) => fsp.writeFile(DB_FILE, JSON.stringify(data, null, 2));
const readEstoque = async () => JSON.parse(await fsp.readFile(ESTOQUE_FILE, 'utf-8'));
const writeEstoque = async (data) => fsp.writeFile(ESTOQUE_FILE, JSON.stringify(data, null, 2));
const readSales = async () => JSON.parse(await fsp.readFile(SALES_FILE, 'utf-8'));
const writeSales = async (data) => fsp.writeFile(SALES_FILE, JSON.stringify(data, null, 2));
const readTransactions = async () => JSON.parse(await fsp.readFile(TRANSACTIONS_FILE, 'utf-8'));
const writeTransactions = async (data) => fsp.writeFile(TRANSACTIONS_FILE, JSON.stringify(data, null, 2));

// --- ROTAS DA API ---

// ROTA DE STATUS - LÓGICA SIMPLIFICADA E SEGURA
app.get('/api/status', async (req, res) => {
    try {
        if (fs.existsSync(DB_FILE)) {
            const db = await readDB();
            res.json({ usersExist: db.users.length > 0 });
        } else {
            // Se o ficheiro não existe, a resposta é simples: não há utilizadores.
            res.json({ usersExist: false });
        }
    } catch (error) {
        console.error("Erro em /api/status:", error);
        res.status(500).json({ message: "Erro no servidor ao verificar estado." });
    }
});

// ROTA DE REGISTO - Garante a criação do ficheiro se for o primeiro registo
app.post('/api/register',
    [
        body('username', 'O nome de utilizador é obrigatório.').not().isEmpty().trim().escape(),
        body('password', 'A palavra-passe precisa ter no mínimo 6 caracteres.').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array()[0].msg });
        }
        try {
            const { username, password, cargo } = req.body;
            let db = { users: [] };
            
            // Tenta ler o ficheiro existente; se não existir, continua com a estrutura vazia.
            if (fs.existsSync(DB_FILE)) {
                db = await readDB();
            }

            if (db.users.find(user => user.username === username)) {
                return res.status(400).json({ success: false, message: 'Este nome de utilizador já existe.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            db.users.push({ username, password: hashedPassword, cargo });
            await writeDB(db);

            res.status(201).json({ success: true, message: 'Utilizador registado com sucesso!' });
        } catch (error) {
            console.error("Erro no registo:", error);
            res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor.' });
        }
    }
);

// ROTA DE LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = await readDB();
        const user = db.users.find(u => u.username === username);
        if (user && await bcrypt.compare(password, user.password)) {
            res.json({ success: true, message: 'Login bem-sucedido!', cargo: user.cargo, username: user.username });
        } else {
            res.status(401).json({ success: false, message: 'Utilizador ou palavra-passe incorretos.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
});


// ... (O resto das rotas de produtos, vendas e sangria continuam aqui) ...
app.get('/produtos', async (req, res) => {
    try {
        const { categoria, subcategoria, termo } = req.query;
        let estoque = await readEstoque();
        let produtosFiltrados = [];

        if (termo) {
            const termoBusca = termo.toLowerCase();
            for (const cat of estoque) {
                for (const subcat in cat.subcategorias) {
                    produtosFiltrados.push(...cat.subcategorias[subcat].filter(p =>
                        p.nome.toLowerCase().includes(termoBusca) ||
                        p.id.toLowerCase().includes(termoBusca) ||
                        cat.nome.toLowerCase().includes(termoBusca) ||
                        subcat.toLowerCase().includes(termoBusca)
                    ));
                }
            }
            // Remove duplicados
            produtosFiltrados = [...new Map(produtosFiltrados.map(item => [item['id'], item])).values()];
        } else if (categoria && subcategoria) {
            const cat = estoque.find(c => c.nome === categoria);
            if (cat && cat.subcategorias[subcategoria]) {
                produtosFiltrados = cat.subcategorias[subcategoria];
            }
        } else if (categoria) {
            const cat = estoque.find(c => c.nome === categoria);
            if (cat) {
                Object.values(cat.subcategorias).forEach(sub => {
                    produtosFiltrados.push(...sub);
                });
            }
        } else {
            // Se nenhum filtro, retorna tudo (ou pode optar por não retornar nada)
            for (const cat of estoque) {
                 Object.values(cat.subcategorias).forEach(sub => {
                    produtosFiltrados.push(...sub);
                });
            }
        }
        res.json(produtosFiltrados);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        res.status(500).send('Erro ao buscar produtos.');
    }
});

app.post('/produtos', async (req, res) => {
    try {
        const novoProduto = req.body;
        let estoque = await readEstoque();

        let categoria = estoque.find(c => c.nome === novoProduto.categoriaNome);
        if (!categoria) {
            // Se a categoria não existe, cria
            categoria = { nome: novoProduto.categoriaNome, subcategorias: {} };
            estoque.push(categoria);
        }

        if (novoProduto.subcategoriaNome && !categoria.subcategorias[novoProduto.subcategoriaNome]) {
            categoria.subcategorias[novoProduto.subcategoriaNome] = [];
        }

        const listaProdutos = novoProduto.subcategoriaNome
            ? categoria.subcategorias[novoProduto.subcategoriaNome]
            : (categoria.subcategorias['Geral'] = categoria.subcategorias['Geral'] || []);

        // Verifica se o ID já existe
        const idExists = estoque.some(cat =>
            Object.values(cat.subcategorias).some(sub =>
                sub.some(p => p.id === novoProduto.id)
            )
        );

        if (idExists) {
            return res.status(400).json({ message: `O ID de produto '${novoProduto.id}' já está em uso.` });
        }

        delete novoProduto.categoriaNome;
        delete novoProduto.subcategoriaNome;
        listaProdutos.push(novoProduto);

        await writeEstoque(estoque);
        res.status(201).json({ message: 'Produto adicionado com sucesso!' });
    } catch (error) {
        console.error("Erro ao adicionar produto:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.put('/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { categoriaNome, subcategoriaNome, tamanho, delta } = req.body;

        let estoque = await readEstoque();
        const categoria = estoque.find(c => c.nome === categoriaNome);

        if (!categoria) return res.status(404).send('Categoria não encontrada.');

        const subcat = categoria.subcategorias[subcategoriaNome];
        if (!subcat) return res.status(404).send('Subcategoria não encontrada.');

        const produto = subcat.find(p => p.id === id);
        if (!produto) return res.status(404).send('Produto não encontrado.');

        if (produto.tamanhos[tamanho] !== undefined) {
            produto.tamanhos[tamanho] = Math.max(0, produto.tamanhos[tamanho] + delta);
        }

        await writeEstoque(estoque);
        res.status(200).json({ message: 'Quantidade atualizada com sucesso!' });

    } catch (error) {
        console.error("Erro ao atualizar quantidade:", error);
        res.status(500).send('Erro interno do servidor.');
    }
});

app.post('/api/sales', async (req, res) => {
    try {
        const sales = await readSales();
        const newSale = {
            id: new Date().getTime(), // ID único para a venda
            ...req.body,
            date: new Date().toISOString()
        };
        sales.push(newSale);
        await writeSales(sales);
        res.status(201).json({ success: true, message: 'Venda registada com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao registar a venda.' });
    }
});

app.post('/api/sangria', async (req, res) => {
    try {
        const transactions = await readTransactions();
        const newTransaction = {
            id: new Date().getTime(),
            ...req.body,
            date: new Date().toISOString()
        };
        transactions.push(newTransaction);
        await writeTransactions(transactions);
        res.status(201).json({ success: true, message: 'Transação registada com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao registar a transação.' });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor a rodar em http://localhost:${PORT}`);
});