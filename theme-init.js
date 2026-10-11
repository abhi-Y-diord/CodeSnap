(function() {
  try {
    var savedTheme = localStorage.getItem('codesnap_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
