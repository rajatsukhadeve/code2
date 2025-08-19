document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const clearChatBtn = document.getElementById('clear-chat');
    const charCount = document.getElementById('char-count');
    const welcomeSection = document.getElementById('welcome-section');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');

    let conversationHistory = [];

    // Initialize chat
    function initializeChat() {
        // Load chat history from localStorage if available
        const savedHistory = localStorage.getItem('codequest-chat-history');
        if (savedHistory) {
            try {
                conversationHistory = JSON.parse(savedHistory);
                displayChatHistory();
            } catch (error) {
                console.error('Error loading chat history:', error);
                conversationHistory = [];
            }
        }

        // Focus on input
        chatInput.focus();
    }

    // Display chat history
    function displayChatHistory() {
        if (conversationHistory.length > 0) {
            welcomeSection.style.display = 'none';
            conversationHistory.forEach(message => {
                appendMessage(message.content, message.isUser, false);
            });
            scrollToBottom();
        }
    }

    // Auto-resize textarea
    function autoResizeTextarea() {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 128) + 'px';
    }

    // Update character count and send button state
    function updateInputState() {
        const length = chatInput.value.length;
        charCount.textContent = length;
        
        // Update character count color
        if (length > 1800) {
            charCount.classList.add('text-red-400');
            charCount.classList.remove('text-gray-500');
        } else if (length > 1500) {
            charCount.classList.add('text-yellow-400');
            charCount.classList.remove('text-gray-500', 'text-red-400');
        } else {
            charCount.classList.remove('text-red-400', 'text-yellow-400');
            charCount.classList.add('text-gray-500');
        }
        
        // Enable/disable send button
        const canSend = length > 0 && length <= 2000;
        sendBtn.disabled = !canSend;
        
        if (canSend) {
            sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    // Append message to chat
    function appendMessage(content, isUser = false, saveToHistory = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`;
        
        const avatar = document.createElement('div');
        avatar.className = `w-10 h-10 rounded-full flex items-center justify-center ${
            isUser 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                : 'bg-gradient-to-br from-gray-600 to-gray-700'
        }`;
        avatar.innerHTML = `<span class="text-white text-lg">${isUser ? '👤' : '🤖'}</span>`;
        
        const messageBubble = document.createElement('div');
        messageBubble.className = `message-bubble text-white px-4 py-3 rounded-2xl ${
            isUser 
                ? 'user-message rounded-tr-md' 
                : 'ai-message rounded-tl-md'
        }`;
        
        // Format message content
        const formattedContent = formatMessage(content);
        messageBubble.innerHTML = formattedContent;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageBubble);
        chatMessages.appendChild(messageDiv);
        
        // Save to history
        if (saveToHistory) {
            conversationHistory.push({ content, isUser, timestamp: new Date().toISOString() });
            saveConversationHistory();
        }
        
        scrollToBottom();
    }

    // Format message content (handle code blocks, links, etc.)
    function formatMessage(content) {
        // Convert code blocks
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language || 'text';
            return `<div class="bg-gray-900/50 rounded-lg p-4 mt-2 mb-2 border border-gray-700/50">
                        <div class="text-xs text-gray-400 mb-2 font-mono">${lang}</div>
                        <pre class="text-green-400 font-mono text-sm overflow-x-auto"><code>${escapeHtml(code.trim())}</code></pre>
                    </div>`;
        });
        
        // Convert inline code
        content = content.replace(/`([^`]+)`/g, '<code class="bg-gray-700/50 text-green-400 px-2 py-1 rounded font-mono text-sm">$1</code>');
        
        // Convert bold text
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
        
        // Convert bullet points
        content = content.replace(/^\s*[-*]\s+(.+)/gm, '<div class="flex items-start gap-2 my-1"><span class="text-blue-400 mt-1">•</span><span>$1</span></div>');
        
        // Convert line breaks
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Scroll to bottom of chat
    function scrollToBottom() {
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }

    // Show typing indicator
    function showTypingIndicator() {
        typingIndicator.classList.remove('hidden');
        scrollToBottom();
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        typingIndicator.classList.add('hidden');
    }

    // Send message to AI
    async function sendMessage(message) {
        try {
            // Hide welcome section after first message
            if (conversationHistory.length === 1) {
                welcomeSection.style.display = 'none';
            }

            showTypingIndicator();
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message,
                    conversationHistory: conversationHistory.slice(-10) // Send last 10 messages for context
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            hideTypingIndicator();
            
            // **MODIFIED SECTION**: This logic now correctly parses your specific API response.
            if (data.success && data.data && data.data.data && data.data.data.ans) {
                const answer = data.data.data.ans;
                appendMessage(answer, false);
            } else {
                appendMessage("I apologize, but I received an unexpected response. Please try again in a moment. 🤔", false);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            hideTypingIndicator();
            
            let errorMessage = "I'm currently experiencing some technical difficulties. ";
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage += "Please check your internet connection and try again. 🔌";
            } else {
                errorMessage += "Please try again in a moment. ⚠️";
            }
            
            appendMessage(errorMessage, false);
        }
    }

    // Handle sending message
    function handleSendMessage() {
        const message = chatInput.value.trim();
        if (!message || message.length > 2000) return;

        // Add user message to chat
        appendMessage(message, true);
        
        // Clear input
        chatInput.value = '';
        updateInputState();
        autoResizeTextarea();
        
        // Send to AI
        sendMessage(message);
    }

    // Save conversation history to localStorage
    function saveConversationHistory() {
        try {
            // Keep only last 50 messages to prevent localStorage bloat
            const limitedHistory = conversationHistory.slice(-50);
            localStorage.setItem('codequest-chat-history', JSON.stringify(limitedHistory));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    // Clear chat history
    function clearChat() {
        if (confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
            conversationHistory = [];
            chatMessages.innerHTML = '';
            localStorage.removeItem('codequest-chat-history');
            welcomeSection.style.display = 'block';
            
            // Show success message
            setTimeout(() => {
                appendMessage("Chat cleared! How can I help you today? 😊", false);
                setTimeout(() => {
                    welcomeSection.style.display = 'none';
                }, 2000);
            }, 500);
        }
    }

    // Handle suggestion button clicks
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const questionDiv = btn.querySelector('.text-xs');
            if (questionDiv) {
                chatInput.value = questionDiv.textContent;
                updateInputState();
                chatInput.focus();
            }
        });
    });

    // Event listeners
    chatInput.addEventListener('input', () => {
        updateInputState();
        autoResizeTextarea();
    });

    chatInput.addEventListener('keydown', (e) => {
        // Send on Enter (but not Shift+Enter)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) {
                handleSendMessage();
            }
        }
    });

    sendBtn.addEventListener('click', handleSendMessage);
    
    clearChatBtn.addEventListener('click', clearChat);

    // Initialize the chat
    initializeChat();

    // Add some visual feedback
    sendBtn.addEventListener('mousedown', () => {
        sendBtn.style.transform = 'scale(0.95)';
    });

    sendBtn.addEventListener('mouseup', () => {
        sendBtn.style.transform = 'scale(1)';
    });

    // Handle window close confirmation
    window.addEventListener('beforeunload', (e) => {
        if (conversationHistory.length > 0) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Show notification when chat is ready
    setTimeout(() => {
        console.log('🤖 Ask Doubt chatbot is ready!');
    }, 500);
});
