/* =========================================================
   Assolyte — Landing · interactions
   ========================================================= */
(function () {
  "use strict";

  var eur = function (n) {
    return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  };

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById("siteHeader");
  var onScroll = function () {
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Caisse interactive (hero) — fidèle à l'app ---------- */
  var prodsEl = document.getElementById("a2Prods");
  var totEl = document.getElementById("a2Tot");
  var cntEl = document.getElementById("a2Cnt");
  var btnEl = document.getElementById("a2Btn");
  var clearEl = document.getElementById("a2Clear");
  var radiosEl = document.getElementById("a2Radios");
  var validateEl = document.getElementById("a2Validate");
  var toast = document.getElementById("toast");

  var qty = {};            // name -> quantity
  var payMode = "cash";
  var toastTimer = null;

  function orderTotalAndCount() {
    var t = 0, c = 0;
    prodsEl.querySelectorAll(".a2-prod").forEach(function (b) {
      var n = b.dataset.name;
      var q = qty[n] || 0;
      t += parseFloat(b.dataset.price) * q;
      c += q;
    });
    return { total: t, count: c };
  }

  function render() {
    var r = orderTotalAndCount();
    var amt = eur(r.total);
    totEl.textContent = amt;
    btnEl.textContent = amt;
    cntEl.textContent = r.count + (r.count > 1 ? " produits" : " produit");
    prodsEl.querySelectorAll(".a2-prod").forEach(function (b) {
      var n = b.dataset.name;
      var q = qty[n] || 0;
      b.classList.toggle("on", q > 0);
      var pill = b.querySelector(".a2-q");
      pill.innerHTML = q + "&nbsp;×";
      pill.style.opacity = q > 0 ? "1" : "0";
      pill.style.transform = q > 0 ? "none" : "scale(.7)";
    });
  }

  prodsEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".a2-prod");
    if (!btn) return;
    var n = btn.dataset.name;
    qty[n] = (qty[n] || 0) + 1;
    render();
  });

  function clearOrder() { qty = {}; render(); }
  clearEl.addEventListener("click", clearOrder);

  radiosEl.addEventListener("click", function (e) {
    var r = e.target.closest(".a2-radio");
    if (!r) return;
    payMode = r.dataset.pay;
    radiosEl.querySelectorAll(".a2-radio").forEach(function (x) { x.classList.toggle("sel", x === r); });
  });

  function showToast(msg) {
    toast.innerHTML = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 1700);
  }

  validateEl.addEventListener("click", function () {
    var r = orderTotalAndCount();
    if (r.total <= 0) { showToast("Touchez d'abord un produit 👆"); return; }
    var label = payMode === "cash" ? "💶 " + eur(r.total) + " encaissés en espèces" : "💳 " + eur(r.total) + " encaissés en carte";
    showToast(label);
    clearOrder();
  });

  render();

  /* ---------- Modale démo ---------- */
  var back = document.getElementById("modalBack");
  var closeBtn = document.getElementById("modalClose");
  var formWrap = document.getElementById("modalForm");
  var doneWrap = document.getElementById("modalDone");
  var form = document.getElementById("demoForm");
  var email = document.getElementById("email");
  var doneMsg = document.getElementById("doneMsg");
  var lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    formWrap.style.display = "";
    doneWrap.style.display = "none";
    email.classList.remove("err");
    email.value = "";
    back.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(function () { email.focus(); }, 220);
  }
  function closeModal() {
    back.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll("[data-demo]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); openModal(); });
  });
  closeBtn.addEventListener("click", closeModal);
  back.addEventListener("click", function (e) { if (e.target === back) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && back.classList.contains("open")) closeModal(); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = email.value.trim();
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (!ok) { email.classList.add("err"); email.focus(); return; }
    email.classList.remove("err");
    var name = v.split("@")[0];
    doneMsg.innerHTML = "Votre accès de test part vers <strong>" + v + "</strong>. Pensez à vérifier vos spams — à tout de suite sur Assolyte&nbsp;!";
    formWrap.style.display = "none";
    doneWrap.style.display = "";
  });

  /* ---------- Reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }
})();
