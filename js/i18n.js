/**
 * Ozark Wire — client-side UI chrome i18n (EN / NL / RU).
 * Dictionaries cover chrome ([data-i18n]). Dynamic copy is translated in-page
 * via the public Google translate endpoint (no Website Translator widget, no
 * googtrans cookie, no Chrome banner). Dismissing Chrome's translate UI cannot
 * revert the page because Chrome is opted out (meta google notranslate) and
 * the translated strings are the real text nodes.
 * Finance codes (BTC, MUEL, SPX, WTI, …) stay via selective notranslate; word
 * labels like GOLD / COPPER translate.
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "ozark-wire-lang";
  var DEFAULT_LANG = "en";
  var SUPPORTED = { en: true, nl: true, ru: true };

  var STRINGS = {
    en: {
      "live.desk": "DESK",
      "nav.daily": "Daily",
      "nav.weekly": "Weekly",
      "nav.forward": "Forward",
      "nav.talks": "Talks",
      "nav.podsubs": "Podcast Subs",
      "nav.ytsubs": "YouTube Subs",
      "nav.reads": "Reads",
      "nav.odds": "Odds",
      "nav.ukraine": "Ukraine",
      "nav.portfolio": "Model Portfolio",
      "nav.about": "About",
      "tagline": "More context. Less noise. Hard assets, sound money, and the map.",
      "ticker.markets": "MARKETS",
      "rail.odds": "Odds",
      "rail.oddsLink": "Full board →",
      "rail.talks": "Fresh talks",
      "rail.talksLink": "All talks →",
      "talks.featured": "Featured",
      "talks.featuredSub": "★ last 7 days",
      "talks.interviews": "Interviews",
      "talks.interviewsSub": "watch list",
      "talks.podcasts": "Podcasts",
      "talks.podcastsSub": "Podcast Addict follows",
      "talks.latest": "LATEST",
      "talks.fav": "Favorite",
      "talks.favShow": "Favorite show",
      "talks.favGuest": "Favorite guest: {name}",
      "subs.search": "Search",
      "subs.filterShows": "Filter shows…",
      "subs.filterChannels": "Filter channels…",
      "subs.filterBooks": "Filter books…",
      "portfolio.chartSub": "total return",
      "portfolio.holdings": "Holdings",
      "portfolio.holdingsSub": "by asset class · weights · day %",
      "portfolio.th.symbol": "Class",
      "portfolio.th.sector": "Sector",
      "portfolio.th.weight": "Weight %",
      "portfolio.th.price": "Price",
      "portfolio.th.day": "Day %",
      "portfolio.title": "Model Portfolio",
      "portfolio.updated": "Updated {date}",
      "portfolio.dayWeighted": "Day (weighted)",
      "portfolio.dayExMuel": "Day (ex-MUEL)",
      "portfolio.exMuel": "Ex-MUEL",
      "portfolio.exMuelTitle": "Exclude MUEL from holdings weights, day %, horizons, and chart",
      "portfolio.metaFull": "{n} classes · day% weighted",
      "portfolio.metaEx": "MUEL dropped · {n} classes · weights renormalized to 100%",
      "portfolio.vsSpx": "vs SPX",
      "portfolio.totalReturnEx": "total return · ex-MUEL",
      "portfolio.loadError": "Could not load portfolio.json",
      "talks.title": "Talks",
      "talks.updated": "Updated {date}",
      "talks.loadError": "Could not load talks.json",
      "talks.noInterviews": "No other interviews.",
      "talks.noPodcasts": "No other podcasts.",
      "odds.title": "Odds",
      "odds.updated": "Updated {date}",
      "odds.loadError": "Could not load odds.json",
      "odds.stamp": "Source timestamps from Polymarket / desk fetch · {ts}",
      "ukraine.title": "Ukraine",
      "ukraine.updated": "Updated {date}",
      "ukraine.loadError": "Could not load ukraine.json",
      "ukraine.empty": "No matching updates.",
      "ukraine.mapTitle": "Front line",
      "ukraine.mapSub": "best guess",
      "ukraine.filter": "Filter updates…",
      "ukraine.filterAll": "All",
      "ukraine.frameKicker": "Desk frame · Provoked / The Duran",
      "podsubs.title": "Podcast Subs",
      "podsubs.fallbackDate": "Shows he follows",
      "podsubs.loadError": "Could not load podcast-subs.json",
      "ytsubs.title": "YouTube Subs",
      "ytsubs.fallbackDate": "Channels he watches",
      "ytsubs.loadError": "Could not load youtube-subs.json",
      "reads.title": "Reads",
      "reads.fallbackDate": "Curated Audible list",
      "reads.loadError": "Could not load reads.json",
      "subs.shown": "{n} shown",
      "subs.filterOn": " · filter on",
      "subs.listed": " / {n} listed",
      "subs.open": "Open",
      "subs.noMatches": "No matches.",
      "empty.odds": "No odds loaded.",
      "empty.talks": "No talks loaded.",
      "empty.items": "No items in this edition.",
      "loading": "Loading brief…",
      "error.generic": "Failed to load edition.",
      "error.noEdition": "No {type} edition found in content/index.json",
      "error.loadFile": "Could not load {file}. Serve via a local HTTP server (file:// blocks fetch).",
      "error.index": "Could not load content/index.json. Run: python3 -m http.server 8080",
      "footer.suffix": " CT · static desk",
      "footer.donate": "Donate to OpenSats",
      "collum.label": "QUOTE OF THE DAY",
      "collum.byline": "— Dave Collum",
      "collum.source": "Source",
      "lang.note": "Full-page translation enabled.",
      "about.h2": "About",
      "about.p1": "Ozark Wire is a high-signal briefing desk for people who track <strong class=\"em\">Bitcoin and hard assets</strong>, <strong class=\"em\">gold, copper, and metals</strong>, <strong class=\"em\">energy and refined products</strong>, <strong class=\"em\">global liquidity</strong> (Howell / Bhatia — levels and second derivatives), <strong class=\"em\">Austrian / sound money</strong>, <strong class=\"em\">geopolitics</strong> (Ukraine, Europe, Middle East), and <strong class=\"em\">intel / deep-state adjacent reporting</strong> — not entertainment.",
      "about.p2": "The beat is simple: more context, less noise. Numbered items. Category chips. Tight bullets. Prices on the masthead (BTC with chain height/fee, gold with Shanghai prem/disc under it, copper, CME live cattle <span class=\"code\">LE</span>, WTI/Brent, 10Y, MUEL when quoted). Odds and talks on the rails. The map is part of the story.",
      "about.p3": "Extra watchlines baked into the desk (not separate nav): <strong class=\"em\">Shanghai gold premium / discount</strong> under GOLD (SGE/SHAU vs COMEX — China physical demand / arb), <strong class=\"em\">live cattle futures</strong> (CME <span class=\"code\">LE</span>), <strong class=\"em\">EU politics / elections</strong> (France, UK timing, NL when markets reopen), <strong class=\"em\">diesel / refined cracks</strong> and Hormuz risk premium (Brent–WTI), <strong class=\"em\">Treasury / 10Y</strong>, and <strong class=\"em\">liquidity second derivatives</strong> — not just the stock of liquidity.",
      "about.editions": "Editions",
      "about.ed.daily": "<strong class=\"em\">Daily</strong> — weekday morning scan; odds strip + fresh talks above the brief.",
      "about.ed.weekly": "<strong class=\"em\">Weekly</strong> — the week distilled: flows, levels, and the few threads that compound.",
      "about.ed.forward": "<strong class=\"em\">Forward</strong> — longer horizon: scenarios, chokepoints, and structural setups.",
      "about.ed.talks": "<strong class=\"em\">Talks</strong> — long-form interviews (Alden, Gromen, Doomberg, Yarvin, Collum) + desk podcasts.",
      "about.ed.podsubs": "<strong class=\"em\">Podcast Subs</strong> — public list of shows he follows (Podcast Addict). Names + links only.",
      "about.ed.ytsubs": "<strong class=\"em\">YouTube Subs</strong> — public list of channels he watches. Names + links only.",
      "about.ed.reads": "<strong class=\"em\">Reads</strong> — curated books from Audible. Titles + authors only; public desk.",
      "about.ed.ukraine": "<strong class=\"em\">Ukraine</strong> — war desk (Horton Provoked / The Duran realist lens): pulsing AMK map + TASS / TF Rodovka / Duran / Diesen / Sonar21 / Antiwar–Horton; WSJ/FT headlines only.",
      "about.ed.odds": "<strong class=\"em\">Odds</strong> — Polymarket board: Brazil, French/EU politics, Hormuz/energy risk, FOMC; NL when live.",
      "about.ed.portfolio": "<strong class=\"em\">Model Portfolio</strong> — public holdings desk: symbol, sector, weight %, last price, day %; YTD % chart vs SPX. No dollar totals.",
      "about.categories": "Categories",
      "about.cats": "BTC · GOLD · COPPER · MACRO · 10Y · GEO · EU · ENERGY · DIESEL · LIQUIDITY · INTEL · TECH",
      "about.catsNote": "Optional chips when the brief needs them — nav stays Daily / Weekly / Forward / Talks / Podcast Subs / YouTube Subs / Reads / Odds / Ukraine / Model Portfolio / About.",
      "lang.en": "English",
      "lang.nl": "Nederlands",
      "lang.ru": "Русский"
    },
    nl: {
      "live.desk": "DESK",
      "nav.daily": "Dagelijks",
      "nav.weekly": "Wekelijks",
      "nav.forward": "Vooruitblik",
      "nav.talks": "Talks",
      "nav.podsubs": "Podcast-subs",
      "nav.ytsubs": "YouTube-subs",
      "nav.reads": "Reads",
      "nav.odds": "Odds",
      "nav.ukraine": "Oekraïne",
      "nav.portfolio": "Modelportfolio",
      "nav.about": "Over",
      "tagline": "Meer context. Minder ruis. Hard assets, sound money, en de kaart.",
      "ticker.markets": "MARKTEN",
      "rail.odds": "Odds",
      "rail.oddsLink": "Volledig bord →",
      "rail.talks": "Verse talks",
      "rail.talksLink": "Alle talks →",
      "talks.featured": "Uitgelicht",
      "talks.featuredSub": "★ laatste 7 dagen",
      "talks.interviews": "Interviews",
      "talks.interviewsSub": "watchlist",
      "talks.podcasts": "Podcasts",
      "talks.podcastsSub": "Podcast Addict-volgers",
      "talks.latest": "NIEUWSTE",
      "talks.fav": "Favoriet",
      "talks.favShow": "Favoriete show",
      "talks.favGuest": "Favoriete gast: {name}",
      "subs.search": "Zoeken",
      "subs.filterShows": "Filter shows…",
      "subs.filterChannels": "Filter kanalen…",
      "subs.filterBooks": "Filter boeken…",
      "portfolio.chartSub": "totaalrendement",
      "portfolio.holdings": "Posities",
      "portfolio.holdingsSub": "per assetklasse · gewichten · dag %",
      "portfolio.th.symbol": "Klasse",
      "portfolio.th.sector": "Sector",
      "portfolio.th.weight": "Gewicht %",
      "portfolio.th.price": "Koers",
      "portfolio.th.day": "Dag %",
      "portfolio.title": "Modelportfolio",
      "portfolio.updated": "Bijgewerkt {date}",
      "portfolio.dayWeighted": "Dag (gewogen)",
      "portfolio.dayExMuel": "Dag (ex-MUEL)",
      "portfolio.exMuel": "Ex-MUEL",
      "portfolio.exMuelTitle": "Sluit MUEL uit van gewichten, dag %, horizons en grafiek",
      "portfolio.metaFull": "{n} klassen · dag% gewogen",
      "portfolio.metaEx": "MUEL weggelaten · {n} klassen · gewichten hernormaliseerd naar 100%",
      "portfolio.vsSpx": "vs SPX",
      "portfolio.totalReturnEx": "totaalrendement · ex-MUEL",
      "portfolio.loadError": "Kon portfolio.json niet laden",
      "talks.title": "Talks",
      "talks.updated": "Bijgewerkt {date}",
      "talks.loadError": "Kon talks.json niet laden",
      "talks.noInterviews": "Geen andere interviews.",
      "talks.noPodcasts": "Geen andere podcasts.",
      "odds.title": "Odds",
      "odds.updated": "Bijgewerkt {date}",
      "odds.loadError": "Kon odds.json niet laden",
      "odds.stamp": "Bron-timestamps van Polymarket / desk-fetch · {ts}",
      "ukraine.title": "Oekraïne",
      "ukraine.updated": "Bijgewerkt {date}",
      "ukraine.loadError": "Kon ukraine.json niet laden",
      "ukraine.empty": "Geen passende updates.",
      "ukraine.mapTitle": "Frontlijn",
      "ukraine.mapSub": "beste schatting",
      "ukraine.filter": "Filter updates…",
      "ukraine.filterAll": "Alles",
      "ukraine.frameKicker": "Desk-kader · Provoked / The Duran",
      "podsubs.title": "Podcast-subs",
      "podsubs.fallbackDate": "Shows die hij volgt",
      "podsubs.loadError": "Kon podcast-subs.json niet laden",
      "ytsubs.title": "YouTube-subs",
      "ytsubs.fallbackDate": "Kanalen die hij volgt",
      "ytsubs.loadError": "Kon youtube-subs.json niet laden",
      "reads.title": "Reads",
      "reads.fallbackDate": "Geselecteerde Audible-lijst",
      "reads.loadError": "Kon reads.json niet laden",
      "subs.shown": "{n} getoond",
      "subs.filterOn": " · filter aan",
      "subs.listed": " / {n} in lijst",
      "subs.open": "Openen",
      "subs.noMatches": "Geen treffers.",
      "empty.odds": "Geen odds geladen.",
      "empty.talks": "Geen talks geladen.",
      "empty.items": "Geen items in deze editie.",
      "loading": "Brief laden…",
      "error.generic": "Editie laden mislukt.",
      "error.noEdition": "Geen {type}-editie in content/index.json",
      "error.loadFile": "Kon {file} niet laden. Gebruik een lokale HTTP-server (file:// blokkeert fetch).",
      "error.index": "Kon content/index.json niet laden. Run: python3 -m http.server 8080",
      "footer.suffix": " CT · static desk",
      "footer.donate": "Doneer aan OpenSats",
      "collum.label": "CITAAT VAN DE DAG",
      "collum.byline": "— Dave Collum",
      "collum.source": "Bron",
      "lang.note": "Vertaling van de volledige pagina ingeschakeld.",
      "about.h2": "Over",
      "about.p1": "Ozark Wire is een high-signal briefingdesk voor wie <strong class=\"em\">Bitcoin en harde activa</strong>, <strong class=\"em\">goud, koper en metalen</strong>, <strong class=\"em\">energie en raffinageproducten</strong>, <strong class=\"em\">globale liquiditeit</strong> (Howell / Bhatia — niveaus en tweede afgeleiden), <strong class=\"em\">Oostenrijkse / sound-money-denken</strong>, <strong class=\"em\">geopolitiek</strong> (Oekraïne, Europa, Midden-Oosten), en <strong class=\"em\">intel- en deep-state-adjacent berichtgeving</strong> volgt — geen entertainment.",
      "about.p2": "De lijn is eenvoudig: meer context, minder ruis. Genummerde items. Categorie-chips. Korte bullets. Koersen in de masthead (BTC met kettinghoogte/fee, goud met Shanghai-premie/-korting eronder, koper, CME live cattle <span class=\"code\">LE</span>, WTI/Brent, 10Y, MUEL wanneer genoteerd). Odds en talks op de rails. De kaart hoort bij het verhaal.",
      "about.p3": "Extra volgliijnen in de desk (geen aparte nav): <strong class=\"em\">Shanghai-goudpremie / -korting</strong> onder GOUD (SGE/SHAU vs COMEX — Chinese fysieke vraag / arb), <strong class=\"em\">live-cattle-futures</strong> (CME <span class=\"code\">LE</span>), <strong class=\"em\">EU-politiek / verkiezingen</strong> (Frankrijk, UK-timing, NL wanneer markten heropenen), <strong class=\"em\">diesel / raffinage-cracks</strong> en Hormuz-risicopremie (Brent–WTI), <strong class=\"em\">Treasury / 10Y</strong>, en <strong class=\"em\">tweede afgeleiden van liquiditeit</strong> — niet alleen de liquiditeitsvoorraad.",
      "about.editions": "Edities",
      "about.ed.daily": "<strong class=\"em\">Dagelijks</strong> — ochtendscan op weekdagen; odds-strip + verse talks boven de brief.",
      "about.ed.weekly": "<strong class=\"em\">Wekelijks</strong> — de week verdicht: stromen, niveaus, en de weinige lijnen die opstapelen.",
      "about.ed.forward": "<strong class=\"em\">Vooruitblik</strong> — langere horizon: scenario’s, knelpunten en structurele setups.",
      "about.ed.talks": "<strong class=\"em\">Talks</strong> — lange interviews (Alden, Gromen, Doomberg, Yarvin, Collum) + desk-podcasts.",
      "about.ed.podsubs": "<strong class=\"em\">Podcast-subs</strong> — openbare lijst van shows die hij volgt (Podcast Addict). Alleen namen + links.",
      "about.ed.ytsubs": "<strong class=\"em\">YouTube-subs</strong> — openbare lijst van kanalen die hij volgt. Alleen namen + links.",
      "about.ed.reads": "<strong class=\"em\">Reads</strong> — gecureerde boeken van Audible. Alleen titels + auteurs; openbare desk.",
      "about.ed.ukraine": "<strong class=\"em\">Oekraïne</strong> — oorlogsdesk: pulserende AMK-frontlijnkaart + TASS / TF Rodovka / The Duran / Antiwar–Horton-kring; alleen grote WSJ/FT-koppen.",
      "about.ed.odds": "<strong class=\"em\">Odds</strong> — Polymarket-bord: Brazilië, Franse/EU-politiek, Hormuz/energie-risico, FOMC; NL wanneer live.",
      "about.ed.portfolio": "<strong class=\"em\">Modelportfolio</strong> — openbare holdings-desk: symbool, sector, gewicht %, laatste koers, dag %; YTD %-grafiek vs SPX. Geen dollartotalen.",
      "about.categories": "Categorieën",
      "about.cats": "BTC · GOUD · KOPER · MACRO · 10Y · GEO · EU · ENERGIE · DIESEL · LIQUIDITEIT · INTEL · TECH",
      "about.catsNote": "Optionele chips wanneer de brief ze nodig heeft — navigatie blijft Dagelijks / Wekelijks / Vooruitblik / Talks / Podcast-subs / YouTube-subs / Reads / Odds / Oekraïne / Modelportfolio / Over.",
      "lang.en": "English",
      "lang.nl": "Nederlands",
      "lang.ru": "Русский"
    },
    ru: {
      "live.desk": "DESK",
      "nav.daily": "Ежедневно",
      "nav.weekly": "Еженедельно",
      "nav.forward": "Вперёд",
      "nav.talks": "Токи",
      "nav.podsubs": "Подкасты",
      "nav.ytsubs": "YouTube",
      "nav.reads": "Reads",
      "nav.odds": "Odds",
      "nav.ukraine": "Украина",
      "nav.portfolio": "Модель портфеля",
      "nav.about": "О проекте",
      "tagline": "Больше контекста. Меньше шума. Hard assets, sound money и карта.",
      "ticker.markets": "РЫНКИ",
      "rail.odds": "Odds",
      "rail.oddsLink": "Вся доска →",
      "rail.talks": "Свежие токи",
      "rail.talksLink": "Все токи →",
      "talks.featured": "Избранное",
      "talks.featuredSub": "★ за 7 дней",
      "talks.interviews": "Интервью",
      "talks.interviewsSub": "watch list",
      "talks.podcasts": "Подкасты",
      "talks.podcastsSub": "подписки Podcast Addict",
      "talks.latest": "НОВОЕ",
      "talks.fav": "Избранное",
      "talks.favShow": "Избранное шоу",
      "talks.favGuest": "Избранный гость: {name}",
      "subs.search": "Поиск",
      "subs.filterShows": "Фильтр шоу…",
      "subs.filterChannels": "Фильтр каналов…",
      "subs.filterBooks": "Фильтр книг…",
      "portfolio.chartSub": "совокупная доходность",
      "portfolio.holdings": "Позиции",
      "portfolio.holdingsSub": "по классам · веса · день %",
      "portfolio.th.symbol": "Класс",
      "portfolio.th.sector": "Сектор",
      "portfolio.th.weight": "Вес %",
      "portfolio.th.price": "Цена",
      "portfolio.th.day": "День %",
      "portfolio.title": "Модель портфеля",
      "portfolio.updated": "Обновлено {date}",
      "portfolio.dayWeighted": "День (взвеш.)",
      "portfolio.dayExMuel": "День (ex-MUEL)",
      "portfolio.exMuel": "Ex-MUEL",
      "portfolio.exMuelTitle": "Исключить MUEL из весов, дневного %, горизонтов и графика",
      "portfolio.metaFull": "{n} классов · день% взвешен",
      "portfolio.metaEx": "MUEL исключён · {n} классов · веса ренормированы до 100%",
      "portfolio.vsSpx": "vs SPX",
      "portfolio.totalReturnEx": "совокупная доходность · ex-MUEL",
      "portfolio.loadError": "Не удалось загрузить portfolio.json",
      "talks.title": "Токи",
      "talks.updated": "Обновлено {date}",
      "talks.loadError": "Не удалось загрузить talks.json",
      "talks.noInterviews": "Нет других интервью.",
      "talks.noPodcasts": "Нет других подкастов.",
      "odds.title": "Odds",
      "odds.updated": "Обновлено {date}",
      "odds.loadError": "Не удалось загрузить odds.json",
      "odds.stamp": "Метки времени Polymarket / desk fetch · {ts}",
      "ukraine.title": "Украина",
      "ukraine.updated": "Обновлено {date}",
      "ukraine.loadError": "Не удалось загрузить ukraine.json",
      "ukraine.empty": "Нет подходящих обновлений.",
      "ukraine.mapTitle": "Линия фронта",
      "ukraine.mapSub": "оценка",
      "ukraine.filter": "Фильтр обновлений…",
      "ukraine.filterAll": "Все",
      "ukraine.frameKicker": "Рамка стола · Provoked / The Duran",
      "podsubs.title": "Подкасты",
      "podsubs.fallbackDate": "Шоу, которые он слушает",
      "podsubs.loadError": "Не удалось загрузить podcast-subs.json",
      "ytsubs.title": "YouTube",
      "ytsubs.fallbackDate": "Каналы, которые он смотрит",
      "ytsubs.loadError": "Не удалось загрузить youtube-subs.json",
      "reads.title": "Reads",
      "reads.fallbackDate": "Кураторский список Audible",
      "reads.loadError": "Не удалось загрузить reads.json",
      "subs.shown": "{n} показано",
      "subs.filterOn": " · фильтр вкл.",
      "subs.listed": " / {n} в списке",
      "subs.open": "Открыть",
      "subs.noMatches": "Нет совпадений.",
      "empty.odds": "Odds не загружены.",
      "empty.talks": "Токи не загружены.",
      "empty.items": "В этой редакции нет пунктов.",
      "loading": "Загрузка брифа…",
      "error.generic": "Не удалось загрузить редакцию.",
      "error.noEdition": "Нет редакции {type} в content/index.json",
      "error.loadFile": "Не удалось загрузить {file}. Запустите локальный HTTP-сервер (file:// блокирует fetch).",
      "error.index": "Не удалось загрузить content/index.json. Команда: python3 -m http.server 8080",
      "footer.suffix": " CT · static desk",
      "footer.donate": "Пожертвовать OpenSats",
      "collum.label": "ЦИТАТА ДНЯ",
      "collum.byline": "— Dave Collum",
      "collum.source": "Источник",
      "lang.note": "Включён перевод всей страницы.",
      "about.h2": "О проекте",
      "about.p1": "Ozark Wire — high-signal briefing desk для тех, кто следит за <strong class=\"em\">Bitcoin и твёрдыми активами</strong>, <strong class=\"em\">золотом, медью и металлами</strong>, <strong class=\"em\">энергией и нефтепродуктами</strong>, <strong class=\"em\">глобальной ликвидностью</strong> (Howell / Bhatia — уровни и вторые производные), <strong class=\"em\">австрийской школой / sound money</strong>, <strong class=\"em\">геополитикой</strong> (Украина, Европа, Ближний Восток) и <strong class=\"em\">intel / deep-state adjacent-репортажами</strong> — не развлечениями.",
      "about.p2": "Посыл прост: больше контекста, меньше шума. Нумерованные пункты. Чипы категорий. Короткие буллеты. Цены в шапке (BTC с высотой цепи/комиссией, золото с шанхайской премией/дисконтом под ним, медь, CME live cattle <span class=\"code\">LE</span>, WTI/Brent, 10Y, MUEL когда котируется). Odds и токи на рельсах. Карта — часть истории.",
      "about.p3": "Доп. линии наблюдения на desk (не отдельная навигация): <strong class=\"em\">шанхайская премия / дисконт по золоту</strong> под ЗОЛОТОМ (SGE/SHAU vs COMEX — физспрос Китая / arb), <strong class=\"em\">фьючерсы на живой скот</strong> (CME <span class=\"code\">LE</span>), <strong class=\"em\">политика ЕС / выборы</strong> (Франция, сроки UK, NL когда рынки открыты), <strong class=\"em\">дизель / креки нефтепереработки</strong> и премия риска Hormuz (Brent–WTI), <strong class=\"em\">Treasury / 10Y</strong> и <strong class=\"em\">вторые производные ликвидности</strong> — не только запас ликвидности.",
      "about.editions": "Редакции",
      "about.ed.daily": "<strong class=\"em\">Ежедневно</strong> — утренний скан в будни; odds-лента + свежие токи над брифом.",
      "about.ed.weekly": "<strong class=\"em\">Еженедельно</strong> — неделя сжата: потоки, уровни и немногие линии, которые складываются.",
      "about.ed.forward": "<strong class=\"em\">Вперёд</strong> — длинный горизонт: сценарии, узкие места, структурные сетапы.",
      "about.ed.talks": "<strong class=\"em\">Токи</strong> — длинные интервью (Alden, Gromen, Doomberg, Yarvin, Collum) + подкасты desk.",
      "about.ed.podsubs": "<strong class=\"em\">Подкасты</strong> — публичный список шоу (Podcast Addict). Только имена + ссылки.",
      "about.ed.ytsubs": "<strong class=\"em\">YouTube</strong> — публичный список каналов. Только имена + ссылки.",
      "about.ed.reads": "<strong class=\"em\">Reads</strong> — кураторские книги из Audible. Только названия + авторы; публичный desk.",
      "about.ed.ukraine": "<strong class=\"em\">Украина</strong> — военный стол: пульсирующая карта AMK + TASS / TF Rodovka / The Duran / круг Antiwar–Horton; только крупные заголовки WSJ/FT.",
      "about.ed.odds": "<strong class=\"em\">Odds</strong> — доска Polymarket: Бразилия, политика Франции/ЕС, Hormuz/энергориск, FOMC; NL когда live.",
      "about.ed.portfolio": "<strong class=\"em\">Модель портфеля</strong> — публичный desk позиций: тикер, сектор, вес %, последняя цена, день %; график YTD % vs SPX. Без долларовых итогов.",
      "about.categories": "Категории",
      "about.cats": "BTC · ЗОЛОТО · МЕДЬ · MACRO · 10Y · GEO · EU · ЭНЕРГИЯ · ДИЗЕЛЬ · ЛИКВИДНОСТЬ · INTEL · TECH",
      "about.catsNote": "Опциональные чипы, когда бриф их требует — навигация: Ежедневно / Еженедельно / Вперёд / Токи / Подкасты / YouTube / Reads / Odds / Украина / Модель портфеля / О проекте.",
      "lang.en": "English",
      "lang.nl": "Nederlands",
      "lang.ru": "Русский"
    }
  };


  var FINANCE_CODES = {
    BTC: true, MUEL: true, WTI: true, BRENT: true, SPX: true, EWS: true,
    "10Y": true, LE: true, GF: true, "SHA+/-": true, "SHA+/−": true, NLY: true
  };

  function isFinanceCode(label) {
    if (label == null) return false;
    var s = String(label).trim();
    if (FINANCE_CODES[s] || FINANCE_CODES[s.toUpperCase()]) return true;
    // Word labels (GOLD, COPPER, MACRO, …) and sector names translate.
    // Portfolio ticker symbols: short A–Z roots with optional .X / -ws suffix.
    if (/^(Other|REITs|Insurance)$/i.test(s)) return false;
    if (/^(GOLD|COPPER|MACRO|ENERGY|DIESEL|LIQUIDITY|INTEL|TECH|GEO|EU)$/i.test(s)) {
      return false;
    }
    // Equity/ETF-style tickers (MUEL already listed; catch other holdings)
    return /^[A-Z]{1,5}([.-][A-Z0-9]+)?$/.test(s) && !/^(GOLD|COPPER)$/.test(s);
  }

  var current = DEFAULT_LANG;
  var refreshTimer = null;
  var trJob = 0;
  var localized = Object.create(null);
  var sources = new WeakMap();
  var tracked = [];
  var attrSources = [];
  var mem = {};
  var CACHE_KEY = "ozark-wire-tr-v2";
  var SEP = "\n\n⟦⟧\n\n";

  try {
    mem = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}") || {};
  } catch (e) {
    mem = {};
  }

  function cacheGet(lang, text) {
    return mem[lang + "\u0000" + text];
  }

  function cacheSet(lang, text, value) {
    mem[lang + "\u0000" + text] = value;
  }

  function saveCache() {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(mem));
    } catch (e) { /* quota */ }
  }

  function clearGoogTransCookie() {
    var host = "";
    try { host = global.location.hostname || ""; } catch (e) { host = ""; }
    var domains = [""];
    if (host) {
      domains.push(host);
      var parts = host.split(".");
      if (parts.length >= 2) domains.push(parts.slice(-2).join("."));
    }
    var exp = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    for (var i = 0; i < domains.length; i++) {
      var d = domains[i];
      var dom = d ? ";domain=" + d : "";
      var dot = d ? ";domain=." + d : "";
      try {
        document.cookie = "googtrans=;" + exp + ";path=/" + dom;
        document.cookie = "googtrans=;" + exp + ";path=/" + dot;
      } catch (e2) { /* ignore */ }
    }
  }

  function blocked(el) {
    var n = el;
    while (n && n !== document.body && n !== document.documentElement) {
      if (n.nodeType === 1) {
        if (n.classList && (n.classList.contains("notranslate") || n.classList.contains("lang-switch"))) return true;
        if (n.getAttribute && n.getAttribute("translate") === "no") return true;
        if (n.hasAttribute && n.hasAttribute("data-i18n")) return true;
      }
      n = n.parentElement;
    }
    return false;
  }

  function shouldTranslate(text) {
    if (!text) return false;
    var s = String(text).trim();
    if (s.length < 2) return false;
    if (localized[s]) return false;
    if (isFinanceCode(s)) return false;
    if (!/[A-Za-z]{2,}/.test(s)) return false;
    if (/^https?:\/\//i.test(s)) return false;
    return true;
  }

  function sourceOf(node) {
    if (sources.has(node)) return sources.get(node);
    var v = node.nodeValue;
    sources.set(node, v);
    tracked.push(node);
    return v;
  }

  function collectTextNodes() {
    var out = [];
    if (!document.body) return out;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node || !node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return NodeFilter.FILTER_REJECT;
        if (blocked(p)) return NodeFilter.FILTER_REJECT;
        if (!shouldTranslate(sourceOf(node))) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) out.push(n);
    return out;
  }

  function attrSource(el, attr) {
    for (var i = 0; i < attrSources.length; i++) {
      if (attrSources[i].el === el && attrSources[i].attr === attr) return attrSources[i].value;
    }
    var v = el.getAttribute(attr) || "";
    attrSources.push({ el: el, attr: attr, value: v });
    return v;
  }

  function collectAttrs() {
    var out = [];
    if (!document.body) return out;
    var els = document.body.querySelectorAll("[title], [aria-label], [placeholder]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (blocked(el) || el.hasAttribute("data-i18n")) continue;
      var attrs = ["title", "aria-label", "placeholder"];
      for (var a = 0; a < attrs.length; a++) {
        if (!el.hasAttribute(attrs[a])) continue;
        var src = attrSource(el, attrs[a]);
        if (shouldTranslate(src)) out.push({ el: el, attr: attrs[a], src: src.trim() });
      }
    }
    return out;
  }

  function restoreAll() {
    for (var i = 0; i < tracked.length; i++) {
      var n = tracked[i];
      if (n && n.parentNode && sources.has(n)) n.nodeValue = sources.get(n);
    }
    for (var j = 0; j < attrSources.length; j++) {
      var rec = attrSources[j];
      if (rec.el && rec.el.getAttribute) rec.el.setAttribute(rec.attr, rec.value);
    }
  }

  function applyKnown(lang) {
    var nodes = collectTextNodes();
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var raw = sourceOf(node);
      var trimmed = raw.trim();
      var dst = cacheGet(lang, trimmed);
      if (!dst) continue;
      var lead = raw.match(/^\s*/)[0];
      var trail = raw.match(/\s*$/)[0];
      var next = lead + dst + trail;
      if (node.nodeValue !== next) node.nodeValue = next;
    }
    var attrs = collectAttrs();
    for (var j = 0; j < attrs.length; j++) {
      var rec = attrs[j];
      var val = cacheGet(lang, rec.src);
      if (val && rec.el.getAttribute(rec.attr) !== val) rec.el.setAttribute(rec.attr, val);
    }
  }

  function chunksOf(list) {
    var out = [];
    var cur = [];
    var len = 0;
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (cur.length && len + t.length + SEP.length > 1400) {
        out.push(cur);
        cur = [];
        len = 0;
      }
      cur.push(t);
      len += t.length + SEP.length;
    }
    if (cur.length) out.push(cur);
    return out;
  }

  function parseJoined(data) {
    var segs = data && data[0] ? data[0] : [];
    var joined = "";
    for (var i = 0; i < segs.length; i++) {
      if (segs[i] && segs[i][0]) joined += segs[i][0];
    }
    return joined.split("⟦⟧").map(function (part) {
      return part.replace(/^\n+|\n+$/g, "");
    });
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) {
        var err = new Error("translate " + r.status);
        err.status = r.status;
        throw err;
      }
      return r.json();
    });
  }

  function translateOne(lang, text) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" +
      encodeURIComponent(lang) + "&dt=t&q=" + encodeURIComponent(text);
    return fetchJson(url).then(function (data) {
      var segs = data && data[0] ? data[0] : [];
      var out = "";
      for (var i = 0; i < segs.length; i++) {
        if (segs[i] && segs[i][0]) out += segs[i][0];
      }
      return out || text;
    });
  }

  function translateBatch(lang, texts) {
    if (texts.length === 1) return translateOne(lang, texts[0]).then(function (v) { return [v]; });
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" +
      encodeURIComponent(lang) + "&dt=t&q=" + encodeURIComponent(texts.join(SEP));
    return fetchJson(url).then(function (data) {
      var parts = parseJoined(data);
      if (parts.length !== texts.length) {
        return Promise.all(texts.map(function (t) { return translateOne(lang, t); }));
      }
      return parts;
    });
  }

  function runChunks(lang, chunks) {
    var i = 0;
    var stopped = false;
    function next() {
      if (stopped || i >= chunks.length) return Promise.resolve();
      var batch = [];
      while (i < chunks.length && batch.length < 3) batch.push(chunks[i++]);
      return Promise.all(batch.map(function (texts) {
        return translateBatch(lang, texts).then(function (parts) {
          for (var k = 0; k < texts.length; k++) cacheSet(lang, texts[k], parts[k] || texts[k]);
        });
      })).then(next, function (err) {
        stopped = true;
        if (err && err.status === 429) return;
        throw err;
      });
    }
    return next();
  }

  function translatePage() {
    var my = ++trJob;
    if (current === "en") {
      restoreAll();
      return;
    }
    var lang = current;
    applyKnown(lang);
    var pendingMap = Object.create(null);
    var nodes = collectTextNodes();
    var attrs = collectAttrs();
    function consider(text) {
      var s = String(text || "").trim();
      if (!shouldTranslate(s)) return;
      if (cacheGet(lang, s) != null) return;
      pendingMap[s] = true;
    }
    for (var i = 0; i < nodes.length; i++) consider(sourceOf(nodes[i]));
    for (var j = 0; j < attrs.length; j++) consider(attrs[j].src);
    var pending = Object.keys(pendingMap);
    if (!pending.length) return;
    runChunks(lang, chunksOf(pending)).then(function () {
      if (my !== trJob || current !== lang) return;
      applyKnown(lang);
      saveCache();
    }).catch(function () { /* keep English for anything that failed */ });
  }

  function refreshTranslation() {
    if (refreshTimer) global.clearTimeout(refreshTimer);
    refreshTimer = global.setTimeout(function () {
      refreshTimer = null;
      translatePage();
    }, 60);
  }

  function readStored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      if (v && SUPPORTED[v]) return v;
    } catch (e) { /* ignore */ }
    return DEFAULT_LANG;
  }

  function writeStored(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) { /* ignore */ }
  }

  function t(key, vars) {
    var pack = STRINGS[current] || STRINGS.en;
    var s = pack[key];
    if (s == null) s = (STRINGS.en && STRINGS.en[key]) || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = String(s).split("{" + k + "}").join(String(vars[k]));
      });
    }
    if (s) localized[s] = true;
    return s;
  }

  function getLang() {
    return current;
  }

  function setLang(lang) {
    if (!SUPPORTED[lang]) lang = DEFAULT_LANG;
    current = lang;
    writeStored(lang);
    applyDom();
    translatePage();
    return current;
  }

  function applyDom() {
    localized = Object.create(null);
    document.documentElement.setAttribute("data-ow-lang", current);
    // Source copy is English. html stays translate=no so Chrome's bar never
    // owns the DOM; data-ow-lang is the desk language.
    document.documentElement.lang = "en";

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute("data-i18n");
      if (!key) continue;
      var mode = el.getAttribute("data-i18n-mode") || "text";
      var val = t(key);
      if (mode === "html") {
        el.innerHTML = val;
      } else if (mode === "placeholder") {
        el.setAttribute("placeholder", val);
      } else if (mode === "title") {
        el.setAttribute("title", val);
      } else if (mode === "aria") {
        el.setAttribute("aria-label", val);
      } else {
        el.textContent = val;
      }
      // Dictionary chrome is already in the target language.
      if (current !== "en") {
        el.setAttribute("translate", "no");
        el.classList.add("notranslate");
      } else {
        el.removeAttribute("translate");
        el.classList.remove("notranslate");
      }
    }

    var flagBtns = document.querySelectorAll(".lang-btn[data-lang]");
    for (var j = 0; j < flagBtns.length; j++) {
      var btn = flagBtns[j];
      var lang = btn.getAttribute("data-lang");
      var active = lang === current;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }

    var note = document.getElementById("lang-content-note");
    if (note) {
      note.textContent = t("lang.note");
      note.classList.toggle("hidden", current === "en");
    }
  }

  var moBound = false;

  function bindDomObserver() {
    if (moBound || typeof MutationObserver === "undefined" || !document.body) return;
    moBound = true;
    var mo = new MutationObserver(function () {
      if (current !== "en") refreshTranslation();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    current = readStored();
    clearGoogTransCookie();
    applyDom();
    bindDomObserver();
    if (current !== "en") translatePage();
  }

  global.OzarkI18n = {
    STORAGE_KEY: STORAGE_KEY,
    STRINGS: STRINGS,
    t: t,
    getLang: getLang,
    setLang: setLang,
    applyDom: applyDom,
    refreshTranslation: refreshTranslation,
    isFinanceCode: isFinanceCode,
    init: init
  };
})(typeof window !== "undefined" ? window : this);
