// Clean Server for Styllo Fashion (UTF-8)
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const activeSessions = new Map();

const USERS_DB_PATH = path.join(__dirname, 'database.json');
const PRODUCTS_DB_FILE = path.join(__dirname, 'estoque.json');
const SALES_DB_FILE = path.join(__dirname, 'sales.json');
const TRANSACTIONS_DB_FILE = path.join(__dirname, 'cash_transactions.json');
// const SUPRIMENTOS_DB_FILE = path.join(__dirname, 'suprimentos.json');
const DEVOLUCOES_DB_FILE = path.join(__dirname, 'devolucoes.json');

app.use(cors());
app.use(express.json());

const readData = (filePath) => {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (err) { if (err.code === 'ENOENT') return []; throw err; }
};
const writeData = (filePath, data) => { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); };

const normalizeText = (v) => typeof v === 'string' ? v.trim() : '';
const lowercaseText = (v) => normalizeText(v).toLowerCase();
const digitsOnly = (v) => normalizeText(v).replace(/[^0-9]/g, '');

const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 6;

// (helpers removidos por solicitação de reversão)

const canonicalCargo = (value) => {
  const n = lowercaseText(value);
  if (!n) return '';
  if (['administrador','gerente'].includes(n)) return 'Administrador';
  if (['funcionario','funcionarios','colaborador','colaboradores'].includes(n)) return 'Funcionario';
  return '';
};

