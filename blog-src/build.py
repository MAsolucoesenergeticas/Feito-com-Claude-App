#!/usr/bin/env python3
"""Gera o blog da M&A a partir de blog-src/.

Uso:
  python3 blog-src/build.py                 publica so os posts com data <= hoje (Brasilia) em blog/
  python3 blog-src/build.py --all           gera todos os posts em blog-preview/ (para revisar)

Cada post vive em blog-src/<slug>.html (corpo) + entrada em posts.json.
Atalhos usados no corpo:
  [[img nome | texto alternativo]]
  [[cta-wa posicao | Titulo | Texto | Botao]]      botao de WhatsApp com UTMs
  [[cta-link posicao | Titulo | Texto | Botao]]    botao para a pagina do post, com UTMs
"""
import html, json, re, shutil, sys
from datetime import datetime, date
from pathlib import Path
from urllib.parse import quote
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "blog-src"
SITE = "https://energiasolarma.com.br"
TEL = "5545991262160"
PREVIEW = "--all" in sys.argv
OUT_NAME = "blog-preview" if PREVIEW else "blog"
OUT = ROOT / OUT_NAME
GA = "G-GW7B5HWNTV"
MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"]


def data_pt(d):
    return f"{d.day} de {MESES[d.month-1]} de {d.year}"


def utm(slug, medium, content):
    return f"utm_source=blog&utm_medium={medium}&utm_campaign={slug}&utm_content={content}"


def wa_href(slug, content):
    texto = ("Ola! Vim pelo blog da M&A Solucoes Energeticas e gostaria de um orcamento de energia solar. "
             f"(Origem: {utm(slug, 'botao', content)})")
    return f"https://wa.me/{TEL}?text={quote(texto, safe='')}"


def wa_btn(slug, content, label, extra="", icon=True):
    return (f'<a class="btn-wa {extra} js-wa" data-wa-ctx="{utm(slug, "botao", content)}" '
            f'href="{wa_href(slug, content)}" target="_blank" rel="noopener noreferrer">{html.escape(label)}</a>')


def imagem(nome, alt):
    tam = sorted(int(m.group(1)) for f in (ROOT / "img" / "obras").glob(f"{nome}-*.webp")
                 if (m := re.search(r"-(\d+)\.webp$", f.name)))
    if not tam:
        raise SystemExit(f"imagem nao encontrada: {nome}")
    srcset = ", ".join(f"/img/obras/{nome}-{t}.webp {t}w" for t in tam)
    maior = tam[-1]
    return (f'<figure class="post-fig"><img src="/img/obras/{nome}-{maior}.webp" srcset="{srcset}" '
            f'sizes="(max-width:920px) 100vw, 872px" alt="{html.escape(alt)}" loading="lazy" decoding="async"></figure>')


def hero_img(nome, alt):
    tam = sorted(int(m.group(1)) for f in (ROOT / "img" / "obras").glob(f"{nome}-*.webp")
                 if (m := re.search(r"-(\d+)\.webp$", f.name)))
    if not tam:
        raise SystemExit(f"imagem nao encontrada: {nome}")
    srcset = ", ".join(f"/img/obras/{nome}-{t}.webp {t}w" for t in tam)
    return (f'<img src="/img/obras/{nome}-{tam[-1]}.webp" srcset="{srcset}" sizes="(max-width:1240px) 100vw, 1240px" '
            f'alt="{html.escape(alt)}" fetchpriority="high" decoding="async">'), f"/img/obras/{nome}-{tam[-1]}.webp"


def expandir(corpo, p):
    slug = p["slug"]

    def f_img(m):
        nome, alt = [x.strip() for x in m.group(1).split("|", 1)]
        return imagem(nome, alt)

    def f_cta_wa(m):
        pos, tit, txt, btn = [x.strip() for x in m.group(1).split("|", 3)]
        return (f'<aside class="cta-box"><h3>{html.escape(tit)}</h3><p>{html.escape(txt)}</p>'
                f'{wa_btn(slug, "cta-" + pos, btn)}</aside>')

    def f_cta_link(m):
        pos, tit, txt, btn = [x.strip() for x in m.group(1).split("|", 3)]
        href = f"/{p['page']}?{utm(slug, 'cta', 'cta-' + pos)}"
        return (f'<aside class="cta-box cta-fim"><h3>{html.escape(tit)}</h3><p>{html.escape(txt)}</p>'
                f'<a class="btn" href="{href}">{html.escape(btn)}</a> '
                f'{wa_btn(slug, "cta-" + pos + "-whatsapp", "Falar no WhatsApp")}</aside>')

    corpo = re.sub(r"\[\[img ([^\]]+)\]\]", f_img, corpo)
    corpo = re.sub(r"\[\[cta-wa ([^\]]+)\]\]", f_cta_wa, corpo)
    corpo = re.sub(r"\[\[cta-link ([^\]]+)\]\]", f_cta_link, corpo)
    return corpo


