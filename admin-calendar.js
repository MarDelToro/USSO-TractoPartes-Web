(function () {
  const zone = 'America/Mexico_City';
  const dateKey = value => {
    const date = new Date(value);
    if (!value || !Number.isFinite(date.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type).value).join('-');
  };
  const today = () => dateKey(new Date());
  let selected = today(), month = selected.slice(0, 7), listings = [], loaded = false;
  const labelDate = key => new Date(`${key}T12:00:00Z`);
  const eventsFor = key => listings.flatMap(lot => ['starts_at', 'ends_at'].filter(field => dateKey(lot[field]) === key).map(field => ({ lot, field, at: lot[field] }))).sort((a,b) => new Date(a.at) - new Date(b.at));
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node; };
  function render() {
    const root = document.getElementById('adminCalendar');
    if (!root) return;
    root.replaceChildren();
    const calendar = el('div');
    calendar.append(el('h2', '', 'Agenda de subastas'), el('p', '', 'Fechas de inicio y cierre · hora de Ciudad de México'));
    const toolbar = el('div', 'cal-toolbar');
    function nav(text, label, action) { const b = el('button', '', text); b.type = 'button'; b.setAttribute('aria-label', label); b.onclick = action; return b; }
    function move(delta) {
      const [y,m] = month.split('-').map(Number);
      const next = new Date(Date.UTC(y,m - 1 + delta,1));
      month = next.toISOString().slice(0,7); selected = month + '-01'; render();
    }
    toolbar.append(nav('‹','Mes anterior',()=>move(-1)), el('span','cal-month',labelDate(month+'-01').toLocaleDateString('es-MX',{month:'long',year:'numeric',timeZone:zone})),nav('›','Mes siguiente',()=>move(1)),nav('Hoy','Volver a hoy',()=>{selected=today();month=selected.slice(0,7);render();}));
    const grid = el('div','cal-grid');
    ['L','M','M','J','V','S','D'].forEach(day=>grid.append(el('span','cal-weekday',day)));
    const [y,m] = month.split('-').map(Number);
    const offset = (new Date(Date.UTC(y,m-1,1)).getUTCDay()+6)%7;
    for(let i=0;i<offset;i++) grid.append(el('span'));
    const days = new Date(Date.UTC(y,m,0)).getUTCDate();
    for(let day=1;day<=days;day++) {
      const key = `${month}-${String(day).padStart(2,'0')}`, count = eventsFor(key).length;
      const b = nav(String(day),`${day} de ${toolbar.children[1].textContent}${count ? `, ${count} eventos` : ''}`,()=>{selected=key;render();document.getElementById('cal-day-'+key)?.focus();});
      b.id = 'cal-day-'+key;
      b.className = 'cal-day'+(key===today()?' today':'')+(key===selected?' selected':'');
      b.setAttribute('aria-pressed',String(key===selected));
      if(key===today()) b.setAttribute('aria-current','date');
      if(count) b.append(el('span','cal-dot'));
      grid.append(b);
    }
    calendar.append(toolbar,grid,el('p','cal-note','● Días con inicio o cierre de subasta'));
    const details = el('div','cal-details');
    details.append(el('h3','',labelDate(selected).toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',timeZone:zone})));
    const list = el('div','cal-events'); list.setAttribute('aria-live','polite');
    const events = eventsFor(selected);
    if(!events.length) list.append(el('p','',loaded?'No hay inicios ni cierres programados para este día.':'Cargando la programación…'));
    events.forEach(({lot,field,at})=>{
      const card=el('div','cal-event');
      card.append(el('strong','',`${lot.lot_number ? 'Lote '+lot.lot_number+' · ' : ''}${lot.title || 'Subasta'}`),el('span','',`${field==='starts_at'?'Inicio':'Cierre'} · ${new Date(at).toLocaleTimeString('es-MX',{timeZone:zone,hour:'numeric',minute:'2-digit',hour12:true})}`));
      const link=el('a','','Ver detalles →'); link.href='Subasta.dc.html#'+encodeURIComponent(lot.id); card.append(link); list.append(card);
    });
    details.append(list); root.append(calendar,details);
  }
  window.USSOCalendar = {
    update(rows) { listings = rows.filter(lot=>lot.status==='active'); loaded=true;render(); },
    error() { const root=document.getElementById('adminCalendar'); if(root) root.replaceChildren(el('p','','No se pudo actualizar la agenda. Recarga la página para volver a intentar.')); },
    dateKey
  };
  document.addEventListener('DOMContentLoaded',render);
})();
