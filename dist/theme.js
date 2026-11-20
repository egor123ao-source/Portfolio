// Apply the saved theme before styles paint; storage may be disabled.
try { const theme = JSON.parse(localStorage.getItem('th')); if (['light', 'dark'].includes(theme)) document.documentElement.dataset.theme = theme; } catch {}
