const BACKEND_URL = "http://localhost:3000";

// --- Estrutura de Dados e Selectores de Elementos ---
let categorias = [
    { nome: "Acessórios", subcategorias: { Feminino: [], Masculino: [], "Infantil Feminina": [], "Infantil Masculina": [] } },
    { nome: "Blusas", subcategorias: { "Feminina": [], Masculina: [], "Infantil Feminina": [], "Infantil Masculina": [] } },
    { nome: "Bolsas", subcategorias: { Feminina: [], Masculino: [], "Infantil Feminina": [], "Infantil Masculina": [] } },
    { nome: "Bonés", subcategorias: { Feminino: [], Masculino: [] } },
    { nome: "Calçados", subcategorias: { Feminino: [], Masculino: [], "Infantil Feminino": [], "Infantil Masculino": [] } },
    { nome: "Calças", subcategorias: { Feminina: [], Masculina: [], "Infantil Feminina": [], "Infantil Masculina": [] } },
    { nome: "Cintos", subcategorias: { Feminino: [], Masculino: [] } },
    { nome: "Cropped", subcategorias: { "Feminina": [] } },
    { nome: "Saias", subcategorias: { Feminina: [], "Infantil Feminina": [] } },
    { nome: "Shorts", subcategorias: { Feminino: [], Masculino: [], "Infantil Feminina": [], "Infantil Masculina": [] } },
    { nome: "Vestidos", subcategorias: { Feminina: [], "Infantil Feminina": [] } }
];

categorias.sort((a, b) => a.nome.localeCompare(b.nome));

const menuCategorias = document.getElementById("menu-categorias");
const areaProdutos = document.getElementById("area-produtos");
const form = document.getElementById("form-produto");
const campoBusca = document.getElementById("campo-busca");
const categoriaSelect = document.getElementById("categoria-select");
const subcategoriaSelect = document.getElementById("subcategoria-select");
const tamanhosInputs = document.getElementById('tamanhos-inputs');
const fieldsetTamanhos = document.getElementById('fieldset-tamanhos');

// --- Elementos do novo Modal (Pop-up) ---
const modalProduto = document.createElement('div');
modalProduto.id = 'modal-produto';
modalProduto.className = 'modal-container';
modalProduto.innerHTML = `
    <div class="modal-content">
        <span class="close-button">&times;</span>
        <h3 id="modal-titulo"></h3>
        <p id="modal-descricao"></p>
        <div id="modal-tamanhos" class="modal-tamanhos"></div>
        
        <div class="modal-botoes">
            <button id="btn-salvar-alteracoes" class="btn-modal-salvar">Salvar Alterações</button>
            <button id="btn-excluir-produto" class="btn-modal-excluir">Excluir Produto</button>
        </div>
    </div>
`;
document.body.appendChild(modalProduto);

const btnFecharModal = modalProduto.querySelector('.close-button');
const btnExcluirProduto = document.getElementById('btn-excluir-produto');
const btnSalvarAlteracoes = document.getElementById('btn-salvar-alteracoes');
const modalTitulo = document.getElementById('modal-titulo');
const modalDescricao = document.getElementById('modal-descricao');
const modalTamanhos = document.getElementById('modal-tamanhos');


// --- Funções de Renderização e Exibição ---

function criarHtmlTamanhos(tamanhos) {
    if (!tamanhos || Object.keys(tamanhos).length === 0) {
        return '<span class="tamanho-estoque sem-estoque">Sem Tamanhos Cadastrados</span>';
    }

    const tamanhosOrdenados = Object.keys(tamanhos).sort((a, b) => {
        const ordemPadrao = ['PP', 'P', 'M', 'G', 'GG'];
        if (!isNaN(parseInt(a)) && !isNaN(parseInt(b))) {
            return parseInt(a) - parseInt(b);
        }
        return ordemPadrao.indexOf(a) - ordemPadrao.indexOf(b);
    });

    let htmlTamanhos = '';
    tamanhosOrdenados.forEach(tamanho => {
        const quantidade = tamanhos[tamanho];
        let classeAlerta = '';
        if (quantidade === 0) {
            classeAlerta = 'sem-estoque';
        } else if (quantidade > 0 && quantidade <= 15) {
            classeAlerta = 'alerta';
        }

        htmlTamanhos += `
            <div class="tamanho-estoque ${classeAlerta}">
                <span class="tamanho-nome">${tamanho}:</span>
                <span class="tamanho-quantidade">${quantidade}</span>
            </div>
        `;
    });
    return htmlTamanhos;
}