def parte(nome, slug):
    s = (SRC / "partes" / nome).read_text(encoding="utf-8")
    # caminhos absolutos
    s = re.sub(r'(href|src)="(?!https?:|tel:|mailto:|#|/)([^"]+)"', r'\1="/\2"', s)
    s = s.replace('href="#solucoes"', 'href="/index.html#solucoes"')

    def troca(m):
        tag = m.group(0)
        if "js-wa" not in tag:
            return tag
        ctx = re.search(r'data-wa-ctx="([^"]*)"', tag).group(1).lower()
        lugar = ("menu-mobile" if "mobile" in ctx else "menu-topo" if "topo" in ctx else
                 "rodape" if "rod" in ctx else "magnum" if "magnum" in ctx else "hero")
        tag = re.sub(r'data-wa-ctx="[^"]*"', f'data-wa-ctx="{utm(slug, "botao", lugar)}"', tag)
        tag = re.sub(r'href="[^"]*"', f'href="{wa_href(slug, lugar)}"', tag)
        return tag

    return re.sub(r"<a [^>]*>", troca, s)


MENU = (SRC / "partes" / "menu.html").read_text(encoding="utf-8")


def header(slug):
    return f'''<header>
  <nav class="nav" aria-label="Menu principal">
    <a href="/index.html" class="logo">M&amp;A <em>Soluções Energéticas</em></a>
    {MENU.replace('<li><a href="/blog/">Blog</a></li>', '<li><a href="/blog/" aria-current="page">Blog</a></li>')}<li class="mobile-cta">
        {wa_btn(slug, "menu-mobile", "Falar no WhatsApp", "wa-block")}
      </li>
    </ul>
    {wa_btn(slug, "menu-topo", "Orçamento no WhatsApp", "nav-cta")}
    <button class="burger" id="burger" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu">
      <span></span><span></span><span></span>
    </button>
  </nav>
</header>
<div class="overlay" id="overlay"></div>'''


def head(titulo, desc, canon, og_img, extra_ld=""):
    t = html.escape(titulo)
    d = html.escape(desc)
    return f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{t}</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{canon}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#08203A">
<meta property="og:type" content="article">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{canon}">
<meta property="og:locale" content="pt_BR">
<meta property="og:image" content="{og_img}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/{OUT_NAME}/blog.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap">
<script async src="https://www.googletagmanager.com/gtag/js?id={GA}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', '{GA}');
</script>
{extra_ld}
</head>'''


def ld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, ensure_ascii=False, indent=2) + "\n</script>"


def pagina(slug, titulo, desc, canon, og_img, ld_blocos, miolo):
    return (head(titulo, desc, canon, og_img, "\n".join(ld_blocos)) +
            f'\n<body data-ctx="geral" data-cidade="Cascavel">\n\n{parte("svg.html", slug)}\n\n'
            f'{parte("topbar.html", slug)}\n\n{header(slug)}\n\n{miolo}\n\n'
            f'{parte("footer.html", slug)}\n\n{parte("magnum.html", slug)}\n\n'
            '<script src="/main.js" defer></script>\n</body>\n</html>\n')


def main():
    hoje = datetime.now(ZoneInfo("America/Sao_Paulo")).date()
    posts = json.loads((SRC / "posts.json").read_text(encoding="utf-8"))
    pub = [p for p in posts if PREVIEW or date.fromisoformat(p["date"]) <= hoje]
    pub.sort(key=lambda p: p["date"], reverse=True)

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    shutil.copy(SRC / "blog.css", OUT / "blog.css")

    for p in pub:
        slug = p["slug"]
        d = date.fromisoformat(p["date"])
        corpo = expandir((SRC / f"{slug}.html").read_text(encoding="utf-8"), p)
        palavras = len(re.sub(r"<[^>]+>", " ", corpo).split())
        minutos = max(3, round(palavras / 200))
        himg, og = hero_img(p["hero"], p["heroalt"])
        canon = f"{SITE}/blog/{slug}/"
        outros = [o for o in pub if o["slug"] != slug][:3]
        mais = ""
        if outros:
            cards = "".join(
                f'<a class="card" href="/blog/{o["slug"]}/"><div class="thumb">{hero_img(o["hero"], o["heroalt"])[0].replace(" fetchpriority=\"high\"", " loading=\"lazy\"")}</div>'
                f'<div class="body"><time datetime="{o["date"]}">{data_pt(date.fromisoformat(o["date"]))}</time>'
                f'<h3>{html.escape(o["title"])}</h3></div></a>' for o in outros)
            mais = f'<section class="post-more"><div class="container"><h2>Leia também</h2><div class="cards">{cards}</div></div></section>'
        miolo = f'''<section class="post-head">
  <div class="container container-narrow">
    <span class="eyebrow">Blog · Energia solar</span>
    <h1>{html.escape(p["title"])}</h1>
    <p class="post-meta">Por M&amp;A Soluções Energéticas · <time datetime="{p["date"]}">{data_pt(d)}</time> · {minutos} min de leitura</p>
  </div>
