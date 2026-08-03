"use client";

import { FormEvent, useDeferredValue, useMemo, useState } from "react";

type Language = "zh" | "en";
type OfficialBook = { id: string; title: string; author: string; publish_date: string; url: string };

const TOTAL_BOOKS = 1_046_365;
const PUBLIC_ARCHIVE_PAGES = 100;
const SEARCH_PAGE_SIZE = 20;
const CONTACT_EMAIL = "baby.bt@gmail.com";

const copy = {
  zh: {
    navSearch: "官網書目", navArchive: "百萬藏書", navMethod: "技術方法", navInquiry: "商務合作", internal: "公開書目",
    eyebrow: "實體中文語料供應與數位化執行中心", headline1: "百萬冊實體中文語料，", headline2: "已集中、保存、初步編目。",
    intro: "我們已將大規模實體中文藏書集中保存於 16 個貨櫃，並建立可抽樣、可追溯的初步書目。可依指定領域進行盤點、去重、權利清查、非破壞掃描、OCR、校對與 AI 訓練資料格式化，協助合作方縮短紙本語料建庫時間。",
    start: "查看官網書目", records: "筆實體庫存紀錄（含重複冊）", containers: "個實體貨櫃",
    searchKicker: "OFFICIAL CATALOG 01", searchTitle: "10 萬筆官網書目搜尋",
    searchDesc: "搜尋目前 2BOOK 官網整理完成的 100,000 筆書名與作者。百萬貨櫃藏書另以靜態頁面公開。",
    placeholder: "輸入書名或作者…", loading: "首次使用時載入 10 萬筆官網書目…", loadHint: "點擊搜尋框即可載入官網書目。",
    results: "筆結果", title: "書名", author: "作者", publishDate: "出版日期", previous: "← 上一頁", next: "下一頁 →", page: "頁",
    archiveKicker: "PHYSICAL ARCHIVE 02", archiveTitle: "百萬冊實體藏書索引",
    archiveDesc: "超過 104 萬筆實體庫存紀錄，可能包含相同書名、不同版本與重複冊；不重複書目數仍在盤點與去重。",
    archiveCopy: "目前公開前 100 頁、共 100,000 筆實體藏書資料；其餘書目尚未開放。",
    openArchive: "進入公開書目索引", pages: "個公開目錄頁", fields: "個公開欄位", fieldNames: "書名 · 作者 · 出版社 · 出版日期",
    methodKicker: "OUR METHOD 03", methodTitle: "AI 進化，不以破壞文化為代價。",
    methodDesc: "我們採用非破壞性掃描，讓紙本內容進入數位世界，同時保留每一本實體書。",
    methodCards: [
      ["01", "非破壞性掃描", "以書籍友善的拍攝與掃描流程擷取頁面，不拆書、不裁切書背，保存原始實體。", "NON-DESTRUCTIVE SCANNING"],
      ["02", "多格式資料交付", "可依專案交付高品質 JPG／TIFF 影像，以及校對後的 TXT／JSON／Markdown 純文字。", "JPG · TIFF · TXT · JSON · MD"],
      ["03", "AI 訓練格式", "依合作方需求整理欄位、切分內容與建立資料集，可對接 Hugging Face Dataset 等標準流程。", "TRAINING-READY DATA"],
      ["04", "實體書完整保留", "數位化後的書籍仍被完整保存，未來可回到人類閱讀與流通體系，兼顧 AI 與文化保存。", "BOOKS REMAIN BOOKS"],
    ],
    inquiryKicker: "ENTERPRISE INQUIRY 04", inquiryTitle: "把紙本藏書轉化為可用的 AI 語料。",
    inquiryDesc: "歡迎 AI 公司、資料服務商、研究單位及文化保存機構洽談盤點去重、批量數位化、權利清查、資料製作與專案出資。",
    models: ["客製化大批量數位化", "依權利狀態規劃資料授權", "新台幣／美元專案出資", "參考加工模式：每冊約 US$30，依規格另議"],
    org: "公司／機構", name: "聯絡人", email: "電子郵件", scope: "合作需求", budget: "預算或預計冊數", message: "補充說明",
    scopeOptions: ["請選擇", "批量非破壞性掃描", "AI 訓練資料製作", "Metadata／書目授權", "研究或文化保存合作", "其他"],
    contact: "合作信箱", submit: "送出合作意向", previewNotice: "送出後會開啟您的郵件程式，請確認按下寄送。", submitted: "郵件內容已產生；請在開啟的郵件程式中確認寄出。",
    footer: "公開書目 · 實體藏書與 AI 數位化合作計畫",
  },
  en: {
    navSearch: "Official catalog", navArchive: "Million-book archive", navMethod: "Our method", navInquiry: "Enterprise inquiry", internal: "OPEN CATALOG",
    eyebrow: "PHYSICAL CHINESE CORPUS & DIGITIZATION PARTNER", headline1: "A million-volume Chinese corpus,", headline2: "concentrated, preserved, and initially cataloged.",
    intro: "We have concentrated a large physical Chinese-language collection in 16 shipping containers and created a traceable preliminary catalog. Projects can include inventory, deduplication, rights review, non-destructive scanning, OCR, correction, and AI training-data packaging—shortening the time required to assemble a paper corpus at scale.",
    start: "Browse official records", records: "physical inventory records, including duplicates", containers: "physical containers",
    searchKicker: "OFFICIAL CATALOG 01", searchTitle: "Search 100,000 official records",
    searchDesc: "Search titles and authors across 100,000 records prepared from the current 2BOOK catalog. The million-book container archive is disclosed separately as static pages.",
    placeholder: "Search title or author…", loading: "Loading 100,000 official records for the first time…", loadHint: "Select the search field to load the official catalog.",
    results: "results", title: "TITLE", author: "AUTHOR", publishDate: "PUBLICATION DATE", previous: "← Previous", next: "Next →", page: "Page",
    archiveKicker: "PHYSICAL ARCHIVE 02", archiveTitle: "Million-book physical archive",
    archiveDesc: "More than 1.04 million physical inventory records, potentially including duplicate copies and multiple editions. Unique-title counting and deduplication remain in progress.",
    archiveCopy: "The first 100 pages—100,000 physical book records—are currently open. The remaining catalog is not yet public.",
    openArchive: "Open the public catalog index", pages: "open catalog pages", fields: "public fields", fieldNames: "Title · Author · Publisher · Publication date",
    methodKicker: "OUR METHOD 03", methodTitle: "AI progress without cultural destruction.",
    methodDesc: "Our non-destructive workflow brings printed content into the digital world while preserving every physical book.",
    methodCards: [
      ["01", "Non-destructive scanning", "Book-safe imaging without unbinding volumes or cutting spines. Every original object remains intact.", "NON-DESTRUCTIVE SCANNING"],
      ["02", "Multi-format delivery", "Project delivery can include high-quality JPG/TIFF images and reviewed TXT/JSON/Markdown text.", "JPG · TIFF · TXT · JSON · MD"],
      ["03", "Training-ready structure", "Content segmentation, metadata design, and dataset packaging can support workflows such as Hugging Face Dataset.", "TRAINING-READY DATA"],
      ["04", "Books remain books", "Digitized books stay intact and can return to human reading and circulation, aligning AI progress with preservation.", "BOOKS REMAIN BOOKS"],
    ],
    inquiryKicker: "ENTERPRISE INQUIRY 04", inquiryTitle: "Turn a paper collection into usable AI data.",
    inquiryDesc: "We welcome AI companies, data providers, researchers, and cultural institutions to discuss inventory deduplication, bulk digitization, rights review, data production, and project funding.",
    models: ["Custom high-volume digitization", "Rights-aware data licensing plans", "Project funding in TWD or USD", "Reference processing model: approximately US$30 per volume, subject to specification"],
    org: "Company / organization", name: "Contact name", email: "Email", scope: "Partnership interest", budget: "Budget or expected volume", message: "Additional context",
    scopeOptions: ["Select one", "Bulk non-destructive scanning", "AI training dataset production", "Metadata / catalog licensing", "Research or preservation partnership", "Other"],
    contact: "CONTACT EMAIL", submit: "Submit inquiry", previewNotice: "Submitting opens your email app. Please review and send the message there.", submitted: "The email draft is ready. Please confirm Send in your email app.",
    footer: "Open catalog · Physical archive and AI digitization initiative",
  },
} as const;

