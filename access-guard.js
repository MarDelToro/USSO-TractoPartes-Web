(function () {
  var ACCESS_KEY = 'usso_acceso_ok';
  var isAllowed = false;

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
