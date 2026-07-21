import prisma from '../utils/prisma.js';

export const getTenYearGrowth = async (req, res) => {
  try {
    const events = await prisma.event.findMany({ select: { startDate: true, institutionId: true } });
    const registrations = await prisma.registration.findMany({ 
      include: { event: { select: { startDate: true } } } 
    });

    const yearlyData = {};
    for (let y = 2016; y <= 2026; y++) {
      yearlyData[y] = { year: y.toString(), events: 0, participants: 0, institutions: 0, uniqueInstIds: new Set() };
    }

    events.forEach(e => {
      const year = new Date(e.startDate).getFullYear();
      if (yearlyData[year]) {
        yearlyData[year].events += 1;
        if (e.institutionId) {
          yearlyData[year].uniqueInstIds.add(e.institutionId);
        }
      }
    });

    registrations.forEach(r => {
      const year = new Date(r.event.startDate).getFullYear();
      if (yearlyData[year]) {
        yearlyData[year].participants += 1;
      }
    });

    const chartData = Object.values(yearlyData).map(data => {
      const { uniqueInstIds, ...rest } = data;
      return { ...rest, institutions: uniqueInstIds.size };
    }).sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    res.json({ success: true, data: chartData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEventTypeBreakdown = async (req, res) => {
  try {
    const breakdown = await prisma.event.groupBy({
      by: ['type'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });
    res.json({ success: true, data: breakdown.map(b => ({ type: b.type || 'Other', count: b._count.id })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopInstitutions = async (req, res) => {
  try {
    const institutions = await prisma.institution.findMany({
      include: {
        _count: { select: { event: true, user: true } },
        user: {
          select: {
            id: true,
            _count: { select: { winner: true } }
          }
        }
      }
    });

    const data = institutions.map(inst => {
      const winsCount = inst.user.reduce((acc, u) => acc + (u._count?.winner || 0), 0);
      const participantCount = inst._count.user || 0;
      const score = (participantCount * 1) + (winsCount * 5);

      return {
        id: inst.id,
        name: inst.name,
        code: inst.code,
        eventCount: inst._count.event,
        participantCount,
        winsCount,
        score
      };
    });

    // Sort by overall score descending (matching Leaderboard page), then winsCount
    data.sort((a, b) => b.score - a.score || b.winsCount - a.winsCount);

    res.json({ 
      success: true, 
      data: data.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getParticipationGrowth = async (req, res) => {
  try {
    // Basic YoY growth calculation
    const registrations = await prisma.registration.findMany({ 
      include: { event: { select: { startDate: true } } } 
    });

    const yearlySum = {};
    registrations.forEach(r => {
      const year = new Date(r.event.startDate).getFullYear();
      yearlySum[year] = (yearlySum[year] || 0) + 1;
    });

    const growthData = [];
    const years = Object.keys(yearlySum).sort();

    for (let i = 1; i < years.length; i++) {
        const currentYear = years[i];
        const prevYear = years[i-1];
        const growth = ((yearlySum[currentYear] - yearlySum[prevYear]) / yearlySum[prevYear]) * 100;
        growthData.push({
            year: currentYear,
            growth: parseFloat(growth.toFixed(1))
        });
    }

    res.json({ success: true, data: growthData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRelationships = async (req, res) => {
  try {
    const relationships = await prisma.relationshiptracker.findMany({
      include: {
        institution_relationshiptracker_institutionAIdToinstitution: { select: { id: true, name: true, code: true } },
        institution_relationshiptracker_institutionBIdToinstitution: { select: { id: true, name: true, code: true } }
      },
      orderBy: { interactionScore: 'desc' },
      take: 20
    });
    res.json({ success: true, data: relationships });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEventSuccessMetrics = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        NOT: {
          status: { in: ['PROPOSED', 'CANCELLED'] }
        }
      },
      include: {
        _count: { select: { registration: true } },
        feedback: { select: { rating: true } },
        institution: { select: { name: true } },
        budget: true
      },
      take: 20,
      orderBy: { startDate: 'desc' }
    });

    const metrics = events.map(e => {
      const avgRating = e.feedback.length > 0
        ? e.feedback.reduce((sum, f) => sum + f.rating, 0) / e.feedback.length
        : 0;

      return {
        id: e.id,
        title: e.title,
        participants: e._count.registration,
        _count: { registration: e._count.registration },
        avgRating: parseFloat(avgRating.toFixed(1)),
        score: Math.min(10, parseFloat(((e._count.registration * 0.05) + (avgRating * 1)).toFixed(1))), // Normalise success score to 10 max
        institution: e.institution,
        budget: e.budget[0] || null
      };
    }).sort((a,b) => b.participants - a.participants); // Sort by highest attendance first

    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFundFlow = async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany();
    const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const remaining = totalAllocated - totalSpent;

    const sponsors = await prisma.sponsor.findMany();
    const totalSponsorship = sponsors.reduce((sum, s) => sum + s.contribution, 0);

    res.json({
      success: true,
      data: {
        totalAllocated,
        totalSpent,
        remaining,
        totalSponsorship
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /analytics/budget-summary
 * Returns aggregated budget totals + registration revenue + top sponsors from real DB data.
 */
export const getBudgetSummary = async (req, res) => {
  try {
    // Aggregate all budgets
    const budgets = await prisma.budget.findMany({
      include: { event: { select: { id: true, title: true, startDate: true } } }
    });

    const totalAllocated = budgets.reduce((s, b) => s + (b.allocated || 0), 0);
    const totalSpent     = budgets.reduce((s, b) => s + (b.spent    || 0), 0);

    // Sponsorship inflow
    const sponsors = await prisma.sponsor.findMany({
      include: { event: { select: { title: true } } },
      orderBy: { contribution: 'desc' },
      take: 10
    });
    const totalSponsorship = sponsors.reduce((s, sp) => s + (sp.contribution || 0), 0);

    // Registration count as a proxy for registration revenue (no price field in DB)
    const regCount = await prisma.registration.count();

    // Year-by-year fund flow from budgets (group by year of event.startDate)
    const yearMap = {};
    budgets.forEach(b => {
      if (!b.event?.startDate) return;
      const yr = new Date(b.event.startDate).getFullYear();
      if (!yearMap[yr]) yearMap[yr] = { year: yr, sponsorship: 0, expenses: 0, registration: 0 };
      yearMap[yr].expenses    += b.spent    || 0;
      yearMap[yr].sponsorship += b.allocated || 0;
    });

    // Add sponsorship to the year chart
    sponsors.forEach(sp => {
      if (!sp.event) return;
    });

    const fundFlowData = Object.values(yearMap)
      .sort((a, b) => a.year - b.year)
      .map(d => ({
        year: d.year,
        sponsorship: Math.round(d.sponsorship / 1000),   // in thousands
        expenses:    Math.round(d.expenses    / 1000),
        registration: 0
      }));

    // Top sponsors formatted
    const topSponsors = sponsors.slice(0, 5).map(sp => ({
      id:           sp.id,
      name:         sp.name,
      eventTitle:   sp.event?.title || 'General',
      contribution: sp.contribution,
      type:         sp.type || (sp.contribution > 300000 ? 'Platinum' : sp.contribution > 200000 ? 'Gold' : sp.contribution > 100000 ? 'Silver' : 'Bronze'),
      status:       sp.status || 'ACTIVE'
    }));

    res.json({
      success: true,
      data: {
        totalSponsorship,
        totalAllocated,
        totalSpent,
        netSurplus: totalSponsorship - totalSpent,
        registrationCount: regCount,
        fundFlowData,
        topSponsors
      }
    });
  } catch (error) {
    console.error('getBudgetSummary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /analytics/collaboration
 * Returns institution collaboration data derived from shared event registrations.
 * Institutions collaborate when their users both register for the same event.
 */
export const getCollaborationData = async (req, res) => {
  try {
    // Fetch all institutions with their users
    const institutions = await prisma.institution.findMany({
      select: { id: true, name: true, code: true }
    });

    // Fetch registrations with user->institution data
    const registrations = await prisma.registration.findMany({
      include: {
        user: { select: { id: true, institutionId: true } },
        event: { select: { id: true, institutionId: true, startDate: true } }
      }
    });

    // Build a map of eventId -> Set of institutionIds that participated
    const eventInstMap = {};
    registrations.forEach(r => {
      if (!r.user?.institutionId) return;
      const eid = r.event.id;
      if (!eventInstMap[eid]) eventInstMap[eid] = { instIds: new Set(), hostInstId: r.event.institutionId, date: r.event.startDate };
      eventInstMap[eid].instIds.add(r.user.institutionId);
    });

    // Count collaboration pairs
    const pairMap = {};
    const instNameMap = {};
    institutions.forEach(i => { instNameMap[i.id] = i.name; });

    Object.values(eventInstMap).forEach(({ instIds, hostInstId, date }) => {
      const arr = [...instIds];
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = Math.min(arr[i], arr[j]);
          const b = Math.max(arr[i], arr[j]);
          const key = `${a}_${b}`;
          if (!pairMap[key]) pairMap[key] = { instAId: a, instBId: b, score: 0, lastDate: date };
          pairMap[key].score += 1;
          if (new Date(date) > new Date(pairMap[key].lastDate)) pairMap[key].lastDate = date;
        }
      }
    });

    // Sort by score descending
    const collaborations = Object.values(pairMap)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map(p => ({
        i1: instNameMap[p.instAId] || `Inst #${p.instAId}`,
        i2: instNameMap[p.instBId] || `Inst #${p.instBId}`,
        score: p.score,
        lastCollaborated: p.lastDate
      }));

    // Who visits us (host institution's events attended by others)
    const visitCountMap = {};
    Object.values(eventInstMap).forEach(({ instIds, hostInstId }) => {
      if (!hostInstId) return;
      instIds.forEach(id => {
        if (id !== hostInstId) {
          visitCountMap[id] = (visitCountMap[id] || 0) + 1;
        }
      });
    });

    const visitUs = Object.entries(visitCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, visits]) => ({ name: instNameMap[parseInt(id)] || `Inst #${id}`, visits }));

    // Which institutions we (host) visit most
    const weVisitMap = {};
    Object.values(eventInstMap).forEach(({ instIds, hostInstId }) => {
      if (!hostInstId) return;
      instIds.forEach(id => {
        if (id !== hostInstId) {
          weVisitMap[hostInstId] = weVisitMap[hostInstId] || {};
          weVisitMap[hostInstId][id] = (weVisitMap[hostInstId][id] || 0) + 1;
        }
      });
    });

    // Flatten to top destinations
    const weVisitFlat = {};
    Object.values(weVisitMap).forEach(destMap => {
      Object.entries(destMap).forEach(([id, count]) => {
        weVisitFlat[id] = (weVisitFlat[id] || 0) + count;
      });
    });

    const weVisit = Object.entries(weVisitFlat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, visits]) => ({ name: instNameMap[parseInt(id)] || `Inst #${id}`, visits }));

    res.json({ success: true, data: { collaborations, weVisit, visitUs } });
  } catch (error) {
    console.error('getCollaborationData error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
