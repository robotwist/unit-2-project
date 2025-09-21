const Item = require('../models/Item');
const Exchange = require('../models/Exchange');
const User = require('../models/User');

// Calculate comprehensive benefits for a user
const calculateUserBenefits = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await User.findById(userId).select('username email createdAt');
        
        // Get user's items and exchanges
        const items = await Item.find({ userId });
        const exchanges = await Exchange.find({
            $or: [{ requesterId: userId }, { ownerId: userId }]
        });

        // Calculate various benefit metrics
        const benefits = await calculateAllBenefits(userId, items, exchanges);
        
        res.json({
            user: {
                username: user.username,
                memberSince: user.createdAt
            },
            benefits,
            items: {
                total: items.length,
                categories: getCategoryBreakdown(items),
                totalValue: items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0)
            },
            exchanges: {
                total: exchanges.length,
                completed: exchanges.filter(e => e.status === 'Completed').length,
                active: exchanges.filter(e => ['Pending', 'Negotiating', 'Active'].includes(e.status)).length
            }
        });

    } catch (error) {
        console.error('Error calculating user benefits:', error);
        res.status(500).json({ error: 'Error calculating benefits' });
    }
};

// Calculate all benefit metrics
const calculateAllBenefits = async (userId, items, exchanges) => {
    const benefits = {
        personal: await calculatePersonalBenefits(items),
        community: await calculateCommunityBenefits(userId, items, exchanges),
        recognition: await calculateRecognitionLevel(userId, items, exchanges),
        insights: await generateBenefitInsights(items, exchanges)
    };

    return benefits;
};

// Calculate personal benefits
const calculatePersonalBenefits = async (items) => {
    const totalValue = items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);
    const categories = [...new Set(items.map(item => item.category))];
    const documentedItems = items.filter(item => 
        item.provenance && item.provenance.length > 50 ||
        item.technicalDetails && item.technicalDetails.length > 50 ||
        item.images && item.images.length > 0
    );

    return {
        digitalInventory: {
            title: 'Digital Inventory Management',
            description: `You've documented ${items.length} materials with photos, descriptions, and technical details.`,
            value: items.length * 10,
            benefits: [
                'Never lose track of your collection',
                'Comprehensive documentation with photos',
                'Technical specifications and provenance',
                'Easy search and filtering capabilities'
            ]
        },
        valueTracking: {
            title: 'Collection Value Tracking',
            description: `Your collection is estimated at $${totalValue.toFixed(2)} across ${categories.length} categories.`,
            value: totalValue > 0 ? Math.min(totalValue / 10, 100) : 0,
            benefits: [
                'Insurance documentation support',
                'Estate planning assistance',
                'Market value tracking',
                'Investment portfolio insights'
            ]
        },
        dataOwnership: {
            title: 'Complete Data Ownership',
            description: 'Export your data anytime in JSON or CSV format. Your data belongs to you.',
            value: 50,
            benefits: [
                'Full data portability',
                'No vendor lock-in',
                'Backup and archival capabilities',
                'Integration with other tools'
            ]
        },
        qualityDocumentation: {
            title: 'High-Quality Documentation',
            description: `${documentedItems.length} of ${items.length} items have detailed documentation.`,
            value: documentedItems.length * 5,
            benefits: [
                'Enhanced knowledge preservation',
                'Better trading opportunities',
                'Higher community recognition',
                'Improved searchability'
            ]
        }
    };
};

