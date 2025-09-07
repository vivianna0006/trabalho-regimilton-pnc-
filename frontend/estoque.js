
// A URL base é declarada no topo do arquivo para ser acessível em qualquer função.
const BACKEND_URL = "http://localhost:3000";


// ==== Estrutura de Dados ====


// Mantém a estrutura de categorias e subcategorias para construir o menu de navegação.
// Os produtos são carregados dinamicamente do backend.
let categorias = [
    {
        nome: "Acessórios",
        subcategorias: {
            Feminino: [],
            Masculino: []
        }
    },
    {
        nome: "Blusas",
        subcategorias: {
            "Feminina": [],
            Masculina: [],
            "Infantil Feminina": [],
            "Infantil Masculina": []
        }
    },
    {
        nome: "Bolsas",
        subcategorias: {
            Feminina: [],
            Masculina: [],
            "Infantil Feminina": [],
            "Infantil Masculina": []
        }
    },
    {
        nome: "Bonés",
        subcategorias: {
            Feminino: [],
            Masculino: []
        }
    },
    {
        nome: "Calçados",
        subcategorias: {
            Feminino: [],
            Masculino: [],
            "Infantil Feminino": [],
            "Infantil Masculino": []
        }
    },
    {
        nome: "Calças",
        subcategorias: {
            Feminina: [],
            Masculina: [],
            "Infantil Feminina": [],
            "Infantil Masculina": []
        }
    },
    {
        nome: "Cintos",
        subcategorias: {
            Feminino: [],
            Masculino: []
        }
    },
    {
        nome: "Cropped",
        subcategorias: {
            "Feminina": []
        }
    },
    {
        nome: "Saias",
        subcategorias: {
            Feminina: [],
            "Infantil Feminina": []
        }
    },
    {
        nome: "Shorts",
        subcategorias: {
            Feminino: [],
            Masculino: [],
            "Infantil Feminina": [],
            "Infantil Masculina": []
        }
    },
    {
        nome: "Vestidos",
        subcategorias: {
            Feminina: [],
            "Infantil Feminina": []
        }
    }
];

// Ordena as categorias em ordem alfabética.
categorias.sort((a, b) => a.nome.localeCompare(b.nome));

// ==== Seletores de Elementos HTML ====
const menuCategorias = document.getElementById("menu-categorias");
const areaProdutos = document.getElementById("area-produtos");
const form = document.getElementById("form-produto");
const campoBusca = document.getElementById("campo-busca");
const categoriaSelect = document.getElementById("categoria-select");
const subcategoriaSelect = document.getElementById("subcategoria-select");
const valorProdutoInput = document.getElementById("valor-produto");

// ==== Funções de Renderização e Exibição ====
/**
 * Exibe a lista de produtos na área principal.
 * @param {Array} produtosParaExibir - Lista de produtos a serem exibidos.
 * @param {string} tituloDaPagina - Título da página de produtos.
 * @param {string} categoriaNome - Nome da categoria.
 * @param {string} subcategoriaNome - Nome da subcategoria (opcional).
 */
function exibirProdutos(produtosParaExibir, tituloDaPagina, categoriaNome, subcategoriaNome) {
    areaProdutos.innerHTML = "";

    if (categoriaNome) {
        const btnVoltar = document.createElement("button");
        btnVoltar.className = "btn-voltar";
        if (subcategoriaNome) {
            btnVoltar.textContent = "↩ Voltar para Subcategorias";
            btnVoltar.onclick = () => mostrarSubcategorias(categoriaNome);
        } else {
            btnVoltar.textContent = "↩ Voltar para Categorias";
            btnVoltar.onclick = () => mostrarCategorias();
        }
        areaProdutos.appendChild(btnVoltar);
    }

    const titulo = document.createElement("h2");
    titulo.textContent = tituloDaPagina;
    areaProdutos.appendChild(titulo);

    if (!produtosParaExibir || produtosParaExibir.length === 0) {
        const aviso = document.createElement("p");
        aviso.textContent = "Sem produtos nesta categoria.";
        areaProdutos.appendChild(aviso);
        return;
    }

    produtosParaExibir.forEach(p => {
        const total = Object.values(p.tamanhos).reduce((soma, qtd) => soma + qtd, 0);
        const div = document.createElement("div");
        div.className = "produto";

        if (total <= 10 && total > 0) {
            div.classList.add("alerta");
        } else if (total === 0) {
            div.classList.add("sem-estoque");
        }

        let tamanhosHTML = '';
        for (const tamanho in p.tamanhos) {
            const qtdTamanho = p.tamanhos[tamanho];
            let classesAlerta = '';
            if (qtdTamanho <= 10 && qtdTamanho > 0) {
                classesAlerta = 'alerta-tamanho';
            } else if (qtdTamanho === 0) {
                classesAlerta = 'sem-estoque-tamanho';
            }
            tamanhosHTML += `
                <div class="tamanho-item ${classesAlerta}">
                    <span>${tamanho}: ${p.tamanhos[tamanho]}</span>
                    <button onclick="alterarQuantidade('${categoriaNome}', '${p.id}', 1, '${subcategoriaNome || ""}', '${tamanho}')">+</button>
                    <button onclick="alterarQuantidade('${categoriaNome}', '${p.id}', -1, '${subcategoriaNome || ""}', '${tamanho}')">-</button>
                </div>
            `;
        }

        const valorFormatado = p.valor ? `R$ ${p.valor.toFixed(2).replace('.', ',')}` : "Não definido";
        div.innerHTML = `
            <strong>${p.nome}</strong> (ID: ${p.id})<br>
            <em>${p.descricao}</em>
            <strong class="valor-produto">Valor: ${valorFormatado}</strong>
            <div class="area-tamanhos">${tamanhosHTML}</div>
            <strong class="total">Quantidade Total: ${total}</strong>
        `;
        areaProdutos.appendChild(div);
    });
}

