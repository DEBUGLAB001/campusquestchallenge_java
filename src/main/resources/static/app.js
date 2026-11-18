
const API_BASE = (() => {
  const match = window.location.pathname.match(/^(\/runtime\/[^/]+\/preview)/);
  return match ? `${match[1]}/api` : '/api';
})();

const TAB_TITLES = {
  standings: 'Standings',
  deadlines: 'Deadlines',
  teams: 'Team directory',
  judging: 'Evaluation scores',
  access: 'Judge access',
  reservations: 'Booth reservations'
};

const SUBMISSION_CATALOG = {
  'sub-101': { title: 'SmartCampus IoT', team: 'CyberKnights', track: 'AI/ML' },
  'sub-102': { title: 'NeuralFlow Engine', team: 'AlgoTitans', track: 'Systems' },
  'sub-103': { title: 'CloudShield', team: 'ByteCrafters', track: 'Cloud' },
  'sub-104': { title: 'ChainCert', team: 'NexusSquad', track: 'Web3' },
  'sub-201': { title: 'SolarGrid UI', team: 'NexusSquad', track: 'Design Quest' }
};

const JUDGE_CATALOG = {
  'judge-alpha': 'Dr. Alan Turing',
  'judge-beta': 'Prof. Grace Hopper',
  'judge-gamma': 'Dr. Claude Shannon',
  'judge-delta': 'Dr. Ada Lovelace',
  'judge-external': 'Dr. Linus Torvalds'
};

document.addEventListener('DOMContentLoaded', () => {
  initThemes();
  initClocks();
  initNavigation();
  initGlobalControls();
  initLeaderboard();
  initDeadlineCheck();
  initTeamLookup();
  initJudgingModule();
  initAccessAudit();
  initBoothReservations();
});

function initThemes() {
  const order = ['teal', 'violet'];
  const labels = { teal: 'Teal', violet: 'Violet' };
  const buttons = document.querySelectorAll('[data-theme-choice]');
  const cycleBtn = document.getElementById('btnCycleTheme');
  const topbarLabel = document.getElementById('topbarThemeLabel');

  function applyTheme(theme, persist = true) {
    const valid = order.includes(theme) ? theme : 'teal';
    document.documentElement.setAttribute('data-theme', valid);

    buttons.forEach((btn) => {
      const isMatch = btn.getAttribute('data-theme-choice') === valid;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-checked', String(isMatch));
    });

    if (topbarLabel) {
      topbarLabel.textContent = labels[valid];
    }

    if (persist) {
      try {
        localStorage.setItem('cq-theme', valid);
      } catch {
        
      }
    }
  }

  let initial = document.documentElement.getAttribute('data-theme') || 'teal';
  try {
    const stored = localStorage.getItem('cq-theme');
    if (order.includes(stored)) initial = stored;
  } catch {
    
  }
  applyTheme(initial, false);

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = btn.getAttribute('data-theme-choice');
      applyTheme(choice, true);
      showToast(`Switched theme to ${labels[choice] || choice}`, 'info');
    });
  });

  if (cycleBtn) {
    cycleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'teal';
      const next = order[(order.indexOf(current) + 1) % order.length];
      applyTheme(next, true);
      showToast(`Switched theme to ${labels[next]}`, 'info');
    });
  }
}

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setNavDot(tab, state) {
  const dot = document.getElementById(`dot-${tab}`);
  if (!dot) return;
  dot.className = `nav-dot ${state || ''}`.trim();
}

function setPulse(key, badgeText, badgeKind, subText) {
  const badge = document.getElementById(`pulse-${key}-badge`);
  const sub = document.getElementById(`pulse-${key}-sub`);
  if (badge) {
    badge.className = `badge ${badgeKind}`;
    badge.textContent = badgeText;
  }
  if (sub && subText) {
    sub.textContent = subText;
  }
}

