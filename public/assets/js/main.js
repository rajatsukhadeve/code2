document.addEventListener('DOMContentLoaded', () => {
    // This function handles showing the correct links/profile info based on login state.
    function setupAuthLinks() {
        // Correctly targets the single <nav id="auth-links"> element from your index.html
        const authLinksContainer = document.getElementById('auth-links');
        if (!authLinksContainer) return; // Exit if the container isn't found

        const user = JSON.parse(localStorage.getItem('codequestUser'));

        if (user && user.username) {
            // If user is logged in, show their profile info and a logout button.
            authLinksContainer.innerHTML = `
                <div class="flex items-center gap-4">
                    <span class="font-semibold text-white">${user.username}</span>
                    <img src="https://placehold.co/40x40/818cf8/white?text=${user.username.charAt(0).toUpperCase()}" class="w-10 h-10 rounded-full border-2 border-indigo-400" alt="User Avatar">
                    <button id="logout-btn" class="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition">Logout</button>
                </div>
            `;

            // Add a click event listener to the new logout button.
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    localStorage.removeItem('codequestUser');
                    window.location.href = 'index.html'; // Redirect to home page after logout
                });
            }
        }
        // If the user is not logged in, the original HTML with "Login" and "Sign Up" buttons remains unchanged.
    }

    // --- INITIALIZE PAGE ---
    // Run the function to set up the correct header links when the page loads.
    setupAuthLinks();
});