</section>
<div class="post-hero"><div class="post-hero-box">{himg}</div></div>
<article class="post"><div class="container container-narrow">
{corpo}
</div></article>
{mais}'''
        blocos = [
            ld({"@context": "https://schema.org", "@type": "Article", "headline": p["title"], "description": p["desc"],
                "image": SITE + og, "datePublished": p["date"], "dateModified": p["date"], "inLanguage": "pt-BR",
                "author": {"@type": "Organization", "name": "M&A Soluções Energéticas", "url": SITE + "/"},
                "publisher": {"@type": "Organization", "name": "M&A Soluções Energéticas",
                              "logo": {"@type": "ImageObject", "url": SITE + "/apple-touch-icon.png"}},
                "mainEntityOfPage": canon}),
            ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Início", "item": SITE + "/"},
                {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"},
                {"@type": "ListItem", "position": 3, "name": p["title"], "item": canon}]}),
        ]
        (OUT / slug).mkdir()
        (OUT / slug / "index.html").write_text(
            pagina(slug, p["title"] + " | M&A Soluções Energéticas", p["desc"], canon, SITE + og, blocos, miolo),
            encoding="utf-8")

    # indice do blog
    if pub:
        cards = "".join(
            f'<a class="card" href="/blog/{o["slug"]}/"><div class="thumb">{hero_img(o["hero"], o["heroalt"])[0].replace(" fetchpriority=\"high\"", " loading=\"lazy\"")}</div>'
            f'<div class="body"><time datetime="{o["date"]}">{data_pt(date.fromisoformat(o["date"]))}</time>'
            f'<h3>{html.escape(o["title"])}</h3><p>{html.escape(o["desc"])}</p></div></a>' for o in pub)
        miolo = f'''<section class="blog-intro"><div class="container">
  <span class="eyebrow">Blog</span>
  <h1>Energia solar no Oeste do Paraná: guias e respostas</h1>
  <p>Contas, regras e dúvidas de quem está pensando em instalar energia solar em Cascavel e região.</p>
</div></section>
<section class="blog-list"><div class="container"><div class="cards">{cards}</div></div></section>'''
        (OUT / "index.html").write_text(
            pagina("blog", "Blog de energia solar no Oeste do Paraná | M&A Soluções Energéticas",
                   "Guias sobre preço, financiamento, Lei 14.300 e instalação de energia solar em Cascavel e região.",
                   SITE + "/blog/", SITE + "/assets/img/og-home.jpg",
                   [ld({"@context": "https://schema.org", "@type": "Blog", "name": "Blog M&A Soluções Energéticas",
                        "url": SITE + "/blog/", "inLanguage": "pt-BR"})], miolo), encoding="utf-8")

    # sitemap (so na publicacao real)
    if not PREVIEW:
        sm = ROOT / "sitemap.xml"
        txt = sm.read_text(encoding="utf-8")
        txt = re.sub(r"\s*<!-- blog:start -->.*?<!-- blog:end -->", "", txt, flags=re.S)
        if pub:
            urls = [f"  <url>\n    <loc>{SITE}/blog/</loc>\n    <lastmod>{pub[0]['date']}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>"]
            urls += [f"  <url>\n    <loc>{SITE}/blog/{o['slug']}/</loc>\n    <lastmod>{o['date']}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>" for o in pub]
            txt = txt.replace("</urlset>", "  <!-- blog:start -->\n" + "\n".join(urls) + "\n  <!-- blog:end -->\n</urlset>")
        sm.write_text(txt, encoding="utf-8")
    print(f"{OUT_NAME}: {len(pub)} post(s) gerado(s) | hoje (Brasilia): {hoje}")
    for o in pub:
        print(" ", o["date"], o["slug"])


if __name__ == "__main__":
    main()