function formatMinutes(totalMinutes) {
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function formatUtcTimestamp(isoStr) {
  if (!isoStr) return '—';
  return String(isoStr).replace('T', ' ').replace('Z', ' UTC');
}

function formatInTimeZone(isoStr, timeZone) {
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return 'Invalid timestamp';
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return isoStr;
  }
}

function initClocks() {
  function tick() {
    const now = new Date();
    const utcEl = document.getElementById('sidebarUtcClock');
    if (utcEl) {
      utcEl.textContent = now.toISOString().slice(11, 19);
    }

    const clientClock = document.getElementById('clientClockDisplay');
    const clientTz = document.getElementById('clientTimezone');
    if (clientClock) {
      clientClock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }
    if (clientTz) {
      try {
        clientTz.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local timezone';
      } catch {
        clientTz.textContent = 'Local timezone';
      }
    }
  }
  tick();
  setInterval(tick, 1000);
}

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const modules = document.querySelectorAll('.module-view');
  const menuToggle = document.getElementById('mobileNavToggle');
  const backdrop = document.getElementById('navBackdrop');
  const topbarTitle = document.getElementById('topbarSectionName');
  const workspace = document.querySelector('.workspace');

  function closeDrawer(returnFocus = false) {
    document.body.classList.remove('mobile-nav-open');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    }
    if (backdrop) backdrop.hidden = true;
    if (workspace) workspace.inert = false;
    if (returnFocus && menuToggle) menuToggle.focus();
  }

  function openDrawer() {
    document.body.classList.add('mobile-nav-open');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Close navigation');
    }
    if (backdrop) backdrop.hidden = false;
    if (workspace) workspace.inert = true;
    navItems[0]?.focus();
  }

  function activateTab(tabId) {
    const valid = Object.prototype.hasOwnProperty.call(TAB_TITLES, tabId);
    const target = valid ? tabId : 'standings';

    navItems.forEach((item) => {
      const active = item.getAttribute('data-tab') === target;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });

    modules.forEach((mod) => {
      mod.classList.toggle('active', mod.id === `module-${target}`);
    });

    if (topbarTitle) {
      topbarTitle.textContent = TAB_TITLES[target];
    }
  }

  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-tab');
      window.location.hash = target;
      activateTab(target);
      if (window.innerWidth <= 920) {
        closeDrawer(false);
        const h2 = document.querySelector(`#module-${target} h2`);
        if (h2) {
          h2.setAttribute('tabindex', '-1');
          h2.focus();
        }
      }
    });
  });

  document.querySelectorAll('[data-jump]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-jump');
      window.location.hash = target;
      activateTab(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'standings';
    activateTab(hash);
  });

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const open = document.body.classList.contains('mobile-nav-open');
      if (open) closeDrawer(true);
      else openDrawer();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => closeDrawer(true));
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('mobile-nav-open')) {
      closeDrawer(true);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 920 && document.body.classList.contains('mobile-nav-open')) {
      closeDrawer(false);
    }
  });

  const initial = window.location.hash.replace('#', '') || 'standings';
  activateTab(initial);
}

function initGlobalControls() {
  const btnRefresh = document.getElementById('btnGlobalRefresh');

  async function refreshAllModules() {
    await Promise.allSettled([
      window._fetchLeaderboard?.(),
      window._fetchDeadline?.(),
      window._fetchTeam?.(),
      window._fetchJudgingStatus?.(),
      window._fetchAccess?.(true),
      window._fetchReservations?.()
    ]);
  }

  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      btnRefresh.disabled = true;
      await refreshAllModules();
      btnRefresh.disabled = false;
      showToast('All competition views refreshed', 'info');
    });
  }
}

