document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const apiBaseUrl = window.config?.apiBaseUrl || 'https://wowmallta.servehttp.com:3000';

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Função para mapear ID de classe para nome
    function getClassName(classId) {
        const classes = {
            1: 'Guerreiro',
            2: 'Paladino',
            3: 'Caçador',
            4: 'Ladino',
            5: 'Sacerdote',
            6: 'Cavaleiro da Morte',
            7: 'Xamã',
            8: 'Mago',
            9: 'Bruxo',
            11: 'Druida'
        };
        return classes[classId] || 'Desconhecido';
    }

    async function loadProfile() {
        try {
            const res = await fetch(`https://wowmallta.servehttp.com:3000/api/dashboard/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Erro ao buscar dados do perfil');

            const { data } = await res.json();

            // Sidebar
            document.querySelector('.user-profile h2').textContent = data.account.username;
            if (data.mainCharacter) {
                const classe = getClassName(data.mainCharacter.class);
                document.querySelector('.user-profile p').textContent = `Nível ${data.mainCharacter.level} - ${classe}`;
            }

            // Status
            document.querySelector('.status-item .points').textContent = data.account.votePoints;
            document.querySelectorAll('.status-item p')[1].textContent = new Date(data.account.memberSince).toLocaleDateString();
            document.querySelectorAll('.status-item p')[2].textContent = `#${data.stats.ranking}`;
            document.querySelectorAll('.status-item p')[3].textContent = `${data.stats.hoursPlayed} horas`;

            // Formulário da conta
            document.getElementById('username').value = data.account.username;
            document.getElementById('email').value = data.account.email;

        } catch (err) {
            console.error('Erro ao carregar perfil:', err);
            alert('Erro ao carregar perfil');
        }
    }

    // Atualização de perfil
    document.querySelector('.account-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            email: document.getElementById('email').value,
            currentPassword: document.getElementById('current-password').value,
            newPassword: document.getElementById('new-password').value
        };

        try {
            const response = await fetch(`https://wowmallta.servehttp.com:3000/api/dashboard/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Perfil atualizado com sucesso!');
                loadProfile();
            } else {
                alert(result.message || 'Erro ao atualizar perfil');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar com o servidor');
        }
    });

    // Logout
    const logoutBtn = document.querySelector('#logout-btn') || document.querySelector('.fa-sign-out-alt')?.closest('a');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        });
    }

    loadProfile();
});
