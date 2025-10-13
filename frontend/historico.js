document.addEventListener('DOMContentLoaded', () => {
  // Helpers
  const token = () => (sessionStorage.getItem('authToken') || '');
  const isAdmin = () => String(sessionStorage.getItem('userCargo') || '').trim().toLowerCase() === 'administrador';
  const toJson = async (resp) => { try { return await resp.json(); } catch { return null; } };
  const debounce = (fn, ms = 300) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), ms); }; };
  const setLoading = (listaId, msg = 'Carregando...') => { const el = document.getElementById(listaId); if (el) el.innerHTML = `<p>${msg}</p>`; };
  const api = async (path, options = {}) => { try { await ApiClient.fetch('/status', { cache: 'no-store' }); } catch (_) {} return await ApiClient.fetch(path, options); };

  // Tabs
  const tabs = Array.from(document.querySelectorAll('.tab-button'));
  const tabContents = Array.from(document.querySelectorAll('.tab-content'));
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const id = tab.getAttribute('data-tab');
      const target = document.getElementById(id);
      if (target) target.classList.add('active');
    });
  });

  // Vendedores
  const setDefaultVendedores = () => {
    document.querySelectorAll('select[id^="filtro-vendedor"]').forEach((s) => {
      if (s) s.innerHTML = '<option value="">Todos os Vendedores</option>';
    });
  };
  const setVendedores = (users) => {
    const list = Array.from(new Set((users || []).filter(Boolean))).sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));
    document.querySelectorAll('select[id^="filtro-vendedor"]').forEach((s) => {
      if (!s) return;
      s.innerHTML = '<option value="">Todos os Vendedores</option>';
      list.forEach(u => s.innerHTML += `<option value="${u}">${u}</option>`);
    });
  };
  const carregarVendedores = async () => {
    setDefaultVendedores();
    try {
      let resp = await api('/users/usernames', { headers: { 'x-auth-token': token() } });
      if (!resp.ok) resp = await api('/users', { headers: { 'x-auth-token': token() } });
      let data = await toJson(resp);
      if (data && Array.isArray(data.results)) data = data.results.map(u => u && u.username).filter(Boolean);
      if (Array.isArray(data) && data.length && typeof data[0] === 'object') data = data.map(u => u && u.username).filter(Boolean);
      if (Array.isArray(data)) setVendedores(data); else throw new Error('Formato inesperado');
    } catch (_) {
      try {
        const resp = await api('/history/sales-all');
        const vendas = await toJson(resp);
        if (Array.isArray(vendas)) setVendedores(vendas.map(v => v && v.seller));
      } catch (e2) {}
    }
  };

  // --- VENDAS ---
  const filtrosVendas = {
    vendedor: document.getElementById('filtro-vendedor-vendas'),
    dia: document.getElementById('filtro-dia-vendas'),
    diaAte: document.getElementById('filtro-dia-ate-vendas'),
    produtoId: document.getElementById('filtro-produto-id'),
    produtoNome: document.getElementById('filtro-produto-nome'),
    ordem: document.getElementById('filtro-ordem-vendas'),
    limpar: document.getElementById('limpar-filtros-vendas'),
    exportar: document.getElementById('exportar-vendas-csv')
  };
  let vendasAtuais = [];
  const resumoVendasEl = document.getElementById('resumo-vendas');
  const atualizarResumoVendas = (vendas) => {
    if (!resumoVendasEl) return;
    const arr = Array.isArray(vendas) ? vendas : [];
    const total = arr.reduce((acc, v) => acc + (Array.isArray(v.items) ? v.items.reduce((s,it)=>s+(Number(it.valor||0)||0),0) : 0), 0);
    resumoVendasEl.textContent = `${arr.length} venda(s) no Total: R$ ${total.toFixed(2)}`;
  };
  const renderizarVendas = (vendas) => {
    const lista = document.getElementById('historico-vendas-lista');
    if (!lista) return;
    lista.innerHTML = '';
    const arr = Array.isArray(vendas) ? vendas : [];
    if (!arr.length) { lista.innerHTML = '<p>Nenhuma venda encontrada para os filtros selecionados.</p>'; atualizarResumoVendas(arr); return; }
    arr.forEach((venda) => {
      const items = Array.isArray(venda.items) ? venda.items : [];
      const totalVenda = items.reduce((acc, it) => acc + (Number(it.valor || 0) || 0), 0);
      const produtosHTML = items.map(p => `<li class="${p.devolvido ? 'devolvido' : ''}">${p.nome || '-'} (ID: ${p.id || ''}) - R$ ${(Number(p.valor||0)||0).toFixed(2)}</li>`).join('');
      const div = document.createElement('div');
      div.className = 'history-item';
      let html = `
        <div class="item-header">
          <span>Venda ID: ${venda.id}</span>
          <span>${new Date(venda.date).toLocaleString('pt-BR')}</span>
        </div>
        <div class="item-details">
          <span><b>Vendedor:</b> ${venda.seller || '-'}</span>
          <span><b>Total:</b> R$ ${totalVenda.toFixed(2)}</span>
          <b>Produtos:</b>
          <ul class="product-list">${produtosHTML}</ul>
        </div>`;
      if (isAdmin()) {
        html += `
        <div class="item-actions" >
          <button class=\"btn-devolver btn-primary\" data-sale-id="${venda.id}">DevoluÃ§Ã£o</button>
          <button class="btn-excluir-venda btn-danger" data-sale-id="${venda.id}" >Excluir Venda</button>
        </div>`;
      }
      div.innerHTML = html;
      lista.appendChild(div);
    });
    atualizarResumoVendas(arr);
  };
  const vendasListaEl = document.getElementById('historico-vendas-lista');
  const modal = document.getElementById('modal-Devolução');
  const devSaleIdEl = document.getElementById('dev-sale-id');
  const devItemsEl = document.getElementById('dev-items');
  const devMotivoEl = document.getElementById('dev-motivo');
  const closeModal = () => { if (modal) modal.style.display = 'none'; };
  const openModal = () => { if (modal) modal.style.display = 'flex'; };
  const findSaleById = (id) => (Array.isArray(vendasAtuais) ? vendasAtuais.find(s => String(s.id) === String(id)) : null);
  const openRefundModal = (saleId) => {
    const sale = findSaleById(saleId);
    if (!sale || !modal || !devSaleIdEl || !devItemsEl) return;
    devSaleIdEl.textContent = saleId;
    if (devMotivoEl) devMotivoEl.value = '';
    const items = Array.isArray(sale.items) ? sale.items : [];
    devItemsEl.innerHTML = items.map((p, idx) => {
      const price = Number(p.valor || 0) || 0;
      const label = `${p.nome || '-'} (ID: ${p.id || ''}) - R$ ${price.toFixed(2)}`;
      return `<label class=\"dev-item\"><input type="checkbox" data-index="${idx}" checked /> <span>${label}</span></label>`;
    }).join('');
    openModal();
  };
  const excluirVenda = async (saleId) => {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return;
    try {
      let resp = await api(`/sales/${saleId}`, { method: 'DELETE', headers: { 'x-auth-token': token() } });
      if (!resp.ok) resp = await api(`/sales/${saleId}/delete`, { method: 'POST', headers: { 'x-auth-token': token() } });
      if (!resp.ok) throw new Error('Falha ao excluir');
      try { showToast('Venda excluída com sucesso!'); } catch (_) {}
      await buscarHistoricoVendas();
    } catch (e) {
      console.error('Erro ao excluir venda:', e);
      try { showToast('Não foi possivel excluir a venda.', 'error'); } catch (_) {}
    }
  };
  if (vendasListaEl) {
    vendasListaEl.addEventListener('click', (ev) => {
      const btnDev = ev.target.closest('.btn-devolver');
      const btnExc = ev.target.closest('.btn-excluir-venda');
      if (btnDev) openRefundModal(btnDev.getAttribute('data-sale-id'));
      else if (btnExc) excluirVenda(btnExc.getAttribute('data-sale-id'));
    });
  }
  const confirmarBtn = document.getElementById('confirmar-Devolução');
  const cancelarBtn = document.getElementById('cancelar-Devolução');
  const fecharBtn = document.getElementById('fechar-modal-Devolução');
  if (fecharBtn) fecharBtn.addEventListener('click', closeModal);
  if (cancelarBtn) cancelarBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  if (confirmarBtn) confirmarBtn.addEventListener('click', async () => {
    const saleId = devSaleIdEl ? devSaleIdEl.textContent : '';
    const sale = findSaleById(saleId);
    if (!sale) { closeModal(); return; }
    const items = Array.isArray(sale.items) ? sale.items : [];
    const checks = Array.from(devItemsEl.querySelectorAll('input[type="checkbox"][data-index]'));
    const selected = checks
      .filter(ch => ch.checked)
      .map(ch => {
        const i = parseInt(ch.getAttribute('data-index') || '-1', 10);
        const p = items[i];
        return p ? { productId: p.id || '', productName: (p.nome || p.name || ''), amount: Number(p.valor || 0) || 0 } : null;
      })
      .filter(Boolean);
    if (!selected.length) { try { showToast('Selecione ao menos um item para devolver.', 'error'); } catch (_) { alert('Selecione ao menos um item.'); } return; }
    const amount = selected.reduce((acc, it) => acc + (Number(it.amount || 0) || 0), 0);
    const payload = { saleId, amount, user: sessionStorage.getItem('username') || '', reason: (devMotivoEl?.value || '').trim(), items: selected };
    try {
      const resp = await api('/refunds', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token() }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('Falha ao registrar a Devolução');
      try { showToast('Devolução registrada com sucesso!'); } catch (_) {}
      closeModal();
      await buscarHistoricoVendas();
      try { await buscarHistoricoDevolucoes(); } catch (_) {}
    } catch (e) {
      console.error('Erro ao registrar Devolução:', e);
      try { showToast('Não foi possivel registrar a Devolução.', 'error'); } catch (_) {}
    }
  });

  const buscarHistoricoVendas = async () => {
    setLoading('historico-vendas-lista');
    const vendedor = filtrosVendas.vendedor?.value || '';
    const dia = filtrosVendas.dia?.value || '';
    const diaAte = filtrosVendas.diaAte?.value || '';
    const produtoId = filtrosVendas.produtoId?.value || '';
    const produtoNome = filtrosVendas.produtoNome?.value || '';
    const ordem = filtrosVendas.ordem?.value || 'date_desc';

    const robustQS = new URLSearchParams({ vendedor, dia, from: dia, to: (diaAte || dia), produtoId, produtoNome, search: produtoNome, sort: ordem });

    const adminParams = new URLSearchParams();
    if (vendedor) adminParams.set('seller', vendedor);
    if (dia) { adminParams.set('from', dia); adminParams.set('to', diaAte || dia); }
    if (produtoId) adminParams.set('productId', produtoId);
    if (produtoNome) adminParams.set('search', produtoNome);
    if (ordem) adminParams.set('sort', ordem);

    try {
      let resp = await api(`/sales?${adminParams.toString()}`, { headers: { 'x-auth-token': token() }, cache: 'no-store' });
      if (!resp.ok) throw new Error('fallback');
      let data = await toJson(resp);
      const vendas = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      vendasAtuais = vendas;
      renderizarVendas(vendas);
    } catch (_) {
      try {
        const resp = await api(`/history/sales-all?${robustQS.toString()}`, { cache: 'no-store' });
        const data = await toJson(resp);
        const vendas = Array.isArray(data) ? data : [];
        vendasAtuais = vendas;
        renderizarVendas(vendas);
      } catch (e2) {
        vendasAtuais = [];
        renderizarVendas([]);
      }
    }
  };
  if (filtrosVendas.vendedor) filtrosVendas.vendedor.addEventListener('change', buscarHistoricoVendas);
  if (filtrosVendas.dia) filtrosVendas.dia.addEventListener('change', buscarHistoricoVendas);
  if (filtrosVendas.diaAte) filtrosVendas.diaAte.addEventListener('change', buscarHistoricoVendas);
  if (filtrosVendas.produtoId) filtrosVendas.produtoId.addEventListener('input', debounce(buscarHistoricoVendas));
  if (filtrosVendas.produtoNome) filtrosVendas.produtoNome.addEventListener('input', debounce(buscarHistoricoVendas));
  if (filtrosVendas.ordem) filtrosVendas.ordem.addEventListener('change', buscarHistoricoVendas);
  if (filtrosVendas.limpar) filtrosVendas.limpar.addEventListener('click', () => {
    if (filtrosVendas.vendedor) filtrosVendas.vendedor.value = '';
    if (filtrosVendas.dia) filtrosVendas.dia.value = '';
    if (filtrosVendas.diaAte) filtrosVendas.diaAte.value = '';
    if (filtrosVendas.produtoId) filtrosVendas.produtoId.value = '';
    if (filtrosVendas.produtoNome) filtrosVendas.produtoNome.value = '';
    if (filtrosVendas.ordem) filtrosVendas.ordem.value = 'date_desc';
    buscarHistoricoVendas();
  });
  if (filtrosVendas.exportar) filtrosVendas.exportar.addEventListener('click', () => {
    const arr = Array.isArray(vendasAtuais) ? vendasAtuais : [];
    const rows = [['id','date','seller','total','itemsCount']];
    arr.forEach((s) => {
      const items = Array.isArray(s.items) ? s.items : [];
      const total = items.reduce((acc,it)=>acc+(Number(it.valor||0)||0),0);
      rows.push([s.id, s.date, s.seller||'', total.toFixed(2), items.length]);
    });
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vendas.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  });

  // --- TRANSAÃ‡Ã•ES (Sangrias / Suprimentos) ---
  let sangriasAtuais = [];
  let suprimentosAtuais = [];
  const renderTransacoes = (listaId, items) => {
    const lista = document.getElementById(listaId);
    if (!lista) return;
    lista.innerHTML = '';
    const arr = Array.isArray(items) ? items : [];
    if (listaId === 'historico-sangrias-lista') sangriasAtuais = arr;
    if (listaId === 'historico-suprimentos-lista') suprimentosAtuais = arr;
    // Resumo
    try {
      if (listaId === 'historico-sangrias-lista') {
        const el = document.getElementById('resumo-sangrias');
        if (el) {
          const total = arr.reduce((s, t) => s + (Number(t.amount||0)||0), 0);
          el.textContent = `${arr.length} registro(s) no Total: R$ ${total.toFixed(2)}`;
        }
      } else if (listaId === 'historico-suprimentos-lista') {
        const el = document.getElementById('resumo-suprimentos');
        if (el) {
          const total = arr.reduce((s, t) => s + (Number(t.amount||0)||0), 0);
          el.textContent = `${arr.length} registro(s) no Total: R$ ${total.toFixed(2)}`;
        }
      }
    } catch (_) {}
    if (!arr.length) { lista.innerHTML = '<p>Nenhuma transação encontrada.</p>'; return; }
    arr.forEach(t => {
      const div = document.createElement('div');
      div.className = 'history-item';
      const actions = isAdmin() ? `<button class="btn-excluir-transacao btn-danger" data-id="${t.id}" >Excluir</button>` : '';
      div.innerHTML = `
        <div class="item-header">
          <span>ID: ${t.id}</span>
          <span>${new Date(t.date).toLocaleString('pt-BR')}</span>
        </div>
        <div class="item-details">
          <span><b>Usuário:</b> ${t.user || '-'}</span>
          <span><b>Tipo:</b> ${t.type || '-'}</span>
          <span><b>Valor:</b> R$ ${(Number(t.amount||0)||0).toFixed(2)}</span>
        </div>
        ${actions ? `<div class="item-actions" >${actions}</div>` : ''}`;
      lista.appendChild(div);
    });
  };
  const excluirTransacao = async (id, refreshCb) => {
    if (!isAdmin()) { try { showToast('área restrita a administradores.', 'error'); } catch (_) {} return; }
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    try {
      const resp = await api(`/transactions/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token() } });
      if (!resp.ok) throw new Error('Falha ao excluir');
      try { showToast('Transação excluída com sucesso!'); } catch (_) {}
      if (typeof refreshCb === 'function') refreshCb();
    } catch (e) {
      console.error('Erro ao excluir transação:', e);
      try { showToast('Não foi possível excluir a transação.', 'error'); } catch (_) {}
    }
  };
  const buscarTransacoes = async (type, listaId, vendedorSelId, diaId, diaAteId, sortSelId) => {
    const vendedor = document.getElementById(vendedorSelId)?.value || '';
    const dia = document.getElementById(diaId)?.value || '';
    const diaAte = diaAteId ? (document.getElementById(diaAteId)?.value || '') : '';
    const sortVal = sortSelId ? (document.getElementById(sortSelId)?.value || '') : '';
    const params = new URLSearchParams({ type, user: vendedor });
    if (dia) params.set('from', dia);
    if (diaAte || dia) params.set('to', diaAte || dia);
    if (sortVal) params.set('sort', sortVal);
    try {
      setLoading(listaId);
      const resp = await api(`/transactions?${params.toString()}`, { headers: { 'x-auth-token': token() }, cache: 'no-store' });
      const data = await toJson(resp);
      const results = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      renderTransacoes(listaId, results);
    } catch (e) {
      renderTransacoes(listaId, []);
    }
  };

  // Eventos transaÃ§Ãµes
  const sangriaV = document.getElementById('filtro-vendedor-sangrias');
  const sangriaD = document.getElementById('filtro-dia-sangrias');
  const sangriaDA = document.getElementById('filtro-dia-ate-sangrias');
  const sangriaL = document.getElementById('limpar-filtros-sangrias');
  if (sangriaV) sangriaV.addEventListener('change', () => buscarTransacoes('sangria','historico-sangrias-lista','filtro-vendedor-sangrias','filtro-dia-sangrias','filtro-dia-ate-sangrias','ordem-sangrias'));
  if (sangriaD) sangriaD.addEventListener('change', () => buscarTransacoes('sangria','historico-sangrias-lista','filtro-vendedor-sangrias','filtro-dia-sangrias','filtro-dia-ate-sangrias','ordem-sangrias'));
  if (sangriaDA) sangriaDA.addEventListener('change', () => buscarTransacoes('sangria','historico-sangrias-lista','filtro-vendedor-sangrias','filtro-dia-sangrias','filtro-dia-ate-sangrias','ordem-sangrias'));
  if (sangriaL) sangriaL.addEventListener('click', () => { if(sangriaV) sangriaV.value=''; if(sangriaD) sangriaD.value=''; if(sangriaDA) sangriaDA.value=''; buscarTransacoes('sangria','historico-sangrias-lista','filtro-vendedor-sangrias','filtro-dia-sangrias','filtro-dia-ate-sangrias','ordem-sangrias'); });

  const suprV = document.getElementById('filtro-vendedor-suprimentos');
  const suprD = document.getElementById('filtro-dia-suprimentos');
  const suprDA = document.getElementById('filtro-dia-ate-suprimentos');
  const suprL = document.getElementById('limpar-filtros-suprimentos');
  if (suprV) suprV.addEventListener('change', () => buscarTransacoes('suprimento','historico-suprimentos-lista','filtro-vendedor-suprimentos','filtro-dia-suprimentos','filtro-dia-ate-suprimentos','ordem-suprimentos'));
  if (suprD) suprD.addEventListener('change', () => buscarTransacoes('suprimento','historico-suprimentos-lista','filtro-vendedor-suprimentos','filtro-dia-suprimentos','filtro-dia-ate-suprimentos','ordem-suprimentos'));
  if (suprDA) suprDA.addEventListener('change', () => buscarTransacoes('suprimento','historico-suprimentos-lista','filtro-vendedor-suprimentos','filtro-dia-suprimentos','filtro-dia-ate-suprimentos','ordem-suprimentos'));
  if (suprL) suprL.addEventListener('click', () => { if(suprV) suprV.value=''; if(suprD) suprD.value=''; if(suprDA) suprDA.value=''; buscarTransacoes('suprimento','historico-suprimentos-lista','filtro-vendedor-suprimentos','filtro-dia-suprimentos','filtro-dia-ate-suprimentos','ordem-suprimentos'); });

  const sangriaLista = document.getElementById('historico-sangrias-lista');
  if (sangriaLista) sangriaLista.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-excluir-transacao');
    if (btn) excluirTransacao(btn.getAttribute('data-id'), () => buscarTransacoes('sangria','historico-sangrias-lista','filtro-vendedor-sangrias','filtro-dia-sangrias','filtro-dia-ate-sangrias','ordem-sangrias'));
  });
  const suprLista = document.getElementById('historico-suprimentos-lista');
  if (suprLista) suprLista.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-excluir-transacao');
    if (btn) excluirTransacao(btn.getAttribute('data-id'), () => buscarTransacoes('suprimento','historico-suprimentos-lista','filtro-vendedor-suprimentos','filtro-dia-suprimentos','filtro-dia-ate-suprimentos','ordem-suprimentos'));
  });

  // Export CSV transaÃ§Ãµes
  const exportarSangriasBtn = document.getElementById('exportar-sangrias-csv');
  if (exportarSangriasBtn) exportarSangriasBtn.addEventListener('click', () => {
    const arr = Array.isArray(sangriasAtuais) ? sangriasAtuais : [];
    const rows = [['id','date','user','type','amount']];
    arr.forEach((t) => rows.push([t.id, t.date, t.user||'', t.type||'', Number(t.amount||0).toFixed(2)]));
    const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sangrias.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  });
  const exportarSuprBtn = document.getElementById('exportar-suprimentos-csv');
  if (exportarSuprBtn) exportarSuprBtn.addEventListener('click', () => {
    const arr = Array.isArray(suprimentosAtuais) ? suprimentosAtuais : [];
    const rows = [['id','date','user','type','amount']];
    arr.forEach((t) => rows.push([t.id, t.date, t.user||'', t.type||'', Number(t.amount||0).toFixed(2)]));
    const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'suprimentos.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  });

  // --- DEVOLUÃ‡Ã•ES ---
  const devV = document.getElementById('filtro-vendedor-devolucoes');
  const devD = document.getElementById('filtro-dia-devolucoes');
  const devDA = document.getElementById('filtro-dia-ate-devolucoes');
  const devPid = document.getElementById('filtro-produto-id-Devolução');
  const devPnm = document.getElementById('filtro-produto-nome-Devolução');
  const devL = document.getElementById('limpar-filtros-devolucoes');
  let devolucoesAtuais = [];
  const renderDevolucoesList = (items) => {
    const resumoDev = document.getElementById('resumo-devolucoes');
    const totalAmount = (Array.isArray(items) ? items : []).reduce((acc, r) => acc + (Number(r.amount||0)||0), 0);
    if (resumoDev) resumoDev.textContent = `${(items||[]).length} devoluções no Total: R$ ${totalAmount.toFixed(2)}`;

    const lista = document.getElementById('historico-devolucoes-lista');
    if (!lista) return;
    lista.innerHTML = '';
    const arr = Array.isArray(items) ? items : [];
    if (!arr.length) { lista.innerHTML = '<p>Nenhuma Devolução encontrada.</p>'; return; }
    arr.forEach((r) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      const itemsList = Array.isArray(r.items) ? r.items : [];
      const itemsHtml = itemsList.map((it) => {
        const pid = it.productId || it.id || '';
        const name = it.productName || it.nome || it.name || '-';
        const amt = Number(it.amount || 0) || 0;
        return `<li>Nome: ${name} (ID: ${pid}) valor: R$ ${amt.toFixed(2)}</li>`;
      }).join('');
      div.innerHTML = `
        <div class="item-header">
          <span>Devolução ID: ${r.id}</span>
          <span>${new Date(r.date).toLocaleString('pt-BR')}</span>
        </div>
        <div class="item-details">
          <span><b>Usuário:</b> ${r.user || '-'}</span>
          <span><b>Total:</b> R$ ${(Number(r.amount||0)||0).toFixed(2)}</span>
          <div><b>Motivo:</b> ${r.reason ? String(r.reason) : '-'}</div>
          ${itemsHtml ? `<div><b>Itens:</b><ul class="product-list">${itemsHtml}</ul></div>` : ''}
        </div>`;
      if (isAdmin()) {
        const actions = document.createElement('div');
        actions.className = 'item-actions';
        actions.style = 'margin-top:8px;display:flex;gap:8px;';
        const btn = document.createElement('button');
        btn.className = 'btn-excluir-Devolução btn-danger';
        btn.setAttribute('data-id', r.id);
        btn.textContent = 'Excluir';
        btn.style = 'background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:6px;';
        actions.appendChild(btn);
        div.appendChild(actions);
      }
      lista.appendChild(div);
    });
  };
  const renderDevolucoes = (items) => { devolucoesAtuais = Array.isArray(items) ? items : []; renderDevolucoesList(items); };
  const buscarHistoricoDevolucoes = async () => {
    const params = new URLSearchParams({
      vendedor: devV?.value || '',
      dia: devD?.value || '',
      from: devD?.value || '',
      to: (devDA?.value || devD?.value || ''),
      produtoId: devPid?.value || '',
      produtoNome: devPnm?.value || ''
    });
    const sortDev = document.getElementById('ordem-devolucoes')?.value || '';
    if (sortDev) params.set('sort', sortDev);
    try {
      setLoading('historico-devolucoes-lista');
      const resp = await api(`/history/devolucoes?${params.toString()}`, { headers: { 'x-auth-token': token() }, cache: 'no-store' });
      const data = await toJson(resp);
      const list = Array.isArray(data) ? data : [];
      renderDevolucoes(list);
    } catch (_) { renderDevolucoes([]); }
  };
  if (devV) devV.addEventListener('change', buscarHistoricoDevolucoes);
  if (devD) devD.addEventListener('change', buscarHistoricoDevolucoes);
  if (devDA) devDA.addEventListener('change', buscarHistoricoDevolucoes);
  if (devPid) devPid.addEventListener('input', debounce(buscarHistoricoDevolucoes));
  if (devPnm) devPnm.addEventListener('input', debounce(buscarHistoricoDevolucoes));
  if (devL) devL.addEventListener('click', () => { if(devV) devV.value=''; if(devD) devD.value=''; if(devDA) devDA.value=''; if(devPid) devPid.value=''; if(devPnm) devPnm.value=''; buscarHistoricoDevolucoes(); });
  const exportarDevolucoesBtn = document.getElementById('exportar-devolucoes-csv');
  if (exportarDevolucoesBtn) exportarDevolucoesBtn.addEventListener('click', () => {
    const arr = Array.isArray(devolucoesAtuais) ? devolucoesAtuais : [];
    const rows = [['id','date','user','saleId','total','itemsCount']];
    arr.forEach(r => rows.push([r.id, r.date, r.user||'', r.saleId||'', Number(r.amount||0).toFixed(2), Array.isArray(r.items)?r.items.length:0]));
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'devolucoes.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  });
  const devLista = document.getElementById('historico-devolucoes-lista');
  if (devLista) devLista.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-excluir-Devolução');
    if (btn) excluirDevolução(btn.getAttribute('data-id'));
  });
  function excluirDevolução(id) {
    if (!isAdmin()) { try { showToast('área restrita a administradores.', 'error'); } catch (_) {} return; }
    if (!confirm('Tem certeza que deseja excluir esta Devolução?')) return;
    api(`/refunds/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token() }})
      .then((resp) => { if (!resp.ok) throw new Error('Falha ao excluir'); try { showToast('Devolução excluída com sucesso!'); } catch (_) {} })
      .then(() => buscarHistoricoDevolucoes())
      .catch((e) => { console.error('Erro ao excluir Devolução:', e); try { showToast('Não foi possível excluir a Devolução.', 'error'); } catch (_) {} });
  }

  // InicializaÃ§Ã£o
  carregarVendedores();
  buscarHistoricoVendas();
  buscarTransacoes('sangria','historico-sangrias-lista','filtro-vendedor-sangrias','filtro-dia-sangrias','filtro-dia-ate-sangrias','ordem-sangrias');
  buscarTransacoes('suprimento','historico-suprimentos-lista','filtro-vendedor-suprimentos','filtro-dia-suprimentos','filtro-dia-ate-suprimentos','ordem-suprimentos');
  buscarHistoricoDevolucoes();
});