const isValidEmail = (value) => {
  const email = lowercaseText(value);
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (digits) => {
  const d = digitsOnly(digits);
  return d.length === 10 || d.length === 11;
};

// CPF validator (check digits)
const isValidCPF = (value) => {
  const s = digitsOnly(value);
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false;
  const calc = (base) => {
    let sum = 0; let weight = base.length + 1;
    for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (weight - i);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  const d1 = calc(s.slice(0, 9));
  const d2 = calc(s.slice(0, 10));
  return d1 === Number(s[9]) && d2 === Number(s[10]);
};

// STATUS (verifica se já existe admin)
app.get('/api/status', (req, res) => {
  try {
    const users = readData(USERS_DB_PATH);
    const hasManager = users.some(u => canonicalCargo(u.cargo) === 'Administrador');
    res.status(200).json({ usersExist: hasManager });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Helpers: devoluções file
const readDevolucoes = () => {
  try { return JSON.parse(fs.readFileSync(DEVOLUCOES_DB_FILE, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
};
const writeDevolucoes = (list) => {
  writeData(DEVOLUCOES_DB_FILE, Array.isArray(list) ? list : []);
};

// USERS: Return all usernames (authenticated, any role)
app.get('/api/users/usernames', (req, res) => {
  try {
    const authToken = req.header('x-auth-token');
    const session = authToken ? activeSessions.get(authToken) : null;
    if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });

    const users = readData(USERS_DB_PATH) || [];
    const usernames = users
      .map((u) => (u && typeof u.username === 'string') ? u.username : null)
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
    res.status(200).json(usernames);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao listar usuários.' });
  }
});

// HISTORY: Robust sales reader (tolerates concatenated JSON arrays)
app.get('/api/history/sales-all', (req, res) => {
  try {
    // Normalize file on read to keep it tidy
    try { normalizeSalesFile(); } catch (_) {}
    const { vendedor, seller, dia, from, to, produtoId, produtoNome, search, sort } = req.query || {};
    const raw = fs.readFileSync(SALES_DB_FILE, 'utf8');
    let sales = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) sales = parsed;
    } catch (_) {
      const regex = /\[[\s\S]*?\]/g;
      let m;
      while ((m = regex.exec(raw)) !== null) {
        try {
          const part = JSON.parse(m[0]);
          if (Array.isArray(part)) sales.push(...part);
        } catch {}
      }
    }

    const sellerFilter = String(seller || vendedor || '').trim().toLowerCase();
    const day = String(dia || '').trim();
    const fromStr = String(from || '').trim();
    const toStr = String(to || '').trim();
    const pid = String(produtoId || '').trim().toLowerCase();
    const pname = String(produtoNome || '').trim().toLowerCase();
    const q = String(search || '').trim().toLowerCase();

    const parseDate = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d; };
    const fromDate = parseDate(fromStr);
    const toDate = parseDate(toStr);

    const filtered = sales.filter((sale) => {
      try {
        const sDate = new Date(sale.date);
        if (sellerFilter && String(sale.seller || '').toLowerCase() !== sellerFilter) return false;
        if (day && !String(sale.date || '').startsWith(day)) return false;
        if (fromDate && sDate < fromDate) return false;
        if (toDate && sDate > toDate) return false;
        if (pid) {
          const items = Array.isArray(sale.items) ? sale.items : [];
          const hasId = items.some((it) => String(it.id || it.codigo || '').toLowerCase().includes(pid));
          if (!hasId) return false;
        }
        if (pname) {
          const items = Array.isArray(sale.items) ? sale.items : [];
          const hasName = items.some((it) => String(it.nome || it.name || '').toLowerCase().includes(pname));
          if (!hasName) return false;
        }
        if (q) {
          const sellerMatch = String(sale.seller || '').toLowerCase().includes(q);
          const items = Array.isArray(sale.items) ? sale.items : [];
          const itemMatch = items.some((it) => {
            const idv = String(it.id || it.codigo || '').toLowerCase();
            const nm = String(it.nome || it.name || '').toLowerCase();
            const ds = String(it.descricao || it.desc || '').toLowerCase();
            return idv.includes(q) || nm.includes(q) || ds.includes(q);
          });
          if (!(sellerMatch || itemMatch)) return false;
        }
        return true;
      } catch { return false; }
    });

    const computeTotal = (sale) => {
      const items = Array.isArray(sale.items) ? sale.items : [];
      return items.reduce((acc, it) => acc + (Number(it.valor || 0) || 0), 0);
    };

    const key = String(sort || 'date_desc');
    const sorted = filtered.slice().sort((a, b) => {
      if (key === 'date_asc') return (Date.parse(a.date)||0) - (Date.parse(b.date)||0);
      if (key === 'total_desc') return (computeTotal(b)||0) - (computeTotal(a)||0);
      if (key === 'total_asc') return (computeTotal(a)||0) - (computeTotal(b)||0);
      return (Date.parse(b.date)||0) - (Date.parse(a.date)||0);
    });

    res.status(200).json(sorted);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao ler histórico de vendas.' });
  }
});

// Helper: normalize sales.json into a single JSON array
function normalizeSalesFile() {
  const raw = fs.readFileSync(SALES_DB_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return; // already fine
  } catch (_) {}
  const regex = /\[[\s\S]*?\]/g;
  let m; const merged = [];
  while ((m = regex.exec(raw)) !== null) {
    try {
      const part = JSON.parse(m[0]);
      if (Array.isArray(part)) merged.push(...part);
    } catch {}
  }
  writeData(SALES_DB_FILE, merged);
}

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const body = req.body || {};
    let rawUsername = normalizeText(body.username);
    const password = typeof body.password === 'string' ? body.password.trim() : '';
    const desiredCargo = canonicalCargo(body.cargo);
    const nomeCompleto = normalizeText(body.nomeCompleto || body.nome || body.fullName);
    const cpfDigits = digitsOnly(body.cpf);
    const email = lowercaseText(body.email);
    const telefoneDigits = digitsOnly(body.telefone || body.phone || body.telefoneCelular);

    if (!rawUsername || rawUsername.length < MIN_USERNAME_LENGTH)
      return res.status(400).json({ message: `Informe um usuário com pelo menos ${MIN_USERNAME_LENGTH} caracteres.` });
    if (!password || password.length < MIN_PASSWORD_LENGTH)
      return res.status(400).json({ message: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` });

    const users = readData(USERS_DB_PATH);
    const isFirstUser = users.length === 0;
    const cargo = desiredCargo || (isFirstUser ? 'Administrador' : '');

    if (!isFirstUser) {
      if (!nomeCompleto) return res.status(400).json({ message: 'Informe o nome completo do funcionário.' });
      if (!cpfDigits) return res.status(400).json({ message: 'Informe o CPF do funcionário.' });
      if (!email) return res.status(400).json({ message: 'Informe o email do funcionário.' });
      if (!telefoneDigits) return res.status(400).json({ message: 'Informe o telefone do funcionário.' });
      if (!isValidEmail(email)) return res.status(400).json({ message: 'Email inválido.' });
      if (!isValidPhone(telefoneDigits)) return res.status(400).json({ message: 'Telefone inválido.' });
    }

    if (!isFirstUser && canonicalCargo(cargo) === 'Funcionario') {
      rawUsername = cpfDigits;
    }
    if (!isFirstUser && !isValidCPF(cpfDigits)) {
      return res.status(400).json({ message: 'CPF inválido.' });
    }
    const existingUsername = users.find(u => typeof u.username === 'string' && u.username.toLowerCase() === rawUsername.toLowerCase());
    if (existingUsername) return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
    if (cpfDigits && users.some(u => u.cpf && digitsOnly(u.cpf) === cpfDigits)) return res.status(409).json({ message: 'Já existe um funcionário com este CPF.' });
    if (email && users.some(u => typeof u.email === 'string' && u.email.toLowerCase() === email)) return res.status(409).json({ message: 'Já existe um funcionário com este email.' });

    if (!isFirstUser) {
      const authToken = req.header('x-auth-token');
      const session = authToken ? activeSessions.get(authToken) : null;
      const isAdminSession = session && canonicalCargo(session.cargo) === 'Administrador';
      if (!isAdminSession) return res.status(403).json({ message: 'Apenas administradores autenticados podem cadastrar usuários.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nowIso = new Date().toISOString();
    const newUser = {
      username: rawUsername,
      password: hashedPassword,
      cargo: cargo || 'Funcionario',
      nomeCompleto: nomeCompleto || rawUsername,
      cpf: cpfDigits || null,
      email: email || null,
      telefone: telefoneDigits || null,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    users.push(newUser);
    writeData(USERS_DB_PATH, users);
    return res.status(201).json({ message: 'Funcionário cadastrado com sucesso!', user: {
      username: newUser.username,
      cargo: newUser.cargo,
      nomeCompleto: newUser.nomeCompleto,
      cpf: newUser.cpf,
      email: newUser.email,
      telefone: newUser.telefone
    }});
  } catch (e) {
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const body = req.body || {};
    const inputUsername = normalizeText(body.username);
    const inputPassword = typeof body.password === 'string' ? body.password : '';

    const users = readData(USERS_DB_PATH);
    let user = users.find(u => typeof u.username === 'string' && u.username.toLowerCase() === inputUsername.toLowerCase());
    const inputDigits = digitsOnly(inputUsername);
    if (!user && inputDigits.length === 11) {
      user = users.find(u => u && u.cpf && digitsOnly(u.cpf) === inputDigits);
    }
    if (!user) return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });

    if (canonicalCargo(user.cargo) === 'Funcionario') {
      if (inputDigits.length !== 11 || digitsOnly(user.cpf || '') !== inputDigits)
        return res.status(401).json({ success: false, message: 'Para funcionário, utilize o CPF como usuário.' });
    }

    if (!inputPassword || !(await bcrypt.compare(inputPassword, user.password)))
      return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });

    for (const [tokenValue, sess] of activeSessions.entries()) {
      if (sess.username === user.username) activeSessions.delete(tokenValue);
    }

    const token = crypto.randomUUID();
    activeSessions.set(token, { username: user.username, cargo: user.cargo, issuedAt: Date.now() });
    return res.status(200).json({ success: true, message: 'Login bem-sucedido!', cargo: user.cargo, username: user.username, token });
  } catch (e) {
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});

app.get('/api/users', async (req, res) => {
    try {
        const db = await readDB();
        const usernames = db.users.map(user => user.username);
        res.json(usernames);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar utilizadores." });
    }
});

// Rota para buscar o histórico de vendas com filtros
app.get('/api/history/sales', async (req, res) => {
    try {
        let sales = await readSales();
        const { vendedor, dia, produtoId, produtoNome } = req.query;

        if (vendedor) {
            sales = sales.filter(sale => sale.seller === vendedor);
        }
        if (dia) { // Formato esperado: YYYY-MM-DD
            sales = sales.filter(sale => sale.date.startsWith(dia));
        }
        if (produtoId) {
            sales = sales.filter(sale => sale.items.some(item => item.id.toLowerCase().includes(produtoId.toLowerCase())));
        }
        if (produtoNome) {
            sales = sales.filter(sale => sale.items.some(item => item.nome.toLowerCase().includes(produtoNome.toLowerCase())));
        }
        res.json(sales.reverse()); // Retorna as mais recentes primeiro
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar histórico de vendas." });
    }
});

// Rota para buscar o histórico de sangrias com filtros
app.get('/api/history/sangrias', async (req, res) => {
    try {
        let transactions = await readTransactions();
        const { vendedor, dia } = req.query;

        if (vendedor) {
            transactions = transactions.filter(t => t.user === vendedor);
        }
        if (dia) {
            transactions = transactions.filter(t => t.date.startsWith(dia));
        }
        res.json(transactions.reverse());
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar histórico de sangrias." });
    }
});

// Rota para buscar o histórico de suprimentos com filtros
app.post('/api/suprimento', async (req, res) => {
    try {
        const suprimentos = await readSuprimentos();
        const newSuprimento = {
            id: new Date().getTime(),
            ...req.body,
            date: new Date().toISOString()
        };
        suprimentos.push(newSuprimento);
        await writeSuprimentos(suprimentos);
        res.status(201).json({ success: true, message: 'Suprimento registado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao registar o suprimento.' });
    }
});

// Rota para buscar o histórico de devoluções com filtros
app.get('/api/history/devolucoes', (req, res) => {
  try {
    const raw = readDevolucoes() || [];
    // Normaliza registros de diferentes formatos em um shape comum
    const normalized = raw.map((r) => {
      const base = {
        id: r.id || Date.now(),
        date: r.date || new Date().toISOString(),
        saleId: r.saleId || null,
        user: r.user || r.vendedor || '',
        reason: r.reason || r.motivo || null,
        amount: Number(r.amount || 0) || 0,
        items: []
      };
      // Suporte a formatos: items[], produto único, products
      if (Array.isArray(r.items)) {
        base.items = r.items.map(it => ({
          productId: it.productId ?? it.id ?? it.codigo ?? null,
          productName: it.productName ?? it.nome ?? it.name ?? null,
          quantity: Number(it.quantity || 1) || 1,
          amount: Number(it.amount || 0) || 0
        }));
        if (!base.amount) base.amount = base.items.reduce((s,it)=> s + (Number(it.amount||0)||0), 0);
      } else if (r.produto) {
        const p = r.produto;
        base.items = [{ productId: p.id || null, productName: p.nome || p.name || null, quantity: 1, amount: Number(p.valor || 0) || 0 }];
        if (!base.amount) base.amount = base.items[0].amount;
      }
      return base;
    });

    const { vendedor = '', dia = '', from = '', to = '', produtoId = '', produtoNome = '', search = '', sort = 'date_desc' } = req.query || {};
    const vnorm = String(vendedor).trim().toLowerCase();
    const dday = String(dia).trim();
    const fromStr = String(from).trim();
    const toStr = String(to).trim();
    const pid = String(produtoId).trim().toLowerCase();
    const pname = String(produtoNome).trim().toLowerCase();
    const q = String(search).trim().toLowerCase();
    const parseDate = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d; };
    const fromDate = parseDate(fromStr);
    const toDate = parseDate(toStr);

    const filtered = normalized.filter((r) => {
      try {
        const rDate = new Date(r.date);
        if (dday && !String(r.date || '').startsWith(dday)) return false;
        if (fromDate && rDate < fromDate) return false;
        if (toDate && rDate > toDate) return false;
        if (vnorm && !String(r.user || '').toLowerCase().includes(vnorm)) return false;
        if (pid) {
          const ok = Array.isArray(r.items) && r.items.some(it => String(it.productId || '').toLowerCase().includes(pid));
          if (!ok) return false;
        }
        if (pname) {
          const okn = Array.isArray(r.items) && r.items.some(it => String(it.productName || '').toLowerCase().includes(pname));
          if (!okn) return false;
        }
        if (q) {
          const reasonMatch = String(r.reason || '').toLowerCase().includes(q);
          const userMatch = String(r.user || '').toLowerCase().includes(q);
          const itemMatch = Array.isArray(r.items) && r.items.some(it => {
            return String(it.productId || '').toLowerCase().includes(q) || String(it.productName || '').toLowerCase().includes(q);
          });
          if (!(reasonMatch || userMatch || itemMatch)) return false;
        }
        return true;
      } catch { return false; }
    }).sort((a,b)=> {
      if (sort === 'amount_desc') return (Number(b.amount)||0) - (Number(a.amount)||0);
      if (sort === 'amount_asc') return (Number(a.amount)||0) - (Number(b.amount)||0);
      if (sort === 'date_asc') return (Date.parse(a.date)||0) - (Date.parse(b.date)||0);
      return (Date.parse(b.date)||0) - (Date.parse(a.date)||0);
    });

    res.status(200).json(filtered);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar histórico de devoluções.' });
  }
});

// Rota para buscar o histrico de suprimentos com filtros


// Rota para apagar uma venda inteira
app.delete('/api/history/sales/:id', async (req, res) => {
    try {
        const saleId = parseInt(req.params.id, 10);
        let sales = await readSales();
        const initialLength = sales.length;
        sales = sales.filter(sale => sale.id !== saleId);

        if (sales.length === initialLength) {
            return res.status(404).json({ message: "Venda não encontrada." });
        }

        await writeSales(sales);
        res.json({ success: true, message: 'Venda apagada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao apagar a venda.' });
    }
});

// Rota para processar uma devolução
app.post('/api/devolucao', async (req, res) => {
    try {
        const { saleId, produto, motivo, vendedor } = req.body;
        
        // 1. Registar a devolução
        const devolucoes = await readDevolucoes();
        const novaDevolucao = {
            id: new Date().getTime(),
            saleId,
            produto,
            motivo,
            vendedor,
            date: new Date().toISOString()
        };
        devolucoes.push(novaDevolucao);
        await writeDevolucoes(devolucoes);

        // 2. Marcar o item como devolvido na venda original
        const sales = await readSales();
        const saleIndex = sales.findIndex(s => s.id === saleId);
        if (saleIndex > -1) {
            const itemIndex = sales[saleIndex].items.findIndex(item => item.id === produto.id && !item.devolvido);
             if (itemIndex > -1) {
                sales[saleIndex].items[itemIndex].devolvido = true;
                await writeSales(sales);
            }
        }
        
        // 3. Atualizar o estoque (opcional, mas recomendado)
        // Esta parte pode ser adicionada depois para aumentar a quantidade em estoque

        res.status(201).json({ success: true, message: 'Devolução registada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao processar devolução.' });
    }
});

// USERS list (admin-only)
app.get('/api/users', (req, res) => {
  try {
    const authToken = req.header('x-auth-token');
    const session = authToken ? activeSessions.get(authToken) : null;
    if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
    if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem consultar funcionarios.' });

    const { search = '', cargo } = req.query || {};
    const normalizedSearch = lowercaseText(search);
    const desiredCargo = canonicalCargo(cargo);

    const users = readData(USERS_DB_PATH);
    const entries = users.map(u => ({
      username: u.username || '',
      cargo: u.cargo || '',
      nomeCompleto: normalizeText(u.nomeCompleto) || u.username || '',
      email: u.email || null,
      telefone: u.telefone || null,
      cpf: u.cpf || null,
      createdAt: u.createdAt || null,
      updatedAt: u.updatedAt || null
    }));

    const filtered = entries.filter((entry) => {
      if (desiredCargo && canonicalCargo(entry.cargo) !== desiredCargo) return false;
      if (!normalizedSearch) return true;
      const values = [entry.username, entry.nomeCompleto, entry.email, entry.telefone, entry.cpf].map(v => lowercaseText(v));
      return values.some(v => v.includes(normalizedSearch));
    }).sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) || 0 : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) || 0 : 0;
      if (aTime === bTime) return (lowercaseText(a.nomeCompleto)).localeCompare(lowercaseText(b.nomeCompleto));
      return bTime - aTime;
  });

  // USERS: Update (admin-only)
  app.put('/api/users/:username', async (req, res) => {
    try {
      const authToken = req.header('x-auth-token');
      const session = authToken ? activeSessions.get(authToken) : null;
      if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
      if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem editar funcionários.' });

      const targetUsername = String(req.params.username || '').trim();
      if (!targetUsername) return res.status(400).json({ message: 'Usuário alvo inválido.' });

      const users = readData(USERS_DB_PATH);
      const idx = users.findIndex(u => typeof u.username === 'string' && u.username.toLowerCase() === targetUsername.toLowerCase());
      if (idx === -1) return res.status(404).json({ message: 'Funcionário não encontrado.' });

      const body = req.body || {};
      const updates = {};
      if (typeof body.nomeCompleto === 'string') updates.nomeCompleto = normalizeText(body.nomeCompleto);
      if (typeof body.email === 'string') updates.email = lowercaseText(body.email);
      if (typeof body.telefone === 'string') updates.telefone = digitsOnly(body.telefone);
      if (typeof body.cpf === 'string') updates.cpf = digitsOnly(body.cpf);
      if (typeof body.cargo === 'string') updates.cargo = canonicalCargo(body.cargo) || users[idx].cargo;

      if (updates.email && !isValidEmail(updates.email)) return res.status(400).json({ message: 'Email inválido.' });
      if (updates.telefone && !isValidPhone(updates.telefone)) return res.status(400).json({ message: 'Telefone inválido.' });
      if (updates.cpf && updates.cpf.length && updates.cpf !== (digitsOnly(users[idx].cpf || ''))) {
        if (!isValidCPF(updates.cpf)) return res.status(400).json({ message: 'CPF inválido.' });
        if (users.some((u, i) => i !== idx && u.cpf && digitsOnly(u.cpf) === updates.cpf)) return res.status(409).json({ message: 'Já existe um funcionário com este CPF.' });
      }
      if (updates.email && updates.email !== lowercaseText(users[idx].email || '')) {
        if (users.some((u, i) => i !== idx && typeof u.email === 'string' && lowercaseText(u.email) === updates.email)) return res.status(409).json({ message: 'Já existe um funcionário com este email.' });
      }

      if (typeof body.password === 'string' && body.password.trim()) {
        const pw = body.password.trim();
        if (pw.length < 6) return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
        updates.password = await bcrypt.hash(pw, 10);
      }

      const now = new Date().toISOString();
      users[idx] = { ...users[idx], ...updates, updatedAt: now };
      writeData(USERS_DB_PATH, users);

      const u = users[idx];
      return res.status(200).json({
        message: 'Funcionário atualizado com sucesso!',
        user: { username: u.username, cargo: u.cargo, nomeCompleto: u.nomeCompleto, cpf: u.cpf, email: u.email, telefone: u.telefone, updatedAt: u.updatedAt }
      });
    } catch (e) {
      res.status(500).json({ message: 'Erro ao atualizar funcionário.' });
    }
  });

  // USERS: Delete (admin-only)
  app.delete('/api/users/:username', (req, res) => {
    try {
      const authToken = req.header('x-auth-token');
      const session = authToken ? activeSessions.get(authToken) : null;
      if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
      if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem excluir funcionários.' });

      const targetUsername = String(req.params.username || '').trim();
      if (!targetUsername) return res.status(400).json({ message: 'Usuário alvo inválido.' });

      const users = readData(USERS_DB_PATH);
      const idx = users.findIndex(u => typeof u.username === 'string' && u.username.toLowerCase() === targetUsername.toLowerCase());
      if (idx === -1) return res.status(404).json({ message: 'Funcionário não encontrado.' });

      // Evitar excluir o último administrador
      const isAdmin = canonicalCargo(users[idx].cargo) === 'Administrador';
      if (isAdmin) {
        const adminCount = users.filter(u => canonicalCargo(u.cargo) === 'Administrador').length;
        if (adminCount <= 1) return res.status(400).json({ message: 'Não é possível excluir o último administrador.' });
      }

      const removed = users.splice(idx, 1)[0];
      writeData(USERS_DB_PATH, users);
      // Encerrar sessões do usuário removido
      for (const [tokenValue, sess] of activeSessions.entries()) {
        if (sess.username && String(sess.username).toLowerCase() === String(removed.username).toLowerCase()) {
          activeSessions.delete(tokenValue);
        }
      }
      return res.status(200).json({ success: true, message: 'Funcionário excluído com sucesso.' });
    } catch (e) {
      res.status(500).json({ message: 'Erro ao excluir funcionário.' });
    }
  });
    res.status(200).json({ total: entries.length, results: filtered });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// PRODUCTS
app.get('/api/produtos', (req, res) => {
  try {
    const { categoria, subcategoria, search } = req.query || {};
    const cat = normalizeText(categoria);
    const sub = normalizeText(subcategoria);
    const q = lowercaseText(search);
    const produtos = readData(PRODUCTS_DB_FILE);

    let list = produtos;
    if (cat) list = list.filter(p => normalizeText(p.categoriaNome).toLowerCase() === cat.toLowerCase());
    if (sub) list = list.filter(p => normalizeText(p.subcategoriaNome).toLowerCase() === sub.toLowerCase());
    if (q) {
      list = list.filter(p => {
        const vals = [p.id, p.nome, p.descricao, p.categoriaNome, p.subcategoriaNome].map(v => lowercaseText(v));
        return vals.some(v => v.includes(q));
      });
    }
    res.status(200).json(list);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar produtos.' });
  }
});

app.get('/api/produtos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const produtos = readData(PRODUCTS_DB_FILE);
    const prod = produtos.find(p => p.id === id);
    if (!prod) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.status(200).json(prod);
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao buscar produto.' });
  }
});

app.post('/api/produtos', (req, res) => {
  try {
    const novo = req.body || {};
    const produtos = readData(PRODUCTS_DB_FILE);
    if (!novo || !novo.id) return res.status(400).json({ message: 'Produto inválido.' });
    if (produtos.some(p => p.id === novo.id)) return res.status(409).json({ message: 'Já existe um produto com este ID.' });
    produtos.push(novo);
    writeData(PRODUCTS_DB_FILE, produtos);
    res.status(201).json({ message: 'Produto adicionado com sucesso.' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao adicionar produto.' });
  }
});

app.put('/api/produtos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const produtos = readData(PRODUCTS_DB_FILE);
    const idx = produtos.findIndex(p => p.id === id);
    if (idx < 0) return res.status(404).json({ message: 'Produto não encontrado.' });
    produtos[idx] = { ...produtos[idx], ...body, id };
    writeData(PRODUCTS_DB_FILE, produtos);
    res.status(200).json({ message: 'Produto atualizado com sucesso.' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao atualizar produto.' });
  }
});

app.delete('/api/produtos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const produtos = readData(PRODUCTS_DB_FILE);
    const idx = produtos.findIndex(p => p.id === id);
    if (idx < 0) return res.status(404).json({ message: 'Produto não encontrado.' });
    produtos.splice(idx, 1);
    writeData(PRODUCTS_DB_FILE, produtos);
    res.status(200).json({ message: 'Produto excluído com sucesso.' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao excluir produto.' });
  }
});

// SALES
app.post('/api/sales', (req, res) => {
  try {
    const { items, seller } = req.body || {};
    if (!Array.isArray(items) || items.length === 0 || !seller)
      return res.status(400).json({ message: 'Dados da venda incompletos.' });
    const sales = readData(SALES_DB_FILE);
    sales.push({ id: Date.now(), date: new Date().toISOString(), items, seller });
    writeData(SALES_DB_FILE, sales);
    res.status(201).json({ message: 'Venda registrada com sucesso!' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao registrar a venda.' });
  }
});

app.get('/api/sales', (req, res) => {
  try {
    try { normalizeSalesFile(); } catch (_) {}
    const authToken = req.header('x-auth-token');
    const session = authToken ? activeSessions.get(authToken) : null;
    if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
    if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem consultar o histórico de vendas.' });

    const sales = readData(SALES_DB_FILE) || [];
    const parseDate = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d; };

    const { from, to, seller = '', search = '', id: idStr, productId: productIdStr, sort: sortKey, page: pageStr, pageSize: pageSizeStr } = req.query || {};
    const fromDate = parseDate(from);
    const toDate = parseDate(to);
    const sellerNorm = lowercaseText(seller);
    const searchNorm = lowercaseText(search);
    const idFilter = idStr ? String(idStr).trim() : '';
    const prodIdFilter = productIdStr ? String(productIdStr).trim() : '';

    const filtered = sales.filter((sale) => {
      try {
        const saleDate = new Date(sale.date);
        if (idFilter) {
          const sid = String(sale.id || '').trim();
          if (sid !== idFilter) return false;
        }
        if (fromDate && saleDate < fromDate) return false;
        if (toDate && saleDate > toDate) return false;
        if (sellerNorm && !lowercaseText(sale.seller || '').includes(sellerNorm)) return false;
        if (prodIdFilter) {
          const items = Array.isArray(sale.items) ? sale.items : [];
          const needle = lowercaseText(prodIdFilter);
          const hasProd = items.some((it) => lowercaseText(String(it.id || it.codigo || '')).includes(needle));
          if (!hasProd) return false;
        }
        if (searchNorm) {
          const sellerMatch = lowercaseText(sale.seller || '').includes(searchNorm);
          const items = Array.isArray(sale.items) ? sale.items : [];
          const itemMatch = items.some((it) => {
            const idVal = lowercaseText(it.id || '');
            const nameVal = lowercaseText(it.nome || it.name || '');
            const descVal = lowercaseText(it.descricao || '');
            return idVal.includes(searchNorm) || nameVal.includes(searchNorm) || descVal.includes(searchNorm);
          });
          if (!(sellerMatch || itemMatch)) return false;
        }
        return true;
      } catch { return false; }
    }).map((sale) => {
      const items = Array.isArray(sale.items) ? sale.items : [];
      const totalItems = items.length;
      const totalValue = items.reduce((acc, it) => acc + (Number(it.valor || 0) || 0), 0);
      return { id: sale.id, date: sale.date, seller: sale.seller || '', totalItems, totalValue, items };
    }).sort((a, b) => {
      const key = String(sortKey || 'date_desc');
      if (key === 'date_asc') return (Date.parse(a.date)||0) - (Date.parse(b.date)||0);
      if (key === 'total_desc') return (Number(b.totalValue)||0) - (Number(a.totalValue)||0);
      if (key === 'total_asc') return (Number(a.totalValue)||0) - (Number(b.totalValue)||0);
      return (Date.parse(b.date)||0) - (Date.parse(a.date)||0);
    });

    const pageNum = Math.max(1, parseInt(pageStr || '1', 10) || 1);
    const sizeNum = Math.min(100, Math.max(1, parseInt(pageSizeStr || '10', 10) || 10));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / sizeNum));
    const page = Math.min(pageNum, totalPages);
    const startIdx = (page - 1) * sizeNum;
    const endIdx = startIdx + sizeNum;
    const paged = filtered.slice(startIdx, endIdx);

    res.status(200).json({ total, page, pageSize: sizeNum, totalPages, results: paged });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// SALES: Summary (admin-only) - aggregates by date
app.get('/api/sales/summary', (req, res) => {
  try {
    const authToken = req.header('x-auth-token');
    const session = authToken ? activeSessions.get(authToken) : null;
    if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
    if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem consultar o histórico de vendas.' });

    const parseDate = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d; };
    const { from, to, seller = '', search = '', productId: productIdStr } = req.query || {};
    const fromDate = parseDate(from);
    const toDate = parseDate(to);
    const sellerNorm = lowercaseText(seller);
    const searchNorm = lowercaseText(search);
    const prodIdFilter = productIdStr ? lowercaseText(String(productIdStr).trim()) : '';

    const sales = readData(SALES_DB_FILE) || [];

    const filtered = sales.filter((sale) => {
      try {
        const saleDate = new Date(sale.date);
        if (fromDate && saleDate < fromDate) return false;
        if (toDate && saleDate > toDate) return false;
        if (sellerNorm && !lowercaseText(sale.seller || '').includes(sellerNorm)) return false;
        const items = Array.isArray(sale.items) ? sale.items : [];
        if (prodIdFilter) {
          const hasProd = items.some((it) => lowercaseText(String(it.id || it.codigo || '')).includes(prodIdFilter));
          if (!hasProd) return false;
        }
        if (searchNorm) {
          const sellerMatch = lowercaseText(sale.seller || '').includes(searchNorm);
          const itemMatch = items.some((it) => {
            const idVal = lowercaseText(it.id || '');
            const nameVal = lowercaseText(it.nome || it.name || '');
            const descVal = lowercaseText(it.descricao || '');
            return idVal.includes(searchNorm) || nameVal.includes(searchNorm) || descVal.includes(searchNorm);
          });
          if (!(sellerMatch || itemMatch)) return false;
        }
        return true;
      } catch { return false; }
    });

    // aggregate by YYYY-MM-DD (local time)
    const toKey = (d) => {
      const dt = new Date(d);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const acc = Object.create(null);
    let sumValue = 0; let sumItems = 0; let sumCount = 0;
    for (const sale of filtered) {
      const key = toKey(sale.date);
      const items = Array.isArray(sale.items) ? sale.items : [];
      const totalValue = items.reduce((a, it) => a + (Number(it.valor || 0) || 0), 0);
      const totalItems = items.length;
      if (!acc[key]) acc[key] = { date: key, totalValue: 0, totalItems: 0, count: 0 };
      acc[key].totalValue += totalValue;
      acc[key].totalItems += totalItems;
      acc[key].count += 1;
      sumValue += totalValue; sumItems += totalItems; sumCount += 1;
    }
    const byDate = Object.values(acc).sort((a, b) => a.date.localeCompare(b.date));
    res.status(200).json({ totalValue: sumValue, totalItems: sumItems, count: sumCount, byDate });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao gerar resumo de vendas.' });
  }
});

// SALES: Delete entire sale (admin-only)
app.delete('/api/sales/:id', (req, res) => {
  try {
    const authToken = req.header('x-auth-token');
    const session = authToken ? activeSessions.get(authToken) : null;
    if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
    if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem excluir vendas.' });

    const { id } = req.params;
    const sales = readData(SALES_DB_FILE) || [];
    const idx = sales.findIndex(s => String(s.id || '') === String(id || ''));
    if (idx < 0) return res.status(404).json({ message: 'Venda não encontrada.' });
    sales.splice(idx, 1);
    writeData(SALES_DB_FILE, sales);
    return res.status(200).json({ message: 'Venda excluída com sucesso.' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao excluir venda.' });
  }
});

// SALES: Delete alias via POST (some environments block DELETE from browsers)
app.post('/api/sales/:id/delete', (req, res) => {
  try {
    const authToken = req.header('x-auth-token');
    const session = authToken ? activeSessions.get(authToken) : null;
    if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
    if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem excluir vendas.' });

    const { id } = req.params;
    const sales = readData(SALES_DB_FILE) || [];
    const idx = sales.findIndex(s => String(s.id || '') === String(id || ''));
    if (idx < 0) return res.status(404).json({ message: 'Venda não encontrada.' });
    sales.splice(idx, 1);
    writeData(SALES_DB_FILE, sales);
    return res.status(200).json({ message: 'Venda excluída com sucesso.' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao excluir venda.' });
  }
});

// SALES: Remove items from a sale (admin-only)
app.patch('/api/sales/:id/items/remove', (req, res) => {
  try {
    const authToken = req.header('x-auth-token');
    const session = authToken ? activeSessions.get(authToken) : null;
    if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
    if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem alterar vendas.' });

    const { id } = req.params;
    const { indices, productIds } = req.body || {};
    const sales = readData(SALES_DB_FILE) || [];
    const sale = sales.find(s => String(s.id || '') === String(id || ''));
    if (!sale) return res.status(404).json({ message: 'Venda não encontrada.' });
    const items = Array.isArray(sale.items) ? sale.items : [];

    let removedCount = 0;
    let newItems = items;

    if (Array.isArray(indices) && indices.length > 0) {
      const idxSet = new Set(indices.map(n => parseInt(n, 10)).filter(n => Number.isInteger(n)));
      removedCount = Array.from(idxSet).filter(n => n >= 0 && n < items.length).length;
      newItems = items.filter((_, i) => !idxSet.has(i));
    } else if (Array.isArray(productIds) && productIds.length > 0) {
      const toRemove = new Set(productIds.map(v => String(v)));
      const before = items.length;
      newItems = items.filter((it) => !toRemove.has(String(it.id || it.codigo || '')));
      removedCount = before - newItems.length;
    } else {
      return res.status(400).json({ message: 'Informe indices ou productIds para remover.' });
    }

    sale.items = newItems;
    const idx = sales.findIndex(s => s === sale);
    sales[idx] = sale;
    writeData(SALES_DB_FILE, sales);
    return res.status(200).json({ message: `Itens removidos: ${removedCount}.`, removed: removedCount });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao remover itens da venda.' });
  }
});

// SALES: Remove items alias via POST
app.post('/api/sales/:id/items/remove', (req, res) => {
  try {
    const authToken = req.header('x-auth-token');
    const session = authToken ? activeSessions.get(authToken) : null;
    if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
    if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem alterar vendas.' });

    const { id } = req.params;
    const { indices, productIds } = req.body || {};
    const sales = readData(SALES_DB_FILE) || [];
    const sale = sales.find(s => String(s.id || '') === String(id || ''));
    if (!sale) return res.status(404).json({ message: 'Venda não encontrada.' });
    const items = Array.isArray(sale.items) ? sale.items : [];

    let removedCount = 0;
    let newItems = items;

    if (Array.isArray(indices) && indices.length > 0) {
      const idxSet = new Set(indices.map(n => parseInt(n, 10)).filter(n => Number.isInteger(n)));
      removedCount = Array.from(idxSet).filter(n => n >= 0 && n < items.length).length;
      newItems = items.filter((_, i) => !idxSet.has(i));
    } else if (Array.isArray(productIds) && productIds.length > 0) {
      const toRemove = new Set(productIds.map(v => String(v)));
      const before = items.length;
      newItems = items.filter((it) => !toRemove.has(String(it.id || it.codigo || '')));
      removedCount = before - newItems.length;
    } else {
      return res.status(400).json({ message: 'Informe indices ou productIds para remover.' });
    }

    sale.items = newItems;
    const idx = sales.findIndex(s => s === sale);
    sales[idx] = sale;
    writeData(SALES_DB_FILE, sales);
    return res.status(200).json({ message: `Itens removidos: ${removedCount}.`, removed: removedCount });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao remover itens da venda.' });
  }
});

// CASH: Refund (Devolução) - admin-only
app.post('/api/refunds', (req, res) => {
  try {
    const authToken = req.header('x-auth-token');
    const session = authToken ? activeSessions.get(authToken) : null;
    if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
    if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem registrar devoluções.' });

    const { saleId, amount, user, reason, items } = req.body || {};
    if (!amount || Number(amount) <= 0 || !user) return res.status(400).json({ message: 'Valor da devolução inválido.' });

    const devolucoes = readDevolucoes() || [];
    const entry = {
      id: Date.now(),
      amount: Number(amount),
      user,
      date: new Date().toISOString(),
      saleId: saleId || null,
      items: Array.isArray(items) ? items.map(it => ({
        productId: it.productId ?? it.id ?? it.codigo ?? null,
        productName: it.productName ?? it.nome ?? it.name ?? null,
        quantity: Number(it.quantity || 1) || 1,
        amount: Number(it.amount || 0) || 0
      })) : [],
      reason: reason || null
    };
    devolucoes.push(entry);
    writeDevolucoes(devolucoes);

    // Remove refunded items from original sale (item-by-item)
    try {
      normalizeSalesFile();
      const sales = readData(SALES_DB_FILE) || [];
      const idx = sales.findIndex(s => String(s.id) === String(saleId));
      if (idx >= 0) {
        const sale = sales[idx];
        let newItems = Array.isArray(sale.items) ? sale.items.slice() : [];
        const refundItems = Array.isArray(entry.items) ? entry.items : [];
        refundItems.forEach((it) => {
          const pid = String(it.productId || '').trim();
          if (!pid) return;
          const rIdx = newItems.findIndex(x => String(x.id || '').trim() === pid);
          if (rIdx >= 0) newItems.splice(rIdx, 1);
        });
        if (newItems.length === 0) {
          sales.splice(idx, 1);
        } else {
          sales[idx] = { ...sale, items: newItems };
        }
        writeData(SALES_DB_FILE, sales);
      }
    } catch (_) {}

    res.status(201).json({ message: 'Devolução registrada com sucesso!', refund: entry });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao registrar devolução.' });
  }
});

// CASH: Refund delete (admin-only)
app.delete('/api/refunds/:id', (req, res) => {
  try {
    const authToken = req.header('x-auth-token');
    const session = authToken ? activeSessions.get(authToken) : null;
    if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
    if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem excluir devoluções.' });

    const { id } = req.params;
    const devolucoes = readDevolucoes() || [];
    const idx = devolucoes.findIndex(r => String(r.id || '') === String(id || ''));
    if (idx < 0) return res.status(404).json({ message: 'Devolução não encontrada.' });
    devolucoes.splice(idx, 1);
    writeDevolucoes(devolucoes);
    return res.status(200).json({ message: 'Devolução excluída com sucesso.' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao excluir devolução.' });
  }
});

// CASH: Sangria
app.post('/api/sangria', (req, res) => {
  try {
    const { amount, user, reason } = req.body || {};
    if (!amount || amount <= 0 || !user) return res.status(400).json({ message: 'O valor da sangria é inválido.' });
    const transactions = readData(TRANSACTIONS_DB_FILE);
    transactions.push({ id: Date.now(), type: 'sangria', amount, user, date: new Date().toISOString(), reason: reason || null });
    writeData(TRANSACTIONS_DB_FILE, transactions);
    res.status(201).json({ message: 'Sangria registrada com sucesso!' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao registrar a sangria.' });
  }
});

// CASH: Suprimento
app.post('/api/suprimento', (req, res) => {
  try {
    const { amount, user } = req.body || {};
    if (!amount || amount <= 0 || !user) return res.status(400).json({ message: 'O valor do suprimento é inválido.' });
    const transactions = readData(TRANSACTIONS_DB_FILE);
    transactions.push({ id: Date.now(), type: 'suprimento', amount, user, date: new Date().toISOString() });
    writeData(TRANSACTIONS_DB_FILE, transactions);
    res.status(201).json({ message: 'Suprimento registrado com sucesso!' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao registrar o suprimento.' });
  }
});

// CASH: Transactions history (sangria/suprimento)
app.get('/api/transactions', (req, res) => {
  try {
    const authToken = req.header('x-auth-token');
    const session = authToken ? activeSessions.get(authToken) : null;
    if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
    if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem consultar o histórico de caixa.' });

    const { type = '', from, to, user = '', search = '', id: idStr, productId: productIdStr, sort: sortKey, page: pageStr, pageSize: pageSizeStr } = req.query || {};
    const typeNorm = lowercaseText(type);
    const userNorm = lowercaseText(user);
    const searchNorm = lowercaseText(search);
    const idFilter = idStr ? String(idStr).trim() : '';
    const prodIdFilter = productIdStr ? String(productIdStr).trim() : '';
    const parseDate = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d; };
    const fromDate = parseDate(from);
    const toDate = parseDate(to);

    const all = readData(TRANSACTIONS_DB_FILE) || [];
    const filtered = all.filter((t) => {
      try {
        if (typeNorm && lowercaseText(t.type) !== typeNorm) return false;
        const date = new Date(t.date);
        if (idFilter) {
          const tid = String(t.id || '').trim();
          if (tid !== idFilter) return false;
        }
        if (fromDate && date < fromDate) return false;
        if (toDate && date > toDate) return false;
        if (userNorm && !lowercaseText(t.user || '').includes(userNorm)) return false;
        if (prodIdFilter) {
          if (lowercaseText(t.type) !== 'devolucao') return false;
          const items = Array.isArray(t.items) ? t.items : [];
          const needle = lowercaseText(prodIdFilter);
          const hasProd = items.some((it) => lowercaseText(String(it.productId || it.id || it.codigo || '')).includes(needle));
          if (!hasProd) return false;
        }
        if (searchNorm) {
          const idMatch = String(t.id || '').toLowerCase().includes(searchNorm);
          const userMatch = lowercaseText(t.user || '').includes(searchNorm);
          const typeMatch = lowercaseText(t.type || '').includes(searchNorm);
          const reasonMatch = lowercaseText(t.reason || '').includes(searchNorm);
          const saleIdMatch = String(t.saleId || '').toLowerCase().includes(searchNorm);
          let itemMatch = false;
          const items = Array.isArray(t.items) ? t.items : [];
          if (items.length) {
            itemMatch = items.some((it) => {
              const pid = lowercaseText(it.productId || it.id || it.codigo || '');
              return pid.includes(searchNorm);
            });
          }
          if (!(idMatch || userMatch || typeMatch || reasonMatch || saleIdMatch || itemMatch)) return false;
        }
        return true;
      } catch { return false; }
    }).map((t) => ({
      id: t.id,
      date: t.date,
      user: t.user || '',
      type: t.type || '',
      amount: Number(t.amount || 0) || 0,
      saleId: t.saleId || null,
      items: Array.isArray(t.items) ? t.items.map(it => ({
        productId: it.productId ?? it.id ?? it.codigo ?? null,
        quantity: Number(it.quantity || 0) || 0,
        amount: Number(it.amount || 0) || 0
      })) : null,
      reason: t.reason || null
    }))
      .sort((a, b) => {
        const key = String(sortKey || 'date_desc');
        if (key === 'date_asc') return (Date.parse(a.date)||0) - (Date.parse(b.date)||0);
        if (key === 'amount_desc') return (Number(b.amount)||0) - (Number(a.amount)||0);
        if (key === 'amount_asc') return (Number(a.amount)||0) - (Number(b.amount)||0);
        return (Date.parse(b.date)||0) - (Date.parse(a.date)||0);
      });

    const pageNum = Math.max(1, parseInt(pageStr || '1', 10) || 1);
    const sizeNum = Math.min(100, Math.max(1, parseInt(pageSizeStr || '10', 10) || 10));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / sizeNum));
    const page = Math.min(pageNum, totalPages);
    const startIdx = (page - 1) * sizeNum;
    const endIdx = startIdx + sizeNum;
    const paged = filtered.slice(startIdx, endIdx);

    res.status(200).json({ total, page, pageSize: sizeNum, totalPages, results: paged });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao consultar transações.' });
  }
});

// CASH: Transactions delete (admin-only)
app.delete('/api/transactions/:id', (req, res) => {
  try {
    const authToken = req.header('x-auth-token');
    const session = authToken ? activeSessions.get(authToken) : null;
    if (!session) return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
    if (canonicalCargo(session.cargo) !== 'Administrador') return res.status(403).json({ message: 'Apenas administradores podem excluir transações.' });

    const { id } = req.params;
    const all = readData(TRANSACTIONS_DB_FILE) || [];
    const idx = all.findIndex(t => String(t.id || '') === String(id || ''));
    if (idx < 0) return res.status(404).json({ message: 'Transação não encontrada.' });
    all.splice(idx, 1);
    writeData(TRANSACTIONS_DB_FILE, all);
    return res.status(200).json({ message: 'Transação excluída com sucesso.' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno ao excluir transação.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Styllo Fashion ouvindo em http://localhost:${PORT}`);
});
