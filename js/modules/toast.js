export function showToast(message, options = {}) {
  // options: { duration: ms, type: 'success'|'error'|'info' }
  const duration = options.duration || 3000;
  const type = options.type || 'success';

  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
