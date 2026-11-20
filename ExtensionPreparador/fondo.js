// Al pulsar el icono de la extensión se abre el preparador en una pestaña.
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("preparador.html") });
});
