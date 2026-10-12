// Footer year + contact form placeholder handler
(function () {
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    // Until a form backend is connected (set the form's action), show a local confirmation only.
    if (!form.getAttribute('action') || form.getAttribute('action') === '#') {
      e.preventDefault();
      if (status) status.hidden = false;
      form.reset();
    }
  });
})();
