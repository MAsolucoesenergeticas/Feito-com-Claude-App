/* ==========================================================================
   M&A SOLUCOES ENERGETICAS · main.js
   1. Configuracao
   2. Contexto da pagina
   3. Botoes WhatsApp
   4. Menu mobile
   5. FAQ
   6. Pagina atual no menu
   7. Mapa sob demanda
   8. Scroll Motion
   9. Widget Magnum
   10. Inicializacao
   ========================================================================== */

(function () {
  'use strict';

  /* ======================================================================
     1. CONFIGURACAO
     ====================================================================== */
  var CONFIG = {
    telefone:     '5545991262160',
    mensagemBase: 'Ola! Vim pelo site da M&A Solucoes Energeticas e gostaria de um orcamento de energia solar.',
    iconeWa:      '<svg class="ico-wa" aria-hidden="true" focusable="false"><use href="#i-wa"></use></svg>',
    chat: {
      atrasoAbertura:   2600,  /* 2.6s: tempo para o usuario explorar antes do chat aparecer */
      duracaoDigitando: 1700   /* 1.7s: simula digitacao natural */
    }
  };

  /* ======================================================================
     2. CONTEXTO DA PAGINA
     ====================================================================== */
  var CIDADES = [
    'Assis Chateaubriand','Baracao','Bela Vista da Caroba','Boa Vista da Aparecida',
    'Bom Jesus do Sul','Cafelandia','Cambe','Campo Mourao','Capanema',
    'Capitao Leonidas Marques','Cascavel','Catanduvas','Ceu Azul','Chopinzinho',
    'Cianorte','Clevelandia','Corbelia','Entre Rios do Oeste',
    'Foz do Iguacu','Francisco Alves','Francisco Beltrao','General Carneiro',
    'Goioxim','Lindoeste','Londrina','Mamborê','Marechal Candido Rondon',
    'Marialva','Mariluz','Maringa','Marmeleiro','Medianeira','Missal',
    'Nova Santa Rosa','Palotina','Pato Bragado','Pato Branco','Perola',
    'Planalto','Ponta Grossa','Ramilandia','Realeza','Santa Helena',
    'Santa Tereza do Oeste','Santa Terezinha de Itaipu','Sao Miguel do Iguacu',
    'Sarandi','Serranopolis do Iguacu','Terra Roxa','Ubirata','Umuarama',
    'Vera Cruz do Oeste','Toledo'
  ];

  function normalizar(txt) {
    return (txt || '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  var INTENCOES = [
    {
      id: 'rural',
      re: /fazenda|agroneg|produtor rural|propriedade rural|cooperativa|agronegocio/,
      msg: 'Vi que voce procura energia solar para o meio rural. Projetos assim costumam entrar em linhas de credito com juros bem abaixo do mercado. Quer que eu verifique o seu caso?',
      cta: 'Quero saber do credito rural',
      wa:  'Ola! Tenho interesse em energia solar para propriedade rural{CIDADE_EM}. Gostaria de saber sobre valores e financiamento.'
    },
    {
      id: 'condominio',
      re: /condom[ii]nio/,
      msg: 'Energia solar em condominio zera a conta das areas comuns e alivia a taxa condominial. Preparo o estudo ja formatado para apresentar em assembleia. Quer que eu faca?',
      cta: 'Quero o estudo para assembleia',
      wa:  'Ola! Preciso de um estudo de energia solar para condominio{CIDADE_EM}, para apresentar em assembleia.'
    },
    {
      id: 'financiamento',
      re: /financiamento|financiar/,
      msg: 'Na maioria dos casos a parcela do financiamento fica proxima ou ate abaixo do que voce ja paga de luz hoje. Quer que eu simule com o valor da sua conta?',
      cta: 'Simular a parcela',
      wa:  'Ola! Quero simular o financiamento de um sistema de energia solar{CIDADE_EM}.'
    },
    {
      id: 'segmento',
      re: /supermercado|mercado|loja|restaurante|fabrica|hotel|pousada|escritorio|galpao|academia|clinica|escola|igreja|industri|comercio|comercial|empresa|empresarial/,
      msg: 'Energia e um dos maiores custos fixos de um negocio - e o unico que da para eliminar de vez. Quer que eu calcule quanto sobraria da sua conta por mes?',
      cta: 'Calcular economia do negocio',
      wa:  'Ola! Tenho interesse em energia solar para meu negocio{CIDADE_EM}. Gostaria de um orcamento.'
    },
    {
      id: 'preco',
      re: /preco|custa|custo|orcamento|cotacao|valor/,
      msg: 'Vi que voce esta pesquisando valores. Preco fechado sem ver a fatura e chute - mas com a sua conta em maos eu fecho o numero exato hoje mesmo. Quer que eu calcule?',
      cta: 'Quero o valor exato',
      wa:  'Ola! Quero saber o preco de um sistema de energia solar{CIDADE_EM}. Vou enviar minha conta de luz.'
    },
    {
      id: 'instalacao',
      re: /instalacao|instalar/,
      msg: 'A instalacao e feita com equipe propria, e a maioria das obras residenciais fica pronta em dois a tres dias. Quer que eu veja o prazo para o seu telhado?',
      cta: 'Ver prazo da instalacao',
      wa:  'Ola! Quero instalar energia solar{CIDADE_EM}. Gostaria de saber prazo e valores.'
    },
    {
      id: 'residencial',
      re: /casa|residencia|residencial|domiciliar/,
      msg: 'Em casa o retorno costuma vir entre o quarto e o sexto ano, e a conta cai para a taxa minima. Quer que eu calcule com o seu consumo real?',
      cta: 'Calcular minha economia',
      wa:  'Ola! Quero energia solar na minha casa{CIDADE_EM}. Gostaria do calculo de economia.'
    }
  ];

  function detectarCidade(h1n) {
    var achada = '';
    CIDADES.forEach(function (cidade) {
      if (h1n.indexOf(normalizar(cidade)) !== -1 && cidade.length > achada.length) {
        achada = cidade;
      }
    });
    return achada;
  }

  function resolverContexto() {
    var h1   = document.querySelector('h1');
    var h1n  = normalizar(h1 ? h1.textContent : '');
    var cidade = detectarCidade(h1n);
    var sufixo = cidade ? ' em ' + cidade : '';
    var regra  = null;

    for (var i = 0; i < INTENCOES.length; i++) {
      if (INTENCOES[i].re.test(h1n)) { regra = INTENCOES[i]; break; }
    }

    if (!regra) {
      return {
        id: 'padrao', cidade: cidade,
        msg: 'Ola! Sou o Magnum, da M&A. Quer saber quanto voce economizaria com energia solar' + (cidade ? ' em ' + cidade : '') + '?',
        cta: 'Quero saber!',
        wa:  CONFIG.mensagemBase
      };
    }

    return {
      id:     regra.id,
      cidade: cidade,
      msg:    regra.msg.replace('{CIDADE}', cidade || 'sua regiao'),
      cta:    regra.cta,
      wa:     regra.wa.replace('{CIDADE_EM}', sufixo)
    };
  }

  var CTX = resolverContexto();

  function getSession(key, fallback) {
    try { return sessionStorage.getItem(key) || fallback; } catch (e) { return fallback; }
  }
  function setSession(key, value) {
    try { sessionStorage.setItem(key, value); } catch (e) {}
  }

  function montarLinkWa(origem) {
    var texto = CTX.wa || CONFIG.mensagemBase;
    if (origem) texto += ' (Origem: ' + origem + ')';
    return 'https://wa.me/' + CONFIG.telefone + '?text=' + encodeURIComponent(texto);
  }

  /* ======================================================================
     3. BOTOES WHATSAPP
     ====================================================================== */
  function iniciarBotoesWhatsApp() {
    Array.from(document.querySelectorAll('a.js-wa')).forEach(function (btn) {
      var origem = btn.getAttribute('data-wa-ctx') || '';
      btn.setAttribute('href', montarLinkWa(origem));
      btn.setAttribute('target', '_blank');
      btn.setAttribute('rel', 'noopener noreferrer');
      if (!btn.querySelector('.ico-wa')) {
        btn.insertAdjacentHTML('afterbegin', CONFIG.iconeWa);
      }
    });
  }

  /* ======================================================================
     4. MENU MOBILE
     ====================================================================== */
  function iniciarMenuMobile() {
    var burger  = document.getElementById('burger');
    var menu    = document.getElementById('menu');
    var overlay = document.getElementById('overlay');
    var header  = document.querySelector('header');

    if (!burger || !menu) return;

    var slot = document.createComment('menu-slot');
    menu.parentNode.insertBefore(slot, menu);

    var mq      = window.matchMedia('(max-width:980px)');
    var scrollY = 0;

    function estaAberto() { return menu.classList.contains('is-open'); }

    function travarFundo() {
      scrollY = window.scrollY || window.pageYOffset || 0;
      document.documentElement.classList.add('nav-lock');
      document.body.classList.add('nav-open');
    }

    function soltarFundo() {
      document.documentElement.classList.remove('nav-lock');
      document.body.classList.remove('nav-open');
    }

    function abrir() {
      menu.classList.add('is-open');
      if (overlay) overlay.classList.add('is-on');
      burger.classList.add('is-x');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Fechar menu');
      travarFundo();
    }

    function fechar(restaurar) {
      if (!estaAberto()) return;
      menu.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-on');
      burger.classList.remove('is-x');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menu');
      soltarFundo();
      if (restaurar !== false) window.scrollTo(0, scrollY);
    }

    function sincronizar() {
      if (mq.matches) {
        if (menu.parentNode !== document.body) document.body.appendChild(menu);
      } else {
        fechar(false);
        if (menu.parentNode === document.body) slot.parentNode.insertBefore(menu, slot);
      }
    }

    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (estaAberto()) fechar(); else abrir();
    });

    if (overlay) overlay.addEventListener('click', function () { fechar(); });

    document.addEventListener('click', function (e) {
      if (!estaAberto()) return;
      if (menu.contains(e.target)) return;
      if (burger.contains(e.target)) return;
      fechar();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') fechar();
    });

    Array.from(menu.querySelectorAll('a')).forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href') || '';
        if (href.charAt(0) === '#' && href.length > 1) {
          var alvo = null;
          try { alvo = document.querySelector(href); } catch (err) {
            console.warn('[MA] Ancora nao encontrada:', href);
            alvo = null;
          }
          if (alvo) {
            e.preventDefault();
            fechar(false);
            requestAnimationFrame(function () {
              var off = header ? header.offsetHeight + 12 : 76;
              var top = alvo.getBoundingClientRect().top + window.pageYOffset - off;
              if (top < 0) top = 0;
              try { window.scrollTo({ top: top, behavior: 'smooth' }); }
              catch (err) { window.scrollTo(0, top); }
              if (history.replaceState) history.replaceState(null, '', href);
            });
            return;
          }
        }
        fechar(false);
      });
    });

    sincronizar();
    if (mq.addEventListener) { mq.addEventListener('change', sincronizar); }
    else if (mq.addListener)  { mq.addListener(sincronizar); }

    window.addEventListener('pageshow', function () {
      if (!estaAberto()) soltarFundo();
    });
  }

  /* ======================================================================
     5. FAQ
     ====================================================================== */
  function iniciarFaq() {
    var perguntas = document.querySelectorAll('.faq-q');
    if (!perguntas.length) return;

    Array.from(perguntas).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var estavaAberta = btn.getAttribute('aria-expanded') === 'true';

        Array.from(perguntas).forEach(function (outra) {
          if (outra !== btn) {
            outra.setAttribute('aria-expanded', 'false');
            outra.classList.remove('is-open');
            var r = outra.nextElementSibling;
            if (r) r.classList.remove('is-open', 'open');
          }
        });

        btn.setAttribute('aria-expanded', estavaAberta ? 'false' : 'true');
        btn.classList.toggle('is-open', !estavaAberta);
        var resposta = btn.nextElementSibling;
        if (resposta) {
          resposta.classList.toggle('is-open', !estavaAberta);
          resposta.classList.toggle('open', !estavaAberta);
        }
      });
    });
  }

  /* ======================================================================
     6. PAGINA ATUAL NO MENU
     ====================================================================== */
  function marcarPaginaAtual() {
    var atual = window.location.pathname.split('/').pop() || 'index.html';
    Array.from(document.querySelectorAll('.menu a')).forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (href.indexOf('#') === 0 || href.indexOf('tel:') === 0) return;
      if (href.split('/').pop() === atual) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ======================================================================
     7. MAPA SOB DEMANDA
     ====================================================================== */
  function iniciarMapaSobDemanda() {
    var box = document.getElementById('mapBox');
    if (!box) return;

    var carregado = false;

    function carregar() {
      if (carregado) return;
      carregado = true;
      var frame = document.createElement('iframe');
      frame.src             = box.dataset.src;
      frame.title           = 'Localizacao da M&A Solucoes Energeticas';
      frame.loading         = 'lazy';
      frame.referrerPolicy  = 'no-referrer-when-downgrade';
      frame.setAttribute('allowfullscreen', '');
      box.innerHTML = '';
      box.appendChild(frame);
      box.classList.remove('map-lazy');
      box.classList.add('is-loaded');
      box.removeAttribute('role');
      box.removeAttribute('tabindex');
      box.removeAttribute('aria-label');
    }

    box.addEventListener('click', carregar);
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); carregar(); }
    });
  }

  /* ======================================================================
     8. SCROLL MOTION · Intersection Observer nativo, sem biblioteca
     ====================================================================== */
  function iniciarScrollMotion() {
    if (!('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    var seletores = [
      '.stat', '.card', '.review', '.step',
      '.eq > div', '.faq-item',
      '.split > div', '.head-center', '.wa-card',
      '#cenarios .eq > div', '#comparativo p',
      '.s-seo h3', '.s-seo p', '.il-grid a'
    ].join(',');

    document.querySelectorAll(seletores).forEach(function (el) {
      el.classList.add('motion-ready');
      io.observe(el);
    });
  }

  /* ======================================================================
     9. WIDGET MAGNUM · chat proativo contextual com WebAudio
     ====================================================================== */
  function iniciarMagnum() {
    var el    = document.getElementById('magnum');
    if (!el) return;

    var pill  = document.getElementById('magnumPill');
    var panel = document.getElementById('magnumPanel');
    var btnX  = document.getElementById('magnumClose');
    var msgEl = document.getElementById('magnumMsg');
    var quick = document.getElementById('magnumQuick');
    var cta   = document.getElementById('magnumCta');

    var cidade = document.body.dataset.cidade || 'sua regiao';
    var DELAY  = 7000;  /* 7s: abertura proativa */

    var ROTEIRO = {
      geral: {
        msg:   'Ola, sou o Magnum, da M&A. Quer saber quanto voce economizaria com energia solar em ' + cidade + '? Me passa o valor medio da sua conta de luz e ja te dou uma estimativa.',
        quick: ['Quanto eu economizo?', 'Quanto custa o sistema?', 'Quero um orcamento']
      },
      residencial: {
        msg:   'Para casa em ' + cidade + ', o mais comum e sistema de 4 a 6 kWp, que ja zera a maior parte da conta. Qual o valor medio da sua fatura?',
        quick: ['Cabe no meu telhado?', 'Em quanto tempo se paga?', 'Quero simular']
      },
      empresas: {
        msg:   'Para comercio em ' + cidade + ', o retorno costuma vir mais rapido porque o consumo e no horario de sol. Qual o consumo medio mensal em kWh?',
        quick: ['Reduz demanda contratada?', 'Posso abater no imposto?', 'Quero uma proposta']
      },
      industrial: {
        msg:   'Projeto industrial em ' + cidade + ' exige analise de demanda e enquadramento tarifario. Voce esta no Grupo A ou B?',
        quick: ['Analise de demanda', 'Preciso de subestacao?', 'Falar com engenheiro']
      },
      agro: {
        msg:   'No agro de ' + cidade + ' atendemos aviario, secador, irrigacao e resfriador de leite. Qual e a sua atividade?',
        quick: ['Tem credito rural?', 'Instalacao em solo', 'Quero orcamento']
      },
      instalacao: {
        msg:   'Em ' + cidade + ' a instalacao leva de 2 a 4 dias; a homologacao na Copel e a etapa mais longa. Quer saber o prazo total do seu caso?',
        quick: ['Qual o prazo completo?', 'Voces cuidam da Copel?', 'Agendar visita']
      },
      empresa: {
        msg:   'M&A Solucoes Energeticas: projeto com ART no CREA, equipe certificada e garantia de instalacao. O que voce quer confirmar sobre nos?',
        quick: ['Ver obras entregues', 'Quais garantias?', 'Falar com consultor']
      },
      orcamento: {
        msg:   'Faco seu orcamento para ' + cidade + ' com 3 dados: valor da conta, tipo de telhado e cidade. Pode me passar o primeiro?',
        quick: ['Minha conta e ate R$ 500', 'De R$ 500 a R$ 2.000', 'Acima de R$ 2.000']
      },
      financiamento: {
        msg:   'Financiamos energia solar em ' + cidade + ' com carencia e parcela que costuma ficar proxima do que voce ja paga de luz. Quer simular?',
        quick: ['Simular parcela', 'Preciso de entrada?', 'Quais bancos?']
      }
    };

    var ctx = (ROTEIRO[document.body.dataset.ctx] ? document.body.dataset.ctx : 'geral');
    var r   = ROTEIRO[ctx];

    if (msgEl) msgEl.textContent = r.msg;

    if (quick) {
      r.quick.forEach(function (txt) {
        var b = document.createElement('button');
        b.type      = 'button';
        b.className = 'magnum-chip';
        b.textContent = txt;
        b.setAttribute('data-wa-ctx', 'magnum-' + ctx + ': ' + txt);
        b.addEventListener('click', function () {
          var base = CONFIG.mensagemBase + ' (' + txt + ')';
          window.open('https://wa.me/' + CONFIG.telefone + '?text=' + encodeURIComponent(base), '_blank', 'noopener,noreferrer');
        });
        quick.appendChild(b);
      });
    }

    if (cta) {
      cta.setAttribute('href', montarLinkWa('magnum-' + ctx + ' | ' + cidade));
      cta.setAttribute('target', '_blank');
      cta.setAttribute('rel', 'noopener noreferrer');
      if (!cta.querySelector('.ico-wa')) {
        cta.insertAdjacentHTML('afterbegin', CONFIG.iconeWa);
      }
    }

    /* --- WebAudio --- */
    var audioCtx = null;

    function initAudio() {
      if (audioCtx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { audioCtx = new AC(); } catch (e) { audioCtx = null; }
    }

    function beep(freq, t, dur) {
      var osc = audioCtx.createOscillator();
      var g   = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(audioCtx.destination);
      osc.start(t); osc.stop(t + dur + 0.02);
    }

    function playSound() {
      initAudio();
      if (!audioCtx) return false;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
        if (audioCtx.state === 'suspended') return false;
      }
      try {
        var t = audioCtx.currentTime;
        beep(988,  t,        0.11);
        beep(1319, t + 0.13, 0.16);
        return true;
      } catch (e) { return false; }
    }

    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, function unlock() {
        initAudio();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        ['pointerdown', 'keydown', 'touchstart'].forEach(function (e2) {
          window.removeEventListener(e2, unlock);
        });
      }, { passive: true });
    });

    /* --- Abrir / fechar --- */
    function openPanel(comSom) {
      el.dataset.state = 'open';
      if (panel) panel.hidden = false;
      if (pill)  pill.setAttribute('aria-expanded', 'true');
      el.removeAttribute('data-alert');
      setSession('magnumSeen', '1');

      if (comSom) {
        if (!playSound()) {
          el.setAttribute('data-alert', '1');
          setTimeout(function () { el.removeAttribute('data-alert'); }, 4000);
        }
      }
    }

    function closePanel() {
      el.dataset.state = 'closed';
      if (panel) panel.hidden = true;
      if (pill)  pill.setAttribute('aria-expanded', 'false');
      el.removeAttribute('data-alert');
      setSession('magnumSeen', '1');
    }

    if (pill) pill.addEventListener('click', function () {
      el.dataset.state === 'open' ? closePanel() : openPanel(false);
    });
    if (btnX) btnX.addEventListener('click', closePanel);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.dataset.state === 'open') closePanel();
    });
    document.addEventListener('click', function (e) {
      if (el.dataset.state === 'open' && !el.contains(e.target)) closePanel();
    });

    /* Proativo: 7s, uma vez por sessao */
    if (!getSession('magnumSeen', null)) {
      setTimeout(function () {
        if (el.dataset.state === 'closed') openPanel(true);
      }, DELAY);
    }
  }

  /* ======================================================================
     10. INICIALIZACAO
     ====================================================================== */
  function init() {
    iniciarBotoesWhatsApp();
    iniciarMenuMobile();
    iniciarFaq();
    marcarPaginaAtual();
    iniciarMapaSobDemanda();
    iniciarScrollMotion();
    iniciarMagnum();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MA_CTX = CTX;

})();