function initLeaderboard() {
  async function fetchLeaderboard() {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`);
      if (!res.ok) return;
      const data = await res.json();

      const entries = Array.isArray(data) ? data : (data.entries || []);
      const tiedCorrect = data.tiedOrderedCorrectly !== undefined ? data.tiedOrderedCorrectly : true;

      const banner = document.getElementById('standingsAnomalyBanner');
      const bannerText = document.getElementById('standingsBannerText');
      const countBadge = document.getElementById('leaderboardCountBadge');

      if (countBadge) {
        countBadge.textContent = `${entries.length} teams`;
      }

      if (banner && bannerText) {
        if (!tiedCorrect) {
          banner.className = 'status-banner warning';
          bannerText.textContent = 'Tie inversion detected: earlier submission ranked behind';
          setNavDot('standings', 'warn');
        } else {
          banner.className = 'status-banner success';
          bannerText.textContent = 'Tie-breaking verified: earlier timestamps prioritized';
          setNavDot('standings', 'ok');
        }
      }

      const podiumTargets = [
        document.getElementById('podiumGold'),
        document.getElementById('podiumSilver'),
        document.getElementById('podiumBronze')
      ];

      podiumTargets.forEach((card, idx) => {
        const item = entries[idx];
        if (!card || !item) return;
        const nameEl = card.querySelector('.podium-team-name');
        const idEl = card.querySelector('.podium-team-id');
        const scoreEl = card.querySelector('.podium-score');
        const timeEl = card.querySelector('.podium-time');

        if (nameEl) nameEl.textContent = item.teamName || item.teamId;
        if (idEl) idEl.textContent = item.teamId;
        if (scoreEl) scoreEl.innerHTML = `${Number(item.score).toFixed(1)} <span>pts</span>`;
        if (timeEl) timeEl.textContent = formatUtcTimestamp(item.submissionTime);
      });

      const tbody = document.getElementById('leaderboardBody');
      if (tbody && entries.length > 0) {
        tbody.innerHTML = entries.map((item, idx) => {
          const rank = item.rank || idx + 1;
          const isTied = (idx > 0 && item.score === entries[idx - 1].score) ||
            (idx < entries.length - 1 && item.score === entries[idx + 1].score);
          const isAnomaly = isTied && !tiedCorrect;

          let badgeHtml = '<span class="badge success">Verified rank</span>';
          if (isAnomaly) {
            badgeHtml = '<span class="badge warning">Tie inversion</span>';
          } else if (isTied) {
            badgeHtml = '<span class="badge success">Tie resolved</span>';
          }

          return `
            <tr class="${isAnomaly ? 'row-anomaly' : ''}">
              <td data-label="Rank" class="rank-num">#${rank}</td>
              <td data-label="Team">
                <strong>${escapeHtml(item.teamName || item.teamId)}</strong>
                <span class="team-sub-id">${escapeHtml(item.teamId)}</span>
              </td>
              <td data-label="Score" class="cell-mono"><strong>${Number(item.score).toFixed(1)} pts</strong></td>
              <td data-label="Submitted (UTC)" class="cell-mono">${escapeHtml(formatUtcTimestamp(item.submissionTime))}</td>
              <td data-label="Tie-break check">${badgeHtml}</td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    }
  }

  window._fetchLeaderboard = fetchLeaderboard;
  fetchLeaderboard();
}

