document.addEventListener('DOMContentLoaded', () => {
  const transition = document.createElement('div');
  transition.className = 'page-transition';
  document.body.appendChild(transition);

  setTimeout(() => {
    transition.classList.add('hide');
  }, 100);

  const links = document.querySelectorAll('a[href]');

  links.forEach((link) => {
    const href = link.getAttribute('href');

    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('javascript') ||
      link.target === '_blank'
    ) {
      return;
    }

    link.addEventListener('click', (e) => {
      e.preventDefault();

      transition.classList.remove('hide');
      transition.classList.add('show');

      setTimeout(() => {
        window.location.href = href;
      }, 450);
    });
  });
});