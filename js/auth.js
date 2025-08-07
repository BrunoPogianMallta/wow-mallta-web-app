document.addEventListener('DOMContentLoaded', () => {
  // =================== CONFIGURAÇÃO =================== //
  const config = {
    apiBaseUrl: 'https://api-backend-server.onrender.com'
  };

  // =================== ELEMENTOS =================== //
  const togglePasswordButtons = document.querySelectorAll('.toggle-password');

  // =================== FUNÇÕES UTILITÁRIAS =================== //
  const clearErrors = (form) => {
    const errorElements = form.querySelectorAll('.error-message');
    errorElements.forEach(el => el.textContent = '');
  };

  const showError = (field, message) => {
    const errorElement = field?.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
      errorElement.textContent = message;
    }
  };

  const handleApiError = (error, form) => {
    console.error('Erro na requisição:', error);
    alert('Erro de conexão com o servidor. Tente novamente.');
  };

  // =================== TOGGLE DE SENHA =================== //
  togglePasswordButtons.forEach(button => {
    button.addEventListener('click', () => {
      const input = button.previousElementSibling;
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      button.classList.toggle('fa-eye');
      button.classList.toggle('fa-eye-slash');
    });
  });

  // =================== FORMULÁRIO DE REGISTRO =================== //
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    const passwordInput = registerForm.querySelector('#password');
    const passwordStrength = registerForm.querySelector('#passwordStrength');

    const calculatePasswordStrength = (password) => {
      let strength = 0;
      const regexes = [
        /[a-z]/,        // minúsculas
        /[A-Z]/,        // maiúsculas
        /[0-9]/,        // números
        /[!@#$%^&*(),.?":{}|<>]/ // especiais
      ];
      regexes.forEach(regex => regex.test(password) && strength++);
      if (password.length >= 8) strength++;

      // Atualiza a UI de força
      passwordStrength.className = 'password-strength';
      let strengthClass = '', strengthText = '';

      switch (strength) {
        case 1: strengthClass = 'normal'; strengthText = 'Normal'; break;
        case 2: strengthClass = 'common'; strengthText = 'Comum'; break;
        case 3: strengthClass = 'rare'; strengthText = 'Rara'; break;
        case 4: strengthClass = 'epic'; strengthText = 'Épica'; break;
        case 5: strengthClass = 'legendary'; strengthText = 'Lendária'; break;
        default: strengthClass = ''; strengthText = '';
      }

      if (strengthClass) {
        passwordStrength.classList.add(strengthClass);
        passwordStrength.innerHTML = `<span>${strengthText}</span>`;
      }
    };

    passwordInput?.addEventListener('input', (e) => {
      calculatePasswordStrength(e.target.value);
    });

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(registerForm);

      const formData = {
        username: registerForm.querySelector('#username').value.trim(),
        email: registerForm.querySelector('#email').value.trim(),
        password: registerForm.querySelector('#password').value,
        confirmPassword: registerForm.querySelector('#confirmPassword').value,
        terms: registerForm.querySelector('#terms').checked
      };

      // Validação
      if (formData.password !== formData.confirmPassword) {
        showError(registerForm.querySelector('#confirmPassword'), 'As senhas não coincidem.');
        return;
      }

      if (!formData.terms) {
        showError(registerForm.querySelector('#terms'), 'Você deve aceitar os termos.');
        return;
      }

      try {
        const response = await fetch(`${config.apiBaseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
          alert('Registro realizado! Verifique seu e-mail para ativar sua conta.');
          window.location.href = `../pages/dashboard.html`;
        } else {
          if (data.errors) {
            data.errors.forEach(err => {
              showError(registerForm.querySelector(`#${err.field}`), err.message);
            });
          } else {
            alert(data.message || 'Erro no registro.');
          }
        }
      } catch (error) {
        handleApiError(error, registerForm);
      }
    });
  }

  // =================== FORMULÁRIO DE LOGIN =================== //
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(loginForm);

      const formData = {
        username: loginForm.querySelector('#loginUsername').value.trim(),
        password: loginForm.querySelector('#loginPassword').value,
        remember: loginForm.querySelector('#remember').checked
      };

      try {
        const response = await fetch(`${config.apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {

          localStorage.clear();
          localStorage.setItem('authToken', data.token);
          if (formData.remember) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }

          console.log('Login efetuado com sucesso!');
          window.location.href = '../pages/dashboard.html';
        } else {
          showError(loginForm.querySelector('#loginUsername'), 'Credenciais inválidas.');
          showError(loginForm.querySelector('#loginPassword'), 'Credenciais inválidas.');
        }
      } catch (error) {
        handleApiError(error, loginForm);
      }
    });

    if (localStorage.getItem('rememberMe') === 'true') {
      const rememberCheckbox = loginForm.querySelector('#remember');
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }
  }

  // =================== VERIFICAÇÃO DE AUTENTICAÇÃO =================== //
  const protectedPages = ['dashboard.html', 'profile.html', 'settings.html'];
  const currentPage = window.location.pathname.split('/').pop();

  if (protectedPages.includes(currentPage)) {
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
      window.location.href = `${window.location.origin}/pages/login.html`;
      return;
    }

    verifyToken(authToken).catch(() => {
      localStorage.removeItem('authToken');
      window.location.href = `${window.location.origin}/pages/login.html`;
    });
  }

  async function verifyToken(token) {
    const response = await fetch(`${config.apiBaseUrl}/api/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Token inválido');

    const data = await response.json();
    updateUserUI(data.user); // Ex: mostrar nome no dashboard
  }

  function updateUserUI(user) {
    const userDisplay = document.querySelector('#userDisplay');
    if (userDisplay && user?.username) {
      userDisplay.textContent = `Bem-vindo(a), ${user.username}`;
    }
  }
});
