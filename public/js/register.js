document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registrasi berhasil! Silakan login.");
            window.location.href = "index.html"; // Redirect ke halaman login
        } else {
            errorMessage.textContent = data.error || "Registrasi gagal. Coba lagi.";
        }
    } catch (error) {
        errorMessage.textContent = "Terjadi kesalahan, coba lagi nanti.";
        console.error('Error:', error);
    }
});