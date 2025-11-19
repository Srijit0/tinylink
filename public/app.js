// public/app.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('create-link-form');
    const formMessage = document.getElementById('form-message');
    const buttonText = document.getElementById('create-link-button-text');
    const spinner = document.getElementById('create-link-spinner');
  
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        formMessage.textContent = '';
        formMessage.className = 'text-sm';
  
        const formData = new FormData(form);
        const targetUrl = formData.get('targetUrl');
        const code = formData.get('code') || undefined;
  
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        spinner.classList.remove('hidden');
        buttonText.textContent = 'Creating...';
  
        try {
          const res = await fetch('/api/links', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetUrl, code })
          });
  
          const data = await res.json().catch(() => ({}));
  
          if (!res.ok) {
            formMessage.textContent = data.error || 'Failed to create link.';
            formMessage.classList.add('text-red-400');
          } else {
            formMessage.textContent = 'Link created successfully.';
            formMessage.classList.add('text-emerald-400');
            // Reload to show latest list
            setTimeout(() => {
              window.location.reload();
            }, 600);
          }
        } catch (err) {
          console.error(err);
          formMessage.textContent = 'Network error. Please try again.';
          formMessage.classList.add('text-red-400');
        } finally {
          submitButton.disabled = false;
          spinner.classList.add('hidden');
          buttonText.textContent = 'Create link';
        }
      });
    }
  
    // Delete buttons
    document.querySelectorAll('.delete-button').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const code = btn.dataset.code;
        if (!code) return;
  
        const confirmDelete = window.confirm(`Delete short link "${code}"?`);
        if (!confirmDelete) return;
  
        try {
          const res = await fetch(`/api/links/${encodeURIComponent(code)}`, {
            method: 'DELETE'
          });
  
          if (res.status === 204) {
            window.location.reload();
          } else {
            const data = await res.json().catch(() => ({}));
            alert(data.error || 'Failed to delete link.');
          }
        } catch (err) {
          console.error(err);
          alert('Network error while deleting.');
        }
      });
    });
  
    // Copy buttons
    document.querySelectorAll('.copy-button').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const value = btn.dataset.copy;
        if (!value) return;
        try {
          await navigator.clipboard.writeText(value);
          btn.textContent = 'Copied';
          setTimeout(() => {
            btn.textContent = 'Copy';
          }, 800);
        } catch (err) {
          console.error(err);
          alert('Failed to copy.');
        }
      });
    });
  });
  
