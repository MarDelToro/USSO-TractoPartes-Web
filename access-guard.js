(function () {
  var ACCESS_KEY = 'usso_acceso_ok';
  var isLocalPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  var isAllowed = false;

  if (isLocalPreview) return;

  try {
    isAllowed = window.localStorage.getItem(ACCESS_KEY) === '1';
  } catch (error) {
    isAllowed = false;
  }

  if (!isAllowed) {
    document.documentElement.style.visibility = 'hidden';
    window.location.replace('/');
  }
})();
