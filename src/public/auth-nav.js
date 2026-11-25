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
      const remove = href => nav.querySelectorAll('a').forEach(link => {
        if (link.getAttribute('href') === href) link.closest('li')?.remove();
      });
      if (user) {
        remove('/login'); remove('/register');
        if (user.role !== 'admin') remove('/users');
        add('/account', user.role === 'student' ? 'Öğrenci alanım' : user.role === 'alumni' ? 'Mezun alanım' : 'Hesabım');
        if (user.role === 'admin') add('/admin', 'Yönetim paneli');
        if (!nav.querySelector('form[action="/auth/logout"]')) {
          const li = document.createElement('li');
          const form = document.createElement('form');
          form.method = 'POST'; form.action = '/auth/logout';
          const button = document.createElement('button');
          button.type = 'submit'; button.textContent = 'Çıkış yap';
          form.appendChild(button); li.appendChild(form); nav.appendChild(li);
        }
      } else {
        remove('/users'); remove('/account'); remove('/admin');
        add('/login', 'Giriş yap');
        add('/register', 'Kayıt ol');
      }
    }).catch(() => {});
})();
