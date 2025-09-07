document.addEventListener('DOMContentLoaded', () => {
    // --- ROTINA DE SEGURANÇA E LÓGICA DO MENU ---
    const userCargo = sessionStorage.getItem('userCargo');
    if (!userCargo) {
        alert('Acesso negado. Por favor, faça o login primeiro.');
        window.location.href = 'index.html';
        return;
    }
    const isAdministrador = userCargo === 'Administrador';
    const adminLink = document.getElementById('admin-link');
    if (isAdministrador && adminLink) { adminLink.classList.remove('hidden'); }
    const sangriaLink = document.getElementById('sangria-link');
    if (isAdministrador && sangriaLink) { sangriaLink.classList.remove('hidden'); }
    const suprimentoLink = document.getElementById('suprimento-link');
    if (isAdministrador && suprimentoLink) { suprimentoLink.classList.remove('hidden'); }
    const historicoLink = document.getElementById('historico-link');
    if (isAdministrador && historicoLink) { historicoLink.classList.remove('hidden'); }
    const logoutBtn = document.getElementById('logout-btn-menu');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                sessionStorage.removeItem('userCargo');
                sessionStorage.removeItem('username');
                window.location.href = 'index.html';
            }
        });
    }

    // --- LÓGICA DO CAIXA ---
    const buscaInput = document.getElementById('busca-produto');
    const listaProdutosDiv = document.getElementById('lista-produtos');
    const listaVendaDiv = document.getElementById('lista-venda');
    const totalVendaEl = document.getElementById('total-venda');
    const finalizarVendaBtn = document.getElementById('finalizar-venda-btn');
    const API_URL = 'http://localhost:3000/api';
    let todosOsProdutos = [];
    let vendaAtual = [];

    const fetchProdutos = async () => {
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) throw new Error(`Erro ${response.status}: Não foi possível buscar os produtos.`);
            todosOsProdutos = await response.json();
            renderizarProdutos([]);
        } catch (error) {
            console.error("### ERRO AO BUSCAR PRODUTOS:", error);
            showToast("ERRO: " + error.message, 'error');
        }
    };

    const renderizarProdutos = (produtos) => {
        listaProdutosDiv.innerHTML = '';
        produtos.forEach(produto => {
            const produtoDiv = document.createElement('div');
            produtoDiv.className = 'item-produto';
            produtoDiv.innerHTML = `
                <span>${produto.name} (R$ ${produto.price.toFixed(2)})</span>
                <button class="add-btn" data-id="${produto.id}">Adicionar</button>
            `;
            listaProdutosDiv.appendChild(produtoDiv);
        });
    };

    const renderizarVenda = () => {
        listaVendaDiv.innerHTML = '';
        let total = 0;
        vendaAtual.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item-venda';
            itemDiv.innerHTML = `
                <span>${item.name} (R$ ${item.price.toFixed(2)})</span>
                <button class="remove-btn" data-index="${index}">Remover</button>
            `;
            listaVendaDiv.appendChild(itemDiv);
            total += item.price;
        });
        totalVendaEl.textContent = `Total: R$ ${total.toFixed(2)}`;
    };

    buscaInput.addEventListener('input', () => {
        const termoBusca = buscaInput.value.toLowerCase();
        if (termoBusca.length >= 2) {
            const produtosFiltrados = todosOsProdutos.filter(produto =>
                produto.name.toLowerCase().includes(termoBusca) ||
                produto.id.includes(termoBusca)
            );
            renderizarProdutos(produtosFiltrados);
        } else {
            renderizarProdutos([]);
        }
    });

    buscaInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const primeiroBotao = listaProdutosDiv.querySelector('.add-btn');
            if (primeiroBotao) {
                primeiroBotao.click();
            }
        }
    });

    listaProdutosDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-btn')) {
            const produtoId = e.target.dataset.id;
            const produtoParaAdicionar = todosOsProdutos.find(p => p.id === produtoId);
            if (produtoParaAdicionar) {
                vendaAtual.push(produtoParaAdicionar);
                renderizarVenda();
                buscaInput.value = '';
                renderizarProdutos([]);
                buscaInput.focus();
            }
        }
    });

    listaVendaDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const indexParaRemover = parseInt(e.target.dataset.index, 10);
            vendaAtual.splice(indexParaRemover, 1);
            renderizarVenda();
        }
    });

    // Evento de finalizar venda COM DIAGNÓSTICO
    finalizarVendaBtn.addEventListener('click', async () => {
        console.log("--- [Passo A] Botão 'Finalizar Venda' foi clicado. ---");

        if (vendaAtual.length === 0) {
            console.log("-> [Falha] A venda está vazia.");
            showToast('Adicione pelo menos um produto para finalizar a venda.', 'error');
            return;
        }
        console.log("-> [OK] A venda tem itens.");

        const vendedor = sessionStorage.getItem('username');
        if (!vendedor) {
            console.log("-> [Falha] Vendedor não encontrado no sessionStorage.");
            showToast('Erro: Vendedor não identificado. Faça login novamente.', 'error');
            return;
        }
        console.log("-> [OK] Vendedor encontrado:", vendedor);

        const saleData = { items: vendaAtual, seller: vendedor };
        console.log("-> A preparar para enviar os seguintes dados:", saleData);

        try {
            console.log("-> A iniciar a requisição 'fetch' para /api/sales...");
            const response = await fetch(`${API_URL}/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData)
            });
            console.log("-> Resposta do servidor recebida. Status:", response.status);

            const data = await response.json();
            if (!response.ok) {
                console.error("-> A resposta do servidor não foi 'ok'. Mensagem:", data.message);
                throw new Error(data.message || 'Ocorreu um erro no servidor.');
            }

            console.log("-> SUCESSO! A chamar showToast.");
            showToast('Venda finalizada e registada com sucesso!');
            vendaAtual = [];
            renderizarVenda();
        } catch (error) {
            console.error("### ERRO no bloco 'try/catch':", error);
            showToast(error.message, 'error');
        }
    });

    fetchProdutos();
});
