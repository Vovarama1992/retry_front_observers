<script>
document.addEventListener('click', (e) => {
  const path = e.composedPath
    ? e.composedPath()
    : (function (n, a = []) { while (n) { a.push(n); n = n.parentNode } return a })(e.target);

  const el = e.target.closest('*');
  const info = (n) =>
    n && n.nodeType === 1
      ? `${n.tagName.toLowerCase()}#${n.id || ''}.${(n.className || '').toString().replace(/\s+/g, '.')}`
      : '';

  console.log('[probe] target:', info(e.target));
  console.log('[probe] closest with any attrs:', el?.outerHTML?.slice(0, 300));
  console.log(
    '[probe] data-track on path:',
    path.find((n) => n.getAttribute?.('data-track'))?.getAttribute?.('data-track') || 'NONE'
  );
}, true);
</script>