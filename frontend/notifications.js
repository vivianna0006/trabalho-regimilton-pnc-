// ===================================================================================
// ==                  SISTEMA DE NOTIFICAÇÕES (notifications.js)                   ==
// ===================================================================================
// Descrição: Este script cria e gerencia as notificações flutuantes (toasts)
// que aparecem no topo da tela para dar feedback ao usuário.
// ===================================================================================

/**
 * Exibe uma notificação flutuante (toast) na tela.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} [type='success'] - O tipo de notificação ('success' ou 'error').
 */
function showToast(message, type = 'success') {
    // Procura se o contêiner principal de toasts já existe na página.
    let container = document.getElementById('toast-container');

    // Se não existir, cria e adiciona à página.
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Cria o elemento HTML para a notificação individual.
    const toast = document.createElement('div');
    // Adiciona as classes CSS para estilizar o toast (ex: 'toast success').
    toast.className = `toast ${type}`;
    // Define o texto da notificação.
    toast.textContent = message;

    // Adiciona o toast ao contêiner na tela.
    container.appendChild(toast);

    // Define um tempo para que a notificação seja removida automaticamente.
    // O tempo (4000ms = 4s) deve corresponder à duração da animação no CSS.
    setTimeout(() => {
        toast.remove();
    }, 4000);
}