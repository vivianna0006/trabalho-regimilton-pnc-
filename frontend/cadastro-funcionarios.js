document.addEventListener('DOMContentLoaded', () => {
  const userCargo = sessionStorage.getItem('userCargo');
  if (!userCargo || userCargo.trim() !== 'Administrador') {
    alert('Acesso negado. Apenas gerentes podem acessar esta página.');
    window.location.href = './menu.html';
    return;
  }

  try {
    const active = document.querySelector('.navbar-links a[href*="cadastro-funcionarios.html"]');
    if (active && active.parentElement) active.parentElement.classList.add('active');
  } catch (_) {}

  const cadastroForm = document.getElementById('cadastro-form');
  const cpfInput = document.getElementById('cpf');
  const telefoneInput = document.getElementById('telefone');
  const usernameInput = document.getElementById('novo-username');
  const nomeCompletoInput = document.getElementById('nome-completo');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('nova-senha');
  const confirmPasswordInput = document.getElementById('confirmar-senha');
  const cargoSelect = document.getElementById('novo-cargo');

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());
  const toDigits = (v) => (v || '').replace(/\D/g, '');
  const isCPF = (v) => {
    const s = toDigits(v);
    if (!s || s.length !== 11) return false;
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

  const clearAllErrors = () => {
    [usernameInput, passwordInput, confirmPasswordInput, nomeCompletoInput, cpfInput, emailInput, telefoneInput].forEach((el) => {
      if (!el) return;
      const group = el.closest('.input-group');
      if (group) group.classList.remove('error');
      const fb = group ? group.querySelector('.input-feedback') : null;
      if (fb) fb.textContent = '';
    });
  };
  const markError = (el, message) => {
    if (!el) return;
    const group = el.closest('.input-group');
    if (group) group.classList.add('error');
    const fb = group ? group.querySelector('.input-feedback') : null;
    if (fb) fb.textContent = message || 'Campo obrigatório';
  };

  const setupEyeToggles = () => {
    document.querySelectorAll('.eye-toggle').forEach((btn) => {
      const targetId = btn.getAttribute('data-target');
      const target = document.getElementById(targetId);
      if (!target) return;
      const setOpen = (open) => {
        if (open) { target.type = 'text'; btn.classList.add('open'); btn.classList.remove('closed'); btn.setAttribute('aria-label', 'Ocultar senha'); btn.title = 'Ocultar senha'; }
        else { target.type = 'password'; btn.classList.remove('open'); btn.classList.add('closed'); btn.setAttribute('aria-label', 'Mostrar senha'); btn.title = 'Mostrar senha'; }
      };
      setOpen(btn.classList.contains('open'));
      btn.addEventListener('click', () => setOpen(!btn.classList.contains('open')));
    });
  };
  setupEyeToggles();

  if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
      let value = (e.target.value || '').replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = value;
      // Se perfil é Funcionário, sincroniza o nome de usuário e o preview
      if (cargoSelect && cargoSelect.value === 'Funcionario') {
        if (usernameInput) usernameInput.value = value;
        const pvUser = document.getElementById('preview-username');
        if (pvUser) pvUser.textContent = value || '-';
      }
    });
  }
  if (telefoneInput) {
    telefoneInput.addEventListener('input', () => {
      let valor = (telefoneInput.value || '').replace(/\D/g, '');
      if (valor.length > 11) valor = valor.slice(0, 11);
      valor = valor.replace(/^(\d{2})(\d)/, '($1) $2');
      valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
      telefoneInput.value = valor;
    });
  }

  const employeeListEl = document.getElementById('employee-list');
  const employeeCountEl = document.getElementById('employee-count');
  const employeeSearchEl = document.getElementById('employee-search');
  const employeeFilterEl = document.getElementById('employee-filter');
  const submitBtn = document.getElementById('submit-btn');

  const renderEmployees = (items = []) => {
  if (employeeCountEl) employeeCountEl.textContent = String(items.length || 0);
  if (!employeeListEl) return;
  if (!items.length) { employeeListEl.innerHTML = '<p>Nenhum funcionário encontrado.</p>'; return; }
  const toDigits = (v) => (v || '').replace(/\D/g, '');
  const fmtCPF = (v) => {
    const d = toDigits(v);
    if (d.length !== 11) return v || '-';
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };
  const fmtPhone = (v) => {
    const d = toDigits(v);
    if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    if (d.length === 8) return d.replace(/(\d{4})(\d{4})/, '$1-$2');
    return v || '-';
  };
    const html = items.map((u) => {
      const nome = u.nomeCompleto || '-';
      const user = u.username || '-';
      const email = u.email || '-';
      const tel = fmtPhone(u.telefone);
      const cpf = fmtCPF(u.cpf);
      const cargo = u.cargo || '-';
      return `
        <div class="employee-item">
          <div class="employee-main"><strong>${nome}</strong><span>@${user}</span></div>
          <div class="employee-meta"><span>${cargo}</span><span>${email}</span><span>${tel}</span><span>${cpf}</span></div>
          <div class="employee-actions">
            <button class="btn btn-edit" data-username="${user}" data-nome="${nome}" data-email="${email}" data-telefone="${u.telefone||''}" data-cpf="${u.cpf||''}" data-cargo="${cargo}">Editar</button>
            <button class="btn btn-danger btn-delete" data-username="${user}">Excluir</button>
          </div>
        </div>`;
    }).join('');
    employeeListEl.innerHTML = html;
  };

  // Modal edit handlers
  const editModal = document.getElementById('edit-modal-backdrop');
  const editForm = document.getElementById('edit-employee-form');
  const editCancelBtn = document.getElementById('edit-cancel');
  const editNome = document.getElementById('edit-nome');
  const editEmail = document.getElementById('edit-email');
  const editTelefone = document.getElementById('edit-telefone');
  const editCpf = document.getElementById('edit-cpf');
  const editCargo = document.getElementById('edit-cargo');
  const editPassword = document.getElementById('edit-password');
  let editingUsername = null;

  const openEditModal = (data) => {
    editingUsername = data.username;
    if (editNome) editNome.value = data.nomeCompleto || '';
    if (editEmail) editEmail.value = data.email || '';
    if (editTelefone) editTelefone.value = data.telefone || '';
    if (editCpf) editCpf.value = data.cpf || '';
    if (editCargo) editCargo.value = data.cargo || 'Funcionario';
    if (editPassword) editPassword.value = '';
    editModal?.classList.remove('hidden');
  };
  const closeEditModal = () => { editModal?.classList.add('hidden'); editingUsername = null; };
  editCancelBtn?.addEventListener('click', (e)=>{ e.preventDefault(); closeEditModal(); });

  // mask telefone/cpf in modal as user types
  editTelefone?.addEventListener('input', () => {
    let valor = (editTelefone.value || '').replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);
    if (valor.length >= 11) {
      valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (valor.length >= 10) {
      valor = valor.replace(/^(\d{2})(\d{4})(\d{4}).*/, '($1) $2-$3');
    } else if (valor.length >= 8) {
      valor = valor.replace(/^(\d{4})(\d{4}).*/, '$1-$2');
    }
    editTelefone.value = valor;
  });
  editCpf?.addEventListener('input', () => {
    let v = (editCpf.value || '').replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0,11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    editCpf.value = v;
  });

  // Delegated actions: edit/delete
  employeeListEl?.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const username = btn.getAttribute('data-username');
    if (!username) return;
    if (btn.classList.contains('btn-delete')) {
      if (!confirm(`Excluir funcionário @${username}?`)) return;
      try {
        if (!ApiClient.getBaseUrl()) { try { await ApiClient.fetch('/status', { cache: 'no-store' }); } catch (_) {} }
        const res = await ApiClient.fetch(`/users/${encodeURIComponent(username)}`, { method: 'DELETE', headers: { 'x-auth-token': sessionStorage.getItem('authToken') || '' } });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Falha ao excluir.');
        }
        try { showToast('Funcionário excluído.'); } catch(_){}
        reloadEmployeeList();
      } catch (e) { try { showToast(e.message || 'Erro ao excluir.', 'error'); } catch(_){} }
      return;
    }
    if (btn.classList.contains('btn-edit')) {
      const data = {
        username,
        nomeCompleto: btn.getAttribute('data-nome') || '',
        email: btn.getAttribute('data-email') || '',
        telefone: btn.getAttribute('data-telefone') || '',
        cpf: btn.getAttribute('data-cpf') || '',
        cargo: btn.getAttribute('data-cargo') || 'Funcionario'
      };
      openEditModal(data);
    }
  });

  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editingUsername) return closeEditModal();
    const body = {
      nomeCompleto: editNome?.value?.trim() || '',
      email: editEmail?.value?.trim() || '',
      telefone: editTelefone?.value?.trim() || '',
      cpf: editCpf?.value?.trim() || '',
      cargo: editCargo?.value || 'Funcionario'
    };
    const pw = editPassword?.value?.trim();
    if (pw && pw.length >= 6) body.password = pw;
    try {
      if (!ApiClient.getBaseUrl()) { try { await ApiClient.fetch('/status', { cache: 'no-store' }); } catch (_) {} }
      const res = await ApiClient.fetch(`/users/${encodeURIComponent(editingUsername)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': sessionStorage.getItem('authToken') || '' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Falha ao atualizar.');
      try { showToast('Funcionário atualizado.'); } catch(_){}
      closeEditModal();
      reloadEmployeeList();
    } catch (err) {
      try { showToast(err.message || 'Erro ao atualizar.', 'error'); } catch(_){}
    }
  });

  const loadLocalEmployees = () => {
    try { const list = JSON.parse(localStorage.getItem('employees') || '[]'); return { total: list.length, results: list }; }
    catch (_) { return { total: 0, results: [] }; }
  };

  const fetchEmployeesFromServer = async (params = {}) => {
    const token = sessionStorage.getItem('authToken') || '';
    const q = new URLSearchParams(params);
    const response = await ApiClient.fetch(`/users?${q.toString()}`, { method: 'GET', headers: { 'x-auth-token': token } });
    if (!response.ok) throw new Error('Falha ao buscar funcionários.');
    const data = await response.json();
    // Normaliza diferentes formatos possíveis do backend
    if (data && Array.isArray(data.results)) {
      return { total: data.total ?? data.results.length, results: data.results };
    }
    if (Array.isArray(data)) {
      if (data.length && typeof data[0] === 'string') {
        // Apenas usernames
        return { total: data.length, results: data.map(u => ({ username: String(u || '') })) };
      }
      // Array de objetos
      return { total: data.length, results: data };
    }
    return { total: 0, results: [] };
  };

  // Tries to read backend database.json directly (as requested)
  const getServerRootBase = async () => {
    try {
      if (!ApiClient.getBaseUrl()) {
        try { await ApiClient.fetch('/status', { cache: 'no-store' }); } catch (_) {}
      }
      const base = ApiClient.getBaseUrl();
      if (!base) return null;
      // strip trailing /api
      return String(base).replace(/\/api\/?$/, '');
    } catch (_) { return null; }
  };

  const fetchEmployeesFromDatabaseFile = async () => {
    const candidates = [];
    const root = await getServerRootBase();
    if (root) {
      candidates.push(`${root}/database.json`);
      candidates.push(`${root}/backend/database.json`);
    }
    // Also try relative paths from the current page (works if served by a static server at repo root)
    const here = window.location.pathname || '';
    if (here.includes('/frontend/')) {
      candidates.push('../backend/database.json');
      candidates.push('/backend/database.json');
      candidates.push('/database.json');
    } else {
      candidates.push('backend/database.json');
      candidates.push('database.json');
    }

    let lastError = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) { lastError = new Error(`HTTP ${res.status}`); continue; }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          // still try to parse to be resilient
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          // Map to expected shape
          const results = data.map((u) => ({
            username: u.username || '',
            cargo: u.cargo || '',
            nomeCompleto: u.nomeCompleto || u.username || '',
            email: u.email || '',
            telefone: u.telefone || '',
            cpf: u.cpf || ''
          }));
          return { total: results.length, results };
        }
      } catch (e) { lastError = e; }
    }
    if (lastError) throw lastError;
    return { total: 0, results: [] };
  };

  const reloadEmployeeList = async () => {
    let results = [];
    try {
      // Tenta primeiro ler diretamente o database.json (pedido do usuário)
      let data;
      try {
        data = await fetchEmployeesFromDatabaseFile();
      } catch (_) {
        data = null;
      }
      // Se falhar, tenta a rota /users
      if (!data || !Array.isArray(data.results) || data.results.length === 0) {
        const params = {};
        if (employeeSearchEl && employeeSearchEl.value) params.search = employeeSearchEl.value;
        if (employeeFilterEl && employeeFilterEl.value && employeeFilterEl.value !== 'all') params.cargo = employeeFilterEl.value;
        if (!ApiClient.getBaseUrl()) { try { await ApiClient.fetch('/status', { cache: 'no-store' }); } catch (_) {} }
        data = await fetchEmployeesFromServer(params);
      }
      results = Array.isArray(data.results) ? data.results : [];
    } catch (_) {
      const local = loadLocalEmployees();
      results = local.results || [];
      const term = (employeeSearchEl && employeeSearchEl.value || '').trim().toLowerCase();
      const role = employeeFilterEl && employeeFilterEl.value;
      if (term) {
        results = results.filter((e) => {
          const values = [e.username, e.nomeCompleto, e.email, e.telefone, e.cpf].map(v => (v || '').toLowerCase());
          return values.some(v => v.includes(term));
        });
      }
      if (role && role !== 'all') { results = results.filter((e) => (e.cargo || '').toLowerCase() === role.toLowerCase()); }
    }
    renderEmployees(results);
  };

  if (employeeSearchEl) employeeSearchEl.addEventListener('input', reloadEmployeeList);
  if (employeeFilterEl) employeeFilterEl.addEventListener('change', reloadEmployeeList);

  const saveLocalEmployee = (entry) => {
    try {
      const key = 'employees';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const now = new Date().toISOString();
      const newEntry = { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, ...entry, createdAt: now };
      list.push(newEntry);
      localStorage.setItem(key, JSON.stringify(list));
      return true;
    } catch (_) { return false; }
  };

  // Preview helpers
  const setPreview = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value || '-'; };
  const maskCPF = (digits) => {
    const d = toDigits(digits).slice(0, 11);
    if (d.length !== 11) return digits || '';
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const syncUsernameWithCPFIfNeeded = () => {
    if (!cargoSelect || cargoSelect.value !== 'Funcionario') return;
    if (!cpfInput) return;
    const value = cpfInput.value || '';
    if (usernameInput) usernameInput.value = value;
    setPreview('preview-username', value ? value : '-');
  };

  // Real-time preview updates
  nomeCompletoInput?.addEventListener('input', () => setPreview('preview-nome', nomeCompletoInput.value.trim()));
  usernameInput?.addEventListener('input', () => setPreview('preview-username', usernameInput.value.trim()));
  cpfInput?.addEventListener('input', () => setPreview('preview-cpf', maskCPF(cpfInput.value)));
  emailInput?.addEventListener('input', () => setPreview('preview-email', emailInput.value.trim()));
  telefoneInput?.addEventListener('input', () => setPreview('preview-telefone', telefoneInput.value.trim()));

  // Cargo change affects username behavior
  cargoSelect?.addEventListener('change', () => {
    const isFunc = cargoSelect.value === 'Funcionario';
    if (usernameInput) {
      usernameInput.readOnly = isFunc;
      usernameInput.placeholder = isFunc ? 'Usará o CPF automaticamente' : 'Mín. 3 caracteres';
    }
    const pvCargo = document.getElementById('preview-cargo');
    if (pvCargo) pvCargo.textContent = cargoSelect.value || '-';
    if (isFunc) syncUsernameWithCPFIfNeeded();
  });
  // Initial state for username field
  if (cargoSelect && cargoSelect.value === 'Funcionario' && usernameInput) {
    usernameInput.readOnly = true;
    usernameInput.placeholder = 'Usará o CPF automaticamente';
  }

  // Check username availability on blur
  const checkUsernameAvailability = async (value) => {
    const v = (value || '').trim();
    if (!v) return { ok: false, reason: 'Informe um usuário.' };
    try {
      const response = await ApiClient.fetch('/users/usernames', { headers: { 'x-auth-token': sessionStorage.getItem('authToken') || '' } });
      if (!response.ok) return { ok: true };
      const list = await response.json().catch(() => []);
      const exists = Array.isArray(list) && list.some(u => String(u || '').toLowerCase() === v.toLowerCase());
      return exists ? { ok: false, reason: 'Este nome de usuário já está em uso.' } : { ok: true };
    } catch (_) { return { ok: true }; }
  };
  usernameInput?.addEventListener('blur', async () => {
    if (cargoSelect?.value === 'Funcionario') return; // CPF-based, skip
    const res = await checkUsernameAvailability(usernameInput.value);
    const group = usernameInput.closest('.input-group');
    group?.classList.remove('valid', 'invalid');
    if (!res.ok) { group?.classList.add('invalid'); markError(usernameInput, res.reason); }
    else { const fb = group?.querySelector('.input-feedback'); if (fb) fb.textContent = ''; }
  });

  if (cadastroForm) {
    cadastroForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearAllErrors();

      const cargo = cargoSelect ? cargoSelect.value : 'Funcionario';
      let username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
      const nomeCompleto = nomeCompletoInput ? nomeCompletoInput.value : '';
      const cpfValue = cpfInput ? cpfInput.value : '';
      const cpfDigits = toDigits(cpfValue);
      const email = emailInput ? emailInput.value : '';
      const telefone = telefoneInput ? telefoneInput.value : '';

      let errorCount = 0; let firstError = null;
      if (!nomeCompleto.trim()) { markError(nomeCompletoInput, 'Informe o nome completo.'); firstError = firstError || nomeCompletoInput; errorCount++; }
      if (!cpfDigits) { markError(cpfInput, 'Informe o CPF.'); firstError = firstError || cpfInput; errorCount++; }
      else if (!isCPF(cpfDigits)) { markError(cpfInput, 'CPF inválido.'); firstError = firstError || cpfInput; errorCount++; }
      if (!email.trim()) { markError(emailInput, 'Informe o email.'); firstError = firstError || emailInput; errorCount++; }
      else if (!isEmail(email)) { markError(emailInput, 'Email inválido.'); firstError = firstError || emailInput; errorCount++; }
      if (!telefone.trim()) { markError(telefoneInput, 'Informe o telefone.'); firstError = firstError || telefoneInput; errorCount++; }
      if (!password) { markError(passwordInput, 'Informe a senha.'); firstError = firstError || passwordInput; errorCount++; }
      else if (password.length < 6) { markError(passwordInput, 'A senha deve ter pelo menos 6 caracteres.'); firstError = firstError || passwordInput; errorCount++; }
      if (!confirmPassword) { markError(confirmPasswordInput, 'Confirme a senha.'); firstError = firstError || confirmPasswordInput; errorCount++; }
      else if (password !== confirmPassword) { markError(confirmPasswordInput, 'As senhas não coincidem.'); firstError = firstError || confirmPasswordInput; errorCount++; }

      if (cargo === 'Funcionario') {
        if (!username) { username = cpfValue; if (usernameInput) usernameInput.value = username; }
      } else {
        if (!username || username.trim().length < 3) { markError(usernameInput, 'Informe um usuário (mín. 3 caracteres).'); firstError = firstError || usernameInput; errorCount++; }
      }

      if (errorCount > 0) {
        try { showToast(`Preencha corretamente os campos (${errorCount} erro${errorCount>1?'s':''}).`, 'error'); } catch (_) {}
        if (firstError && typeof firstError.focus === 'function') firstError.focus();
        return;
      }

      if (cargo === 'Funcionario') { username = cpfValue; if (usernameInput) usernameInput.value = username; }

      const payload = { username, password, cargo, nomeCompleto: nomeCompleto.trim(), cpf: cpfValue, email: email.trim(), telefone: telefone.trim() };

      let saved = false;
      const setSubmitting = (on) => { try { if (submitBtn) submitBtn.disabled = !!on; } catch (_) {} };
      setSubmitting(true);
      try {
        if (!ApiClient.getBaseUrl()) { try { await ApiClient.fetch('/status', { cache: 'no-store' }); } catch (_) {} }
        const response = await ApiClient.fetch('/register', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': sessionStorage.getItem('authToken') || '' }, body: JSON.stringify(payload) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const msg = String(data.message || '').toLowerCase();
          if (msg.includes('usuário') && msg.includes('uso')) markError(usernameInput, data.message);
          if (msg.includes('cpf')) markError(cpfInput, data.message);
          if (msg.includes('email')) markError(emailInput, data.message);
          throw new Error(data.message || 'Não foi possível cadastrar no servidor.');
        }
        saved = true;
      } catch (error) {
        const local = saveLocalEmployee({ ...payload, cpf: cpfDigits });
        if (local) { try { showToast('Sem conexão com o servidor. Cadastro salvo localmente.', 'error'); } catch (_) {} saved = true; }
        else { try { showToast(error.message || 'Falha ao cadastrar.', 'error'); } catch (_) {} }
      } finally { setSubmitting(false); }

      if (saved) {
        try { showToast('Funcionário cadastrado com sucesso!'); } catch (_) {}
        cadastroForm.reset();
        if (usernameInput) usernameInput.value = '';
        const pv = (id) => document.getElementById(id);
        ['preview-username','preview-cpf','preview-nome','preview-email','preview-telefone'].forEach(k => { const el = pv(k); if (el) el.textContent = '-'; });
        reloadEmployeeList();
      }
    });
  }

  document.getElementById('reset-btn')?.addEventListener('click', (ev) => {
    ev.preventDefault();
    [usernameInput, passwordInput, confirmPasswordInput, nomeCompletoInput, cpfInput, emailInput, telefoneInput].forEach((el) => { if (el) el.value = ''; });
    clearAllErrors();
    const pv = (id) => document.getElementById(id);
    ['preview-username','preview-cpf','preview-nome','preview-email','preview-telefone'].forEach((k) => { const el = pv(k); if (el) el.textContent = '-'; });
  });

  reloadEmployeeList();
  // Ensure initial username preview state for Funcionário
  syncUsernameWithCPFIfNeeded();
});


