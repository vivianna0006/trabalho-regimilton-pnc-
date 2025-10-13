// Popula os selects de vendedores de forma robusta
(function(){
  const setDefaultOption = () => {
    try {
      document.querySelectorAll('select[id^="filtro-vendedor"]').forEach((select) => {
        if (!select) return;
        select.innerHTML = '<option value="">Todos os Vendedores</option>';
      });
    } catch (_) {}
  };

  const setOptions = (users) => {
    const list = Array.from(new Set((users || []).filter(Boolean)))
      .sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));
    try {
      document.querySelectorAll('select[id^="filtro-vendedor"]').forEach((select) => {
        if (!select) return;
        select.innerHTML = '<option value="">Todos os Vendedores</option>';
        list.forEach((user) => { select.innerHTML += `<option value="${user}">${user}</option>`; });
      });
    } catch (_) {}
  };

  const load = async () => {
    setDefaultOption();
    const token = (window.sessionStorage && sessionStorage.getItem('authToken')) || '';
    try { await ApiClient.fetch('/status', { cache: 'no-store' }); } catch (_) {}

    try {
      let resp = await ApiClient.fetch('/users/usernames', { headers: { 'x-auth-token': token } });
      if (!resp.ok) resp = await ApiClient.fetch('/users', { headers: { 'x-auth-token': token } });
      const data = await resp.json();
      let users = Array.isArray(data) ? data : [];
      if (users.length && typeof users[0] === 'object') {
        users = users.map(u => (u && typeof u.username === 'string') ? u.username : null).filter(Boolean);
      }
      if (users && users.length) { setOptions(users); return; }
    } catch (e) {
      // continue to fallback
    }

    // Fallback: extrai vendedores de histórico de vendas
    try {
      const resp = await ApiClient.fetch('/history/sales-all');
      const vendas = await resp.json();
      if (Array.isArray(vendas)) setOptions(vendas.map(v => v && v.seller));
    } catch (_) {}
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