function exibirProdutos(produtos, tituloDaPagina, categoriaNome, subcategoriaNome) {
    areaProdutos.innerHTML = "";

    if (categoriaNome) {
        const btnVoltar = document.createElement("button");
        btnVoltar.className = "btn-voltar";
        btnVoltar.textContent = "↩ Voltar";
        btnVoltar.onclick = subcategoriaNome ? () => mostrarSubcategorias(categoriaNome) : () => mostrarCategorias();
        areaProdutos.appendChild(btnVoltar);
    }

    const titulo = document.createElement("h2");
    titulo.textContent = tituloDaPagina;
    areaProdutos.appendChild(titulo);

    if (!produtos || produtos.length === 0) {
        const aviso = document.createElement("p");
        if (tituloDaPagina.startsWith("Resultados para")) {
            aviso.textContent = "Nenhum produto encontrado com este termo.";
        } else {
            aviso.textContent = "Nenhum produto encontrado nesta categoria.";
        }
        areaProdutos.appendChild(aviso);
        return;
    }

    produtos.forEach(p => {
        const total = Object.values(p.tamanhos).reduce((soma, qtd) => soma + qtd, 0);
        let hasZeroStock = false;
        
        for (const tamanho in p.tamanhos) {
            if (p.tamanhos[tamanho] === 0) {
                hasZeroStock = true;
                break;
            }
        }
        
        const div = document.createElement("div");
        div.className = `produto ${total > 0 && total <= 15 ? "alerta" : ""} ${hasZeroStock ? "sem-estoque-geral" : ""}`;

        const valorFormatado = p.valor ? `R$ ${p.valor.toFixed(2).replace('.', ',')}` : "Não definido";

        div.innerHTML = `
            <div class="produto-info">
                <strong>${p.nome}</strong> (ID: ${p.id})<br>
                <em>${p.descricao}</em>
                <strong class="valor-produto">Valor: ${valorFormatado}</strong>

                <div class="area-tamanhos">
                    ${criarHtmlTamanhos(p.tamanhos)}
                </div>
            </div>
            <button class="btn-opcoes" onclick="abrirModalProduto('${p.id}', '${p.nome}', '${p.descricao}', '${p.categoriaNome}', '${p.subcategoriaNome}')">...</button>
        `;
        areaProdutos.appendChild(div);
    });
}

// --- Funções do Modal (Pop-up) ---

let produtoAtualParaEdicao = null;

function abrirModalProduto(id, nome, descricao, categoria, subcategoria) {
    modalTitulo.textContent = nome;
    modalDescricao.textContent = descricao;

    btnExcluirProduto.onclick = () => excluirProduto(id, categoria, subcategoria);
    
    fetch(`${BACKEND_URL}/produtos/${id}`)
        .then(response => response.json())
        .then(produto => {
            produtoAtualParaEdicao = produto;
            modalTamanhos.innerHTML = '';
            const isCalcado = categoria === 'Calçados';
            const tamanhosDisponiveis = Object.keys(produto.tamanhos).sort((a, b) => {
                if(isCalcado) return parseInt(a) - parseInt(b);
                const ordemRoupa = ['PP', 'P', 'M', 'G', 'GG'];
                return ordemRoupa.indexOf(a) - ordemRoupa.indexOf(b);
            });

            tamanhosDisponiveis.forEach(tamanho => {
                const qtdTamanho = produto.tamanhos[tamanho];
                const classesAlerta = qtdTamanho > 0 && qtdTamanho <= 15 ? 'alerta-tamanho' : (qtdTamanho === 0 ? 'sem-estoque-tamanho' : '');

                const tamanhoItem = document.createElement('div');
                tamanhoItem.className = `tamanho-item-modal ${classesAlerta}`;
                tamanhoItem.innerHTML = `
                    <span>${tamanho}:</span>
                    <input type="number" id="qtd-${tamanho}" name="${tamanho}" value="${qtdTamanho}" min="0" class="input-quantidade">
                `;
                modalTamanhos.appendChild(tamanhoItem);
            });

            modalProduto.classList.add('show-modal');
        })
        .catch(error => {
            console.error('Erro ao carregar produto para o modal:', error);
            alert('Não foi possível carregar os detalhes do produto.');
        });
}

function fecharModal() {
    modalProduto.classList.remove('show-modal');
    produtoAtualParaEdicao = null;
}

btnFecharModal.addEventListener('click', fecharModal);

window.addEventListener('click', (event) => {
    if (event.target === modalProduto) {
        fecharModal();
    }
});