// Calculate community benefits
const calculateCommunityBenefits = async (userId, items, exchanges) => {
    const communityViews = await calculateCommunityViews(userId);
    const knowledgeScore = await calculateKnowledgeScore(items);
    const reputation = await calculateReputationScore(exchanges, userId);
    const contributionScore = await calculateContributionScore(items, exchanges);

    return {
        knowledgePreservation: {
            title: 'Knowledge Preservation',
            description: `You're contributing to the preservation of analog knowledge for future generations.`,
            value: knowledgeScore,
            benefits: [
                'Historical documentation',
                'Technical knowledge sharing',
                'Cultural preservation',
                'Educational resource creation'
            ]
        },
        communityImpact: {
            title: 'Community Impact',
            description: `Your materials have been viewed ${communityViews} times, helping others discover analog solutions.`,
            value: communityViews * 2,
            benefits: [
                'Helping others find materials',
                'Enabling creativity and innovation',
                'Building community connections',
                'Creating discovery opportunities'
            ]
        },
        reputationBuilding: {
            title: 'Community Reputation',
            description: `You've built a reputation score of ${reputation} through quality exchanges and documentation.`,
            value: reputation,
            benefits: [
                'Access to rare materials',
                'Priority in trading requests',
                'Trust from community members',
                'Mentoring opportunities'
            ]
        },
        contributionRecognition: {
            title: 'Contribution Recognition',
            description: `Your contribution score of ${contributionScore} reflects your active participation in the community.`,
            value: contributionScore,
            benefits: [
                'Community recognition',
                'Expert status consideration',
                'Curator opportunities',
                'Governance participation'
            ]
        }
    };
};

// Calculate recognition level
const calculateRecognitionLevel = async (userId, items, exchanges) => {
    const personalScore = Object.values(await calculatePersonalBenefits(items))
        .reduce((sum, benefit) => sum + benefit.value, 0);
    const communityScore = Object.values(await calculateCommunityBenefits(userId, items, exchanges))
        .reduce((sum, benefit) => sum + benefit.value, 0);
    
    const totalScore = personalScore + communityScore;
    
    let level = {
        name: 'Analog Member',
        color: 'gray',
        level: 1,
        score: totalScore,
        nextLevel: 100,
        progress: Math.min((totalScore / 100) * 100, 100)
    };

    if (totalScore >= 1000) {
        level = { name: 'Analog Master', color: 'gold', level: 5, score: totalScore, nextLevel: null, progress: 100 };
    } else if (totalScore >= 500) {
        level = { name: 'Analog Expert', color: 'silver', level: 4, score: totalScore, nextLevel: 1000, progress: ((totalScore - 500) / 500) * 100 };
    } else if (totalScore >= 200) {
        level = { name: 'Analog Enthusiast', color: 'bronze', level: 3, score: totalScore, nextLevel: 500, progress: ((totalScore - 200) / 300) * 100 };
    } else if (totalScore >= 100) {
        level = { name: 'Analog Contributor', color: 'blue', level: 2, score: totalScore, nextLevel: 200, progress: ((totalScore - 100) / 100) * 100 };
    }

    return {
        current: level,
        perks: getLevelPerks(level.level),
        achievements: await getAchievements(userId, items, exchanges)
    };
};

// Generate benefit insights
const generateBenefitInsights = async (items, exchanges) => {
    const insights = [];
    
    if (items.length === 0) {
        insights.push({
            type: 'start',
            title: 'Start Your Analog Journey',
            message: 'Document your first analog material to begin building your inventory and contributing to the community.',
            action: 'Add your first item',
            priority: 'high'
        });
    } else if (items.length < 5) {
        insights.push({
            type: 'grow',
            title: 'Expand Your Collection',
            message: `You have ${items.length} items documented. Consider documenting more to unlock additional community benefits.`,
            action: 'Document more items',
            priority: 'medium'
        });
    }

    if (exchanges.length === 0 && items.length > 0) {
        insights.push({
            type: 'share',
            title: 'Share Your Materials',
            message: 'Make your materials available for trading, renting, or sharing to build community connections.',
            action: 'Update trade settings',
            priority: 'medium'
        });
    }

    const highValueItems = items.filter(item => item.estimatedValue > 500);
    if (highValueItems.length > 0) {
        insights.push({
            type: 'insurance',
            title: 'Consider Insurance Documentation',
            message: `You have ${highValueItems.length} high-value items. Consider creating detailed documentation for insurance purposes.`,
            action: 'Review insurance documentation',
            priority: 'low'
        });
    }

    return insights;
};

// Helper functions
const getCategoryBreakdown = (items) => {
    const categories = {};
    items.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + 1;
    });
    return categories;
};

const calculateCommunityViews = async (userId) => {
    // This would be implemented with actual view tracking
    const items = await Item.find({ userId });
    return items.reduce((sum, item) => sum + (item.viewCount || 0), 0);
};

