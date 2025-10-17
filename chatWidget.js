window.addEventListener('load', function() {
  const btn = document.createElement('button');
  btn.textContent = 'Chat with us';
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: '#0078ff',
    color: '#fff',
    border: 'none',
    padding: '12px 18px',
    borderRadius: '30px',
    cursor: 'pointer',
    zIndex: 9999
  });
  btn.onclick = function() {
    window.open('https://live.agent-crm.com/aichat', 'chatWindow', 'width=400,height=600');
  };
  document.body.appendChild(btn);
});
