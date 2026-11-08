/* Scène 3D « Hammer » — Three.js r128 : grille, bâtiments en blocs, cadre de pièce, particules.
   Réagit à la souris et au scroll ; désactivée si mouvement réduit / appareil peu puissant / WebGL indisponible. */
(()=>{const c=document.getElementById('bg'),off=()=>{c.style.display='none'};
if(!window.THREE||matchMedia('(prefers-reduced-motion:reduce)').matches||(navigator.hardwareConcurrency||4)<4||(navigator.deviceMemory||4)<4)return off();
try{const sm=innerWidth<760,r=new THREE.WebGLRenderer({canvas:c,antialias:!sm,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,sm?1:1.5));
const s=new THREE.Scene();s.fog=new THREE.FogExp2(0x050505,.04);const cam=new THREE.PerspectiveCamera(50,1,.1,120);cam.position.set(0,4,17);
s.add(new THREE.AmbientLight(0x555555,1.1));const d=new THREE.DirectionalLight(0xffffff,1.1);d.position.set(-6,10,6);s.add(d);const pl=new THREE.PointLight(0xffffff,2.4,45);s.add(pl);
const grid=new THREE.GridHelper(90,sm?45:90,0x555555,0x1d1d1d);grid.position.y=-3.5;s.add(grid);
const g=new THREE.Group();g.position.set(sm?0:5.5,-3.5,-6);s.add(g);
const mat=new THREE.MeshStandardMaterial({color:0x9a9a9a,metalness:.92,roughness:.28}),dk=new THREE.MeshStandardMaterial({color:0x1b1b1b,metalness:.75,roughness:.45}),lm=new THREE.LineBasicMaterial({color:0xf5f5f5,transparent:true,opacity:.42});
const room=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(14,8,14)),lm);room.position.y=4;g.add(room);
const bl=[];for(let i=0;i<(sm?8:16);i++){const w=1+(Math.random()*3|0),h=1+(Math.random()*6|0),dp=1+(Math.random()*3|0),geo=new THREE.BoxGeometry(w,h,dp),m=new THREE.Mesh(geo,i%3?dk:mat);
m.position.set((i%4-1.5)*3.2,0,(Math.floor(i/4)-1.5)*3.2);m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),lm));m.userData={h,i};m.scale.y=.01;g.add(m);bl.push(m)}
const fl=[];for(let i=0;i<(sm?4:8);i++){const m=new THREE.Mesh(i%2?new THREE.OctahedronGeometry(.45):new THREE.IcosahedronGeometry(.4),mat);m.position.set((Math.random()-.5)*14,2+Math.random()*7,(Math.random()-.5)*14);m.userData.f=Math.random()*6;g.add(m);fl.push(m)}
const n=sm?120:360,pa=new Float32Array(n*3);for(let i=0;i<n*3;i++)pa[i]=(Math.random()-.5)*40;const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pa,3));
const pts=new THREE.Points(pg,new THREE.PointsMaterial({size:.05,color:0xffffff,transparent:true,opacity:.5}));s.add(pts);
let mx=0,my=0,sy=0,t=0,run=true;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=-(e.clientY/innerHeight)*2+1});
const rs=()=>{r.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};rs();addEventListener('resize',rs);
document.addEventListener('visibilitychange',()=>{run=!document.hidden;if(run)loop()});c.addEventListener('webglcontextlost',off);
function loop(){if(!run)return;requestAnimationFrame(loop);if(document.body.classList.contains('read'))return;t+=.01;sy+=(Math.min(scrollY,4000)-sy)*.06;
g.rotation.y=-.55+t*.07+sy*.0007+mx*.12;cam.position.x+=(mx*1.4-cam.position.x)*.04;cam.position.y+=(4-sy*.0015+my*.6-cam.position.y)*.04;cam.lookAt(0,0,-4);
bl.forEach(m=>{if(t>m.userData.i*.07){m.scale.y+=(1-m.scale.y)*.05}m.position.y=m.userData.h/2*m.scale.y});
fl.forEach(m=>{m.rotation.x+=.006;m.rotation.y+=.008;m.position.y+=Math.sin(t*2+m.userData.f)*.004});pts.rotation.y=t*.03;
pl.position.set(mx*12,my*6+4,7);r.render(s,cam)}
loop()}catch(e){off()}})();
