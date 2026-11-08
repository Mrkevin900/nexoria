/* Couche premium : étend main.js sans retirer de fonctionnalité (navigation, résumé, timeline, missions, paramètres, toasts). */
(()=>{
const IC={home:'◇',parcours:'◈',hammer:'▦',vocab:'❖',ressources:'⌘',blender:'⬡',exercices:'▲',creation:'◉',optim:'⚙',portfolio:'▤',final:'✔',settings:'☰'};
Object.assign(Object.fromEntries(NAV.map(n=>[n[0],n])),{});
const ren={home:'Introduction',parcours:'Tableau de bord',exercices:'Exercices pratiques',creation:'Méthodologie pro',optim:'Optimisation et tests'};NAV.forEach(n=>{if(ren[n[0]])n[1]=ren[n[0]]});NAV.push(['settings','Paramètres']);
const nb=()=>{$('#nav').innerHTML=NAV.map(n=>`<button data-go="${n[0]}" title="${n[1]}"><i>${IC[n[0]]}</i><span>${n[1]}</span></button>`+(n[0]=='hammer'?`<div class="chs">${C.map((c,i)=>`<button data-c="${i}" title="${c[0]}"><i>#${i}</i><span>${c[0]}</span></button>`).join('')}</div>`:'')).join('')};
const toast=m=>{let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';document.body.append(t)}t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),1800)};
/* sidebar réductible */
document.body.classList.toggle('col',!!S.col);$('#col').onclick=()=>{S.col=!S.col;document.body.classList.toggle('col',S.col);$('#col').textContent=S.col?'»':'«';save()};$('#col').textContent=S.col?'»':'«';
/* accueil */
const oh=V.home;V.home=()=>{const s=stats();return oh().replace('Commencer la formation','COMMENCER LA FORMATION').replace('Explorer les cours','EXPLORER LE PROGRAMME').replace('</div></section>',`</div><div class="hp rv"><span class="mono">PROGRESSION ${s.pct}%</span><div class="bar"><i style="width:${s.pct}%"></i></div></div></section>`)};
/* tableau de bord : carte « Reprendre » calculée sur les données réelles */
const rc=()=>{const s=stats(),has=S.lastC!=null,i=has?S.lastC:Math.max(0,C.findIndex((_,j)=>!S.done[j])),pr=P.map((p,k)=>[p[0],cnt('p'+k,3)]).filter(x=>x[1]>0&&x[1]<3);
return `<div class="card resume rv"><span class="tag">Reprendre ma formation</span><h2>${has?'Dernier cours consulté':'Premier cours recommandé'} — #${i} ${C[i][0]}</h2><p>${C[i][2]}</p><div class="row"><button class="btn p" data-c="${i}">Reprendre</button><button class="btn" data-go="exercices">Mes missions</button></div><p class="mono">${s.pct}% accompli · ${s.cd}/10 cours · ${s.pv}/6 exercices · ${Object.keys(S.fav).filter(k=>S.fav[k]).length} favori(s)</p><p class="mono">${pr.length?'PROJETS EN COURS : '+pr.map(x=>x[0]+' ('+x[1]+'/3)').join(' · '):'AUCUN PROJET EN COURS'}</p></div>`};
const op=V.parcours;V.parcours=()=>op().replace('<div class="stats">',rc()+'<div class="stats">').replace('Mon parcours</h2>','Bienvenue sur ton parcours</h2>');
/* Hammer : timeline des 10 cours */
const ohm=V.hammer;V.hammer=()=>ohm().replace('<div class="warn rv">',`<div class="htl rv">${C.map((c,i)=>`<button data-c="${i}" class="${S.done[i]?'ok':(S.ck['c'+i+'.0']||S.ck['c'+i+'.1'])?'ing':''}"><b>#${i}</b><span>${c[0]}</span></button>`).join('')}</div><div class="warn rv">`);
/* cours : encadrés tirés du guide */
const TIP={0:'Ne change aucun chemin de configuration et ne réinstalle rien avant d’avoir identifié ta version de Hammer.',3:'Garde une copie de la version précédente.',4:'Après #4, arrête-toi pour créer une pièce, la texturer et la compiler avant de continuer avec #5 à #9.',8:'N’utilise pas encore les displacements partout.',9:'Ne transforme pas tout en func_detail : les murs qui doivent bloquer la visibilité restent structurels.'};
const oc=openC;openC=function(i){S.lastC=i;oc(i);const c=C[i],mb=$('#modal .mb'),h=[...mb.querySelectorAll('h3')].find(x=>x.textContent.startsWith('Contenu'));
mb.querySelector('.tag').insertAdjacentHTML('afterend',`<div class="bar" title="Chapitre ${i+1} / 10"><i style="width:${(i+1)*10}%"></i></div>`);
h&&h.insertAdjacentHTML('beforebegin',`<div class="co"><b>Étapes à reproduire</b><ol><li>Regarde la vidéo « ${c[0]} ».</li><li>${c[3]}</li><li>Sauvegarde et prends une capture.</li></ol></div>${TIP[i]?`<div class="co"><b>Conseil</b>${TIP[i]}</div>`:''}<div class="co"><b>Notion importante</b>Une vidéo devient une compétence lorsque tu peux refaire la manipulation sans elle et expliquer à quoi elle sert.</div><div class="co w"><b>Point de vigilance</b>La série date de 2015–2016 : menus, chemins ou paramètres peuvent différer de ton installation. Ne modifie pas plusieurs réglages à la fois.</div>`)};
/* missions */
const oe=V.exercices;V.exercices=()=>{let h=oe();const st=k=>pOK(k)?'Validée':cnt('p'+k,3)?'En cours':'À faire';
h=h.replace('<div class="grid">',`<div class="chain rv">${P.map((p,k)=>`<div class="${pOK(k)?'ok':cnt('p'+k,3)?'ing':''}"><b>${k+1}</b><span>${p[0]}</span></div>`).join('')}</div><div class="grid">`);
P.forEach((p,k)=>{h=h.replace(`<div class="n">0${k+1}</div>`,`<span class="tag">Mission ${k+1} · ${st(k)}</span><div class="n">0${k+1}</div>`)});return h};
/* Blender : parcours progressif */
const ob=V.blender;V.blender=()=>ob().replace('<h3 style="margin-top:24px">',`<div class="card rv" style="margin-top:20px"><h3>Parcours progressif</h3><p class="muted">Dans l’ordre recommandé par le guide ; l’export Source vient en dernier.</p>${ck('b',['Interface','Navigation et déplacement','Modélisation (d’abord une caisse, puis un petit meuble)','Matériaux','Éclairage','Dépliage UV','Introduction à l’export Source (Blender Source Tools, Crowbar)'])}</div><h3 style="margin-top:24px">`);
/* paramètres */
V.settings=()=>hd('Réglages','Paramètres','Tes données restent dans ce navigateur (localStorage).')+`<div class="grid"><div class="card rv"><h3>Mode lecture</h3><p>Texte plus grand, effets 3D masqués.</p><br><button class="btn" data-act="read">Basculer</button></div><div class="card rv"><h3>Sauvegarde</h3><p>Exporte ta progression, tes notes et tes favoris en JSON.</p><br><button class="btn" data-act="exp">Exporter</button></div><div class="card rv"><h3>Réinitialiser</h3><p>Efface progression, notes, favoris et captures.</p><br><button class="btn" data-act="rst">Tout effacer</button></div></div>`;
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]')?.dataset.act;if(a=='read')$('#rd').click();
if(a=='exp'){const b=new Blob([JSON.stringify({...S,notes:Object.fromEntries(Object.entries(S.notes).filter(([k])=>!k.startsWith('img')))},null,1)],{type:'application/json'}),l=document.createElement('a');l.href=URL.createObjectURL(b);l.download='mapping-academy-progression.json';l.click();toast('Export téléchargé')}
if(a=='rst'&&confirm('Tout effacer définitivement ?')){localStorage.removeItem(K);location.reload()}
if(e.target.closest('[data-fav]'))toast('Favori mis à jour')});
document.addEventListener('change',e=>{if(e.target.matches('[data-ck],[data-done]'))toast('✓ Progression enregistrée')});
let nt;document.addEventListener('input',e=>{if(e.target.dataset.note){clearTimeout(nt);nt=setTimeout(()=>toast('Note enregistrée'),700)}});
nb();render();
})();
