// CampusQuest Client Application Logic

(function() {
    'use strict';

    // State
    let currentBootId = null;
    let isRestarting = false;
    let activeTab = localStorage.getItem('cq_active_tab') || 'leaderboard';
    let pollTimer = null;

    // Helper: compute relative API path preserving preview prefix
    function getApiUrl(endpoint) {
        let base = window.location.pathname;
        if (!base.endsWith('/')) {
            base = base.substring(0, base.lastIndexOf('/') + 1);
        }
        return base + endpoint.replace(/^\//, '');
    }

    // Friendly fetch with no-store
    async function apiFetch(endpoint, options = {}) {
        const url = getApiUrl(endpoint);
        const headers = options.headers || {};
        headers['Cache-Control'] = 'no-store';
        
        try {
            const resp = await fetch(url, { ...options, headers, cache: 'no-store' });
            hideError();
            if (resp.status === 403) {
                const data = await resp.json().catch(() => ({}));
                return { isForbidden: true, data };
            }
            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${resp.status} ${resp.statusText}`);
            }
            return await resp.json();
        } catch (err) {
            showError(`API error on ${endpoint}: ${err.message}`);
            throw err;
        }
    }

    function showError(msg) {
        const card = document.getElementById('errorCard');
        const text = document.getElementById('errorMessage');
        if (card && text) {
            text.textContent = msg;
            card.classList.remove('hidden');
        }
    }

    function hideError() {
        const card = document.getElementById('errorCard');
        if (card) card.classList.add('hidden');
    }

    function showToast(msg, isApplying = false) {
        const toast = document.getElementById('reloadNotification');
        const spinner = document.getElementById('toastSpinner');
        const text = document.getElementById('toastMessage');
        if (toast && text) {
            text.textContent = msg;
            if (isApplying) {
                spinner.classList.remove('hidden');
            } else {
                spinner.classList.add('hidden');
            }
            toast.classList.remove('hidden');
        }
    }

    function hideToast() {
        const toast = document.getElementById('reloadNotification');
        if (toast) toast.classList.add('hidden');
    }

    // Switch Tab
    function switchTab(tabName) {
        activeTab = tabName;
        localStorage.setItem('cq_active_tab', tabName);

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${tabName}`);
        });

        refreshActiveScreen();
    }

    // Health Polling
    async function pollHealth() {
        try {
            const data = await fetch(getApiUrl('api/health'), { cache: 'no-store' }).then(r => r.json());
            const bootId = data.boot_id;
            const startedAt = data.started_at;

            document.getElementById('bootIdDisplay').textContent = bootId ? bootId.substring(0, 8) + '...' : 'Unknown';
            document.getElementById('startedAtDisplay').textContent = startedAt || '--:--:--';
            document.getElementById('healthDot').className = 'status-dot green';

            if (currentBootId === null) {
                currentBootId = bootId;
            } else if (currentBootId !== bootId) {
                // Server restarted!
                currentBootId = bootId;
                showToast('Changes applied! Live preview reloaded.', false);
                setTimeout(hideToast, 3500);
                refreshActiveScreen();
            }

            if (isRestarting) {
                isRestarting = false;
                showToast('Changes applied! Live preview reloaded.', false);
                setTimeout(hideToast, 3500);
                refreshActiveScreen();
            }
        } catch (e) {
            // Server might be compiling / restarting
            document.getElementById('healthDot').className = 'status-dot red';
            document.getElementById('bootIdDisplay').textContent = 'Restarting...';
            if (!isRestarting) {
                isRestarting = true;
                showToast('Applying your changes...', true);
            }
        }
    }

    // Screen 1: Leaderboard
    async function refreshLeaderboard() {
        try {
            const data = await apiFetch('api/leaderboard');
            const tbody = document.getElementById('leaderboardTbody');
            const statusTag = document.getElementById('leaderboardStatusTag');
            const footerNote = document.getElementById('leaderboardFooterNote');

            if (!data || !data.entries) return;

            let html = '';
            data.entries.forEach(entry => {
                const rankClass = entry.rank === 1 ? 'rank-1' : entry.rank === 2 ? 'rank-2' : entry.rank === 3 ? 'rank-3' : 'rank-other';
                html += `
                    <tr>
                        <td><span class="rank-badge ${rankClass}">#${entry.rank}</span></td>
                        <td><strong>${entry.teamName}</strong> <span class="mono" style="font-size:0.75rem; color:#64748b">(${entry.teamId})</span></td>
                        <td><strong style="color:#6366f1">${entry.score.toFixed(1)} pts</strong></td>
                        <td class="mono" style="font-size:0.8rem">${entry.submissionTime}</td>
                        <td>
                            ${entry.score === 95.0 
                                ? (entry.rank === 1 && entry.teamId === 'team-cyber'
                                    ? '<span class="status-tag solved" style="font-size:0.72rem">Solved: Earlier Time Ranks #1</span>'
                                    : entry.rank === 1 && entry.teamId === 'team-algo'
                                    ? '<span class="status-tag defect" style="font-size:0.72rem">Defect: Later Time Inverted to #1</span>'
                                    : '<span class="status-tag" style="font-size:0.72rem">Tied Score</span>')
                                : '<span style="color:#64748b">-</span>'}
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;

            if (data.tiedOrderedCorrectly) {
                statusTag.className = 'status-tag solved';
                statusTag.textContent = '✓ Solved: Tied scores break by submission time';
                footerNote.innerHTML = '<span style="color:#10b981">✓ Correct Leaderboard: CyberKnights submitted at 10:00Z and is properly ranked #1 ahead of AlgoTitans (10:30Z).</span>';
            } else {
                statusTag.className = 'status-tag defect';
                statusTag.textContent = '✗ Seeded Defect: Tie-break inverted';
                footerNote.innerHTML = '<span style="color:#ef4444">✗ Defect 1: AlgoTitans submitted later (10:30Z) but is incorrectly ranked #1 ahead of CyberKnights (10:00Z).</span>';
            }
        } catch (e) {}
    }

    // Screen 2: Deadlines
    async function refreshDeadlines() {
        try {
            const data = await apiFetch('api/events/deadline-check');
            const statusTag = document.getElementById('deadlinesStatusTag');
            const box = document.getElementById('dlValidationBox');
            const res = document.getElementById('dlValidationResult');
            const desc = document.getElementById('dlValidationDesc');

            if (data.allowed) {
                statusTag.className = 'status-tag solved';
                statusTag.textContent = '✓ Solved: Configured event timezone respected';
                box.className = 'validation-box accepted';
                res.textContent = '✓ STATUS: ACCEPTED (ON TIME)';
                desc.textContent = 'Submission at 21:30 UTC correctly evaluated in America/New_York (17:30 local), before the 18:00 local deadline.';
            } else {
                statusTag.className = 'status-tag defect';
                statusTag.textContent = '✗ Seeded Defect: Event timezone ignored';
                box.className = 'validation-box rejected';
                res.textContent = '✗ STATUS: REJECTED (DEADLINE_EXPIRED)';
                desc.textContent = 'Defect 2: Event deadline 18:00 was parsed as UTC (18:00Z). Candidate submission at 21:30 UTC was falsely rejected despite being 17:30 local!';
            }
        } catch (e) {}
    }

    // Screen 3: Teams
    async function refreshTeams() {
        const teamIdInput = document.getElementById('inputTeamLookup').value || 'team-cyber';
        try {
            const data = await apiFetch(`api/teams/lookup?id=${encodeURIComponent(teamIdInput)}`);
            const statusTag = document.getElementById('teamsStatusTag');
            const resultBox = document.getElementById('teamLookupResult');

            if (data.found) {
                statusTag.className = 'status-tag solved';
                statusTag.textContent = '✓ Solved: Equivalent TeamId finds record';
                resultBox.innerHTML = `
                    <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:1.25rem;">
                        <h4 style="color:#34d399; margin-bottom:0.5rem">✓ Team Found: ${data.team.name}</h4>
                        <p><strong>Track:</strong> ${data.team.track} | <strong>Members:</strong> ${data.team.memberCount} | <strong>Status:</strong> ${data.team.status}</p>
                        <p class="mono" style="font-size:0.8rem; color:#94a3b8; margin-top:0.4rem">TeamId: ${data.searchedId}</p>
                    </div>
                `;
            } else {
                statusTag.className = 'status-tag defect';
                statusTag.textContent = '✗ Seeded Defect: Map key lookup failed';
                resultBox.innerHTML = `
                    <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:1.25rem;">
                        <h4 style="color:#f87171; margin-bottom:0.5rem">✗ Lookup Failed for "${data.searchedId}"</h4>
                        <p style="color:#fca5a5">${data.error}</p>
                        <p style="font-size:0.8rem; color:#94a3b8; margin-top:0.4rem">Defect 3: TeamId class lacks a proper hashCode() implementation matching value equality.</p>
                    </div>
                `;
            }
        } catch (e) {}
    }

    // Screen 4: Judging
    async function refreshJudging() {
        try {
            const data = await apiFetch('api/judging/status?subId=sub-101');
            const statusTag = document.getElementById('judgingStatusTag');
            const totalDisplay = document.getElementById('judgingTotalScore');
            const countDisplay = document.getElementById('judgingCount');
            const note = document.getElementById('judgingFooterNote');

            totalDisplay.textContent = data.totalScore.toFixed(1) + ' pts';
            countDisplay.textContent = data.evaluationCount;

            if (data.isDuplicated) {
                statusTag.className = 'status-tag defect';
                statusTag.textContent = '✗ Seeded Defect: Score duplicated on retry';
                note.innerHTML = '<span style="color:#f87171">✗ Defect 4: Evaluation score duplicated (' + data.totalScore + ' pts)! Callback retry was not idempotent.</span>';
            } else {
                statusTag.className = 'status-tag solved';
                statusTag.textContent = '✓ Solved: Callback retry is idempotent';
                note.innerHTML = '<span style="color:#34d399">✓ Correct: Score idempotent at 25.0 pts across duplicate retries.</span>';
            }
        } catch (e) {}
    }

    // Screen 5: Access
    async function refreshAccess() {
        try {
            const res = await apiFetch('api/submissions/judge-access?judgeId=judge-alpha&submissionId=sub-201');
            const statusTag = document.getElementById('accessStatusTag');
            const box = document.getElementById('accessResultBox');

            if (res.isForbidden || (res.data && res.data.code === 'ACCESS_DENIED')) {
                statusTag.className = 'status-tag solved';
                statusTag.textContent = '✓ Solved: 403 Forbidden across events';
                box.innerHTML = `
                    <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:1.25rem;">
                        <h4 style="color:#34d399; margin-bottom:0.5rem">✓ 403 Forbidden: Access Denied</h4>
                        <p>Judge "judge-alpha" (event-hackathon) was denied access to submission "sub-201" (event-designquest).</p>
                        <p class="mono" style="font-size:0.8rem; color:#94a3b8; margin-top:0.4rem">${res.data.error || 'Unauthorized cross-event access'}</p>
                    </div>
                `;
            } else {
                statusTag.className = 'status-tag defect';
                statusTag.textContent = '✗ Seeded Defect: Unauthorized access permitted';
                box.innerHTML = `
                    <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:1.25rem;">
                        <h4 style="color:#f87171; margin-bottom:0.5rem">✗ Security Defect: Unauthorized Submission Leaked!</h4>
                        <p style="color:#fca5a5">Judge Alan Turing (event-hackathon) accessed submission "SolarGrid UI" belonging to event-designquest.</p>
                        <p class="mono" style="font-size:0.8rem; color:#94a3b8; margin-top:0.4rem">Missing event assignment verification in getSubmissionForJudge().</p>
                    </div>
                `;
            }
        } catch (e) {}
    }

    // Screen 6: Reservations
    async function refreshReservations() {
        try {
            const slots = await apiFetch('api/reservations');
            const statusTag = document.getElementById('reservationStatusTag');
            const box = document.getElementById('reservationResultBox');

            if (!slots || !slots.length) return;
            const slot = slots.find(s => s.slotId === 'slot-lab-a') || slots[0];
            const count = slot.reservedTeams ? slot.reservedTeams.length : 0;
            const exceeded = count > slot.capacity;

            let html = `
                <div class="grid-2" style="margin-bottom:1rem">
                    <div class="info-group">
                        <span class="label">Reservation Slot</span>
                        <span class="value">${slot.name} (${slot.slotId})</span>
                    </div>
                    <div class="info-group">
                        <span class="label">Configured Capacity</span>
                        <span class="value mono">${slot.capacity} teams max</span>
                    </div>
                </div>
                <div class="metric-card" style="margin-bottom:1rem">
                    <span class="metric-label">Current Bookings</span>
                    <span class="metric-val mono ${exceeded ? 'text-danger' : ''}" style="${exceeded ? 'color:#f87171' : 'color:#34d399'}">${count} / ${slot.capacity}</span>
                </div>
            `;

            if (exceeded) {
                statusTag.className = 'status-tag defect';
                statusTag.textContent = '✗ Seeded Defect: Capacity Exceeded';
                html += `<p style="color:#f87171">✗ Race condition: ${count} teams reserved slot with capacity ${slot.capacity}!</p>`;
            } else {
                statusTag.className = 'status-tag solved';
                statusTag.textContent = '✓ Solved: Capacity strictly enforced';
                html += `<p style="color:#34d399">✓ Thread-safe: Reservations never exceed max capacity ${slot.capacity}.</p>`;
            }

            box.innerHTML = html;
        } catch (e) {}
    }

    // Screen 7: Matching
    async function refreshMatching() {
        try {
            const data = await apiFetch('api/matching');
            const statusTag = document.getElementById('matchingStatusTag');
            const box = document.getElementById('matchingResultBox');

            let html = `
                <div class="grid-2" style="margin-bottom:1rem">
                    <div class="metric-card">
                        <span class="metric-label">Matched Submissions</span>
                        <span class="metric-val mono">${data.matchedCount} / ${data.targetMaximum}</span>
                    </div>
                    <div class="info-group">
                        <span class="label">Matching Status</span>
                        <span class="value">${data.isMaximumMatching ? 'Optimal Maximum Matching' : 'Suboptimal Greedy Matching'}</span>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.02); padding:1rem; border-radius:8px;">
                    <h5 style="color:#94a3b8; margin-bottom:0.5rem">Judge Assignments:</h5>
                    <ul style="list-style:none; padding-left:0;">
            `;

            for (const [judge, sub] of Object.entries(data.assignments || {})) {
                html += `<li class="mono" style="padding:0.25rem 0; font-size:0.85rem">👨‍⚖️ ${judge} ➔ 📄 ${sub}</li>`;
            }
            html += '</ul></div>';

            if (data.isMaximumMatching) {
                statusTag.className = 'status-tag solved';
                statusTag.textContent = '✓ Solved: Maximum bipartite matching (4/4)';
            } else {
                statusTag.className = 'status-tag defect';
                statusTag.textContent = '✗ Seeded Defect: Greedy stalled (' + data.matchedCount + '/4)';
            }

            box.innerHTML = html;
        } catch (e) {}
    }

    // Screen 8: Schedule
    async function refreshSchedule() {
        try {
            const data = await apiFetch('api/schedule');
            const statusTag = document.getElementById('scheduleStatusTag');
            const box = document.getElementById('scheduleResultBox');

            let html = `
                <div class="grid-2" style="margin-bottom:1rem">
                    <div class="metric-card">
                        <span class="metric-label">Total Priority Score</span>
                        <span class="metric-val mono">${data.totalPriority} / ${data.optimalTarget} pts</span>
                    </div>
                    <div class="info-group">
                        <span class="label">Optimization State</span>
                        <span class="value">${data.isOptimal ? 'Optimal Weighted Schedule (DP)' : 'Suboptimal Schedule (Greedy)'}</span>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.02); padding:1rem; border-radius:8px;">
                    <h5 style="color:#94a3b8; margin-bottom:0.5rem">Scheduled Demo Intervals:</h5>
                    <ul style="list-style:none; padding-left:0;">
            `;

            (data.scheduledSlots || []).forEach(slot => {
                const startH = Math.floor(slot.startMinute / 60);
                const startM = (slot.startMinute % 60).toString().padStart(2, '0');
                const endH = Math.floor(slot.endMinute / 60);
                const endM = (slot.endMinute % 60).toString().padStart(2, '0');
                html += `<li class="mono" style="padding:0.25rem 0; font-size:0.85rem">⏱️ ${startH}:${startM} - ${endH}:${endM} | ${slot.teamName} (Priority: ${slot.priority})</li>`;
            });
            html += '</ul></div>';

            if (data.isOptimal) {
                statusTag.className = 'status-tag solved';
                statusTag.textContent = '✓ Solved: Maximum Priority Score (65 pts)';
            } else {
                statusTag.className = 'status-tag defect';
                statusTag.textContent = '✗ Seeded Defect: Suboptimal Score (' + data.totalPriority + ' pts)';
            }

            box.innerHTML = html;
        } catch (e) {}
    }

    // Dispatcher for active screen refresh
    function refreshActiveScreen() {
        switch (activeTab) {
            case 'leaderboard': refreshLeaderboard(); break;
            case 'deadlines': refreshDeadlines(); break;
            case 'teams': refreshTeams(); break;
            case 'judging': refreshJudging(); break;
            case 'access': refreshAccess(); break;
            case 'reservations': refreshReservations(); break;
            case 'matching': refreshMatching(); break;
            case 'schedule': refreshSchedule(); break;
        }
    }

    // Event listeners
    document.addEventListener('DOMContentLoaded', () => {
        // Tab switching
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        // Team lookup button
        document.getElementById('btnLookupTeam')?.addEventListener('click', refreshTeams);
        document.getElementById('inputTeamLookup')?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') refreshTeams();
        });

        // Judging simulate retry button
        document.getElementById('btnSimulateRetry')?.addEventListener('click', async () => {
            await apiFetch('api/judging/record-score?evalId=eval-101&subId=sub-101&judgeId=judge-alpha&score=25.0', { method: 'POST' });
            await apiFetch('api/judging/record-score?evalId=eval-101&subId=sub-101&judgeId=judge-alpha&score=25.0', { method: 'POST' });
            refreshJudging();
        });

        // Concurrent reservation burst button
        document.getElementById('btnBurstReservations')?.addEventListener('click', async () => {
            await apiFetch('api/reservations/simulate-burst?slotId=slot-lab-a', { method: 'POST' });
            refreshReservations();
        });

        // Reset data store button
        document.getElementById('btnResetStore')?.addEventListener('click', async () => {
            await apiFetch('api/admin/reset', { method: 'POST' });
            refreshActiveScreen();
        });

        // Dismiss error button
        document.getElementById('btnDismissError')?.addEventListener('click', hideError);

        // Restore active tab
        switchTab(activeTab);

        // Immediate health check
        pollHealth();

        // 1.5s background polling loop
        pollTimer = setInterval(() => {
            pollHealth();
            refreshActiveScreen();
        }, 1500);
    });

})();