/**
 * Cria os botões das categorias no menu.
 */
function mostrarCategorias() {
    menuCategorias.innerHTML = "";
    campoBusca.value = "";
    areaProdutos.innerHTML = `
        <h2>Bem-vindo!</h2>
        <p>Selecione uma categoria para ver os produtos.</p>
    `;

    categorias.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat.nome;
        btn.onclick = () => {
            if (cat.subcategorias) {
                mostrarSubcategorias(cat.nome);
            } else {
                buscarEExibirProdutos(cat.nome);
            }
        };
        menuCategorias.appendChild(btn);
    });
    carregarCategoriasNoFormulario();
}

/**
 * Mostra as subcategorias de uma categoria selecionada.
 * @param {string} categoriaNome - O nome da categoria.
 */
function mostrarSubcategorias(categoriaNome) {
    const categoria = categorias.find(c => c.nome === categoriaNome);
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

// ==== Funções de Comunicação com o Backend ====
/**
 * Busca produtos no backend e os exibe na tela.
 * @param {string} categoriaNome - A categoria para buscar.
 * @param {string} [subcategoriaNome=null] - A subcategoria para buscar (opcional).
 */
async function buscarEExibirProdutos(categoriaNome, subcategoriaNome = null) {
    areaProdutos.innerHTML = `
        <h2>Carregando produtos de ${categoriaNome}${subcategoriaNome ? ' - ' + subcategoriaNome : ''}...</h2>
    `;
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

/**
 * Realiza uma busca de produtos no backend com base em um termo.
 */
async function realizarBusca() {
    const termo = campoBusca.value.trim().toLowerCase();

    if (termo === "") {
        mostrarCategorias();
        return;
    }

   try {
        const response = await fetch(`${BACKEND_URL}/produtos?termo=${encodeURIComponent(termo)}`);
        if (!response.ok) throw new Error('Erro na busca.');
        const produtosEncontrados = await response.json();
        exibirProdutos(produtosEncontrados, `Resultados para "${termo}"`, null, null);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        areaProdutos.innerHTML = `<p>Não foi possível realizar a busca.</p>`;
    }
}


/**
 * Altera a quantidade de um produto no backend.
 * @param {string} catNome - Nome da categoria.
 * @param {string} prodId - ID do produto.
 * @param {number} delta - A quantidade a ser adicionada ou removida (+1 ou -1).
 * @param {string} [subcatNome=null] - Nome da subcategoria (opcional).
 * @param {string} tamanho - O tamanho do produto.
 */
async function alterarQuantidade(catNome, prodId, delta, subcatNome = null, tamanho) {
    try {
        const response = await fetch(`${BACKEND_URL}/produtos/${prodId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                categoriaNome: catNome,
                subcategoriaNome: subcatNome,
                tamanho: tamanho,
                delta: delta
            })
        });

        if (!response.ok) {
            throw new Error('Falha ao atualizar a quantidade no backend.');
        }

        if (campoBusca.value.trim() !== "") {
            realizarBusca();
        } else {
            buscarEExibirProdutos(catNome, subcatNome);
        }
 } catch (error) {
        console.error('Erro ao alterar quantidade:', error);
        alert(`Erro: ${error.message}`);
    }
}

// ... (código anterior do estoque.js)

/**
 * Adiciona um novo produto ao backend.
 */
form.addEventListener("submit", async e => {
    e.preventDefault();
    const novoProduto = {
        id: document.getElementById("id").value.trim(),
        nome: document.getElementById("nome").value.trim(),
        descricao: document.getElementById("descricao").value.trim(),
        valor: parseFloat(document.getElementById("valor-produto").value.replace(',', '.')) || 0,
        categoriaNome: document.getElementById("categoria-select").value.trim(),
        subcategoriaNome: document.getElementById("subcategoria-select").value.trim(),
        tamanhos: {}
    };
    const inputsTamanho = document.getElementById("tamanhos-inputs").querySelectorAll("input");
    inputsTamanho.forEach(input => {
        const tamanho = input.id.replace('qtd-', '').toUpperCase();
        novoProduto.tamanhos[tamanho] = parseInt(input.value) || 0;
    });

    if (!novoProduto.id || !novoProduto.nome || !novoProduto.categoriaNome || !novoProduto.valor) {
        showToast("Preencha todos os campos obrigatórios, incluindo um valor válido.", 'error');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/produtos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoProduto)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao adicionar o produto no backend.');
        }

        form.reset();
        carregarCategoriasNoFormulario();
        showToast('Produto cadastrado com sucesso!');

        // AÇÃO CORRIGIDA: Em vez de tentar recarregar uma categoria indefinida,
        // vamos voltar para a visão geral das categorias.
        mostrarCategorias();

    } catch (error) {
        console.error('Erro no cadastro:', error);
        showToast(`Erro no cadastro: ${error.message}`, 'error');
    }
});


// ==== Funções de Formulário e UI ====
/**
 * Carrega as categorias no campo de seleção do formulário.
 */
function carregarCategoriasNoFormulario() {
    categoriaSelect.innerHTML = '<option value="">Selecione a Categoria</option>';
    categorias.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.nome;
        option.textContent = cat.nome;
        categoriaSelect.appendChild(option);
    });
    const novaCategoriaOption = document.createElement("option");
    novaCategoriaOption.value = "nova-categoria";
    novaCategoriaOption.textContent = "Adicionar nova categoria";
    categoriaSelect.appendChild(novaCategoriaOption);
}

/**
 * Atualiza os campos de entrada de tamanho com base na categoria selecionada.
 * @param {string} categoriaNome - O nome da categoria selecionada.
 */
function atualizarCamposTamanho(categoriaNome) {
    const tamanhosInputsContainer = document.getElementById("tamanhos-inputs");
    tamanhosInputsContainer.innerHTML = '';

    let tamanhos;
    if (categoriaNome === "Calçados") {
        tamanhos = Array.from({ length: 10 }, (_, i) => (34 + i).toString());
    } else {
        tamanhos = ["PP", "P", "M", "G", "GG"];
    }

    tamanhos.forEach(tamanho => {
        const div = document.createElement("div");
        div.className = "tamanho-input-item";

        const label = document.createElement("label");
        label.textContent = tamanho;
        label.setAttribute("for", `qtd-${tamanho}`);

        const input = document.createElement("input");
        input.type = "number";
        input.id = `qtd-${tamanho}`;
        input.name = `tamanhos[${tamanho}]`;
        input.min = "0";
        input.value = "0";

        div.appendChild(label);
        div.appendChild(input);
        tamanhosInputsContainer.appendChild(div);
    });
}

// ==== Event Listeners e Inicialização ====
// Inicia o sistema ao carregar a página
    mostrarCategorias();
campoBusca.addEventListener("input", realizarBusca);

categoriaSelect.addEventListener("change", (e) => {
    const categoriaNome = e.target.value;
    const categoria = categorias.find(c => c.nome === categoriaNome);

    subcategoriaSelect.innerHTML = '';
    subcategoriaSelect.style.display = 'none';

    const tamanhosInputsContainer = document.getElementById("tamanhos-inputs");
    tamanhosInputsContainer.innerHTML = '';

    if (categoria && categoria.subcategorias) {
        subcategoriaSelect.style.display = 'inline-block';
        Object.keys(categoria.subcategorias).forEach(sub => {
            const option = document.createElement("option");
            option.value = sub;
            option.textContent = sub;
            subcategoriaSelect.appendChild(option);
        });
        const novaSubcategoriaOption = document.createElement("option");
        novaSubcategoriaOption.value = "nova-subcategoria";
        novaSubcategoriaOption.textContent = "Adicionar nova subcategoria";
        subcategoriaSelect.appendChild(novaSubcategoriaOption);
    }

    atualizarCamposTamanho(categoriaNome);
});
const formatarMoeda = (valor) => {
    // Remove tudo que não for número
    const apenasNumeros = valor.replace(/\D/g, '');

    // Se não houver números, retorna uma string vazia
    if (!apenasNumeros) return '';

    // Garante que temos pelo menos 3 dígitos para os centavos
    const numeroComZeros = apenasNumeros.padStart(3, '0');
    const centavos = numeroComZeros.slice(-2);
    const inteiro = numeroComZeros.slice(0, -2);

    // Formata a parte inteira com pontos de milhar
    const inteiroFormatado = parseInt(inteiro, 10).toLocaleString('pt-BR');

    return `${inteiroFormatado},${centavos}`;
};

// Adiciona o "ouvinte" que formata o valor enquanto o usuário digita
valorProdutoInput.addEventListener('input', () => {
    valorProdutoInput.value = formatarMoeda(valorProdutoInput.value);
});