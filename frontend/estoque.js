
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
        const response = await fetch(`${BACKEND_URL}/produtos/busca?termo=${termo}`);
        if (!response.ok) {
            throw new Error('Erro na busca.');
        }
        const produtosEncontrados = await response.json();
        exibirProdutos(produtosEncontrados, `Resultados para "${termo}" (${produtosEncontrados.length} encontrados)`, null, null);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        areaProdutos.innerHTML = `
            <h2>Resultados da busca</h2>
            <p>Não foi possível realizar a busca. Tente novamente.</p>
        `;
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
            headers: {
                'Content-Type': 'application/json'
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
        console.error('Erro ao sincronizar com o backend:', error);
        alert('Atenção: Não foi possível sincronizar com o servidor.');
    }
}

// ... (código anterior do estoque.js)

/**
 * Adiciona um novo produto ao backend.
 */
form.addEventListener("submit", async e => {
    e.preventDefault();

    const catNome = document.getElementById("categoria-select").value.trim();
    const subcat = document.getElementById("subcategoria-select").value.trim();
    const id = document.getElementById("id").value.trim();
    const nome = document.getElementById("nome").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const valor = parseFloat(document.getElementById("valor-produto").value.replace(',', '.')) || 0;

    let tamanhos = {};
    const inputsTamanho = document.getElementById("tamanhos-inputs").querySelectorAll("input");
    inputsTamanho.forEach(input => {
        const tamanho = input.id.replace('qtd-', '').toUpperCase();
        tamanhos[tamanho] = parseInt(input.value) || 0;
    });

    if (!catNome || !id || !nome || !descricao || valor <= 0) {
        alert("Por favor, preencha todos os campos obrigatórios, incluindo um valor válido para o produto.");
        return;
    }

    // AQUI ESTÁ A MUDANÇA IMPORTANTE
    // Criamos o objeto que será enviado no corpo da requisição.
    // Ele precisa conter todas as informações que o backend espera.
    const novoProduto = {
        id,
        categoriaNome: catNome, // Adicionamos a categoria aqui
        subcategoriaNome: subcat, // Adicionamos a subcategoria aqui
        nome,
        descricao,
        valor,
        tamanhos
    };

    try {
        // Agora, enviamos apenas o objeto do produto.
        const response = await fetch(`${BACKEND_URL}/produtos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novoProduto) // Mudamos para enviar apenas `novoProduto`
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao adicionar o produto no backend.');
        }

        form.reset();
        carregarCategoriasNoFormulario();
        alert('Produto cadastrado com sucesso!');
        buscarEExibirProdutos(catNome, subcat || null);

    } catch (error) {
        console.error('Erro no cadastro:', error);
        alert(`Erro no cadastro: ${error.message}`);
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
document.addEventListener("DOMContentLoaded", function() {
    mostrarCategorias();
});

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
