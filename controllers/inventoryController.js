const Item = require('../models/Item');
const Exchange = require('../models/Exchange');
const User = require('../models/User');

// Get user's personal inventory with detailed analytics
const getPersonalInventory = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { category, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        // Build query
        let query = { userId };
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (status && status !== 'all') {
            query.availabilityStatus = status;
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const items = await Item.find(query)
            .sort(sort)
            .populate('userId', 'username');

        // Calculate inventory analytics
        const analytics = await calculateInventoryAnalytics(userId);

        res.render('inventory/personal', { 
            items, 
            analytics,
            filters: { category, status, sortBy, sortOrder }
        });

    } catch (error) {
        console.error('Error fetching personal inventory:', error);
        res.status(500).render('inventory/personal', { 
            error: 'Error loading inventory',
            items: [],
            analytics: {}
        });
    }
};

// Calculate comprehensive inventory analytics
const calculateInventoryAnalytics = async (userId) => {
    try {
        // Basic counts
        const totalItems = await Item.countDocuments({ userId });
        const availableItems = await Item.countDocuments({ userId, availabilityStatus: 'Available' });
        const onLoanItems = await Item.countDocuments({ userId, availabilityStatus: 'On Loan' });

        // Category breakdown
        const categoryBreakdown = await Item.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Trade type breakdown
        const tradeTypeBreakdown = await Item.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: '$tradeType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Condition breakdown
        const conditionBreakdown = await Item.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: '$condition', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Total estimated value
        const valueAnalytics = await Item.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: '$estimatedValue' },
                    avgValue: { $avg: '$estimatedValue' },
                    maxValue: { $max: '$estimatedValue' },
                    minValue: { $min: '$estimatedValue' }
                }
            }
        ]);

        // Exchange activity
        const exchangeStats = await Exchange.aggregate([
            {
                $match: {
                    $or: [
                        { requesterId: userId },
                        { ownerId: userId }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalExchanges: { $sum: 1 },
                    completedExchanges: {
                        $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
                    },
                    activeExchanges: {
                        $sum: { $cond: [{ $in: ['$status', ['Pending', 'Negotiating', 'Active']] }, 1, 0] }
                    }
                }
            }
        ]);

        // Community engagement metrics
        const communityStats = await calculateCommunityEngagement(userId);

        return {
            totalItems,
            availableItems,
            onLoanItems,
            categoryBreakdown,
            tradeTypeBreakdown,
            conditionBreakdown,
            valueAnalytics: valueAnalytics[0] || { totalValue: 0, avgValue: 0, maxValue: 0, minValue: 0 },
            exchangeStats: exchangeStats[0] || { totalExchanges: 0, completedExchanges: 0, activeExchanges: 0 },
            communityStats
        };

    } catch (error) {
        console.error('Error calculating analytics:', error);
        return {};
    }
};

