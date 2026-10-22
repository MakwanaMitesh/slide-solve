// ==============================================================================
// Authentication & Session Management Client Script
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Handle Login Form if present
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const loginBtn = document.getElementById('loginBtn');
    const loginAlert = document.getElementById('loginAlert');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    if (togglePasswordBtn && passwordInput) {
      togglePasswordBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePasswordBtn.innerHTML = isPassword
          ? '<i class="bi bi-eye-slash"></i>'
          : '<i class="bi bi-eye"></i>';
      });
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginAlert.classList.add('d-none');
      loginAlert.textContent = '';

      const login = document.getElementById('login').value.trim();
      const password = passwordInput.value;

      if (!login || !password) {
        loginAlert.textContent = 'Please enter both username/email and password.';
        loginAlert.classList.remove('d-none');
        return;
      }

      // Show loading spinner
      const originalBtnHtml = loginBtn.innerHTML;
      loginBtn.disabled = true;
      loginBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Authenticating...
      `;

      try {
        const response = await fetch('/api/v1/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ login, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Store token in session storage as fallback reference
          if (data.csrfToken) {
            sessionStorage.setItem('csrfToken', data.csrfToken);
          }
          window.location.href = '/admin/dashboard';
        } else {
          loginAlert.textContent = data.message || 'Invalid username or password.';
          loginAlert.classList.remove('d-none');
        }
      } catch (err) {
        console.error('Login network error:', err);
        loginAlert.textContent = 'Network or server error. Please try again.';
        loginAlert.classList.remove('d-none');
      } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalBtnHtml;
      }
    });
  }

  // 2. Handle Logout Actions
  document.querySelectorAll('.btn-logout').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await fetch('/api/v1/admin/logout', {
          method: 'POST',
          headers: { Accept: 'application/json' }
        });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        sessionStorage.clear();
        window.location.href = '/admin/login';
      }
    });
  });

  // 3. Mobile Sidebar Toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  const adminSidebar = document.querySelector('.admin-sidebar');
  const sidebarBackdrop = document.querySelector('.sidebar-backdrop');

  if (sidebarToggle && adminSidebar) {
    sidebarToggle.addEventListener('click', () => {
      adminSidebar.classList.toggle('show');
      if (sidebarBackdrop) sidebarBackdrop.classList.toggle('show');
    });

    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', () => {
        adminSidebar.classList.remove('show');
        sidebarBackdrop.classList.remove('show');
      });
    }
  }

  // 4. Fetch Current User Profile & Guard Protected Pages
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.includes('/login');

  if (!isLoginPage && currentPath.startsWith('/admin')) {
    fetch('/api/v1/admin/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => {
        if (data.success && data.user) {
          const userDisplayNames = document.querySelectorAll('.user-display-name');
          const userDisplayEmails = document.querySelectorAll('.user-display-email');
          userDisplayNames.forEach((el) => (el.textContent = data.user.username));
          userDisplayEmails.forEach((el) => (el.textContent = data.user.email));
          if (data.csrfToken) {
            sessionStorage.setItem('csrfToken', data.csrfToken);
          }
        } else {
          window.location.replace('/admin/login');
        }
      })
      .catch(() => {
        // Unauthorized - immediate redirect to login
        window.location.replace('/admin/login');
      });
  }
});
