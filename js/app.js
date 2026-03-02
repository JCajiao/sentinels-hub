// app.js — SPA navigation, policy management, localStorage persistence
// Sentinels Hub — Personnel Onboarding System
// Zero dependencies — Vanilla JS

(function () {
  'use strict';

  // =========================================================================
  // POLICY DATA [WP#1914]
  // =========================================================================

  const POLICIES = [
    {
      id: 'conduct',
      title: 'Código de Conducta',
      summary: 'Normas de comportamiento profesional dentro de la organización.',
      content: [
        'Este código establece los estándares de comportamiento esperados de todos los miembros del equipo Sentinels.',
        'Principios fundamentales:',
        [
          'Respeto mutuo en todas las interacciones profesionales',
          'Comunicación transparente y honesta con el equipo',
          'Compromiso con la excelencia técnica y la mejora continua',
          'Colaboración activa y apoyo entre compañeros',
          'Puntualidad en entregas y reuniones programadas'
        ],
        'El incumplimiento de estas normas será evaluado por el comité de ética interno y puede resultar en medidas disciplinarias según la gravedad de la falta.'
      ]
    },
    {
      id: 'security',
      title: 'Política de Seguridad de la Información',
      summary: 'Manejo de datos sensibles, contraseñas y accesos a sistemas.',
      content: [
        'La seguridad de la información es una prioridad crítica para Sentinels. Todos los miembros deben cumplir con los siguientes protocolos.',
        'Requisitos obligatorios:',
        [
          'Usar contraseñas de mínimo 16 caracteres con complejidad alta',
          'Activar autenticación de dos factores (2FA) en todos los sistemas',
          'No compartir credenciales de acceso bajo ninguna circunstancia',
          'Reportar incidentes de seguridad dentro de las primeras 24 horas',
          'Cifrar datos sensibles en tránsito y en reposo',
          'Bloquear la estación de trabajo al ausentarse'
        ],
        'Los accesos a sistemas se revisan trimestralmente. Los accesos no utilizados por más de 30 días serán revocados automáticamente.'
      ]
    },
    {
      id: 'remote',
      title: 'Política de Trabajo Remoto',
      summary: 'Reglas y expectativas para el teletrabajo.',
      content: [
        'Sentinels opera bajo un modelo de trabajo remoto-first. Esta política establece las expectativas para mantener la productividad y colaboración.',
        'Lineamientos de trabajo remoto:',
        [
          'Mantener disponibilidad durante el horario core (10:00 - 16:00 UTC-5)',
          'Usar los canales oficiales de comunicación (Slack, email corporativo)',
          'Participar con cámara encendida en reuniones de equipo',
          'Mantener un espacio de trabajo adecuado y ergonómico',
          'Reportar cualquier problema de conectividad que afecte la productividad'
        ],
        'El trabajo remoto es un privilegio basado en la confianza. Se espera que cada miembro gestione su tiempo de manera responsable y cumpla con los entregables acordados.'
      ]
    },
    {
      id: 'privacy',
      title: 'Política de Privacidad',
      summary: 'Tratamiento de datos personales y cumplimiento normativo.',
      content: [
        'Esta política describe cómo Sentinels recopila, usa y protege los datos personales de empleados, clientes y terceros.',
        'Principios de privacidad:',
        [
          'Los datos personales se recopilan solo con consentimiento explícito',
          'El acceso a datos personales está limitado al personal autorizado',
          'Los datos se retienen solo durante el período necesario',
          'Todo empleado tiene derecho a acceder, rectificar y eliminar sus datos',
          'Las transferencias internacionales de datos cumplen con regulaciones locales'
        ],
        'Sentinels designa un Oficial de Protección de Datos (DPO) responsable de supervisar el cumplimiento. Cualquier consulta sobre privacidad debe dirigirse a privacy@sentinels.dev.'
      ]
    },
    {
      id: 'resources',
      title: 'Política de Uso de Recursos',
      summary: 'Uso adecuado de equipos, software y recursos de la empresa.',
      content: [
        'Los recursos proporcionados por Sentinels (equipos, licencias, servicios cloud) son para uso profesional. Esta política define los límites de uso aceptable.',
        'Normas de uso:',
        [
          'Los equipos de la empresa son para uso profesional primario',
          'El software con licencia corporativa no debe compartirse externamente',
          'Los recursos cloud deben usarse de manera eficiente y cost-conscious',
          'Reportar inmediatamente cualquier daño o pérdida de equipos',
          'No instalar software no autorizado en equipos corporativos',
          'Devolver todos los recursos al finalizar la relación laboral'
        ],
        'El uso indebido de recursos puede resultar en la revocación de accesos y medidas disciplinarias. El equipo de IT realiza auditorías periódicas de uso de recursos.'
      ]
    }
  ];

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  const STORAGE_KEY = 'sentinels-hub-progress';

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[Sentinels Hub] Failed to load state:', e);
    }
    return { confirmed: {} };
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[Sentinels Hub] Failed to save state:', e);
    }
  }

  let state = loadState();

  function isPolicyConfirmed(policyId) {
    return !!state.confirmed[policyId];
  }

  function confirmPolicy(policyId) {
    state.confirmed[policyId] = {
      timestamp: new Date().toISOString()
    };
    saveState(state);
  }

  function getConfirmedCount() {
    return Object.keys(state.confirmed).length;
  }

  function isOnboardingComplete() {
    return getConfirmedCount() === POLICIES.length;
  }

  // =========================================================================
  // SPA NAVIGATION [WP#1911]
  // =========================================================================

  function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.app-section');

    navLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var target = this.getAttribute('data-section');
        navigateTo(target);
      });
    });

    // Handle hash navigation
    function handleHash() {
      var hash = window.location.hash.replace('#', '');
      if (hash && document.getElementById('section-' + hash)) {
        navigateTo(hash);
      }
    }

    window.addEventListener('hashchange', handleHash);
    if (window.location.hash) {
      handleHash();
    }
  }

  function navigateTo(sectionId) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
    });

    // Update sections
    document.querySelectorAll('.app-section').forEach(function (section) {
      section.classList.toggle('active', section.id === 'section-' + sectionId);
    });

    // Update hash without triggering hashchange
    history.replaceState(null, '', '#' + sectionId);

    // Refresh dynamic content
    if (sectionId === 'policies') {
      renderPolicies();
    } else if (sectionId === 'progress') {
      renderProgress();
    } else if (sectionId === 'home') {
      updateHeroStatus();
    }
  }

  // =========================================================================
  // POLICY CARD RENDERING [WP#1915]
  // =========================================================================

  function renderPolicyContent(content) {
    var html = '';
    content.forEach(function (item) {
      if (Array.isArray(item)) {
        html += '<ul>';
        item.forEach(function (li) {
          html += '<li>' + escapeHtml(li) + '</li>';
        });
        html += '</ul>';
      } else {
        html += '<p>' + escapeHtml(item) + '</p>';
      }
    });
    return html;
  }

  function renderPolicies() {
    var container = document.getElementById('policy-list');
    if (!container) return;

    container.innerHTML = '';

    POLICIES.forEach(function (policy, index) {
      var confirmed = isPolicyConfirmed(policy.id);
      var card = document.createElement('div');
      card.className = 'policy-card' + (confirmed ? ' confirmed' : '');
      card.style.animationDelay = (0.1 * index) + 's';
      card.setAttribute('data-policy-id', policy.id);

      card.innerHTML =
        '<div class="policy-card-header">' +
          '<span class="policy-card-number">Policy ' + String(index + 1).padStart(2, '0') + '</span>' +
          '<span class="policy-card-status ' + (confirmed ? 'confirmed' : 'pending') + '">' +
            (confirmed ? '✓ Confirmed' : '○ Pending') +
          '</span>' +
        '</div>' +
        '<div class="policy-card-title">' + escapeHtml(policy.title) + '</div>' +
        '<div class="policy-card-summary">' + escapeHtml(policy.summary) + '</div>' +
        '<div class="policy-card-expand"><span class="arrow">▸</span> View Details</div>' +
        '<div class="policy-content">' +
          '<div class="policy-content-text">' + renderPolicyContent(policy.content) + '</div>' +
          renderConfirmationControls(policy.id, confirmed) +
        '</div>';

      // Toggle expand on card click (but not on checkbox/button)
      card.addEventListener('click', function (e) {
        if (e.target.closest('.hud-checkbox-wrapper') || e.target.closest('.hud-btn')) return;
        this.classList.toggle('expanded');
      });

      container.appendChild(card);
    });

    // Bind confirmation controls
    bindConfirmationEvents();
  }

  // =========================================================================
  // CONFIRMATION CONTROLS [WP#1917]
  // =========================================================================

  function renderConfirmationControls(policyId, confirmed) {
    if (confirmed) {
      return '<div class="confirmation-done">' +
        '<span class="hud-btn confirmed" disabled>✓ Policy Confirmed</span>' +
      '</div>';
    }

    return '<div class="confirmation-controls" data-policy-id="' + policyId + '">' +
      '<div class="hud-checkbox-wrapper" data-policy-id="' + policyId + '">' +
        '<div class="hud-checkbox" id="checkbox-' + policyId + '"></div>' +
        '<span class="hud-checkbox-label">I have read and understood this policy</span>' +
      '</div>' +
      '<button class="hud-btn" id="btn-' + policyId + '" disabled>Confirm Reading</button>' +
    '</div>';
  }

  function bindConfirmationEvents() {
    // Checkbox toggles
    document.querySelectorAll('.hud-checkbox-wrapper').forEach(function (wrapper) {
      wrapper.addEventListener('click', function (e) {
        e.stopPropagation();
        var policyId = this.getAttribute('data-policy-id');
        var checkbox = document.getElementById('checkbox-' + policyId);
        var btn = document.getElementById('btn-' + policyId);

        if (!checkbox || !btn) return;

        checkbox.classList.toggle('checked');
        btn.disabled = !checkbox.classList.contains('checked');
      });
    });

    // Confirm buttons
    document.querySelectorAll('.hud-btn:not(.confirmed)').forEach(function (btn) {
      if (!btn.id || !btn.id.startsWith('btn-')) return;

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (this.disabled) return;

        var policyId = this.id.replace('btn-', '');
        confirmPolicy(policyId);
        renderPolicies();

        // Check if onboarding is complete
        if (isOnboardingComplete()) {
          setTimeout(function () {
            navigateTo('progress');
          }, 500);
        }
      });
    });
  }

  // =========================================================================
  // PROGRESS RENDERING [WP#1918]
  // =========================================================================

  function renderProgress() {
    var container = document.getElementById('progress-panel');
    if (!container) return;

    var confirmed = getConfirmedCount();
    var total = POLICIES.length;
    var percent = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    var complete = isOnboardingComplete();

    var html = '';

    if (complete) {
      // Onboarding Complete state [WP#1920]
      html += '<div class="onboarding-complete">' +
        '<div class="complete-title">ONBOARDING COMPLETE</div>' +
        '<div class="complete-subtitle">All policies have been reviewed and confirmed</div>' +
        '<div class="complete-status"><span class="dot"></span>Personnel Cleared &mdash; Full Access Granted</div>' +
      '</div>';
    }

    html += '<div class="progress-stats">' +
      '<div class="progress-count">' + confirmed + ' / ' + total + '</div>' +
      '<div class="progress-label">Policies Confirmed</div>' +
    '</div>';

    html += '<div class="progress-bar-container">' +
      '<div class="progress-bar-fill' + (complete ? ' complete' : '') + '" style="width: ' + percent + '%"></div>' +
    '</div>';

    html += '<div class="progress-percentage" style="text-align: center; font-size: 0.6rem; letter-spacing: 0.2rem; color: ' +
      (complete ? 'var(--hud-green)' : 'var(--hud-cyan-50)') + '; margin-bottom: 25px;">' +
      percent + '% COMPLETE</div>';

    // Policy status list
    POLICIES.forEach(function (policy, index) {
      var isConfirmed = isPolicyConfirmed(policy.id);
      html += '<div class="progress-policy-item">' +
        '<span class="progress-policy-name">' + String(index + 1).padStart(2, '0') + '. ' + escapeHtml(policy.title) + '</span>' +
        '<span class="progress-policy-status ' + (isConfirmed ? 'confirmed' : 'pending') + '">' +
          (isConfirmed ? '✓ Confirmed' : '○ Pending') +
        '</span>' +
      '</div>';
    });

    container.innerHTML = html;
  }

  // =========================================================================
  // HERO STATUS UPDATE
  // =========================================================================

  function updateHeroStatus() {
    var el = document.getElementById('hero-status');
    if (!el) return;

    if (isOnboardingComplete()) {
      el.textContent = 'COMPLETE';
      el.style.color = 'var(--hud-green)';
    } else {
      var count = getConfirmedCount();
      el.textContent = count > 0 ? count + '/' + POLICIES.length + ' DONE' : 'PENDING';
    }
  }

  // =========================================================================
  // UTILITIES
  // =========================================================================

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  function init() {
    initNavigation();
    updateHeroStatus();

    // If there's saved progress, show a subtle indicator
    if (getConfirmedCount() > 0) {
      var statusLine = document.querySelector('.status-line');
      if (statusLine && !isOnboardingComplete()) {
        statusLine.innerHTML = '<span class="dot"></span>System Online &mdash; ' +
          getConfirmedCount() + '/' + POLICIES.length + ' Policies Confirmed';
      } else if (statusLine && isOnboardingComplete()) {
        statusLine.innerHTML = '<span class="dot"></span>Onboarding Complete &mdash; All Policies Confirmed';
        statusLine.style.color = 'var(--hud-green)';
      }
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
