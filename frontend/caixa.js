// ===================================================================================
// ==                          LÓGICA DA FRENTE DE CAIXA (caixa.js)                   ==
// ===================================================================================

const buscaInput = document.getElementById('busca-produto');
const listaProdutosDiv = document.getElementById('lista-produtos');
const listaVendaDiv = document.getElementById('lista-venda');
const totalVendaEl = document.getElementById('total-venda');
const finalizarVendaBtn = document.getElementById('finalizar-venda-btn');
const API_URL = 'http://localhost:3000'; // URL base do nosso servidor

let todosOsProdutos = [];
let vendaAtual = [];

/**
 * Busca todos os produtos do estoque no backend.
 */
const fetchProdutos = async () => {
    try {
        // CORREÇÃO #1: A rota correta é /produtos, sem o /api.
        const response = await fetch(`${API_URL}/produtos`);
        if (!response.ok) {
            throw new Error('Não foi possível carregar os produtos do estoque.');
        }
        todosOsProdutos = await response.json();
        renderizarProdutos([]); // Inicia com a lista de busca vazia.
    } catch (error) {
        console.error("ERRO AO BUSCAR PRODUTOS:", error);
        showToast(error.message, 'error');
    }
};

/**
 * Mostra na tela os produtos filtrados pela busca.
 * @param {Array} produtos - A lista de produtos para exibir.
 */
const renderizarProdutos = (produtos) => {
    listaProdutosDiv.innerHTML = '';
    produtos.forEach(produto => {
        const produtoDiv = document.createElement('div');
        produtoDiv.className = 'item-produto';

        // CORREÇÃO #2: Usamos 'produto.nome' e 'produto.valor' para corresponder ao estoque.json.
        produtoDiv.innerHTML = `
            <span>${produto.nome} (R$ ${produto.valor.toFixed(2)})</span>
            <button class="add-btn" data-id="${produto.id}">Adicionar</button>
        `;
        listaProdutosDiv.appendChild(produtoDiv);
    });
};

/**
 * Atualiza a lista de itens na venda atual e o valor total.
 */
const renderizarVenda = () => {
    listaVendaDiv.innerHTML = '';
    let total = 0;
    vendaAtual.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-venda';

        // CORREÇÃO #3: Usamos 'item.nome' e 'item.valor' aqui também.
        itemDiv.innerHTML = `
            <span>${item.nome} (R$ ${item.valor.toFixed(2)})</span>
            <button class="remove-btn" data-index="${index}">Remover</button>
        `;
        listaVendaDiv.appendChild(itemDiv);
        total += item.valor;
    });
    totalVendaEl.textContent = `Total: R$ ${total.toFixed(2)}`;
};

// --- EVENT LISTENERS (Funcionalidades dos botões e campos) ---

buscaInput.addEventListener('input', () => {
    const termoBusca = buscaInput.value.toLowerCase();
    if (termoBusca.length >= 2) {
        const produtosFiltrados = todosOsProdutos.filter(produto =>
            produto.nome.toLowerCase().includes(termoBusca) ||
            produto.id.toLowerCase().includes(termoBusca)
        );
        renderizarProdutos(produtosFiltrados);
    } else {
        renderizarProdutos([]);
    }
});

listaProdutosDiv.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-btn')) {
        const produtoId = e.target.dataset.id;
        const produtoParaAdicionar = todosOsProdutos.find(p => p.id === produtoId);
        if (produtoParaAdicionar) {
            vendaAtual.push({ ...produtoParaAdicionar }); // Adiciona uma cópia do produto
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

finalizarVendaBtn.addEventListener('click', async () => {
    if (vendaAtual.length === 0) {
        showToast('Adicione pelo menos um produto para finalizar a venda.', 'error');
        return;
    }
    const vendedor = sessionStorage.getItem('username');
    const saleData = { items: vendaAtual, seller: vendedor };

    try {
        const response = await fetch(`${API_URL}/api/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Ocorreu um erro no servidor.');
        }
        showToast('Venda finalizada e registrada com sucesso!');
        vendaAtual = [];
        renderizarVenda();
    } catch (error) {
        console.error("ERRO ao finalizar venda:", error);
        showToast(error.message, 'error');
    }
});

// Inicia o carregamento dos produtos assim que o script é lido.
fetchProdutos();