function initDeadlineCheck() {
  const eventSel = document.getElementById('deadlineEventSelect');
  const tsInput = document.getElementById('deadlineTimestampInput');
  const btn = document.getElementById('btnRecheckDeadline');
  const presets = document.querySelectorAll('.deadline-preset');

  async function check(notify = false) {
    const eventId = eventSel ? eventSel.value : 'event-hackathon';
    const timestamp = (tsInput ? tsInput.value.trim() : '') || '2026-10-14T21:30:00Z';

    try {
      const res = await fetch(
        `${API_BASE}/events/deadline-check?eventId=${encodeURIComponent(eventId)}&timestamp=${encodeURIComponent(timestamp)}`
      );
      if (!res.ok) {
        showToast('Invalid timestamp or event selection', 'danger');
        return;
      }
      const data = await res.json();

      const configVal = document.getElementById('deadlineConfigVal');
      const configZone = document.getElementById('deadlineConfigZone');
      const utcVal = document.getElementById('subTimeUtcVal');
      const localVal = document.getElementById('subTimeLocalVal');
      const cutoffLabel = document.getElementById('timelineCutoffLabel');
      const banner = document.getElementById('deadlineStatusBanner');
      const badge = document.getElementById('timelineBadge');
      const scrubber = document.getElementById('timelineScrubber');
      const explanation = document.getElementById('deadlineExplanation');

      const formattedLocal = formatInTimeZone(data.submissionTimeUtc, data.configuredTimeZone);

      if (configVal) configVal.textContent = String(data.configuredDeadline || '').replace('T', ' ');
      if (configZone) configZone.textContent = `${data.configuredTimeZone} (${data.eventTitle})`;
      if (utcVal) utcVal.textContent = data.submissionTimeUtc;
      if (localVal) localVal.textContent = `${formattedLocal} local time`;
      if (cutoffLabel) cutoffLabel.textContent = `Cutoff: ${String(data.configuredDeadline || '').slice(11)} ${data.configuredTimeZone}`;

      if (data.allowed) {
        if (banner) {
          banner.className = 'status-banner success';
          banner.textContent = 'Accepted — within event deadline';
        }
        if (badge) {
          badge.className = 'badge success mono';
          badge.textContent = 'ACCEPTED';
        }
        if (scrubber) {
          scrubber.className = 'timeline-fill ok';
          scrubber.style.width = '82%';
        }
        if (explanation) {
          explanation.className = 'diagnostic-box success';
          explanation.innerHTML = `
            <strong>Submission accepted.</strong> Timestamp <code>${escapeHtml(data.submissionTimeUtc)}</code>
            converts to <strong>${escapeHtml(formattedLocal)}</strong> in <code>${escapeHtml(data.configuredTimeZone)}</code>,
            which is on or before the configured cutoff <code>${escapeHtml(data.configuredDeadline)}</code>.
          `;
        }
        setNavDot('deadlines', 'ok');
        setPulse('deadlines', 'Accepted', 'success', `${data.configuredTimeZone}`);
      } else {
        if (banner) {
          banner.className = 'status-banner danger';
          banner.textContent = 'Rejected — deadline expired';
        }
        if (badge) {
          badge.className = 'badge danger mono';
          badge.textContent = 'REJECTED';
        }
        if (scrubber) {
          scrubber.className = 'timeline-fill err';
          scrubber.style.width = '100%';
        }
        if (explanation) {
          explanation.className = 'diagnostic-box danger';
          explanation.innerHTML = `
            <strong>Submission rejected (${escapeHtml(data.status)}).</strong> Timestamp
            <code>${escapeHtml(data.submissionTimeUtc)}</code> corresponds to <strong>${escapeHtml(formattedLocal)}</strong>
            in <code>${escapeHtml(data.configuredTimeZone)}</code> against deadline <code>${escapeHtml(data.configuredDeadline)}</code>.
            If the local time is earlier than the cutoff, the backend is comparing naive UTC instead of event timezone.
          `;
        }
        setNavDot('deadlines', 'err');
        setPulse('deadlines', 'Rejected', 'danger', 'Timezone check flagged');
      }

      if (notify) showToast(`Deadline check: ${data.status}`, data.allowed ? 'success' : 'danger');
    } catch (err) {
      console.error('Deadline check error:', err);
    }
  }

  presets.forEach((p) => {
    p.addEventListener('click', () => {
      if (eventSel) eventSel.value = p.getAttribute('data-event') || 'event-hackathon';
      if (tsInput) tsInput.value = p.getAttribute('data-ts') || '2026-10-14T21:30:00Z';
      check(true);
    });
  });

  if (btn) btn.addEventListener('click', () => check(true));
  if (eventSel) eventSel.addEventListener('change', () => check(false));

  window._fetchDeadline = () => check(false);
  check(false);
}