function number(value: number, language: Language) {
  return new Intl.NumberFormat(language === "zh" ? "zh-TW" : "en-US").format(value);
}

export default function CatalogBrowser() {
  const [language, setLanguage] = useState<Language>("zh");
  const [officialBooks, setOfficialBooks] = useState<OfficialBook[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("zh-TW"));
  const t = copy[language];

  function loadOfficialCatalog() {
    if (catalogLoaded || catalogLoading) return;
    setCatalogLoading(true);
    fetch("/official-search.json")
      .then((response) => response.json())
      .then((data: OfficialBook[]) => { setOfficialBooks(data); setCatalogLoaded(true); })
      .finally(() => setCatalogLoading(false));
  }

  const filtered = useMemo(() => {
    if (!deferredQuery) return officialBooks;
    return officialBooks.filter((book) => (book.title + " " + book.author).toLocaleLowerCase("zh-TW").includes(deferredQuery));
  }, [officialBooks, deferredQuery]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / SEARCH_PAGE_SIZE));
  const visible = filtered.slice((searchPage - 1) * SEARCH_PAGE_SIZE, searchPage * SEARCH_PAGE_SIZE);

  function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const organization = String(data.get("organization") || "");
    const contactName = String(data.get("name") || "");
    const senderEmail = String(data.get("email") || "");
    const scope = String(data.get("scope") || "");
    const budget = String(data.get("budget") || "");
    const message = String(data.get("message") || "");
    const subject = "[2BOOK AI Corpus Inquiry] " + organization + " · " + scope;
    const body = [
      "Company / Organization: " + organization,
      "Contact: " + contactName,
      "Email: " + senderEmail,
      "Partnership interest: " + scope,
      "Budget / Volume: " + budget,
      "",
      "Additional context:",
      message,
    ].join("\n");
    setSubmitted(true);
    window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  return (
    <main className={language === "en" ? "lang-en" : ""}>
      <nav className="nav" aria-label="Main navigation">
        <a className="brand brand-image" href="#top"><img className="brand-logo" src="/2book-logo.webp" alt="2BOOK 臻品齋" /><span className="brand-name"><strong>臻品齋書店</strong><small>PHYSICAL CHINESE CORPUS</small></span></a>
        <div className="nav-links"><a href="#catalog">{t.navSearch}</a><a href="#archive">{t.navArchive}</a><a href="#method">{t.navMethod}</a><a href="#inquiry">{t.navInquiry}</a></div>
        <div className="language-switch" aria-label="Language"><button className={language === "zh" ? "active" : ""} onClick={() => setLanguage("zh")}>中文</button><span>/</span><button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button></div>
        <span className="internal-badge">{t.internal}</span>
      </nav>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> {t.eyebrow}</div>
        <h1>{t.headline1}<br /><em>{t.headline2}</em></h1>
        <p className="hero-copy">{t.intro}</p>
        <div className="hero-actions"><a className="primary-button" href="#catalog">{t.start} <span>↓</span></a><div className="progress-summary"><strong>{number(TOTAL_BOOKS, language)}</strong><span>{t.records}</span></div><div className="progress-summary"><strong>16</strong><span>{t.containers}</span></div></div>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="section-heading"><div><span className="section-kicker">{t.searchKicker}</span><h2>{t.searchTitle}</h2></div><p>{t.searchDesc}</p></div>
        <div className="search-panel single-search"><label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onFocus={loadOfficialCatalog} onChange={(event) => { setQuery(event.target.value); setSearchPage(1); loadOfficialCatalog(); }} placeholder={t.placeholder} aria-label={t.placeholder} /></label></div>
        <div className="results-bar"><p>{catalogLoading ? t.loading : catalogLoaded ? <><strong>{number(filtered.length, language)}</strong> {t.results}</> : t.loadHint}</p><span>{t.title} · {t.author} · {t.publishDate}</span></div>
        {catalogLoaded && <div className="catalog-table"><div className="table-head official-columns"><span>{t.title}</span><span>{t.author}</span><span>{t.publishDate}</span></div>{visible.map((book, index) => <article className="book-row official-columns" key={book.id}><div className="book-title"><small>{String((searchPage - 1) * SEARCH_PAGE_SIZE + index + 1).padStart(6, "0")}</small><strong><a href={book.url} target="_blank" rel="noreferrer">{book.title} <span className="external-mark">↗</span></a></strong></div><div className="book-author">{book.author}</div><div className="book-publish-date">{book.publish_date}</div></article>)}</div>}
        {catalogLoaded && filtered.length > SEARCH_PAGE_SIZE && <div className="pagination"><button disabled={searchPage === 1} onClick={() => setSearchPage((value) => Math.max(1, value - 1))}>{t.previous}</button><span>{t.page} <strong>{number(searchPage, language)}</strong> / {number(pageCount, language)}</span><button disabled={searchPage === pageCount} onClick={() => setSearchPage((value) => Math.min(pageCount, value + 1))}>{t.next}</button></div>}
      </section>

      <section className="archive-section" id="archive">
        <div className="section-heading"><div><span className="section-kicker">{t.archiveKicker}</span><h2>{t.archiveTitle}</h2></div><p>{t.archiveDesc}</p></div>
        <div className="archive-card"><div><span className="archive-number">1,046,365</span><h3>{t.archiveTitle}</h3><p>{t.archiveCopy}</p><a className="archive-link" href="/archive/index.html">{t.openArchive} <span>↗</span></a></div><dl><div><dt>{number(TOTAL_BOOKS, language)}</dt><dd>{t.records}</dd></div><div><dt>{number(PUBLIC_ARCHIVE_PAGES, language)}</dt><dd>{t.pages}</dd></div><div><dt>4</dt><dd>{t.fields}<small>{t.fieldNames}</small></dd></div></dl></div>
      </section>

      <section className="method-section" id="method">
        <div className="section-heading"><div><span className="section-kicker">{t.methodKicker}</span><h2>{t.methodTitle}</h2></div><p>{t.methodDesc}</p></div>
        <div className="method-grid">{t.methodCards.map((card) => <article key={card[0]}><span>{card[0]}</span><h3>{card[1]}</h3><p>{card[2]}</p><small>{card[3]}</small></article>)}</div>
      </section>

      <section className="inquiry-section" id="inquiry">
        <div className="inquiry-copy"><span className="section-kicker">{t.inquiryKicker}</span><h2>{t.inquiryTitle}</h2><p>{t.inquiryDesc}</p><a className="contact-email" href={"mailto:" + CONTACT_EMAIL}><span>{t.contact}</span>{CONTACT_EMAIL}</a><ul>{t.models.map((model) => <li key={model}>{model}</li>)}</ul></div>
        <form className="inquiry-form" onSubmit={submitInquiry}>
          <div className="form-grid"><label><span>{t.org}</span><input name="organization" required /></label><label><span>{t.name}</span><input name="name" required /></label><label><span>{t.email}</span><input name="email" type="email" required /></label><label><span>{t.budget}</span><input name="budget" /></label><label className="form-wide"><span>{t.scope}</span><select name="scope" required>{t.scopeOptions.map((option, index) => <option key={option} value={index ? option : ""}>{option}</option>)}</select></label><label className="form-wide"><span>{t.message}</span><textarea name="message" rows={4} /></label></div>
          <button className="submit-button" type="submit">{t.submit} <span>→</span></button>
          <small className={submitted ? "form-notice submitted" : "form-notice"}>{submitted ? t.submitted : t.previewNotice}</small>
        </form>
      </section>

      <footer><div className="brand brand-image"><img className="brand-logo footer-logo" src="/2book-logo.webp" alt="2BOOK 臻品齋" /><span className="brand-name"><strong>臻品齋書店</strong><small>PHYSICAL CHINESE CORPUS</small></span></div><p>{t.footer}</p></footer>
    </main>
  );
}
