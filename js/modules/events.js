export function setupDashboardEvents(selectors, logoutFn) {
    const logoutBtn = document.querySelector(selectors.logoutBtn);
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutFn);
    } else {
        console.warn(`Botão de logout não encontrado: ${selectors.logoutBtn}`);
    }

    const changeCharacterBtn = document.querySelector(selectors.changeCharacterBtn);
    if (changeCharacterBtn) {
        changeCharacterBtn.addEventListener('click', () => {
            const modal = document.querySelector(selectors.characterModal);
            if (modal) modal.style.display = 'block';
        });
    }

    const closeModals = document.querySelectorAll(selectors.closeModal);
    if (closeModals.length > 0) {
        closeModals.forEach(btn =>
            btn.addEventListener('click', () => {
                const modal = document.querySelector(selectors.characterModal);
                if (modal) modal.style.display = 'none';
            })
        );
    }

    const menuLinks = document.querySelectorAll(selectors.menuLinks);
    if (menuLinks.length > 0) {
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                if (!sectionId) return;

                document.querySelectorAll(selectors.dashboardSections).forEach(section => {
                    section.classList.add('hidden');
                });

                const section = document.getElementById(sectionId);
                if (section) section.classList.remove('hidden');
                else console.warn(`Seção não encontrada: ${sectionId}`);
            });
        });
    }
}
