/* =========================================================
   Marinho Arquitetura e Design — comportamento do site
   JavaScript puro, sem dependências.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     Constante única do WhatsApp (número + mensagem padrão).
     Todos os links [data-wa] e o formulário usam estes valores.
     --------------------------------------------------------- */
  var WHATSAPP = {
    number: '5562981267552',
    defaultMessage: 'Olá! Vim pelo site da Marinho Arquitetura e Design e gostaria de conversar sobre um projeto.'
  };

  function waLink(message) {
    return 'https://wa.me/' + WHATSAPP.number + '?text=' + encodeURIComponent(message);
  }

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

  function focusables(container) {
    return $$(FOCUSABLE, container).filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
  }

  /* Mantém o foco do teclado dentro de um contêiner (menu e lightbox) */
  function trapTab(event, container) {
    if (event.key !== 'Tab') return;
    var items = focusables(container);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  /* ---------------------------------------------------------
     Links de WhatsApp e ano do rodapé
     --------------------------------------------------------- */
  $$('[data-wa]').forEach(function (el) {
    el.setAttribute('href', waLink(el.getAttribute('data-wa-message') || WHATSAPP.defaultMessage));
  });

  var yearEl = $('#ano');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------
     Eventos de analytics (nada instalado): dispara um evento
     "marinho:track" e, se existir, empurra para o dataLayer.
     --------------------------------------------------------- */
  document.addEventListener('click', function (event) {
    var el = event.target.closest('[data-track]');
    if (!el) return;
    var name = el.getAttribute('data-track');
    window.dispatchEvent(new CustomEvent('marinho:track', { detail: { name: name } }));
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: 'marinho_track', name: name });
  });

  /* ---------------------------------------------------------
     Header: transparente sobre o hero, creme depois que a página rola
     --------------------------------------------------------- */
  var header = $('.site-header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     Menu mobile em tela cheia
     --------------------------------------------------------- */
  var menuBtn = $('#menu-toggle');
  var menu = $('#mobile-menu');

  function menuIsOpen() { return !menu.hidden; }

  function openMenu() {
    menu.hidden = false;
    header.classList.add('menu-open');   // header volta ao estilo claro sobre o fundo escuro do menu
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Fechar menu');
    document.documentElement.classList.add('no-scroll');
    var first = focusables(menu)[0];
    if (first) first.focus();
  }

  function closeMenu(returnFocus) {
    menu.hidden = true;
    header.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Abrir menu');
    document.documentElement.classList.remove('no-scroll');
    if (returnFocus) menuBtn.focus();
  }

  menuBtn.addEventListener('click', function () { menuIsOpen() ? closeMenu(true) : openMenu(); });
  menu.addEventListener('click', function (event) { if (event.target.closest('a')) closeMenu(false); });
  menu.addEventListener('keydown', function (event) {
    // O botão do menu fica acima do painel, então o ciclo de foco inclui o botão
    if (event.key !== 'Tab') return;
    var items = focusables(menu).concat([menuBtn]);
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  menuBtn.addEventListener('keydown', function (event) {
    if (!menuIsOpen() || event.key !== 'Tab') return;
    var items = focusables(menu);
    if (!event.shiftKey && items.length) { event.preventDefault(); items[0].focus(); }
    else if (event.shiftKey && items.length) { event.preventDefault(); items[items.length - 1].focus(); }
  });
  window.matchMedia('(min-width: 1100px)').addEventListener('change', function (e) { if (e.matches && menuIsOpen()) closeMenu(false); });

  /* ---------------------------------------------------------
     Entrada suave ao rolar (IntersectionObserver)
     --------------------------------------------------------- */
  var revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------------------------------------------------
     FAQ: aria-expanded acompanha o estado do <details>
     --------------------------------------------------------- */
  $$('.faq__item').forEach(function (item) {
    var summary = $('summary', item);
    summary.setAttribute('aria-expanded', item.open ? 'true' : 'false');
    item.addEventListener('toggle', function () { summary.setAttribute('aria-expanded', item.open ? 'true' : 'false'); });
  });

  /* ---------------------------------------------------------
     Portfólio: filtros
     --------------------------------------------------------- */
  var grid = $('#portfolio-grid');
  var gridItems = $$('.grid__item', grid);
  var filterBtns = $$('.filter');
  var statusEl = $('#filtro-status');
  var currentFilter = 'todos';

  function tileOf(li) { return $('.tile', li); }
  function matches(li) { return currentFilter === 'todos' || tileOf(li).getAttribute('data-cat') === currentFilter; }

  function applyFilter(cat) {
    currentFilter = cat;
    filterBtns.forEach(function (btn) {
      var active = btn.getAttribute('data-filter') === cat;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    var shown = 0;
    gridItems.forEach(function (li) {
      clearTimeout(li._hideTimer);
      if (matches(li)) {
        shown++;
        if (li.hidden) {
          li.hidden = false;
          li.classList.add('is-hiding');
          requestAnimationFrame(function () { requestAnimationFrame(function () { li.classList.remove('is-hiding'); }); });
        } else {
          li.classList.remove('is-hiding');
        }
      } else if (!li.hidden) {
        li.classList.add('is-hiding');
        li._hideTimer = setTimeout(function () { li.hidden = true; }, 320);
      }
    });
    statusEl.textContent = shown + (shown === 1 ? ' projeto exibido' : ' projetos exibidos');
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFilter(btn.getAttribute('data-filter')); });
  });

  /* ---------------------------------------------------------
     Portfólio: lightbox
     --------------------------------------------------------- */
  var lb = $('#lightbox');
  var lbImg = $('#lb-img');
  var lbTitle = $('#lb-title');
  var lbMeta = $('#lb-meta');
  var lbCount = $('#lb-count');
  var lbCta = $('#lb-cta');
  var lbClose = $('#lb-close');
  var lbList = [];
  var lbIndex = 0;
  var lbReturnFocus = null;

  function lbIsOpen() { return !lb.hidden; }

  function renderLightbox() {
    var tile = lbList[lbIndex];
    var tone = (tile.className.match(/tone-\d/) || ['tone-1'])[0];
    lbImg.className = 'lightbox__img placeholder ' + tone;
    var photo = $('#lb-photo');
    photo.setAttribute('src', tile.getAttribute('data-full') || '');
    photo.setAttribute('alt', tile.getAttribute('data-title') + ' (imagem ilustrativa)');
    lbTitle.textContent = tile.getAttribute('data-title');
    lbMeta.textContent = tile.getAttribute('data-meta');
    lbCount.textContent = (lbIndex + 1) + ' / ' + lbList.length;
    lbCta.setAttribute('href', waLink('Olá! Vi o projeto ' + tile.getAttribute('data-title') + ' no site da Marinho e gostaria de conversar sobre um projeto parecido.'));
  }

  function openLightbox(tile) {
    lbList = gridItems.filter(matches).map(tileOf);
    lbIndex = Math.max(0, lbList.indexOf(tile));
    lbReturnFocus = tile;
    renderLightbox();
    lb.hidden = false;
    document.documentElement.classList.add('no-scroll');
    lbClose.focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    document.documentElement.classList.remove('no-scroll');
    if (lbReturnFocus) lbReturnFocus.focus();
  }

  function stepLightbox(delta) {
    lbIndex = (lbIndex + delta + lbList.length) % lbList.length;
    renderLightbox();
  }

  grid.addEventListener('click', function (event) {
    var tile = event.target.closest('.tile');
    if (tile) openLightbox(tile);
  });
  lbClose.addEventListener('click', closeLightbox);
  $('#lb-prev').addEventListener('click', function () { stepLightbox(-1); });
  $('#lb-next').addEventListener('click', function () { stepLightbox(1); });

  lb.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); stepLightbox(-1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); stepLightbox(1); }
    else trapTab(event, lb);
  });

  // Swipe no celular
  var touchX = null;
  lb.addEventListener('touchstart', function (event) { touchX = event.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (event) {
    if (touchX === null) return;
    var dx = event.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ESC fecha o lightbox ou o menu */
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (lbIsOpen()) closeLightbox();
    else if (menuIsOpen()) closeMenu(true);
  });

  /* ---------------------------------------------------------
     Formulário de orçamento em 3 etapas → WhatsApp
     --------------------------------------------------------- */
  var form = $('#quote-form');
  var quoteBox = $('#quote');
  var panels = $$('.step-panel', form);
  var progressBar = $('#progress-bar');
  var progressLabel = $('#progress-label');
  var confirmBox = $('#confirm');
  var confirmLink = $('#confirm-link');
  var situacaoField = $('#field-situacao');
  var metragemInput = $('#metragem');
  var metragemOpt = $('#metragem-opt');
  var step = 1;
  var TOTAL_STEPS = 3;
  var BRAND_TYPES = ['Branding / Naming', 'Sinalização'];

  function val(name) {
    var el = form.elements[name];
    if (!el) return '';
    if (el.length !== undefined && el[0] && el[0].type === 'radio') {
      var checked = $$('input[name="' + name + '"]:checked', form)[0];
      return checked ? checked.value : '';
    }
    return (el.value || '').trim();
  }

  function isBrand() { return BRAND_TYPES.indexOf(val('tipo')) !== -1; }

  /* Branding, naming e sinalização: sem "situação" e metragem opcional */
  function syncProjectType() {
    var brand = isBrand();
    situacaoField.hidden = brand;
    $$('input[name="situacao"]', form).forEach(function (r) { r.required = !brand; });
    metragemInput.required = !brand;
    metragemOpt.hidden = !brand;
  }

  function setStep(n) {
    step = n;
    panels.forEach(function (p) { p.hidden = Number(p.getAttribute('data-step')) !== n; });
    progressBar.style.width = (n / TOTAL_STEPS * 100) + '%';
    progressLabel.textContent = 'Etapa ' + n + ' de ' + TOTAL_STEPS;
    var panel = panels[n - 1];
    var title = $('.step-panel__title', panel);
    title.setAttribute('tabindex', '-1');
    title.focus({ preventScroll: true });
    var top = quoteBox.getBoundingClientRect().top;
    if (top < 60 || top > window.innerHeight * 0.6) quoteBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* Erros: mensagem visível, aria-invalid e associação com o campo */
  var errSeq = 0;
  function setError(fieldEl, message) {
    var errEl = $('.field__error', fieldEl);
    if (!errEl) return;
    if (!errEl.id) errEl.id = 'erro-' + (++errSeq);
    var controls = $$('input, textarea', fieldEl);
    if (message) { errEl.textContent = message; }
    errEl.hidden = !message;
    fieldEl.classList.toggle('has-error', !!message);
    controls.forEach(function (c) {
      if (message) { c.setAttribute('aria-invalid', 'true'); c.setAttribute('aria-describedby', errEl.id); }
      else { c.removeAttribute('aria-invalid'); c.removeAttribute('aria-describedby'); }
    });
  }

  function fieldOf(el) { return el.closest('.field'); }

  var digits = function (s) { return s.replace(/\D/g, ''); };

  var RULES = {
    1: [
      { name: 'tipo', test: function () { return !!val('tipo'); }, msg: 'Escolha o tipo de projeto.' },
      { name: 'situacao', skip: isBrand, test: function () { return !!val('situacao'); }, msg: 'Escolha a situação da obra.' },
      { name: 'local', test: function () { return val('local').length >= 2; }, msg: 'Informe a cidade ou o bairro.' }
    ],
    2: [
      {
        name: 'metragem',
        test: function () {
          var d = digits(val('metragem'));
          if (!d) return isBrand();
          return Number(d) > 0;
        },
        msg: 'Informe a metragem aproximada, só números.'
      },
      { name: 'orcamento', test: function () { return !!val('orcamento'); }, msg: 'Escolha uma faixa de orçamento.' },
      { name: 'prazo', test: function () { return !!val('prazo'); }, msg: 'Escolha um prazo.' }
    ],
    3: [
      { name: 'nome', test: function () { return val('nome').length >= 2; }, msg: 'Informe seu nome.' },
      {
        name: 'whats',
        test: function () {
          var d = digits(val('whats'));
          return (d.length === 10 || d.length === 11) && /^[1-9][1-9]/.test(d) && (d.length === 10 || d.charAt(2) === '9');
        },
        msg: 'Informe um WhatsApp válido, com DDD.'
      },
      { name: 'email', test: function () { var v = val('email'); return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }, msg: 'Esse e-mail parece incompleto.' }
    ]
  };

  function validateStep(n) {
    var firstBad = null;
    RULES[n].forEach(function (rule) {
      var control = form.elements[rule.name];
      var anchor = control.length !== undefined && control[0] && control[0].type === 'radio' ? control[0] : control;
      var fieldEl = fieldOf(anchor);
      if (rule.skip && rule.skip()) { setError(fieldEl, ''); return; }
      var ok = rule.test();
      setError(fieldEl, ok ? '' : rule.msg);
      if (!ok && !firstBad) firstBad = anchor;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  /* Máscaras */
  function maskPhone(value) {
    var d = digits(value).slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  metragemInput.addEventListener('input', function () { metragemInput.value = digits(metragemInput.value).slice(0, 5); });
  form.elements.whats.addEventListener('input', function (e) { e.target.value = maskPhone(e.target.value); });

  /* Limpa o erro assim que o campo é corrigido */
  form.addEventListener('input', function (e) { var f = fieldOf(e.target); if (f && f.classList.contains('has-error')) setError(f, ''); });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'tipo') syncProjectType();
    var f = fieldOf(e.target);
    if (f && f.classList.contains('has-error')) setError(f, '');
  });

  /* Navegação entre etapas */
  form.addEventListener('click', function (event) {
    if (event.target.closest('[data-next]')) { if (validateStep(step)) setStep(step + 1); }
    else if (event.target.closest('[data-prev]')) { setStep(step - 1); }
  });

  /* Mensagem organizada para o WhatsApp */
  function buildMessage() {
    var lines = ['Olá! Vim pelo site e gostaria de solicitar um orçamento.', ''];
    function add(label, value) { if (value) lines.push('*' + label + ':* ' + value); }
    var metragem = digits(val('metragem'));
    var notes = [val('referencias'), val('obs')].filter(Boolean).join(' / ');

    add('Nome', val('nome'));
    add('Tipo de projeto', val('tipo'));
    if (!isBrand()) add('Situação', val('situacao'));
    add('Local da obra', val('local'));
    if (metragem) add('Metragem', metragem + ' m²');
    add('Investimento previsto', val('orcamento'));
    add('Prazo para iniciar', val('prazo'));
    add('Referências/observações', notes);
    add('Meu WhatsApp', val('whats'));
    add('E-mail', val('email'));
    return lines.join('\n');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    // Enter nas etapas 1 e 2 funciona como "Continuar"
    if (step < TOTAL_STEPS) { if (validateStep(step)) setStep(step + 1); return; }

    for (var s = 1; s <= TOTAL_STEPS; s++) {
      if (!validateStep(s)) { if (s !== step) setStep(s); validateStep(s); return; }
    }

    var url = waLink(buildMessage());
    var win = window.open(url, '_blank');
    if (win) { win.opener = null; } else { window.location.href = url; }

    confirmLink.setAttribute('href', url);
    form.hidden = true;
    $('.progress', quoteBox).hidden = true;
    progressLabel.hidden = true;
    confirmBox.hidden = false;
    confirmBox.focus();
  });

  function resetQuote() {
    form.reset();
    $$('.field', form).forEach(function (f) { setError(f, ''); });
    syncProjectType();
    confirmBox.hidden = true;
    form.hidden = false;
    $('.progress', quoteBox).hidden = false;
    progressLabel.hidden = false;
    setStep(1);
  }
  $('#quote-reset').addEventListener('click', resetQuote);

  /* "Pedir orçamento deste serviço" já deixa o tipo de projeto marcado */
  $$('[data-tipo]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (!confirmBox.hidden) resetQuote();
      var wanted = link.getAttribute('data-tipo');
      var radio = $$('input[name="tipo"]', form).filter(function (r) { return r.value === wanted; })[0];
      if (radio) { radio.checked = true; syncProjectType(); setError(fieldOf(radio), ''); }
      if (step !== 1) {
        panels.forEach(function (p) { p.hidden = Number(p.getAttribute('data-step')) !== 1; });
        step = 1;
        progressBar.style.width = (100 / TOTAL_STEPS) + '%';
        progressLabel.textContent = 'Etapa 1 de ' + TOTAL_STEPS;
      }
    });
  });

  syncProjectType();
})();
