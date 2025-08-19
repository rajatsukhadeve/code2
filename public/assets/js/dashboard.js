document.addEventListener('DOMContentLoaded', () => {
    let currentUserData = null;

    // Enhanced notification system
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-xl">${type === 'success' ? '✅' : '❌'}</span>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => container.removeChild(notification), 300);
        }, 4000);
    }

    // Enhanced data fetching with loading states
    async function fetchDashboardData() {
        const user = JSON.parse(localStorage.getItem('codequestUser'));
        if (!user || !user.username) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const path = urlParams.get('path') || 'python';

            const response = await fetch(`/api/dashboard?username=${user.username}&path=${path}`);
            
            if (!response.ok) {
                localStorage.removeItem('codequestUser');
                window.location.href = 'login.html';
                return;
            }
            
            const data = await response.json();
            currentUserData = data;
            
            // Update all UI elements with enhanced animations
            updateHeader(data);
            updateWelcomeMessage(data);
            updateQuickStats(data);
            updateLearningPath(data.learningPath, path);
            updateBadges(data.badges);
            updateProgress(data);
            updateStreak(data.dailyStreak);
            fetchQuests();

            // Show welcome back message
            showNotification(`Welcome back, ${data.userName}! Ready to continue your quest? 🚀`);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            const container = document.getElementById('learning-path-container');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-6xl mb-4">😵</div>
                        <p class="text-red-400 font-bold mb-2">Oops! Something went wrong</p>
                        <p class="text-gray-400">Please ensure the server is running correctly.</p>
                        <button onclick="window.location.reload()" class="mt-4 px-6 py-2 btn-primary rounded-lg">
                            Try Again
                        </button>
                    </div>
                `;
            }
        }
    }

    async function fetchQuests() {
        try {
            const response = await fetch('/api/quests');
            const quests = await response.json();
            updateQuests(quests);
        } catch (error) {
            console.error("Error fetching quests:", error);
            const container = document.getElementById('quests-container');
            if(container) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <div class="text-4xl mb-2">🤔</div>
                        <p class="text-red-400">Could not load quests.</p>
                    </div>
                `;
            }
        }
    }

    function updateHeader(data) {
        const userNameHeader = document.getElementById('user-name-header');
        const userAvatar = document.getElementById('user-avatar');
        const headerGems = document.getElementById('header-gems');
        const headerXp = document.getElementById('header-xp');
        
        if (userNameHeader) userNameHeader.textContent = data.userName;
        if (userAvatar) {
            userAvatar.src = `https://placehold.co/40x40/818cf8/white?text=${data.userName.charAt(0).toUpperCase()}`;
            userAvatar.alt = `${data.userName}'s Avatar`;
        }
        if (headerGems) headerGems.textContent = data.gems.toLocaleString();
        if (headerXp) headerXp.textContent = `${data.xp.toLocaleString()} XP`;
    }

    function updateWelcomeMessage(data) {
        const userNameMain = document.getElementById('user-name-main');
        if (userNameMain) userNameMain.textContent = data.userName;
    }

    function updateQuickStats(data) {
        const quickLevel = document.getElementById('quick-level');
        const quickXp = document.getElementById('quick-xp');
        const quickStreak = document.getElementById('quick-streak');
        const quickGems = document.getElementById('quick-gems');

        if (quickLevel) {
            quickLevel.textContent = data.level;
            quickLevel.parentElement.classList.add('level-up');
        }
        if (quickXp) quickXp.textContent = data.xp.toLocaleString();
        if (quickStreak) {
            quickStreak.textContent = data.dailyStreak;
            if (data.dailyStreak > 0) {
                quickStreak.parentElement.classList.add('fire-animation');
            }
        }
        if (quickGems) {
            quickGems.textContent = data.gems.toLocaleString();
            quickGems.classList.add('gem-sparkle');
        }
    }

    function updateLearningPath(pathData, pathName) {
        const container = document.getElementById('learning-path-container');
        if (!container) return;

        if (!pathData || !pathData.type || !pathData.lessonId || !pathData.currentLesson) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">🔍</div>
                    <p class="text-red-400 font-bold mb-2">Quest Not Found!</p>
                    <p class="text-gray-400">The learning path data seems to be incomplete.</p>
                </div>
            `;
            return;
        }

        // Calculate progress percentage
        const completedSteps = pathData.steps?.filter(step => step.completed).length || 0;
        const totalSteps = pathData.steps?.length || 0;
        const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

        let stepsHtml = '';
        if (pathData.steps && pathData.steps.length > 0) {
            stepsHtml = pathData.steps.map((step, index) => {
                const isCurrent = !step.completed && (index === 0 || (pathData.steps[index - 1] && pathData.steps[index - 1].completed));
                let icon, textColor, stepStatus;
                
                if (step.completed) {
                    icon = `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">✓</div>`;
                    textColor = 'text-emerald-400 font-semibold';
                    stepStatus = '✨ Completed';
                } else if (isCurrent) {
                    icon = `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold animate-pulse shadow-lg pulse-glow">▶</div>`;
                    textColor = 'text-white font-bold';
                    stepStatus = '🎯 Current';
                } else {
                    icon = `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-gray-400 font-bold shadow-lg">🔒</div>`;
                    textColor = 'text-gray-500';
                    stepStatus = '🔒 Locked';
                }
                
                return `
                    <div class="flex items-center p-4 rounded-lg bg-gray-800/20 hover:bg-gray-800/40 transition-colors border border-gray-700/30">
                        ${icon}
                        <div class="ml-4 flex-1">
                            <span class="text-lg ${textColor}">${step.name}</span>
                            <div class="text-sm text-gray-500 mt-1">${stepStatus}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        let continueButtonHtml = '';
        if (pathData.type === 'riddle') {
            continueButtonHtml = `
                <a href="riddle.html?id=${pathData.lessonId}" class="inline-block w-full mt-8 px-8 py-4 rounded-xl font-bold text-white btn-primary text-lg pulse-glow hover:scale-105 transition-all">
                    🧩 Continue: ${pathData.currentLesson}
                </a>
            `;
        } else {
            continueButtonHtml = `
                <a href="lesson.html?id=${pathData.lessonId}" class="inline-block w-full mt-8 px-8 py-4 rounded-xl font-bold text-white btn-primary text-lg pulse-glow hover:scale-105 transition-all">
                    📚 Continue: ${pathData.currentLesson}
                </a>
            `;
        }

        container.innerHTML = `
            <div class="mb-6">
                <h3 class="text-3xl font-bold gradient-text mb-4">${pathData.title}</h3>
                <div class="flex items-center gap-4 mb-4">
                    <div class="flex-1">
                        <div class="progress-bar h-3">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                    <span class="text-sm font-bold text-white">${Math.round(progressPercentage)}%</span>
                </div>
                <p class="text-gray-400">${completedSteps} of ${totalSteps} challenges completed</p>
            </div>
            
            ${stepsHtml ? `<div class="space-y-3 mb-6">${stepsHtml}</div>` : ''}
            
            ${continueButtonHtml}
        `;
    }

    function updateBadges(badges) {
        const container = document.getElementById('badges-container');
        const badgeCount = document.getElementById('badge-count');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!badges || badges.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-6xl mb-4">🏆</div>
                    <p class="text-gray-400 mb-2">No achievements yet</p>
                    <p class="text-sm text-gray-500">Complete challenges to earn your first badge!</p>
                </div>
            `;
            if (badgeCount) badgeCount.textContent = '0 earned';
            return;
        }

        if (badgeCount) badgeCount.textContent = `${badges.length} earned`;

        badges.forEach((badge, index) => {
            const badgeEl = document.createElement('div');
            badgeEl.className = 'badge-item text-center p-4 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-xl border border-yellow-400/20 hover:border-yellow-400/40 transition-all';
            badgeEl.style.animationDelay = `${index * 0.1}s`;
            badgeEl.innerHTML = `
                <div class="text-5xl mb-3">${badge.icon}</div>
                <p class="font-bold text-yellow-400 mb-1">${badge.name}</p>
                <p class="text-xs text-gray-400 leading-tight">${badge.description}</p>
            `;
            
            // Add click effect
            badgeEl.addEventListener('click', () => {
                showAchievementDetails(badge);
            });
            
            container.appendChild(badgeEl);
        });
    }

    function showAchievementDetails(badge) {
        const modal = document.getElementById('achievement-modal');
        const content = document.getElementById('achievement-content');
        
        content.innerHTML = `
            <div class="text-6xl mb-4">${badge.icon}</div>
            <h4 class="text-xl font-bold text-yellow-400 mb-2">${badge.name}</h4>
            <p class="text-gray-400">${badge.description}</p>
        `;
        
        modal.classList.remove('hidden');
        modal.querySelector('.glass-card').classList.add('scale-100');
    }

    function updateProgress(data) {
        const container = document.getElementById('progress-container');
        if (!container) return;
        
        const xpPercentage = Math.min((data.xp / data.xpToNextLevel) * 100, 100);
        const nextLevelXp = data.xpToNextLevel - data.xp;
        
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Level Display -->
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full mb-4 shadow-lg">
                        <span class="text-3xl font-bold text-white">${data.level}</span>
                    </div>
                    <p class="font-bold text-indigo-300 text-lg">Level ${data.level} Adventurer</p>
                </div>

                <!-- XP Progress -->
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold text-indigo-300">Experience Points</span>
                        <span class="text-sm text-indigo-400 font-bold">${data.xp.toLocaleString()} / ${data.xpToNextLevel.toLocaleString()} XP</span>
                    </div>
                    <div class="progress-bar h-4">
                        <div class="progress-fill" style="width: ${xpPercentage}%"></div>
                    </div>
                    <p class="text-center text-sm text-gray-400 mt-2">
                        ${nextLevelXp > 0 ? `${nextLevelXp.toLocaleString()} XP to Level ${data.level + 1}` : 'Max Level Reached!'}
                    </p>
                </div>

                <!-- Gems Display -->
                <div class="text-center p-4 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-xl border border-yellow-400/20">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <span class="text-3xl gem-sparkle">💎</span>
                        <span class="text-3xl font-bold text-yellow-400">${data.gems.toLocaleString()}</span>
                    </div>
                    <p class="text-sm text-yellow-300 font-semibold">Precious Gems</p>
                </div>
            </div>
        `;
    }

    function updateStreak(streak) {
        const container = document.getElementById('streak-container');
        if (!container) return;
        
        const streakMessages = [
            "Start your journey! 🚀",
            "Great start! Keep it up! 👍",
            "You're on fire! 🔥",
            "Unstoppable! 💪",
            "Legend in the making! 🌟",
            "Coding master! 👑"
        ];
        
        const messageIndex = Math.min(Math.floor(streak / 5), streakMessages.length - 1);
        const message = streakMessages[messageIndex];
        
        container.innerHTML = `
            <div class="text-center">
                <div class="flex items-center justify-center mb-6">
                    <div class="text-8xl fire-animation mr-4">🔥</div>
                    <div>
                        <p class="text-6xl font-bold text-orange-400 mb-2">${streak}</p>
                        <p class="text-lg text-gray-300">Day Streak!</p>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-400/20 mb-4">
                    <p class="text-orange-300 font-semibold">${message}</p>
                </div>
                
                <p class="text-center text-gray-400 text-sm">
                    Complete a lesson every day to keep your streak alive! 
                    ${streak > 0 ? '🎯' : '💡'}
                </p>
            </div>
        `;
    }

    function updateQuests(quests) {
        const container = document.getElementById('quests-container');
        if (!container) return;

        if (!quests || quests.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6">
                    <div class="text-5xl mb-4">📝</div>
                    <p class="text-gray-400">No quests available right now</p>
                    <p class="text-sm text-gray-500">Check back later for new challenges!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = quests.map((quest, index) => {
            const [current, total] = quest.progress.split('/').map(Number);
            const progressPercent = total > 0 ? (current / total) * 100 : 0;
            const isCompleted = current >= total;
            
            return `
                <div class="bg-gradient-to-r from-gray-800/30 to-gray-700/30 p-6 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all ${isCompleted ? 'ring-2 ring-green-400/50' : ''}">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                                <span class="text-white font-bold">${isCompleted ? '✓' : '📋'}</span>
                            </div>
                            <div>
                                <p class="font-bold text-white">${quest.title}</p>
                                <p class="text-sm text-gray-400 mt-1">${quest.description}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="font-bold ${isCompleted ? 'text-green-400' : 'text-yellow-400'}">${quest.progress}</p>
                            <p class="text-xs text-gray-500">${isCompleted ? 'Complete!' : 'In Progress'}</p>
                        </div>
                    </div>
                    
                    <div class="quest-progress">
                        <div class="quest-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Initialize dashboard
    fetchDashboardData();

    // Add some interactive features
    document.addEventListener('click', (e) => {
        if (e.target.matches('.interactive-card')) {
            e.target.style.transform = 'scale(0.98)';
            setTimeout(() => {
                e.target.style.transform = '';
            }, 150);
        }
    });
});