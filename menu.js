// --- 1. ALT MENYULARIN AÇILIB-BAĞLANMASI (ACCORDION) ---
function toggleMenu(menuId, headerElement) {
  const allMenus = document.querySelectorAll('.anim-menu');
  const allArrows = document.querySelectorAll('.arrow');
  const targetMenu = document.getElementById(menuId);
  const targetArrow = headerElement.querySelector('.arrow');

  if (!targetMenu || !targetArrow) return;

  const isOpen = targetMenu.classList.contains('open');

  // Hamısını bağla
  allMenus.forEach(m => m.classList.remove('open'));
  allArrows.forEach(a => a.classList.remove('open'));

  // Bağlı idisə aç
  if (!isOpen) {
    targetMenu.classList.add('open');
    targetArrow.classList.add('open');
  }
}

// --- 2. MOBİL MENYU İDARƏSİ ---
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const menuContent = document.getElementById('menu-bar');

  if (!menuToggle || !menuContent) return;

  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpening = !menuContent.classList.contains('menu-open');
    menuContent.classList.toggle('menu-open');
    document.body.style.overflow = isOpening ? 'hidden' : '';
  });

  document.addEventListener('click', (e) => {
    if (
      !menuToggle.contains(e.target) &&
      !menuContent.contains(e.target) &&
      menuContent.classList.contains('menu-open')
    ) {
      menuContent.classList.remove('menu-open');
      document.body.style.overflow = '';
    }
  });
});