async function excluirProduto(id, catNome, subcatNome) {
    if (!confirm(`Tem certeza que deseja excluir o produto com ID: ${id}?`)) {
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/produtos/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoriaNome: catNome, subcategoriaNome: subcatNome })
        });
        if (!response.ok) {
            throw new Error('Falha ao excluir o produto.');
        }

        alert('Produto excluído com sucesso!');
        fecharModal();
        buscarEExibirProdutos(catNome, subcatNome);
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir o produto. Verifique sua conexão com o backend.');
    }
}

async function salvarAlteracoesNoProduto() {
    if (!produtoAtualParaEdicao) {
        alert("Nenhum produto selecionado para edição.");
        return;
    }

    // Salva as informações da categoria antes de qualquer outra coisa
    const categoriaDoProduto = produtoAtualParaEdicao.categoriaNome;
    const subcategoriaDoProduto = produtoAtualParaEdicao.subcategoriaNome;

    const novosTamanhos = {};
    const inputsTamanho = modalTamanhos.querySelectorAll('input[type="number"]');

    inputsTamanho.forEach(input => {
        novosTamanhos[input.name] = parseInt(input.value, 10);
    });
    
    try {
        const response = await fetch(`${BACKEND_URL}/produtos/${produtoAtualParaEdicao.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tamanhos: novosTamanhos
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Falha ao salvar as alterações no produto.');
        }

        alert("Alterações salvas com sucesso!");
        // Agora usa as variáveis salvas para recarregar a página
        buscarEExibirProdutos(categoriaDoProduto, subcategoriaDoProduto);
        fecharModal();
        
    } catch (error) {
        console.error('Erro ao salvar alterações:', error);
        alert(`Atenção: Não foi possível salvar as alterações. Erro: ${error.message}`);
    }
}
btnSalvarAlteracoes.addEventListener('click', salvarAlteracoesNoProduto);


// --- Funções de Comunicação com o Backend (Não Alteradas) ---

async function mostrarCategorias() {
    menuCategorias.innerHTML = "";
    campoBusca.value = "";
    areaProdutos.innerHTML = `
        <h2>Bem-vindo!</h2>
        <p>Selecione uma categoria para ver os produtos.</p>
    `;

    categorias.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat.nome;
        btn.onclick = () => cat.subcategorias ? mostrarSubcategorias(cat.nome) : buscarEExibirProdutos(cat.nome);
        menuCategorias.appendChild(btn);
    });
}

function mostrarSubcategorias(categoriaNome) {
    const categoria = categorias.find(c => c.nome === categoriaNome);
    if (!categoria) return;

    areaProdutos.innerHTML = "";
    const btnVoltar = document.createElement("button");
    btnVoltar.textContent = "↩ Voltar para Categorias";
    btnVoltar.className = "btn-voltar";
    btnVoltar.onclick = () => mostrarCategorias();
    areaProdutos.appendChild(btnVoltar);

    const h2 = document.createElement("h2");
    h2.textContent = categoriaNome;
    areaProdutos.appendChild(h2);

    const lista = document.createElement("div");
    lista.className = "lista-subcategorias";

    Object.keys(categoria.subcategorias).forEach(sub => {
        const btn = document.createElement("button");
        btn.textContent = sub;
        btn.onclick = () => buscarEExibirProdutos(categoriaNome, sub);
        lista.appendChild(btn);
    });

    areaProdutos.appendChild(lista);
}

async function buscarEExibirProdutos(categoriaNome, subcategoriaNome = null) {
    areaProdutos.innerHTML = `<h2>Carregando produtos de ${categoriaNome}${subcategoriaNome ? ' - ' + subcategoriaNome : ''}...</h2>`;
    const url = `${BACKEND_URL}/produtos?categoria=${categoriaNome}${subcategoriaNome ? '&subcategoria=' + subcategoriaNome : ''}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erro ao buscar produtos do servidor.');
        }
        const produtos = await response.json();
        exibirProdutos(produtos, `${categoriaNome}${subcategoriaNome ? ' - ' + subcategoriaNome : ''}`, categoriaNome, subcategoriaNome);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        areaProdutos.innerHTML = `
            <h2>${categoriaNome}${subcategoriaNome ? ' - ' + subcategoriaNome : ''}</h2>
            <p>Ocorreu um erro ao carregar os produtos. Verifique sua conexão com o backend.</p>
        `;
    }
}

let searchTimer;

