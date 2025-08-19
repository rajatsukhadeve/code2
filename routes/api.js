const express = require('express');
const router = express.Router();

// This is our mock (simulated) database for the leaderboard.
// In a real application, this data would come from a database like MongoDB or PostgreSQL.
const leaderboardData = [
    { rank: 1, name: 'Alex Ryder', xp: 15240, avatar: 'A', rankColor: 'text-yellow-400', borderColor: 'border-yellow-400' },
    { rank: 2, name: 'Ben Carter', xp: 14880, avatar: 'B', rankColor: 'text-gray-300', borderColor: 'border-gray-400' },
    { rank: 3, name: 'Chloe Davis', xp: 14510, avatar: 'C', rankColor: 'text-orange-400', borderColor: 'border-orange-400' },
    { rank: 47, name: 'You', xp: 9120, avatar: 'Y', isCurrentUser: true }
];

// Define the API endpoint to get leaderboard data.
// When the frontend makes a GET request to '/api/leaderboard', this function runs.
router.get('/leaderboard', (req, res) => {
    // We respond with the leaderboard data in JSON format.
    res.json(leaderboardData);
});

// Export the router so it can be used in server.js
module.exports = router;