const calculateKnowledgeScore = async (items) => {
    let score = 0;
    items.forEach(item => {
        score += 10; // Base score for documenting
        if (item.provenance && item.provenance.length > 50) score += 5;
        if (item.technicalDetails && item.technicalDetails.length > 50) score += 5;
        if (item.images && item.images.length > 0) score += item.images.length * 2;
        if (item.estimatedValue > 0) score += 3;
    });
    return Math.min(score, 1000);
};

const calculateReputationScore = async (exchanges, userId) => {
    const completedExchanges = exchanges.filter(e => e.status === 'Completed');
    let reputation = 0;
    
    completedExchanges.forEach(exchange => {
        reputation += 5; // Base reputation for completed exchanges
        if (exchange.requesterId.toString() === userId) {
            if (exchange.ownerRating && exchange.ownerRating >= 4) reputation += 10;
            if (exchange.ownerRating && exchange.ownerRating >= 5) reputation += 5;
        } else {
            if (exchange.requesterRating && exchange.requesterRating >= 4) reputation += 10;
            if (exchange.requesterRating && exchange.requesterRating >= 5) reputation += 5;
        }
    });
    
    return Math.min(reputation, 500);
};

const calculateContributionScore = async (items, exchanges) => {
    const documentationScore = items.length * 10;
    const exchangeScore = exchanges.length * 5;
    const qualityBonus = items.filter(item => 
        item.provenance && item.provenance.length > 50 ||
        item.technicalDetails && item.technicalDetails.length > 50
    ).length * 10;
    
    return documentationScore + exchangeScore + qualityBonus;
};

const getLevelPerks = (level) => {
    const perks = {
        1: ['Document up to 10 materials', 'Browse community inventory', 'Export your data'],
        2: ['Document unlimited materials', 'Participate in exchanges', 'Access to trading hub', 'Priority support'],
        3: ['Early access to rare materials', 'Mentoring opportunities', 'Community voting rights', 'Advanced analytics'],
        4: ['Expert badge and recognition', 'Access to exclusive materials', 'Curator privileges', 'Invitation to expert panels'],
        5: ['Master badge and legacy recognition', 'Platform governance rights', 'Lifetime premium access', 'Founding member status']
    };
    return perks[level] || perks[1];
};

const getAchievements = async (userId, items, exchanges) => {
    const achievements = [];
    
    if (items.length >= 1) achievements.push({ name: 'First Document', description: 'Documented your first analog material' });
    if (items.length >= 10) achievements.push({ name: 'Collector', description: 'Documented 10 materials' });
    if (items.length >= 50) achievements.push({ name: 'Curator', description: 'Documented 50 materials' });
    
    if (exchanges.length >= 1) achievements.push({ name: 'Trader', description: 'Completed your first exchange' });
    if (exchanges.length >= 10) achievements.push({ name: 'Community Member', description: 'Completed 10 exchanges' });
    
    const highValueItems = items.filter(item => item.estimatedValue > 1000);
    if (highValueItems.length > 0) achievements.push({ name: 'Collector of Value', description: 'Own high-value materials' });
    
    const categories = [...new Set(items.map(item => item.category))];
    if (categories.length >= 5) achievements.push({ name: 'Diverse Collector', description: 'Materials in 5+ categories' });
    
    return achievements;
};

// Get community benefits overview
const getCommunityBenefitsOverview = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalItems = await Item.countDocuments();
        const totalExchanges = await Exchange.countDocuments({ status: 'Completed' });
        const totalValue = await Item.aggregate([
            { $group: { _id: null, total: { $sum: '$estimatedValue' } } }
        ]);

        const recentActivity = await Item.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            community: {
                totalUsers,
                totalItems,
                totalExchanges,
                totalValue: totalValue[0]?.total || 0
            },
            recentActivity,
            benefits: {
                knowledgePreservation: `${totalItems} materials documented`,
                communityConnections: `${totalExchanges} successful exchanges`,
                collectiveValue: `$${(totalValue[0]?.total || 0).toFixed(2)} in documented materials`
            }
        });

    } catch (error) {
        console.error('Error getting community benefits overview:', error);
        res.status(500).json({ error: 'Error getting community overview' });
    }
};

module.exports = {
    calculateUserBenefits,
    getCommunityBenefitsOverview
};
