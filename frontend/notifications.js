
/**
 @param {string} message 
  @param {string} [type='success'] 
 */
function showToast(message, type = 'success') {
    const normalize = (text) => {
        if (typeof text !== 'string') return text;
        return text
            .replace(/Nï¿½o/g, 'NÃ£o')
            .replace(/nï¿½o/g, 'nÃ£o')
            .replace(/Sessao/g, 'SessÃ£o')
            .replace(/Faï¿½ï¿½a/g, 'FaÃ§a')
            .replace(/funcionário/g, 'funcionÃ¡rio')
            .replace(/funcionários/g, 'funcionÃ¡rios')
            .replace(/invï¿½lido/g, 'invÃ¡lido')
            .replace(/invï¿½lidos/g, 'invÃ¡lidos');
    };
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = normalize(message);
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}