async function realizarBusca() {
    const termo = campoBusca.value.trim().toLowerCase();

    clearTimeout(searchTimer);

    if (termo === "") {
        mostrarCategorias();
        return;
    }

    searchTimer = setTimeout(async () => {
        areaProdutos.innerHTML = `<h2>Buscando por "${termo}"...</h2>`;

        try {
            const response = await fetch(`${BACKEND_URL}/produtos?termo=${termo}`);
            if (!response.ok) {
                throw new Error('Erro na busca.');
            }

            const produtosEncontrados = await response.json();
            exibirProdutos(produtosEncontrados, `Resultados para "${termo}"`, null, null);

        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            areaProdutos.innerHTML = `
                <h2>Resultados da busca</h2>
                <p>Não foi possível realizar a busca. Verifique sua conexão com o backend.</p>
            `;
        }
    }, 300);
}

async function adicionarProduto(event) {
    event.preventDefault();

    const id = document.getElementById("id").value;
    const nome = document.getElementById("nome").value;
    const descricao = document.getElementById("descricao").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const categoria = categoriaSelect.value;
    const subcategoria = subcategoriaSelect.value;

    const tamanhos = {};
    const inputsTamanho = tamanhosInputs.querySelectorAll('input[type="number"]');
    inputsTamanho.forEach(input => {
        tamanhos[input.name] = parseInt(input.value, 10);
    });

    if (categoria === "") {
        alert("Por favor, selecione uma categoria.");
        return;
    }

    const novoProduto = { id, nome, descricao, valor, categoriaNome: categoria, subcategoriaNome: subcategoria, tamanhos };

    try {
        const response = await fetch(`${BACKEND_URL}/produtos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoProduto)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Erro ao adicionar produto.');
        }

        const produtoCriado = await response.json();
        console.log("Produto adicionado:", produtoCriado);
        form.reset();
        alert("Produto adicionado com sucesso!");
        mostrarCategorias();
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        alert(`Erro ao adicionar produto: ${error.message}`);
    }
}

function carregarFormularioDeCategorias() {
    categoriaSelect.innerHTML = '';
    subcategoriaSelect.innerHTML = '';

    categoriaSelect.appendChild(new Option("Selecione uma Categoria", ""));
    subcategoriaSelect.appendChild(new Option("Selecione uma Subcategoria", ""));

    categorias.forEach(categoria => {
        const option = new Option(categoria.nome, categoria.nome);
        categoriaSelect.appendChild(option);
    });

    const gerarInputsDeTamanho = (tamanhos) => {
        tamanhosInputs.innerHTML = '';
        tamanhos.forEach(tamanho => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'tamanho-input-group';
            inputGroup.innerHTML = `
                <label for="qtd-${tamanho}">${tamanho}:</label>
                <input type="number" id="qtd-${tamanho}" name="${tamanho}" value="0" min="0" required />
            `;
            tamanhosInputs.appendChild(inputGroup);
        });
        fieldsetTamanhos.style.display = 'block';
    };

    categoriaSelect.addEventListener('change', () => {
        const categoriaSelecionada = categoriaSelect.value;
        const categoriaObj = categorias.find(c => c.nome === categoriaSelecionada);

        subcategoriaSelect.innerHTML = '';
        subcategoriaSelect.appendChild(new Option("Selecione uma Subcategoria", ""));

        if (categoriaObj?.subcategorias) {
            Object.keys(categoriaObj.subcategorias).forEach(sub => {
                const option = new Option(sub, sub);
                subcategoriaSelect.appendChild(option);
            });
        }
        toggleTamanhosVisibility();
    });

    subcategoriaSelect.addEventListener('change', toggleTamanhosVisibility);

    function toggleTamanhosVisibility() {
        const categoriaSelecionada = categoriaSelect.value;
        const subcategoriaSelecionada = subcategoriaSelect.value;

        if (categoriaSelecionada && subcategoriaSelecionada) {
            const tipo = subcategoriaSelecionada;
            let tamanhos;
            if (categoriaSelecionada === 'Calçados') {
                tamanhos = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
            } else {
                tamanhos = ['PP', 'P', 'M', 'G', 'GG'];
            }
            gerarInputsDeTamanho(tamanhos);
        } else {
            fieldsetTamanhos.style.display = 'none';
        }
    }

    fieldsetTamanhos.style.display = 'none';
}

// --- Inicialização e Event Listeners ---

document.addEventListener("DOMContentLoaded", () => {
    mostrarCategorias();
    carregarFormularioDeCategorias();
});

form.addEventListener('submit', adicionarProduto);
campoBusca.addEventListener("input", realizarBusca);