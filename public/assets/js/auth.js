document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');

    // Handle Registration Form Submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (errorMessage) errorMessage.textContent = ''; // Clear previous errors

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                // Ensure this fetch goes to the /api/register endpoint
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();

                if (result.success) {
                    // On success, redirect to the login page to sign in
                    window.location.href = `login.html?registered=true`;
                } else {
                    if (errorMessage) errorMessage.textContent = result.message;
                }
            } catch (error) {
                if (errorMessage) errorMessage.textContent = "An error occurred during registration.";
                console.error("Registration error:", error);
            }
        });
    }

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (errorMessage) errorMessage.textContent = ''; // Clear previous errors

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                // Ensure this fetch goes to the /api/login endpoint
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();

                if (result.success) {
                    // Save user data to localStorage to simulate a session and redirect
                    localStorage.setItem('codequestUser', JSON.stringify(result.userData));
                    window.location.href = 'index.html';
                } else {
                    if (errorMessage) errorMessage.textContent = result.message;
                }
            } catch (error) {
                if (errorMessage) errorMessage.textContent = "An error occurred during login.";
                console.error("Login error:", error);
            }
        });

        // Check for the 'registered=true' parameter in the URL to show a success message
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('registered') === 'true') {
            const successMessage = document.createElement('p');
            successMessage.textContent = "Registration successful! Please log in.";
            successMessage.className = "text-emerald-400 mb-4";
            loginForm.prepend(successMessage);
        }
    }
});
