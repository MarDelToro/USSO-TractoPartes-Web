(function () {
  document.getElementById('mobilePublish').addEventListener('click',()=>document.getElementById('publishIndex').click());
  const menu=document.getElementById('adminMobileMenu');
  menu.textContent='';menu.setAttribute('aria-label','Abrir menú de administración');
  const menuIcon=document.createElement('i');menuIcon.className='bi bi-list';menuIcon.setAttribute('aria-hidden','true');menu.append(menuIcon);
  const icons = {overview:'grid',auctions:'box-seam',live:'activity',finance:'wallet2',history:'clock-history',winners:'trophy',users:'people',notices:'bell'};
  document.querySelectorAll('.admin-index-links [data-admin-view-link]').forEach(link => {
    const icon = document.createElement('i'); icon.className='bi bi-'+icons[link.dataset.adminViewLink];icon.setAttribute('aria-hidden','true');link.prepend(icon);
  });
  const money = value => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(value);
  window.USSODashboard = {update({listings,active,awarded,paid}){
    const values={overviewAwarded:money(awarded),overviewPaid:money(paid),overviewPending:money(Math.max(0,awarded-paid)),overviewPublished:active.length,overviewUpcoming:active.filter(l=>new Date(l.starts_at)>new Date()).length};
    Object.entries(values).forEach(([id,value])=>document.getElementById(id).textContent=value);
    const activeList=document.getElementById('overviewActiveLots');
    activeList.replaceChildren();
    active.forEach(lot=>{
      const row=document.createElement('article');row.className='overview-active-lot';
      if(lot.image_url){const image=document.createElement('img');image.src=lot.image_url;image.alt='';image.loading='lazy';image.onerror=()=>image.remove();row.append(image);}
      const content=document.createElement('div');
      const status=document.createElement('span');
      const upcoming=new Date(lot.starts_at)>new Date();
      status.textContent=(upcoming?'Próxima':'Activa')+(lot.lot_number?' · #'+lot.lot_number:'');
      status.className='overview-lot-status';
      const title=document.createElement('strong');title.textContent=lot.title||'Subasta';
      const date=document.createElement('small');
      const at=upcoming?lot.starts_at:lot.ends_at;
      date.textContent=(upcoming?'Inicia ':'Cierra ')+(at?new Date(at).toLocaleString('es-MX',{timeZone:'America/Mexico_City',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'por definir');
      const actions=document.createElement('div');actions.className='overview-lot-actions';
      const edit=document.createElement('button');edit.type='button';edit.dataset.edit=lot.id;edit.textContent='Editar';edit.setAttribute('aria-label','Editar '+(lot.title||'subasta'));
      const detail=document.createElement('a');detail.href='Subasta.dc.html#'+encodeURIComponent(lot.id);detail.textContent='Ver detalles';
      actions.append(edit,detail);content.append(status,title,date,actions);row.append(content);activeList.append(row);
    });
    if(!active.length){const empty=document.createElement('p');empty.textContent='No hay subastas activas ni próximas por ahora.';activeList.append(empty);}
    const body=document.getElementById('overviewRecent');body.replaceChildren();
    listings.slice(0,5).forEach(lot=>{
      const tr=document.createElement('tr');
      const status=lot.status==='active' ? (lot.ends_at && new Date(lot.ends_at)<=new Date()?'Finalizada':new Date(lot.starts_at)>new Date()?'Próxima':'Activa') : 'Finalizada';
      [lot.lot_number||'—',lot.title||'Sin título',money(lot.current_price||lot.start_price||0),status,lot.starts_at?new Date(lot.starts_at).toLocaleDateString('es-MX',{day:'numeric',month:'short',timeZone:'America/Mexico_City'}):'Por definir'].forEach((text,index)=>{
        const td=document.createElement('td');td.textContent=text;if(index===3)td.className='overview-state';tr.append(td);
      });
      const td=document.createElement('td'),link=document.createElement('a');link.href='Subasta.dc.html#'+encodeURIComponent(lot.id);link.textContent='Ver';link.setAttribute('aria-label','Ver '+(lot.title||'subasta'));td.append(link);tr.append(td);body.append(tr);
    });
    if(!listings.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=6;td.textContent='Aún no hay subastas publicadas.';tr.append(td);body.append(tr);}
  }};
})();
