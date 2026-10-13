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
            showError(`Communication notice on ${endpoint}: ${err.message}`);
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

    // Temporary Flashing Notification (Flashes for 3.5 seconds then fades away)
    function triggerFlash(containerId, message, type = 'success') {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="flash-pill ${type}">
                <span>${type === 'success' ? '✓' : 'ℹ️'}</span>
                <span>${message}</span>
            </div>
        `;
        setTimeout(() => {
            if (container) container.innerHTML = '';
        }, 3600);
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

            document.getElementById('bootIdDisplay').textContent = bootId ? bootId.substring(0, 8) + '...' : 'Online';
            document.getElementById('startedAtDisplay').textContent = startedAt || '--:--:--';
            document.getElementById('healthDot').className = 'status-dot green';

            if (currentBootId === null) {
                currentBootId = bootId;
            } else if (currentBootId !== bootId) {
                // Server restarted!
                currentBootId = bootId;
                showToast('Changes applied! Preview updated.', false);
                setTimeout(hideToast, 3500);
                refreshActiveScreen();
            }

            if (isRestarting) {
                isRestarting = false;
                showToast('Changes applied! Preview updated.', false);
                setTimeout(hideToast, 3500);
                refreshActiveScreen();
            }
        } catch (e) {
            document.getElementById('healthDot').className = 'status-dot red';
            document.getElementById('bootIdDisplay').textContent = 'Reconnecting...';
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
            const footerNote = document.getElementById('leaderboardFooterNote');

            if (!data || !data.entries) return;

            let html = '';
            data.entries.forEach(entry => {
                const rankClass = entry.rank === 1 ? 'rank-1' : entry.rank === 2 ? 'rank-2' : entry.rank === 3 ? 'rank-3' : 'rank-other';
                html += `
                    <tr>
                        <td><span class="rank-badge ${rankClass}">#${entry.rank}</span></td>
                        <td><strong>${entry.teamName}</strong> <span class="mono" style="font-size:0.75rem; color:#64748b">(${entry.teamId})</span></td>
                        <td><strong style="color:#4f46e5">${entry.score.toFixed(1)} pts</strong></td>
                        <td class="mono" style="font-size:0.8rem">${entry.submissionTime}</td>
                        <td>
                            ${entry.score === 95.0 
                                ? (entry.rank === 1 && entry.teamId === 'team-cyber'
                                    ? '<span class="status-pill success">Verified Standing</span>'
                                    : entry.rank === 1 && entry.teamId === 'team-algo'
                                    ? '<span class="status-pill danger">Tie Inverted</span>'
                                    : '<span class="status-pill neutral">Tied Score</span>')
                                : '<span class="status-pill neutral">Finalized</span>'}
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;

            if (data.tiedOrderedCorrectly) {
                footerNote.innerHTML = '<span style="color:#059669">✓ Official Standings: Tie resolved by earlier submission timestamp.</span>';
            } else {
                footerNote.innerHTML = '<span style="color:#dc2626">Note: Standings currently reflect raw rank order.</span>';
            }
        } catch (e) {}
    }

    // Screen 2: Deadlines
    async function refreshDeadlines() {
        try {
            const data = await apiFetch('api/events/deadline-check');
            const box = document.getElementById('dlValidationBox');
            const res = document.getElementById('dlValidationResult');
            const desc = document.getElementById('dlValidationDesc');

            if (data.allowed) {
                box.className = 'validation-box accepted';
                res.textContent = 'STATUS: ACCEPTED (ON TIME)';
                desc.textContent = 'Submission at 21:30 UTC verified within 18:00 local deadline for America/New_York (17:30 EDT).';
            } else {
                box.className = 'validation-box rejected';
                res.textContent = 'STATUS: REJECTED (DEADLINE_EXPIRED)';
                desc.textContent = 'Submission timestamp was evaluated against 18:00 UTC instead of local event timezone.';
            }
        } catch (e) {}
    }

    // Screen 3: Teams
    async function refreshTeams() {
        const teamIdInput = document.getElementById('inputTeamLookup').value || 'team-cyber';
        try {
            const data = await apiFetch(`api/teams/lookup?id=${encodeURIComponent(teamIdInput)}`);
            const resultBox = document.getElementById('teamLookupResult');

            if (data.found) {
                resultBox.innerHTML = `
                    <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:1.25rem;">
                        <h4 style="color:#065f46; margin-bottom:0.4rem; font-size:1.05rem">✓ ${data.team.name}</h4>
                        <p style="color:#334155"><strong>Track:</strong> ${data.team.track} &nbsp;|&nbsp; <strong>Roster:</strong> ${data.team.memberCount} members &nbsp;|&nbsp; <strong>Status:</strong> <span class="status-pill success">${data.team.status}</span></p>
                        <p class="mono" style="font-size:0.8rem; color:#64748b; margin-top:0.35rem">Team ID: ${data.searchedId}</p>
                    </div>
                `;
            } else {
                resultBox.innerHTML = `
                    <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:1.25rem;">
                        <h4 style="color:#991b1b; margin-bottom:0.4rem">No Active Record for "${data.searchedId}"</h4>
                        <p style="color:#b91c1c; font-size:0.9rem">${data.error}</p>
                    </div>
                `;
            }
        } catch (e) {}
    }

    // Screen 4: Judging
    async function refreshJudging() {
        try {
            const data = await apiFetch('api/judging/status?subId=sub-101');
            const totalDisplay = document.getElementById('judgingTotalScore');
            const countDisplay = document.getElementById('judgingCount');
            const note = document.getElementById('judgingFooterNote');

            totalDisplay.textContent = data.totalScore.toFixed(1) + ' pts';
            countDisplay.textContent = data.evaluationCount;

            if (data.isDuplicated) {
                note.innerHTML = '<span style="color:#dc2626">Notice: Score inflated (' + data.totalScore + ' pts) across duplicate callback submissions.</span>';
            } else {
                note.innerHTML = '<span style="color:#059669">✓ Evaluation score verified at 25.0 pts (idempotent scoring).</span>';
            }
        } catch (e) {}
    }

    // Screen 5: Access
    async function refreshAccess() {
        try {
            const res = await apiFetch('api/submissions/judge-access?judgeId=judge-alpha&submissionId=sub-201');
            const box = document.getElementById('accessResultBox');

            if (res.isForbidden || (res.data && res.data.code === 'ACCESS_DENIED')) {
                box.innerHTML = `
                    <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:1.25rem;">
                        <h4 style="color:#065f46; margin-bottom:0.4rem">✓ Access Restricted (403 Forbidden)</h4>
                        <p style="color:#334155">Judge "judge-alpha" (event-hackathon) cannot access submissions from "event-designquest".</p>
                        <p class="mono" style="font-size:0.8rem; color:#64748b; margin-top:0.35rem">Multi-tenant boundary strictly enforced.</p>
                    </div>
                `;
            } else {
                box.innerHTML = `
                    <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:1.25rem;">
                        <h4 style="color:#991b1b; margin-bottom:0.4rem">Submission Inspection Permitted</h4>
                        <p style="color:#b91c1c">Judge Alan Turing (event-hackathon) accessed submission "SolarGrid UI" from event-designquest.</p>
                        <p class="mono" style="font-size:0.8rem; color:#64748b; margin-top:0.35rem">Cross-event authorization boundary not enforced.</p>
                    </div>
                `;
            }
        } catch (e) {}
    }

    // Screen 6: Reservations
    async function refreshReservations() {
        try {
            const slots = await apiFetch('api/reservations');
            const box = document.getElementById('reservationResultBox');

            if (!slots || !slots.length) return;
            const slot = slots.find(s => s.slotId === 'slot-lab-a') || slots[0];
            const count = slot.reservedTeams ? slot.reservedTeams.length : 0;
            const exceeded = count > slot.capacity;

            let html = `
                <div class="grid-2" style="margin-bottom:1rem">
                    <div class="info-group">
                        <span class="label">Location</span>
                        <span class="value">${slot.name} (${slot.slotId})</span>
                    </div>
                    <div class="info-group">
                        <span class="label">Booth Capacity</span>
                        <span class="value mono">${slot.capacity} teams max</span>
                    </div>
                </div>
                <div class="metric-card" style="margin-bottom:1rem">
                    <span class="metric-label">Confirmed Reservations</span>
                    <span class="metric-val mono" style="${exceeded ? 'color:#dc2626' : 'color:#059669'}">${count} / ${slot.capacity}</span>
                </div>
            `;

            if (exceeded) {
                html += `<p style="color:#dc2626; font-size:0.88rem">Overbooked: ${count} teams confirmed for slot with capacity ${slot.capacity}.</p>`;
            } else {
                html += `<p style="color:#059669; font-size:0.88rem">Confirmed: Bookings are strictly maintained within max capacity ${slot.capacity}.</p>`;
            }

            box.innerHTML = html;
        } catch (e) {}
    }

    // Screen 7: Matching
    async function refreshMatching() {
        try {
            const data = await apiFetch('api/matching');
            const box = document.getElementById('matchingResultBox');

            let html = `
                <div class="grid-2" style="margin-bottom:1rem">
                    <div class="metric-card">
                        <span class="metric-label">Assigned Submissions</span>
                        <span class="metric-val mono">${data.matchedCount} / ${data.targetMaximum}</span>
                    </div>
                    <div class="info-group">
                        <span class="label">Allocation Status</span>
                        <span class="value">${data.isMaximumMatching ? 'Full Coverage (Optimal)' : 'Partial Allocation (Greedy)'}</span>
                    </div>
                </div>
                <div style="background:#f8fafc; padding:1rem; border-radius:8px; border:1px solid #e2e8f0;">
                    <h5 style="color:#475569; margin-bottom:0.5rem; font-size:0.82rem">Assigned Matches:</h5>
                    <ul style="list-style:none; padding-left:0;">
            `;

            for (const [judge, sub] of Object.entries(data.assignments || {})) {
                html += `<li class="mono" style="padding:0.25rem 0; font-size:0.85rem">👨‍⚖️ ${judge} ➔ 📄 ${sub}</li>`;
            }
            html += '</ul></div>';

            box.innerHTML = html;
        } catch (e) {}
    }

    // Screen 8: Schedule
    async function refreshSchedule() {
        try {
            const data = await apiFetch('api/schedule');
            const box = document.getElementById('scheduleResultBox');

            let html = `
                <div class="grid-2" style="margin-bottom:1rem">
                    <div class="metric-card">
                        <span class="metric-label">Cumulative Priority Impact</span>
                        <span class="metric-val mono">${data.totalPriority} / ${data.optimalTarget} pts</span>
                    </div>
                    <div class="info-group">
                        <span class="label">Schedule Strategy</span>
                        <span class="value">${data.isOptimal ? 'Optimal Dynamic Schedule' : 'Greedy Schedule'}</span>
                    </div>
                </div>
                <div style="background:#f8fafc; padding:1rem; border-radius:8px; border:1px solid #e2e8f0;">
                    <h5 style="color:#475569; margin-bottom:0.5rem; font-size:0.82rem">Confirmed Presentation Slots:</h5>
                    <ul style="list-style:none; padding-left:0;">
            `;

            (data.scheduledSlots || []).forEach(slot => {
                const startH = Math.floor(slot.startMinute / 60);
                const startM = (slot.startMinute % 60).toString().padStart(2, '0');
                const endH = Math.floor(slot.endMinute / 60);
                const endM = (slot.endMinute % 60).toString().padStart(2, '0');
                html += `<li class="mono" style="padding:0.25rem 0; font-size:0.85rem">⏱️ ${startH}:${startM} - ${endH}:${endM} | <strong>${slot.teamName}</strong> (Priority: ${slot.priority})</li>`;
            });
            html += '</ul></div>';

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
        document.getElementById('btnLookupTeam')?.addEventListener('click', () => {
            refreshTeams();
            triggerFlash('flashNotice-teams', 'Team directory queried', 'success');
        });
        document.getElementById('inputTeamLookup')?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                refreshTeams();
                triggerFlash('flashNotice-teams', 'Team directory queried', 'success');
            }
        });

        // Judging simulate retry button
        document.getElementById('btnSimulateRetry')?.addEventListener('click', async () => {
            await apiFetch('api/judging/record-score?evalId=eval-101&subId=sub-101&judgeId=judge-alpha&score=25.0', { method: 'POST' });
            await apiFetch('api/judging/record-score?evalId=eval-101&subId=sub-101&judgeId=judge-alpha&score=25.0', { method: 'POST' });
            refreshJudging();
            triggerFlash('flashNotice-judging', 'Scoring webhook evaluation recorded', 'success');
        });

        // Concurrent reservation burst button
        document.getElementById('btnBurstReservations')?.addEventListener('click', async () => {
            await apiFetch('api/reservations/simulate-burst?slotId=slot-lab-a', { method: 'POST' });
            refreshReservations();
            triggerFlash('flashNotice-reservations', 'Concurrent burst simulation executed', 'warn');
        });

        // Reset data store button
        document.getElementById('btnResetStore')?.addEventListener('click', async () => {
            await apiFetch('api/admin/reset', { method: 'POST' });
            refreshActiveScreen();
            showToast('Data store reset to initial state.', false);
            setTimeout(hideToast, 3000);
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
