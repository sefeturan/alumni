(function () {
  const nav = document.querySelector('.nav-links');
  if (!nav) return;
  fetch('/auth/me', { credentials: 'same-origin' })
    .then(response => response.ok ? response.json() : { user: null })
    .then(({ user }) => {
      const add = (href, label) => {
        if ([...nav.querySelectorAll('a')].some(link => link.getAttribute('href') === href)) return;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = href; a.textContent = label; li.appendChild(a); nav.appendChild(li);
      };
      if (user) {
        add('/account', 'Hesabım');
        if (user.role === 'admin') add('/admin', 'Yönetim');
        const li = document.createElement('li');
        const form = document.createElement('form');
        form.method = 'POST'; form.action = '/auth/logout';
        const button = document.createElement('button');
        button.type = 'submit'; button.textContent = 'Çıkış yap';
        form.appendChild(button); li.appendChild(form); nav.appendChild(li);
      } else {
        add('/login', 'Giriş yap');
        add('/register', 'Kayıt ol');
      }
    }).catch(() => {});
})();
