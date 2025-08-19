document.addEventListener('DOMContentLoaded', () => {
    const lessonContainer = document.getElementById('lesson-container');
    const feedbackContainer = document.getElementById('feedback-container');
    let correctAnswerIndex = -1;
    let selectedOption = null;
    let lessonData = null;

    // Enhanced notification system
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} show`;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-xl">${type === 'success' ? '🎉' : '❌'}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    // Enhanced loading animation
    function showLoading(container) {
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="spinner"></div>
                <span class="ml-4 text-gray-400 text-lg">Loading your challenge...</span>
            </div>
        `;
    }

    async function fetchLesson() {
        showLoading(lessonContainer);
        
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const lessonId = urlParams.get('id');
            if (!lessonId) throw new Error("No lesson ID found in URL");

            const response = await fetch(`/api/lesson?id=${lessonId}`);
            if (!response.ok) throw new Error('Lesson not found on the server');
            
            const lesson = await response.json();
            lessonData = lesson;
            correctAnswerIndex = lesson.correctAnswer;
            renderLesson(lesson);

        } catch (error) {
            lessonContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">😵</div>
                    <p class="text-red-400 font-bold text-xl mb-2">Oops! Quest Not Found</p>
                    <p class="text-gray-400 mb-4">${error.message}</p>
                    <button onclick="window.location.href='/dashboard.html'" class="px-6 py-3 btn-primary rounded-lg font-semibold">
                        Return to Dashboard
                    </button>
                </div>
            `;
            console.error(error);
        }
    }

    function renderLesson(lesson) {
        // Add typing animation delay
        setTimeout(() => {
            const optionsHtml = lesson.options.map((option, index) => `
                <button data-index="${index}" class="option-btn w-full text-left p-6 rounded-xl bg-gradient-to-r from-gray-700/30 to-gray-800/30 hover:from-gray-600/40 hover:to-gray-700/40 border-2 border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 text-lg group transform hover:scale-[1.02] hover:shadow-lg">
                    <div class="flex items-center">
                        <div class="w-8 h-8 rounded-full bg-gray-600/50 flex items-center justify-center mr-4 text-sm font-bold text-gray-300 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                            ${String.fromCharCode(65 + index)}
                        </div>
                        <span class="flex-1">${option}</span>
                    </div>
                </button>
            `).join('');

            lessonContainer.innerHTML = `
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-full mb-4">
                        <span class="text-white font-bold text-2xl">📚</span>
                    </div>
                    <h1 class="text-3xl md:text-4xl font-bold gradient-text mb-4">${lesson.title}</h1>
                    <div class="max-w-2xl mx-auto">
                        <p class="text-xl md:text-2xl text-white leading-relaxed mb-8 p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-400/20">
                            ${lesson.question}
                        </p>
                    </div>
                </div>
                
                <div class="space-y-4 max-w-3xl mx-auto mb-8">
                    ${optionsHtml}
                </div>
                
                <div class="text-center">
                    <button id="submit-btn" class="px-12 py-4 rounded-xl font-bold text-white btn-primary text-xl btn-disabled transition-all duration-300 transform hover:scale-105" disabled>
                        <span class="flex items-center justify-center gap-2">
                            <span>🎯</span>
                            <span>Check Answer</span>
                        </span>
                    </button>
                    <p class="text-sm text-gray-500 mt-4">Select an option to continue</p>
                </div>
            `;

            attachOptionListeners();
        }, 300);
    }

    function attachOptionListeners() {
        const optionButtons = document.querySelectorAll('.option-btn');
        const submitBtn = document.getElementById('submit-btn');

        optionButtons.forEach((btn, index) => {
            // Add entrance animation
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(20px)';
            setTimeout(() => {
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
                btn.style.transition = 'all 0.5s ease';
            }, 100 + (index * 100));

            btn.addEventListener('click', () => {
                // Remove previous selection
                optionButtons.forEach(b => {
                    b.classList.remove('border-sky-500', 'bg-sky-500/20', 'ring-2', 'ring-sky-400/50');
                    b.querySelector('.w-8').classList.remove('bg-sky-500', 'text-white');
                    b.querySelector('.w-8').classList.add('bg-gray-600/50', 'text-gray-300');
                });
                
                // Add selection styling
                btn.classList.add('border-sky-500', 'bg-sky-500/20', 'ring-2', 'ring-sky-400/50');
                btn.querySelector('.w-8').classList.remove('bg-gray-600/50', 'text-gray-300');
                btn.querySelector('.w-8').classList.add('bg-sky-500', 'text-white');
                
                selectedOption = parseInt(btn.dataset.index);
                
                // Enable submit button with animation
                submitBtn.disabled = false;
                submitBtn.classList.remove('btn-disabled');
                submitBtn.classList.add('pulse-glow');
                
                // Add click animation
                btn.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1.02)';
                }, 100);
            });
        });

        submitBtn.addEventListener('click', () => {
            if (selectedOption !== null) {
                // Add loading state to button
                submitBtn.innerHTML = `
                    <span class="flex items-center justify-center gap-2">
                        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Checking...</span>
                    </span>
                `;
                submitBtn.disabled = true;
                
                setTimeout(() => {
                    checkAnswer(selectedOption);
                }, 1000); // Add suspense!
            }
        });
    }

    async function checkAnswer(selectedIndex) {
        const isCorrect = selectedIndex === correctAnswerIndex;
        const urlParams = new URLSearchParams(window.location.search);
        const lessonId = urlParams.get('id');
        const path = lessonId.includes('python') ? 'python' : 
                   lessonId.includes('js') ? 'javascript' : 
                   lessonId.includes('sql') ? 'sql' : 'python';
        const user = JSON.parse(localStorage.getItem('codequestUser'));

        // Disable all options
        document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

        // Show correct/incorrect styling on options
        document.querySelectorAll('.option-btn').forEach((btn, index) => {
            if (index === correctAnswerIndex) {
                btn.classList.add('border-green-500', 'bg-green-500/20');
                btn.querySelector('.w-8').classList.remove('bg-sky-500', 'bg-gray-600/50');
                btn.querySelector('.w-8').classList.add('bg-green-500', 'text-white');
            } else if (index === selectedIndex && !isCorrect) {
                btn.classList.add('border-red-500', 'bg-red-500/20');
                btn.querySelector('.w-8').classList.remove('bg-sky-500');
                btn.querySelector('.w-8').classList.add('bg-red-500', 'text-white');
            }
        });

        let feedbackHtml;

        if (isCorrect && user) {
            try {
                await fetch('/api/complete-lesson', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user.username })
                });
                
                showNotification('🎉 Correct! +100 XP & +10 💎 earned!', 'success');
            } catch (error) {
                console.error("Failed to save progress:", error);
            }
            
            feedbackHtml = `
                <div class="glass-card p-8 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 transform scale-95 animate-pulse">
                    <div class="text-center">
                        <div class="text-8xl mb-6">🎉</div>
                        <h2 class="text-4xl font-bold text-emerald-400 mb-4">Outstanding!</h2>
                        <p class="text-xl text-gray-300 mb-6">You've mastered this challenge!</p>
                        
                        <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
                            <div class="bg-emerald-500/10 p-4 rounded-lg border border-emerald-400/20">
                                <div class="text-2xl font-bold text-emerald-400">+100</div>
                                <div class="text-sm text-emerald-300">XP Earned</div>
                            </div>
                            <div class="bg-yellow-500/10 p-4 rounded-lg border border-yellow-400/20">
                                <div class="text-2xl font-bold text-yellow-400">+10</div>
                                <div class="text-sm text-yellow-300">Gems</div>
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <a href="dashboard.html?path=${path}" class="inline-block px-8 py-4 rounded-xl font-bold text-white btn-primary text-lg hover:scale-105 transition-transform">
                                🏠 Return to Dashboard
                            </a>
                            <p class="text-sm text-gray-400">Your progress has been saved automatically</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            feedbackHtml = `
                <div class="glass-card p-8 rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30">
                    <div class="text-center">
                        <div class="text-8xl mb-6">🤔</div>
                        <h2 class="text-4xl font-bold text-red-400 mb-4">Not Quite Right!</h2>
                        <p class="text-xl text-gray-300 mb-6">Every expert was once a beginner. Let's try again!</p>
                        
                        <div class="bg-blue-500/10 p-6 rounded-xl border border-blue-400/20 mb-8">
                            <h3 class="font-bold text-blue-400 mb-2">💡 Learning Tip:</h3>
                            <p class="text-gray-300 text-left">The correct answer was <strong class="text-emerald-400">"${lessonData.options[correctAnswerIndex]}"</strong>. Take a moment to understand why this is the right choice!</p>
                        </div>
                        
                        <div class="flex flex-col sm:flex-row gap-4 justify-center">
                            <button id="retry-btn" class="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all hover:scale-105">
                                🔄 Try Again
                            </button>
                            <a href="dashboard.html?path=${path}" class="px-8 py-4 rounded-xl font-bold text-gray-300 bg-gray-700/50 hover:bg-gray-700 transition-all hover:scale-105">
                                🏠 Back to Dashboard
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

        // Animate feedback appearance
        feedbackContainer.innerHTML = feedbackHtml;
        const feedbackCard = feedbackContainer.querySelector('.glass-card');
        if (feedbackCard) {
            feedbackCard.style.opacity = '0';
            feedbackCard.style.transform = 'translateY(30px) scale(0.9)';
            
            setTimeout(() => {
                feedbackCard.style.opacity = '1';
                feedbackCard.style.transform = 'translateY(0) scale(1)';
                feedbackCard.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            }, 500);
        }

        // Add retry functionality
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                // Add loading animation
                retryBtn.innerHTML = `
                    <span class="flex items-center justify-center gap-2">
                        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Restarting...</span>
                    </span>
                `;
                
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            });
        }

        // Scroll to feedback
        setTimeout(() => {
            feedbackContainer.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }, 600);
    }

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        const options = document.querySelectorAll('.option-btn:not([disabled])');
        const submitBtn = document.getElementById('submit-btn');
        
        // Numbers 1-4 to select options
        if (e.key >= '1' && e.key <= '4') {
            const index = parseInt(e.key) - 1;
            if (options[index]) {
                options[index].click();
            }
        }
        
        // Enter to submit
        if (e.key === 'Enter' && submitBtn && !submitBtn.disabled) {
            submitBtn.click();
        }
        
        // Escape to go back
        if (e.key === 'Escape') {
            window.history.back();
        }
    });

    // Initialize lesson
    fetchLesson();
    
    // Add some visual flair
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            } else {
                card.style.transform = '';
            }
        });
    });
});