// Calculate community engagement benefits
const calculateCommunityEngagement = async (userId) => {
    try {
        // Items documented this month
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const itemsThisMonth = await Item.countDocuments({
            userId,
            createdAt: { $gte: thisMonth }
        });

        // Total community views of user's items
        const communityViews = await Item.aggregate([
            { $match: { userId } },
            { $project: { views: { $size: { $ifNull: ['$viewCount', []] } } } },
            { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ]);

        // Knowledge contribution score
        const knowledgeScore = await calculateKnowledgeContributionScore(userId);

        // Community reputation
        const reputation = await calculateReputationScore(userId);

        return {
            itemsThisMonth,
            totalViews: communityViews[0]?.totalViews || 0,
            knowledgeScore,
            reputation,
            benefits: generateBenefitsSummary(itemsThisMonth, communityViews[0]?.totalViews || 0, knowledgeScore, reputation)
        };

    } catch (error) {
        console.error('Error calculating community engagement:', error);
        return {};
    }
};

// Calculate knowledge contribution score based on documentation quality
const calculateKnowledgeContributionScore = async (userId) => {
    try {
        const items = await Item.find({ userId });
        
        let score = 0;
        items.forEach(item => {
            // Base score for documenting
            score += 10;
            
            // Bonus for detailed documentation
            if (item.provenance && item.provenance.length > 50) score += 5;
            if (item.technicalDetails && item.technicalDetails.length > 50) score += 5;
            if (item.images && item.images.length > 0) score += item.images.length * 2;
            if (item.estimatedValue > 0) score += 3;
            
            // Bonus for making items available to community
            if (item.tradeType !== 'Share') score += 2;
        });

        return Math.min(score, 1000); // Cap at 1000
    } catch (error) {
        console.error('Error calculating knowledge score:', error);
        return 0;
    }
};

// Calculate reputation score based on exchange activity
const calculateReputationScore = async (userId) => {
    try {
        const exchanges = await Exchange.find({
            $or: [{ requesterId: userId }, { ownerId: userId }],
            status: 'Completed'
        });

        let reputation = 0;
        exchanges.forEach(exchange => {
            // Base reputation for completed exchanges
            reputation += 5;
            
            // Bonus for positive ratings
            if (exchange.requesterId.toString() === userId) {
                if (exchange.ownerRating && exchange.ownerRating >= 4) reputation += 10;
                if (exchange.ownerRating && exchange.ownerRating >= 5) reputation += 5;
            } else {
                if (exchange.requesterRating && exchange.requesterRating >= 4) reputation += 10;
                if (exchange.requesterRating && exchange.requesterRating >= 5) reputation += 5;
            }
        });

        return Math.min(reputation, 500); // Cap at 500
    } catch (error) {
        console.error('Error calculating reputation:', error);
        return 0;
    }
};

// Generate benefits summary based on engagement
const generateBenefitsSummary = (itemsThisMonth, totalViews, knowledgeScore, reputation) => {
    const benefits = [];

    if (itemsThisMonth > 0) {
        benefits.push({
            type: 'Documentation',
            title: 'Knowledge Preservation',
            description: `You've documented ${itemsThisMonth} items this month, contributing to analog knowledge preservation.`,
            value: itemsThisMonth * 10
        });
    }

    if (totalViews > 10) {
        benefits.push({
            type: 'Community Impact',
            title: 'Community Resource',
            description: `Your documented materials have been viewed ${totalViews} times, helping others discover analog solutions.`,
            value: totalViews * 2
        });
    }

    if (knowledgeScore > 100) {
        benefits.push({
            type: 'Expertise',
            title: 'Analog Expert',
            description: 'Your detailed documentation demonstrates deep analog knowledge and expertise.',
            value: knowledgeScore
        });
    }

    if (reputation > 50) {
        benefits.push({
            type: 'Trust',
            title: 'Trusted Community Member',
            description: 'Your positive exchange history builds trust and opens doors to rare materials.',
            value: reputation * 5
        });
    }

    // Calculate total benefit value
    const totalValue = benefits.reduce((sum, benefit) => sum + benefit.value, 0);

    return {
        benefits,
        totalValue,
        level: calculateBenefitLevel(totalValue)
    };
};

// Calculate benefit level based on total value
const calculateBenefitLevel = (totalValue) => {
    if (totalValue >= 1000) return { name: 'Analog Master', color: 'gold' };
    if (totalValue >= 500) return { name: 'Analog Expert', color: 'silver' };
    if (totalValue >= 200) return { name: 'Analog Enthusiast', color: 'bronze' };
    if (totalValue >= 100) return { name: 'Analog Contributor', color: 'blue' };
    return { name: 'Analog Member', color: 'gray' };
};

// Export inventory data
const exportInventory = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { format = 'json' } = req.query;

        const items = await Item.find({ userId })
            .populate('userId', 'username email');

        const analytics = await calculateInventoryAnalytics(userId);

        const exportData = {
            user: {
                username: req.session.user.username,
                exportDate: new Date().toISOString()
            },
            inventory: items,
            analytics,
            benefits: analytics.communityStats?.benefits
        };

        if (format === 'csv') {
            // Convert to CSV format
            const csv = convertToCSV(items);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="analog-society-inventory.csv"');
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="analog-society-inventory.json"');
            res.json(exportData);
        }

    } catch (error) {
        console.error('Error exporting inventory:', error);
        res.status(500).json({ error: 'Error exporting inventory' });
    }
};

