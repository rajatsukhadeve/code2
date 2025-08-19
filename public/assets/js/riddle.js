document.addEventListener('DOMContentLoaded', () => {
    const riddleDescription = document.getElementById('riddle-description');
    const codeEditor = document.getElementById('code-editor');
    const runCodeBtn = document.getElementById('run-code-btn');
    const resetBtn = document.getElementById('reset-btn');
    const outputText = document.getElementById('output-text');
    const successCelebration = document.getElementById('success-celebration');
    let solution = '';
    let originalScaffold = '';
    let riddleData = null;
    let attempts = 0;

    // Enhanced notification system
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) {
            // Create container if it doesn't exist
            const newContainer = document.createElement('div');
            newContainer.id = 'notification-container';
            newContainer.className = 'fixed top-4 right-4 z-50';
            document.body.appendChild(newContainer);
        }
        
        const notificationContainer = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type} show`;
        notification.innerHTML = `
            <div class="flex items-center gap-3 bg-gray-800/90 backdrop-blur-sm px-4 py-3 rounded-lg border border-gray-600 shadow-lg">
                <span class="text-xl">${type === 'success' ? '🎉' : type === 'error' ? '❌' : '💡'}</span>
                <span class="text-white">${message}</span>
            </div>
        `;
        
        notificationContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notificationContainer.contains(notification)) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Enhanced loading animation
    function showLoading(container, message = 'Loading...') {
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="spinner"></div>
                <span class="ml-4 text-gray-400 text-lg">${message}</span>
            </div>
        `;
    }

    // Enhanced code analysis
    function analyzeCode(userCode) {
        const analysis = {
            hasReturn: userCode.includes('return'),
            hasFunction: userCode.includes('function') || userCode.includes('def '),
            lineCount: userCode.split('\n').filter(line => line.trim()).length,
            complexity: 'simple'
        };

        if (userCode.includes('for') || userCode.includes('while')) {
            analysis.complexity = 'intermediate';
        }
        if (userCode.includes('recursion') || userCode.match(/function.*function/)) {
            analysis.complexity = 'advanced';
        }

        return analysis;
    }

    // Enhanced hint system
    function getHint(attempt) {
        const hints = [
            "💡 Think about the problem step by step. What's the first thing you need to do?",
            "🤔 Check your return statement - are you returning the right value?",
            "🔍 Look at the example carefully. What pattern do you see?",
            "💪 You're getting closer! Double-check your logic.",
            "🎯 Almost there! Review the expected output format."
        ];
        
        const hintIndex = Math.min(attempt - 1, hints.length - 1);
        return hints[hintIndex];
    }

    async function fetchRiddle() {
        showLoading(riddleDescription, 'Loading your coding challenge...');
        
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const riddleId = urlParams.get('id');
            if (!riddleId) throw new Error("No riddle ID provided in URL");

            const response = await fetch(`/api/riddle?id=${riddleId}`);
            if (!response.ok) throw new Error('Riddle not found');
            
            const riddle = await response.json();
            riddleData = riddle;
            solution = riddle.solution;
            originalScaffold = riddle.scaffold;
            renderRiddle(riddle);

        } catch (error) {
            riddleDescription.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">🤷‍♂️</div>
                    <p class="text-red-400 font-bold text-xl mb-2">Challenge Not Found</p>
                    <p class="text-gray-400 mb-4">We couldn't load this riddle. Please try again.</p>
                    <button onclick="window.location.href='/dashboard.html'" class="px-6 py-3 btn-primary rounded-lg font-semibold">
                        🏠 Back to Dashboard
                    </button>
                </div>
            `;
            console.error(error);
        }
    }

    function renderRiddle(riddle) {
        setTimeout(() => {
            riddleDescription.innerHTML = `
                <div class="space-y-6">
                    <div class="text-center mb-6">
                        <h1 class="text-3xl font-bold gradient-text mb-4">${riddle.title}</h1>
                        <div class="inline-flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-lg border border-purple-400/20">
                            <span class="text-purple-400">🎯</span>
                            <span class="text-sm font-semibold text-purple-300">Coding Challenge</span>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 rounded-xl border border-indigo-400/20">
                        <h3 class="font-bold text-indigo-400 mb-3 flex items-center gap-2">
                            📋 Challenge Description
                        </h3>
                        <div class="text-gray-300 leading-relaxed whitespace-pre-wrap">${riddle.riddle}</div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-emerald-500/10 p-4 rounded-lg border border-emerald-400/20">
                            <h4 class="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                                🏆 Rewards
                            </h4>
                            <div class="space-y-1 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-400">XP Bonus:</span>
                                    <span class="text-emerald-400 font-bold">+150</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-400">Gems:</span>
                                    <span class="text-yellow-400 font-bold">+15 💎</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-blue-500/10 p-4 rounded-lg border border-blue-400/20">
                            <h4 class="font-bold text-blue-400 mb-2 flex items-center gap-2">
                                📊 Difficulty
                            </h4>
                            <div class="flex items-center gap-2">
                                <div class="flex space-x-1">
                                    ${[1,2,3,4,5].map(i => `<div class="w-2 h-2 rounded-full ${i <= 3 ? 'bg-blue-400' : 'bg-gray-600'}"></div>`).join('')}
                                </div>
                                <span class="text-sm text-gray-400">Intermediate</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Set up the code editor with scaffold
            if (codeEditor) {
                codeEditor.value = riddle.scaffold;
                updateLineNumbers();
            }
            
            // Add syntax highlighting effect
            if (codeEditor) {
                codeEditor.classList.add('fade-in-section', 'is-visible');
            }
            
        }, 300);
    }

    // Enhanced run code functionality
    if (runCodeBtn) {
        runCodeBtn.addEventListener('click', () => {
            const userCode = codeEditor ? codeEditor.value.trim() : '';
            const user = JSON.parse(localStorage.getItem('codequestUser') || 'null');
            attempts++;
            
            if (!userCode) {
                showNotification('Please write some code first! 🤔', 'error');
                return;
            }
            
            // Add loading state
            runCodeBtn.innerHTML = `
                <span class="flex items-center justify-center gap-2">
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Running...</span>
                </span>
            `;
            runCodeBtn.disabled = true;
            
            // Simulate code execution time
            setTimeout(() => {
                checkSolution(userCode, user);
            }, 1500);
        });
    }

    function checkSolution(userCode, user) {
        const analysis = analyzeCode(userCode);
        let outputMessage = '';
        let isSuccess = false;
        
        // Check if solution is correct (more flexible checking)
        const cleanUserCode = userCode.replace(/\s+/g, ' ').trim();
        const cleanSolution = solution.replace(/\s+/g, ' ').trim();
        
        if (cleanUserCode.includes(cleanSolution) || userCode.includes(solution)) {
            isSuccess = true;
            outputMessage = `🎉 SUCCESS! You solved the riddle perfectly!\n\n✨ Code Analysis:\n- Solution found: ✅\n- Code quality: ${analysis.complexity}\n- Lines written: ${analysis.lineCount}\n\n🏆 Rewards earned:\n+150 XP Bonus\n+15 Gems 💎\n\nProgress automatically saved!`;
            
            if (user) {
                // Save progress
                fetch('/api/complete-lesson', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user.username })
                }).catch(error => console.error("Failed to save progress:", error));
            }
            
            showSuccessCelebration();
            showNotification('🎉 Riddle solved! Amazing work!', 'success');
            
        } else {
            const hint = getHint(attempts);
            outputMessage = `🤔 Not quite right yet. Keep trying!\n\n💡 Hint: ${hint}\n\n🔍 Code Analysis:\n- Has return statement: ${analysis.hasReturn ? '✅' : '❌'}\n- Function defined: ${analysis.hasFunction ? '✅' : '❌'}\n- Lines written: ${analysis.lineCount}\n\nAttempt #${attempts} - You're getting closer! 💪`;
            
            showNotification(hint, 'info');
        }

        // Update output
        if (outputText) {
            outputText.textContent = outputMessage;
            outputText.className = isSuccess ? 'text-emerald-400 font-mono text-sm' : 'text-orange-400 font-mono text-sm';
        }
        
        // Reset button state
        if (runCodeBtn) {
            runCodeBtn.innerHTML = `
                <span class="flex items-center justify-center gap-2">
                    <span>▶️</span>
                    <span>Run Code</span>
                </span>
            `;
            runCodeBtn.disabled = false;
            
            // Add button animation
            if (isSuccess) {
                runCodeBtn.classList.add('btn-success');
                runCodeBtn.innerHTML = `
                    <span class="flex items-center justify-center gap-2">
                        <span>✅</span>
                        <span>Solved!</span>
                    </span>
                `;
                runCodeBtn.disabled = true;
            }
        }
    }

    function showSuccessCelebration() {
        if (successCelebration) {
            successCelebration.classList.remove('hidden');
            successCelebration.style.opacity = '0';
            successCelebration.style.transform = 'translateY(30px) scale(0.9)';
            
            setTimeout(() => {
                successCelebration.style.opacity = '1';
                successCelebration.style.transform = 'translateY(0) scale(1)';
                successCelebration.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            }, 500);
            
            // Scroll to celebration
            setTimeout(() => {
                successCelebration.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 800);
        }
    }

    // Reset functionality
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (originalScaffold && codeEditor) {
                codeEditor.value = originalScaffold;
                updateLineNumbers();
                if (outputText) {
                    outputText.textContent = '';
                    outputText.className = 'text-gray-300 whitespace-pre-wrap text-sm font-mono';
                }
                attempts = 0;
                
                // Reset run button
                if (runCodeBtn) {
                    runCodeBtn.classList.remove('btn-success');
                    runCodeBtn.innerHTML = `
                        <span class="flex items-center justify-center gap-2">
                            <span>▶️</span>
                            <span>Run Code</span>
                        </span>
                    `;
                    runCodeBtn.disabled = false;
                }
                
                if (successCelebration) {
                    successCelebration.classList.add('hidden');
                }
                showNotification('Code reset to original template! 🔄', 'info');
            }
        });
    }

    // Enhanced line numbers functionality
    function updateLineNumbers() {
        const editor = document.getElementById('code-editor');
        const lineNumbers = document.getElementById('line-numbers');
        if (editor && lineNumbers) {
            const lines = editor.value.split('\n');
            const lineNumbersText = lines.map((_, i) => i + 1).join('\n');
            lineNumbers.textContent = lineNumbersText;
        }
    }

    // Auto-save functionality
    let autoSaveTimeout;
    if (codeEditor) {
        codeEditor.addEventListener('input', () => {
            updateLineNumbers();
            
            // Auto-save to localStorage
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const riddleId = urlParams.get('id');
                if (riddleId) {
                    localStorage.setItem(`riddle_${riddleId}_progress`, codeEditor.value);
                }
            }, 1000);
        });
    }

    // Load auto-saved progress
    function loadAutoSavedProgress() {
        const urlParams = new URLSearchParams(window.location.search);
        const riddleId = urlParams.get('id');
        if (riddleId && codeEditor) {
            const saved = localStorage.getItem(`riddle_${riddleId}_progress`);
            if (saved && saved !== originalScaffold) {
                setTimeout(() => {
                    const shouldRestore = confirm('🔄 We found your previous work on this riddle. Would you like to restore it?');
                    if (shouldRestore) {
                        codeEditor.value = saved;
                        updateLineNumbers();
                        showNotification('Previous work restored! 📂', 'info');
                    }
                }, 1000);
            }
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+Enter or Cmd+Enter to run code
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (runCodeBtn && !runCodeBtn.disabled) {
                runCodeBtn.click();
            }
        }
        
        // Ctrl+R or Cmd+R to reset (prevent page reload)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            if (resetBtn) {
                resetBtn.click();
            }
        }
        
        // Escape to go back
        if (e.key === 'Escape') {
            window.location.href = '/dashboard.html';
        }
    });

    // Initialize the riddle
    fetchRiddle();
    
    // Load auto-saved progress after riddle loads
    setTimeout(loadAutoSavedProgress, 2000);
    
    // Add visual enhancements
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 30;
                const rotateY = (centerX - x) / 30;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            } else {
                card.style.transform = '';
            }
        });
    });
});