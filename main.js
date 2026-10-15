// Footer year + contact form (sends through Web3Forms)
(function () {
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  if (!form) return;
  var btn = form.querySelector('button[type="submit"]');

  // Analytics: note once when a visitor actually reaches the form
  if ('IntersectionObserver' in window) {
    var seen = false;
    new IntersectionObserver(function (entries, obs) {
      if (seen || !entries[0].isIntersecting) return;
      seen = true; obs.disconnect();
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: 'form-seen-' + location.host + location.pathname, title: 'Form seen', event: true });
      }
    }, { threshold: 0.4 }).observe(form);
  }

  function say(attr, isError) {
    if (!status) return;
    status.textContent = status.getAttribute(attr) || '';
    status.classList.toggle('is-error', !!isError);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var keyField = form.querySelector('input[name="access_key"]');
    if (!keyField || !keyField.value.trim()) { say('data-error', true); return; }

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    if (btn) btn.disabled = true;
    say('data-sending');

    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && j.success; });
      })
      .then(function (ok) {
        if (ok) {
          say('data-success'); form.reset();
          if (window.goatcounter && window.goatcounter.count) {
            window.goatcounter.count({ path: 'form-sent-' + location.host, title: 'Contact form sent', event: true });
          }
        } else { say('data-error', true); }
      })
      .catch(function () { say('data-error', true); })
      .then(function () { if (btn) btn.disabled = false; });
  });
})();