// Convert items to CSV format
const convertToCSV = (items) => {
    const headers = [
        'Name', 'Description', 'Category', 'Condition', 'Trade Type', 
        'Estimated Value', 'Provenance', 'Technical Details', 
        'Availability Status', 'Created Date'
    ];

    const rows = items.map(item => [
        `"${item.name}"`,
        `"${item.description}"`,
        `"${item.category}"`,
        `"${item.condition}"`,
        `"${item.tradeType}"`,
        item.estimatedValue,
        `"${item.provenance || ''}"`,
        `"${item.technicalDetails || ''}"`,
        `"${item.availabilityStatus}"`,
        item.createdAt.toISOString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Get inventory insights and recommendations
const getInventoryInsights = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const analytics = await calculateInventoryAnalytics(userId);
        
        const insights = generateInsights(analytics);
        const recommendations = generateRecommendations(analytics);

        res.json({
            insights,
            recommendations,
            analytics
        });

    } catch (error) {
        console.error('Error getting insights:', error);
        res.status(500).json({ error: 'Error generating insights' });
    }
};

// Generate actionable insights
const generateInsights = (analytics) => {
    const insights = [];

    if (analytics.totalItems === 0) {
        insights.push({
            type: 'start',
            title: 'Start Your Analog Journey',
            message: 'Document your first analog material to begin building your inventory and contributing to the community.',
            action: 'Add your first item'
        });
    } else if (analytics.totalItems < 5) {
        insights.push({
            type: 'grow',
            title: 'Expand Your Collection',
            message: `You have ${analytics.totalItems} items documented. Consider documenting more to unlock community benefits.`,
            action: 'Document more items'
        });
    }

    if (analytics.exchangeStats.totalExchanges === 0 && analytics.totalItems > 0) {
        insights.push({
            type: 'share',
            title: 'Share Your Materials',
            message: 'Make your materials available for trading, renting, or sharing to build community connections.',
            action: 'Update trade settings'
        });
    }

    if (analytics.valueAnalytics.totalValue > 1000) {
        insights.push({
            type: 'valuable',
            title: 'High-Value Collection',
            message: `Your collection is valued at $${analytics.valueAnalytics.totalValue.toFixed(2)}. Consider insurance documentation.`,
            action: 'Review insurance options'
        });
    }

    return insights;
};

// Generate personalized recommendations
const generateRecommendations = (analytics) => {
    const recommendations = [];

    // Category diversity recommendation
    if (analytics.categoryBreakdown && analytics.categoryBreakdown.length < 3) {
        recommendations.push({
            type: 'diversity',
            title: 'Diversify Your Collection',
            message: 'Consider documenting materials from different categories to expand your analog expertise.',
            action: 'Explore new categories'
        });
    }

    // Documentation quality recommendation
    if (analytics.communityStats?.knowledgeScore < 200) {
        recommendations.push({
            type: 'quality',
            title: 'Enhance Documentation',
            message: 'Add provenance and technical details to increase your knowledge contribution score.',
            action: 'Improve item descriptions'
        });
    }

    // Community engagement recommendation
    if (analytics.communityStats?.reputation < 50) {
        recommendations.push({
            type: 'engagement',
            title: 'Build Community Reputation',
            message: 'Complete exchanges and provide quality ratings to build trust in the community.',
            action: 'Participate in exchanges'
        });
    }

    return recommendations;
};

module.exports = {
    getPersonalInventory,
    exportInventory,
    getInventoryInsights,
    calculateInventoryAnalytics
};