function initTeamLookup() {
  const input = document.getElementById('teamSearchInput');
  const btn = document.getElementById('btnQueryTeam');
  const resultCard = document.getElementById('teamResultCard');
  const banner = document.getElementById('teamsStatusBanner');
  const seedBtns = document.querySelectorAll('.seed-btn');

  async function query(teamId, notify = false) {
    if (!resultCard) return;
    const id = (teamId || input?.value || 'team-cyber').trim();
    if (!id) return;

    try {
      const res = await fetch(`${API_BASE}/teams/lookup?id=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.found && data.team) {
        const t = data.team;
        const resolvedId = (t.teamId && t.teamId.value) ? t.teamId.value : id;

        if (banner) {
          banner.className = 'status-banner success';
          banner.textContent = `Resolved ${resolvedId}`;
        }
        setNavDot('teams', 'ok');
        setPulse('teams', 'Resolved', 'success', `${t.name} (${resolvedId})`);

        resultCard.innerHTML = `
          <div class="sheet-header">
            <div>
              <h3>${escapeHtml(t.name)}</h3>
              <p>Verified team record resolved from HashMap registry</p>
            </div>
            <span class="badge success">${escapeHtml(t.status || 'ACTIVE')}</span>
          </div>
          <div class="sheet-body">
            <div class="dossier-grid">
              <div>
                <div class="dossier-field-label">Team identifier</div>
                <div class="dossier-field-value mono">${escapeHtml(resolvedId)}</div>
              </div>
              <div>
                <div class="dossier-field-label">Competition track</div>
                <div class="dossier-field-value"><span class="badge navy">${escapeHtml(t.track || 'General')}</span></div>
              </div>
              <div>
                <div class="dossier-field-label">Member count</div>
                <div class="dossier-field-value mono">${escapeHtml(t.memberCount ?? '—')} members</div>
              </div>
              <div>
                <div class="dossier-field-label">Registry lookup</div>
                <div class="dossier-field-value"><span class="badge success">Key matched</span></div>
              </div>
            </div>
          </div>
        `;
        if (notify) showToast(`Found team ${t.name}`, 'success');
      } else {
        if (banner) {
          banner.className = 'status-banner danger';
          banner.textContent = `Lookup miss: ${id}`;
        }
        setNavDot('teams', 'err');
        setPulse('teams', 'Lookup miss', 'danger', `${id} returned null`);

        resultCard.innerHTML = `
          <div class="sheet-header">
            <div>
              <h3>Record not found for <span class="mono">${escapeHtml(id)}</span></h3>
              <p>Backend returned null for an equivalent TeamId key lookup</p>
            </div>
            <span class="badge danger">Key mismatch</span>
          </div>
          <div class="sheet-body">
            <div class="diagnostic-box danger">
              ${escapeHtml(data.error || 'Team not found in registry (TeamId key lookup returned null).')}
            </div>
          </div>
        `;
        if (notify) showToast(`Team "${id}" was not found`, 'danger');
      }
    } catch (err) {
      console.error('Team lookup error:', err);
    }
  }

  seedBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const seed = b.getAttribute('data-seed');
      if (input) input.value = seed;
      query(seed, true);
    });
  });

  if (btn) btn.addEventListener('click', () => query(input?.value, true));
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') query(input.value, true);
    });
  }

  window._fetchTeam = () => query(input?.value || 'team-cyber', false);
  query('team-cyber', false);
}

function initJudgingModule() {
  const btnSend = document.getElementById('btnDispatchWebhook');
  const btnStatus = document.getElementById('btnRefreshJudgingStatus');
  const inputEval = document.getElementById('inputEvalId');
  const inputSub = document.getElementById('inputSubId');
  const inputJudge = document.getElementById('inputJudgeId');
  const inputScore = document.getElementById('inputScoreVal');

  const targetEl = document.getElementById('webhookTargetLabel');
  const scoreEl = document.getElementById('webhookScore');
  const countEl = document.getElementById('webhookCount');
  const descEl = document.getElementById('webhookIdempotencyDesc');
  const banner = document.getElementById('webhookStatusBanner');
  const logEl = document.getElementById('webhookSimulationLog');

  function updateJudgingUI(data) {
    const total = Number(data.totalScore ?? 0);
    const count = Number(data.evaluationCount ?? 0);
    const duplicated = Boolean(data.isDuplicated) || total > 25.0;

    if (targetEl && data.submissionId) targetEl.textContent = data.submissionId;
    if (scoreEl) scoreEl.textContent = `${total.toFixed(1)} pts`;
    if (countEl) countEl.textContent = String(count);

    if (duplicated) {
      if (banner) {
        banner.className = 'status-banner danger';
        banner.textContent = `Duplicate score inflated total to ${total.toFixed(1)} pts`;
      }
      if (descEl) {
        descEl.style.color = 'var(--cq-danger)';
        descEl.textContent = `Duplicate evaluation appended (${count} records)`;
      }
      setNavDot('judging', 'err');
      setPulse('judging', `${total.toFixed(1)} pts`, 'danger', 'Duplicate score detected');
    } else if (count > 0) {
      if (banner) {
        banner.className = 'status-banner success';
        banner.textContent = `Idempotent score locked at ${total.toFixed(1)} pts`;
      }
      if (descEl) {
        descEl.style.color = 'var(--cq-success)';
        descEl.textContent = `Deduplicated cleanly (${count} recorded)`;
      }
      setNavDot('judging', 'ok');
      setPulse('judging', `${total.toFixed(1)} pts`, 'success', `${count} evaluation recorded`);
    } else {
      if (banner) {
        banner.className = 'status-banner';
        banner.textContent = 'Ready for callback delivery';
      }
      if (descEl) {
        descEl.style.color = 'var(--cq-text-muted)';
        descEl.textContent = 'No callbacks recorded yet';
      }
      setNavDot('judging', '');
      setPulse('judging', '0.0 pts', 'neutral', 'Awaiting callback');
    }
  }

  async function fetchStatus() {
    const subId = (inputSub?.value || 'sub-101').trim();
    try {
      const res = await fetch(`${API_BASE}/judging/status?subId=${encodeURIComponent(subId)}`);
      if (!res.ok) return;
      const data = await res.json();
      updateJudgingUI(data);
    } catch (err) {
      console.error('Judging status error:', err);
    }
  }

  function appendLog(html) {
    if (!logEl) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = html;
    logEl.prepend(entry);
  }

  if (btnSend) {
    btnSend.addEventListener('click', async () => {
      btnSend.disabled = true;
      const evalId = (inputEval?.value || 'eval-101').trim();
      const subId = (inputSub?.value || 'sub-101').trim();
      const judgeId = (inputJudge?.value || 'judge-alpha').trim();
      const score = parseFloat(inputScore?.value || '25.0') || 25.0;

      try {
        const params = new URLSearchParams({ evalId, subId, judgeId, score: String(score) });
        const res = await fetch(`${API_BASE}/judging/record-score?${params.toString()}`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          updateJudgingUI(data);
          const now = new Date().toISOString().slice(11, 19);
          const duplicated = Boolean(data.isDuplicated) || Number(data.totalScore) > 25.0;
          appendLog(
            `<strong>[${now} UTC]</strong> evalId=${escapeHtml(evalId)} &rarr; total <strong>${Number(data.totalScore).toFixed(1)} pts</strong> (count=${data.evaluationCount}) — ${
              duplicated
                ? '<span style="color: var(--cq-danger); font-weight: 700;">DUPLICATE INFLATION</span>'
                : '<span style="color: var(--cq-success); font-weight: 700;">IDEMPOTENT OK</span>'
            }`
          );
          showToast(
            duplicated
              ? `Duplicate callback inflated score to ${Number(data.totalScore).toFixed(1)} pts`
              : `Score recorded cleanly (${Number(data.totalScore).toFixed(1)} pts)`,
            duplicated ? 'danger' : 'success'
          );
        }
      } catch (err) {
        showToast(`Callback error: ${err.message}`, 'danger');
      } finally {
        btnSend.disabled = false;
      }
    });
  }

  if (btnStatus) {
    btnStatus.addEventListener('click', async () => {
      await fetchStatus();
      showToast('Judging score ledger refreshed', 'info');
    });
  }

  window._fetchJudgingStatus = fetchStatus;
  fetchStatus();
}

function initAccessAudit() {
  const btn = document.getElementById('btnCheckAccess');
  const selJudge = document.getElementById('selJudge');
  const selSub = document.getElementById('selSub');
  const resultEl = document.getElementById('accessCheckResult');
  const banner = document.getElementById('accessSignalBanner');
  const quickBtns = document.querySelectorAll('.access-quick-test');

  async function check(silent = false) {
    const judgeId = selJudge ? selJudge.value : 'judge-alpha';
    const subId = selSub ? selSub.value : 'sub-201';

    try {
      const res = await fetch(
        `${API_BASE}/submissions/judge-access?judgeId=${encodeURIComponent(judgeId)}&submissionId=${encodeURIComponent(subId)}`
      );
      const data = await res.json();

      if (res.ok && data.authorized) {
        const crossEvent = data.judgeEvent && data.submissionEvent && data.judgeEvent !== data.submissionEvent;

        if (crossEvent) {
          if (banner) {
            banner.className = 'status-banner danger';
            banner.textContent = 'Cross-event leak: foreign submission disclosed';
          }
          if (resultEl) {
            resultEl.className = 'diagnostic-box danger';
            resultEl.innerHTML = `
              <strong>Cross-event access granted (HTTP 200).</strong>
              Judge <code>${escapeHtml(judgeId)}</code> (<code>${escapeHtml(data.judgeEvent)}</code>) was permitted to inspect
              submission <code>${escapeHtml(subId)}</code> belonging to <code>${escapeHtml(data.submissionEvent)}</code>.
              Expected <code>403 Forbidden</code>.
            `;
          }
          setNavDot('access', 'err');
          setPulse('access', 'Leak risk', 'danger', 'Cross-event access open');
          if (!silent) showToast('Cross-event submission access was granted (expected 403)', 'danger');
        } else {
          if (banner) {
            banner.className = 'status-banner success';
            banner.textContent = 'Authorized within matching event';
          }
          if (resultEl) {
            resultEl.className = 'diagnostic-box success';
            resultEl.innerHTML = `
              <strong>Authorized (HTTP 200).</strong>
              Judge <code>${escapeHtml(judgeId)}</code> and submission <code>${escapeHtml(subId)}</code> share event boundary
              <code>${escapeHtml(data.judgeEvent)}</code>.
            `;
          }
          setNavDot('access', 'ok');
          setPulse('access', 'Authorized', 'success', 'Same-event check passed');
          if (!silent) showToast('Same-event judge access authorized', 'success');
        }
      } else {
        if (banner) {
          banner.className = 'status-banner success';
          banner.textContent = 'Cross-event boundary enforced (403)';
        }
        if (resultEl) {
          resultEl.className = 'diagnostic-box success';
          resultEl.innerHTML = `
            <strong>Access blocked (HTTP ${res.status} Forbidden).</strong>
            ${escapeHtml(data.error || 'Judge cannot inspect submissions outside their assigned event.')}
          `;
        }
        setNavDot('access', 'ok');
        setPulse('access', 'Enforced', 'success', '403 cross-event guard');
        if (!silent) showToast('Cross-event access blocked (403 Forbidden)', 'success');
      }
    } catch (err) {
      if (resultEl) {
        resultEl.className = 'diagnostic-box danger';
        resultEl.textContent = `Request failed: ${err.message}`;
      }
    }
  }

  if (btn) btn.addEventListener('click', () => check(false));
  quickBtns.forEach((b) => {
    b.addEventListener('click', () => {
      if (selJudge) selJudge.value = b.getAttribute('data-judge');
      if (selSub) selSub.value = b.getAttribute('data-sub');
      check(false);
    });
  });

  window._fetchAccess = check;
  check(true);
}

function initBoothReservations() {
  const grid = document.getElementById('boothSlotsGrid');
  const banner = document.getElementById('boothStatusBanner');

  function renderSlots(slots) {
    if (!grid) return;

    const anyOverflow = slots.some((s) => (s.reservedTeams || []).length > s.capacity);
    if (banner) {
      if (anyOverflow) {
        banner.className = 'status-banner danger';
        banner.textContent = 'Capacity overflow detected under concurrency';
        setNavDot('reservations', 'err');
      } else {
        banner.className = 'status-banner success';
        banner.textContent = 'All venue booths within capacity';
        setNavDot('reservations', 'ok');
      }
    }

    grid.innerHTML = slots.map((slot) => {
      const teams = slot.reservedTeams || [];
      const count = teams.length;
      const cap = slot.capacity || 1;
      const pct = Math.round((count / cap) * 100);
      const overflow = count > cap;
      const fillClass = overflow ? 'overflow' : (count === cap ? 'full' : '');

      const rosterHtml = teams.length > 0
        ? teams.map((t) => `<span class="badge ${overflow ? 'danger' : 'navy'} mono">${escapeHtml(t)}</span>`).join('')
        : '<span style="font-size: 13.5px; color: var(--cq-text-muted);">No teams reserved yet.</span>';

      return `
        <article class="sheet">
          <div class="sheet-header">
            <div>
              <h3>${escapeHtml(slot.name || slot.slotId)}</h3>
              <p class="mono">${escapeHtml(slot.slotId)} &mdash; Capacity ${cap} teams</p>
            </div>
            <span class="badge ${overflow ? 'danger' : (count === cap ? 'success' : 'neutral')} mono">
              ${count} / ${cap} (${pct}%)
            </span>
          </div>
          <div class="sheet-body">
            <div class="booth-meter-bar" role="progressbar" aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="${cap}">
              <div class="booth-meter-fill ${fillClass}" style="width: ${Math.min(100, pct)}%;"></div>
            </div>
            <div class="dossier-field-label" style="margin-bottom: 8px;">Reserved teams</div>
            <div class="roster-chips" style="margin-bottom: 18px;">
              ${rosterHtml}
            </div>
            <button class="btn btn-primary btn-burst-slot" type="button" data-slot="${escapeHtml(slot.slotId)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span>Simulate 10 concurrent bookings</span>
            </button>
          </div>
        </article>
      `;
    }).join('');

    grid.querySelectorAll('.btn-burst-slot').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const slotId = btn.getAttribute('data-slot');
        btn.disabled = true;
        try {
          const res = await fetch(`${API_BASE}/reservations/simulate-burst?slotId=${encodeURIComponent(slotId)}`, {
            method: 'POST'
          });
          if (res.ok) {
            const data = await res.json();
            await fetchStatus();
            if (data.exceededCapacity || data.reservedCount > data.capacity) {
              showToast(`Overflow on ${slotId}: ${data.reservedCount} booked for ${data.capacity}-team capacity`, 'danger');
            } else {
              showToast(`Capacity enforced on ${slotId}: ${data.reservedCount} / ${data.capacity} teams`, 'success');
            }
          }
        } catch (err) {
          showToast(`Reservation simulation failed: ${err.message}`, 'danger');
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  async function fetchStatus() {
    try {
      const res = await fetch(`${API_BASE}/reservations`);
      if (!res.ok) return;
      const slots = await res.json();
      if (Array.isArray(slots)) {
        slots.sort((a, b) => String(a.slotId).localeCompare(String(b.slotId)));
        renderSlots(slots);
      }
    } catch (err) {
      console.error('Reservations fetch error:', err);
    }
  }

  window._fetchReservations = fetchStatus;
  fetchStatus();
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'danger') {
    iconSvg = '<svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  } else {
    iconSvg = '<svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'opacity 200ms ease, transform 200ms ease';
    setTimeout(() => toast.remove(), 220);
  }, 3400);
}
