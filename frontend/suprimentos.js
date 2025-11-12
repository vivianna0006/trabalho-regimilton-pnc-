// Aguarda a página carregar
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formSuprimento");
  const tabela = document.querySelector("#tabelaSuprimentos tbody");

  // === Função para listar suprimentos ===
  async function carregarSuprimentos() {
    const resp = await fetch("/api/suprimentos");
    const suprimentos = await resp.json();

    tabela.innerHTML = ""; // Limpa a tabela
    suprimentos.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.descricao}</td>
        <td>R$ ${Number(s.valor).toFixed(2)}</td>
        <td>${s.data || "-"}</td>
      `;
      tabela.appendChild(tr);
    });
  }

  // === Enviar novo suprimento ===
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const novo = {
      descricao: document.getElementById("descricao").value,
      valor: parseFloat(document.getElementById("valor").value),
      data: new Date().toLocaleString("pt-BR")
    };

    const resp = await fetch("/api/suprimentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novo)
    });

    if (resp.ok) {
      alert("💰 Suprimento registrado com sucesso!");
      form.reset();
      carregarSuprimentos(); // Atualiza a tabela
    } else {
      alert("❌ Erro ao registrar suprimento.");
    }
  });

  carregarSuprimentos(); // Carrega os dados ao abrir a página
});
