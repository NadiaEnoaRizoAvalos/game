'use strict';
// Configuración: tiempos en segundos; posiciones en coordenadas lógicas del canvas.
const CONFIG = {width:1000,height:640,basketCapacity:6,speed:225,pickRadius:48,minX:42,maxX:958,minY:58,maxY:602,door:{x:174,y:235,radius:37},minimumSaved:0};
// Anclas sobre el suelo: la altura visual de la soga no limita el movimiento.

const ROPES = [{x1:395,x2:910,y:190},{x1:285,x2:750,y:365},{x1:430,x2:920,y:545}];
const OBSTACLES = [{x:63,y:56,w:216,h:153},{x:70,y:401,w:140,h:113}];
function garmentPosition(i,count)
{
    const ropeId=i%ROPES.length,r=ROPES[ropeId],slot=Math.floor(i/ROPES.length),n=Math.ceil((count-ropeId)/ROPES.length);
    return {x:r.x1+48+slot*(r.x2-r.x1-96)/Math.max(1,n-1),y:r.y,ropeId};
}
function canStand(x,y)
{
    return !OBSTACLES.some(o=>x>o.x-12&&x<o.x+o.w+12&&y>o.y-9&&y<o.y+o.h+9)&&!ROPES.some(r=>[r.x1,r.x2].some(px=>Math.hypot(x-px,y-r.y)<17));
}
function movePlayer(dx,dy,dt)
{
    const p=state.player,norm=Math.hypot(dx,dy)||1;
    p.walking=!!(dx||dy);
    if(p.walking)
        {
            p.facingX=dx;p.facingY=dy;
        } // Normalizar evita velocidad extra en diagonal.
 const steps=Math.max(1,Math.ceil(CONFIG.speed*dt/8));
 for(let i=0;i<steps;i++)
    {
        const x=clamp(p.x+dx/norm*CONFIG.speed*dt/steps,CONFIG.minX,CONFIG.maxX);
        if(canStand(x,p.y))p.x=x;
        const y=clamp(p.y+dy/norm*CONFIG.speed*dt/steps,CONFIG.minY,CONFIG.maxY);
        if(canStand(p.x,y))p.y=y;
    }
}

const GARMENTS = {
 sock:{name:'Media',value:1,time:.4,size:.5,priority:1,resistance:1.2,color:'#e9ce86'},
 shirt:{name:'Remera',value:4,time:.7,size:1,priority:2,resistance:1,color:'#e4a183'},
 pants:{name:'Pantalón',value:6,time:1.2,size:1.5,priority:2,resistance:1.25,color:'#708f9b'},
 blouse:{name:'Camisa',value:5,time:.9,size:1,priority:2,resistance:.9,color:'#ece7c6'},
 jacket:{name:'Campera',value:8,time:1.8,size:2,priority:3,resistance:1.4,color:'#81996b'},
 sheet:{name:'Sábana',value:12,time:2.5,size:3,priority:3,resistance:.8,color:'#eee9d0'},
 leather:{name:'Cuero',value:16,time:2.1,size:2.5,priority:4,resistance:.75,color:'#aa704b',special:true,dryMultiplier:2}
};


const LEVELS = [
 {name:'Tranquilo',delay:20,stormAfter:18,wetRate:9,wind:1,specialCount:0,types:['sock','shirt','pants','sheet','blouse','shirt','jacket','sock']},
 {name:'Tormenta',delay:17,stormAfter:14,wetRate:12,wind:3,specialCount:1,types:['shirt','pants','sock','sheet','blouse','jacket','shirt','pants','sock','leather']},
 {name:'Tormenta fuerte',delay:14,stormAfter:10,wetRate:15,wind:5,specialCount:2,types:['sheet','shirt','pants','jacket','sock','blouse','sheet','pants','jacket','shirt','leather','leather']}
];

const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d');

const keys=new Set();
let state,clock=0,lastTime=0,toastTime=0,helpWasPlaying=false;

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// WebAudio: ningún archivo de audio externo. El contexto se abre tras un gesto.
const AudioFX={enabled:false,context:null,rain:null,rainGain:null,
 init()
 {
    if(!this.context)
        {
            const AC=window.AudioContext||window.webkitAudioContext;
            if(AC)this.context=new AC();
        }
        this.context?.resume().catch(()=>{});
    },
 tone(freq=500,duration=.12,type='sine',volume=.05)
 {
    if(!this.enabled||!this.context)return;
    const a=this.context,o=a.createOscillator(),g=a.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,a.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq*.7,a.currentTime+duration);
    g.gain.setValueAtTime(volume,a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,a.currentTime+duration);
    o.connect(g).connect(a.destination);o.start();
    o.stop(a.currentTime+duration);
},
 noise(duration,volume)
 {
    if(!this.enabled||!this.context)return;
    const a=this.context,b=a.createBuffer(1,a.sampleRate*duration,a.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
    const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();
    s.buffer=b;
    f.type='lowpass';
    f.frequency.value=380;
    g.gain.value=volume;
    s.connect(f).connect(g).connect(a.destination);
    s.start();
},
 weather(intensity)
 {
    if(!this.context)return;
    if(intensity>0&&this.enabled&&!this.rain)
        {
            const a=this.context,b=a.createBuffer(1,a.sampleRate*2,a.sampleRate),d=b.getChannelData(0);
            for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.rain=a.createBufferSource();
            this.rain.buffer=b;this.rain.loop=true;this.rainGain=a.createGain();
            const f=a.createBiquadFilter();
            f.type='lowpass';f.frequency.value=1600;
            this.rain.connect(f).connect(this.rainGain).connect(a.destination);
            this.rain.start();
        }
        if(this.rainGain)this.rainGain.gain.setTargetAtTime(this.enabled?intensity*.045:0,this.context.currentTime,.1);},
 stop(){if(this.rain){this.rain.stop();this.rain=null;this.rainGain=null;}},
 play(name){if(name==='collect')this.tone(720);if(name==='full')this.tone(180,.22,'triangle');if(name==='deposit'){this.tone(650,.2);setTimeout(()=>this.tone(980,.2),100);}if(name==='thunder')this.noise(1.3,.3);if(name==='rain')this.noise(.6,.08);if(name==='lightning')this.tone(90,.15,'sawtooth',.025);if(name==='finish'){[440,550,660,880].forEach((v,i)=>setTimeout(()=>this.tone(v,.2),i*120));}}
};


function makeLevel(index,total=0){const level=LEVELS[index];return {mode:'menu',index,total,elapsed:0,points:0,level,player:{x:174,y:270,walking:false,facingX:0,facingY:1},basket:[],items:level.types.map((type,i)=>i>=level.types.length-level.specialCount?'leather':type==='leather'?'jacket':type).map((type,i)=>({type,...GARMENTS[type],...garmentPosition(i,level.types.length),wetness:0,status:'hanging'})),progress:0,target:null,rainIntensity:0,rainStarted:false,stormAnnounced:false,flights:[],depositAnim:null,collectPulse:0,flash:0,thunderAt:level.delay-4,particles:[],saved:0};}

function loadLevel(index,total=0){keys.clear();AudioFX.stop();state=makeLevel(index,total);state.mode='playing';$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Ⅱ';updateHUD();toast('¡A la soga! Mantené Espacio para recoger.');}

function menu()
{   AudioFX.stop();
    keys.clear();
    state=makeLevel(0);
    showPanel('<div class="eyebrow">EL PATIO TE ESPERA</div><h2>Se viene la lluvia.</h2><p>Recogé la ropa, llená el canasto y volvé a casa.<br>Algunas prendas valen más. ¡Elegí bien!</p><div class="panel-actions"><button class="primary" data-action="start">JUGAR <span>→</span></button><button class="secondary" data-action="help">INSTRUCCIONES</button></div><p class="tiny">TRES TORMENTAS · UN CANASTO · MUCHAS DECISIONES</p>');
    $('pause').disabled=true;
    updateHUD();
}
function showPanel(html)
{
    $('panel').innerHTML=html;
    $('overlay').hidden=false;
}

function toast(message)
{
    $('toast').textContent=message;
    $('toast').classList.add('visible');
    toastTime=2.8;
}
function usedSpace()
{
    return state.basket.reduce((s,p)=>s+p.size,0);
}
function valueOf(item)
{
    return item.wetness<30?item.value*(item.dryMultiplier||1):item.wetness<70?item.value*.5:0;
}
function nearest()
{
    let best=null,dist=Infinity;
    for(const p of state.items)
        {
            if(p.status!=='hanging')continue;
            const d=Math.hypot(p.x-state.player.x,p.y-state.player.y);
            if(d<CONFIG.pickRadius&&d<dist)
                {
                    best=p;
                    dist=d;
                }}
                return best;
            }
function deposit()
{
    if(!state.basket.length)return;
    const points=state.basket.reduce((s,p)=>s+valueOf(p),0);
    state.depositAnim={time:0,duration:1.1,points,items:state.basket.map(p=>({...p})),x:state.player.x,y:state.player.y};
    state.basket.forEach(p=>p.status='saved');
    state.saved+=state.basket.length;
    state.basket=[];
    state.points+=points;
    AudioFX.play('deposit');
    burst(CONFIG.door.x,CONFIG.door.y-20,'#f0d486',14);
    toast(`¡A salvo! +${points} puntos guardados`);
}
function burst(x,y,color,count=8)
{
    for(let i=0;i<count;i++)state.particles.push({x,y,vx:(Math.random()-.5)*95,vy:-Math.random()*90-20,life:1,color});
}
function update(dt)
{
    if(state.mode==='playing'||state.mode==='menu')clock+=dt;
    if(toastTime>0)
        {
            toastTime-=dt;
            if(toastTime<=0)$('toast').classList.remove('visible');
        }
            if(state.mode!=='playing')return;
            const s=state;
            s.elapsed+=dt;
            s.flash=Math.max(0,s.flash-dt*2.5);
            s.collectPulse=Math.max(0,s.collectPulse-dt);
            for(const f of s.flights)f.time+=dt;
            s.flights=s.flights.filter(f=>f.time<f.duration);
            if(s.depositAnim)
                {
                    s.depositAnim.time+=dt;
                    if(s.depositAnim.time>=s.depositAnim.duration)s.depositAnim=null;
                }
 const dx=Number(keys.has('right'))-Number(keys.has('left')),dy=Number(keys.has('down'))-Number(keys.has('up'));
 movePlayer(dx,dy,dt);

 if(Math.hypot(s.player.x-CONFIG.door.x,s.player.y-CONFIG.door.y)<CONFIG.door.radius)deposit();

 const target=nearest();
 if(target!==s.target)
    {
        s.target=target;s.progress=0;
    }

 if(keys.has('collect')&&target)
    {
        if(usedSpace()+target.size<=CONFIG.basketCapacity)
            {
                s.progress+=dt;
                if(s.progress>=target.time)
                    {
                        target.status='basket';
                        s.basket.push(target);
                        s.flights.push({item:{...target},x:target.x,y:target.y-52,time:0,duration:.55});
                        s.collectPulse=.55;
                        burst(target.x,target.y-30,target.color);
                        AudioFX.play('collect');
                        s.progress=0;s.target=null;
                        if(usedSpace()>=CONFIG.basketCapacity)
                            {
                                AudioFX.play('full');
                                toast('Canasto lleno. ¡Volvé a la puerta!');
                            }
                        }
                    }else{
                        s.progress=0;
                        if(toastTime<=0)toast('No hay espacio para esta prenda. Descargá en casa.');
                    }
                }else s.progress=0;
 // Toda la ropa expuesta recibe la misma lluvia; intensidad suave → tormenta.
 if(s.elapsed>=s.level.delay)
    {
        const rainTime=s.elapsed-s.level.delay;
        if(!s.rainStarted)
            {
                s.rainStarted=true;
                AudioFX.play('rain');
                toast('Empiezan las primeras gotas en todo el patio.');
            }
            const t=clamp(rainTime/s.level.stormAfter,0,1);
            s.rainIntensity=.08+.92*t*t*(3-2*t);
            AudioFX.weather(s.rainIntensity);
            for(const p of s.items)
                {
                    if(p.status==='hanging'||p.status==='basket')p.wetness=clamp(p.wetness+dt*s.level.wetRate*(.12+1.35*s.rainIntensity)/p.resistance,0,100);
                }
                if(t>=1&&!s.stormAnnounced)
                    {
                        s.stormAnnounced=true;
                        s.flash=.32;
                        AudioFX.play('thunder');
                        toast('¡Se largó la tormenta! Guardá lo que puedas.');
                    }
                }
 if(s.elapsed>s.thunderAt)
    {
        if(s.rainIntensity>.55)
            {
                AudioFX.play('thunder');
                s.flash=.15+s.rainIntensity*.2;
                AudioFX.play('lightning');
            }
            s.thunderAt=s.elapsed+(s.rainIntensity>.9?5:9)+Math.random()*4;
        }
 for(const p of s.particles)
    {
        p.x+=p.vx*dt;
        p.y+=p.vy*dt;
        p.vy+=140*dt;
        p.life-=dt;
    }
    s.particles=s.particles.filter(p=>p.life>0);

 // La ropa del canasto aún puede mojarse: solo la puerta asegura los puntos.
 const unsettled=s.items.some(p=>p.status!=='saved'&&p.wetness<100);

 if(!s.depositAnim&&!s.flights.length&&((s.stormAnnounced&&!unsettled)||s.items.every(p=>p.status==='saved')))finish();updateHUD();
}
function finish()
{
    keys.clear();
    state.mode='results';
    AudioFX.stop();
    AudioFX.play('finish');
    $('pause').disabled=true;
    const s=state,dry=s.items.filter(p=>p.status==='saved'&&p.wetness<30).length,damp=s.items.filter(p=>p.status==='saved'&&p.wetness>=30&&p.wetness<70).length,wet=s.items.filter(p=>p.wetness>=70).length,failed=s.saved<CONFIG.minimumSaved;showPanel(`<div class="eyebrow">NIVEL ${s.index+1} ${failed?'· A INTENTAR DE NUEVO':'COMPLETADO'}</div><h2>${failed?'¡Todavía podés mejorar!':s.index===2?'Después de la lluvia.':'Un respiro en casa.'}</h2><div class="result-grid"><div><strong>${dry}</strong>Salvadas secas</div><div><strong>${damp}</strong>Salvadas húmedas</div><div><strong>${wet}</strong>Empapadas</div></div><div class="result-score">${s.points} <small>puntos</small></div><p>Total de la partida: <strong>${s.total+s.points}</strong> · ${s.saved}/${s.items.length} guardadas</p><div class="panel-actions"><button class="secondary" data-action="retry">JUGAR DE NUEVO</button>${s.index<2&&!failed?'<button class="primary" data-action="next">SIGUIENTE NIVEL →</button>':'<button class="primary" data-action="start">NUEVA PARTIDA →</button>'}</div>`);
}
function pause()
{
    if(state.mode==='playing')
        {
            state.mode='paused';
            keys.clear();AudioFX.weather(0);
            $('pause').textContent='▶';
            showPanel('<div class="eyebrow">LA TORMENTA PUEDE ESPERAR</div><h2>Un pequeño descanso.</h2><p>El tiempo está en pausa.</p><div class="panel-actions"><button class="primary" data-action="resume">SEGUIR JUGANDO →</button><button class="secondary" data-action="menu">VOLVER AL INICIO</button></div>');
        }else
             if(state.mode==='paused')resume();
            }
function resume()
{
    state.mode='playing';
    $('overlay').hidden=true;
    $('pause').textContent='Ⅱ';
    keys.clear();
}
function help()
{
    helpWasPlaying=state.mode==='playing';
    if(helpWasPlaying){state.mode='paused';
        AudioFX.weather(0);keys.clear();
    }
    showPanel('<div class="eyebrow">CÓMO JUGAR</div><h2>Elegí. Recogé. Guardá.</h2><p><b>1.</b> Movete en 8 direcciones con WASD, flechas o botones táctiles.<br><b>2.</b> Acercate a una prenda desde cualquier lado y mantené Espacio o Recoger. Si soltás, el progreso se reinicia.<br><b>3.</b> Llevá el canasto a la puerta de la casa, arriba a la izquierda.<br>Seca: 100% · Húmeda: 50% · Empapada: 0%.<br>★ Cuero seco: ¡puntos dobles! La ropa del canasto también se moja: guardala en casa.</p><button class="primary" data-action="closeHelp">¡ENTENDIDO!</button>');
}

function updateHUD()
{
    const s=state;
    $('weather-veil').style.opacity=clamp(s.elapsed/(s.level.delay+14),0,1)*.32;
    $('level-label').textContent=`NIVEL 0${s.index+1} / 03`;
    $('level-name').textContent=s.level.name;$('timer').textContent=s.rainStarted?'☂':Math.max(0,Math.ceil(s.level.delay-s.elapsed));
    $('timer-unit').textContent=s.rainStarted?'':' s';
    $('weather-label').textContent=s.rainStarted?(s.rainIntensity>=.99?'TORMENTA':s.rainIntensity<.35?'LLOVIZNA':'LLUVIA'):'LLUVIA EN';
    $('score').textContent=String(s.total+s.points).padStart(3,'0');
    $('capacity').textContent=usedSpace();
    $('capacity-bar').style.width=usedSpace()/CONFIG.basketCapacity*100+'%';
    $('hint').textContent=s.mode==='menu'?'● Un cielo tranquilo… por ahora.':s.target?`${s.target.special?'★ ':''}${s.target.name} · ${valueOf(s.target)} pts · ${s.target.time} s · ${s.target.size} espacios · ${Math.round(s.target.wetness)}% humedad`:s.rainStarted?(s.stormAnnounced?'⛈ Tormenta en todo el patio. ¡A casa!':'☂ Llueve en todo el patio. La tormenta se acerca.'):'↖ Casa: guardá la ropa. Podés recorrer las tres sogas.';
}

// Dibujo propio en Canvas. Formas por píxeles y paleta común, sin imágenes.
function rect(x,y,w,h,c)
{
    ctx.fillStyle=c;
    ctx.fillRect(Math.round(x),Math.round(y),w,h);
}

function line(x1,y1,x2,y2,c,width=2)
{
    ctx.strokeStyle=c;
    ctx.lineWidth=width;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
}
function poly(points,c)
{
    ctx.fillStyle=c;
    ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.closePath();
    ctx.fill();
}

function label(text,x,y,size=11,color='#4d6347',align='center')
{
    ctx.fillStyle=color;
    ctx.font=`${size}px monospace`;
    ctx.textAlign=align;
    ctx.fillText(text,x,y);
}
function cloud(x,y,scale,color)
{
    ctx.save();ctx.translate(x,y);
    ctx.scale(scale,scale);
    rect(0,16,96,21,color);
    rect(14,4,59,32,color);
    rect(30,0,28,10,color);
    rect(-12,24,119,10,color);
    ctx.restore();
}
function shrub(x,y,scale=1)
{
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(scale,scale);
    rect(-30,-15,63,26,'#6c8855');
    rect(-21,-27,43,34,'#78965e');
    rect(-11,-36,21,23,'#859f65');
    rect(-27,-10,10,11,'#91a96b');
    rect(15,-20,13,13,'#66804e');
    ctx.restore();
}
function wetColor(hex,wetness)
{
    const w=clamp(wetness/100,0,1),rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),gray=rgb[0]*.3+rgb[1]*.59+rgb[2]*.11;return '#'+rgb.map(v=>Math.round((v*(1-w*.6)+gray*w*.6)*(1-w*.28)).toString(16).padStart(2,'0')).join('');
}
function drawGarment(p,pose=null)
{
    const picking=!pose&&state.target===p&&state.progress>0,q=picking?clamp(state.progress/p.time,0,1):0,sway=Math.sin(clock*2+p.x)*state.level.wind*(1+state.rainIntensity*.6);
    const x=pose?pose.x:p.x+sway,y=pose?pose.y:p.y-52+Math.sin(q*Math.PI)*4;
    ctx.save();ctx.translate(x,y);
    const scale=pose?pose.scale:.72;
    ctx.scale(scale,scale);
    ctx.rotate(pose?pose.angle:Math.sin(clock*2+p.x)*state.level.wind*.009+(picking?Math.sin(q*Math.PI*6)*.06:0));
    const c=wetColor(p.color,p.wetness);
    const clothRect=(x,y,w,h,color)=>rect(x,y,w,h,wetColor(color,p.wetness)),clothLine=(x,y,x2,y2,color,width)=>line(x,y,x2,y2,wetColor(color,p.wetness),width);
    ctx.shadowColor='#49643c15';
    ctx.shadowOffsetY=4;
switch(p.type)
{
    case 'sock':poly([[-10,2],[4,2],[4,24],[15,24],[15,35],[-10,35]],c);
    clothRect(-10,4,14,4,'#faf1d0');
    break;
    case 'pants':poly([[-20,2],[20,2],[24,61],[4,61],[0,25],[-4,61],[-24,61]],c);
    clothLine(-18,10,18,10,'#526c7c');
    break;
    case 'sheet':clothRect(-29,2,58,73,c);
    clothRect(-23,5,3,67,'#dcd9ba');
    clothRect(17,5,3,65,'#dcd9ba');
    clothLine(-27,67,27,67,'#cacba9',2);
    break;
    default:poly([[-13,2],[-26,9],[-35,28],[-21,33],[-16,24],[-16,53],[17,53],[17,24],[23,33],[35,27],[27,8],[12,2],[7,9],[-7,9]],c);
    if(p.type==='leather'||p.type==='jacket'||p.type==='blouse')
        {
            clothLine(0,10,0,52,'#586444',2);
            clothRect(-11,25,7,2,'#e0c193');
            clothRect(6,25,7,2,'#e0c193');
        }
        else clothRect(-8,19,16,3,'#f0d7b2');
    }
ctx.shadowOffsetY=0;
if(!pose)
    {
    if(q<.45)rect(-14,-4,4,10,'#b28656');
    if(p.type!=='sock'&&q<.85)rect(11,-4,4,10,'#b28656');
    if(p.special){
        rect(-20,-29,40,17,'#f2d89c');
        label('★ ×2',0,-17,10,'#855c35');
    }
    if(p.wetness>=30)
        {
            const bottom=p.type==='sheet'?76:p.type==='pants'?64:p.type==='sock'?38:56;for(let i=0;i<(p.wetness>=70?3:1);i++){const d=(clock*22+i*11)%20;rect(-9+i*9,bottom+d,2,4,'#7f9ca9');}}}ctx.restore();}
function drawPlayer()
{
    const p=state.player,x=Math.round(p.x),y=Math.round(p.y),step=p.walking?Math.sin(clock*17)*4:0,reach=state.progress>0||state.collectPulse>0,reachWave=reach?Math.sin(clock*15)*5:0,storing=state.depositAnim&&Math.hypot(p.x-state.depositAnim.x,p.y-state.depositAnim.y)<12,bend=storing?Math.sin(state.depositAnim.time/state.depositAnim.duration*Math.PI)*6:0;ctx.save();ctx.translate(x,y+bend);ctx.scale(.72,.72);ctx.rotate(storing?Math.sin(state.depositAnim.time/state.depositAnim.duration*Math.PI)*.12:0);if(p.facingX<0)ctx.scale(-1,1);ctx.fillStyle='#354c3930';ctx.beginPath();ctx.ellipse(0,3,22,7,0,0,Math.PI*2);ctx.fill();rect(-12,-12,8,16+step,'#69604b');rect(6,-12,8,16-step,'#69604b');rect(-15,0+step,11,6,'#4a503b');rect(6,-step,12,6,'#4a503b');poly([[-13,-52],[13,-52],[22,-13],[-22,-13]],'#9b655b');if(p.facingY>=0){rect(-12,-44,24,27,'#e8d7ae');rect(-8,-22,16,4,'#cfbc93');}else{rect(-13,-42,26,4,'#e8d7ae');rect(-2,-42,4,24,'#e8d7ae');}rect(-21,reach?-65+reachWave:-46,8,reach?30:23,'#dba985');rect(14,reach?-70-reachWave:storing?-53:-44,8,reach?30:22,'#dfb38f');rect(-11,-76,24,26,'#e7bd95');rect(-15,-79,29,9,'#ddd6c1');rect(-17,-73,7,14,'#ded9c7');rect(10,-74,8,12,'#c9c6b5');rect(-18,-88,13,14,'#d7d2c0');rect(-9,-83,22,7,'#ebe6d1');if(p.facingY<0){rect(-11,-75,25,22,'#d7d2c0');rect(-6,-65,14,11,'#c3bfae');}else if(p.facingX){rect(8,-64,3,3,'#4b4b3b');rect(13,-61,5,5,'#e7bd95');rect(9,-55,4,2,'#b87769');}else{rect(-6,-64,3,3,'#4b4b3b');rect(6,-64,3,3,'#4b4b3b');rect(0,-55,5,2,'#b87769');line(-6,-62,8,-62,'#8b876f',1);}basket(29,storing?-21:-13-state.collectPulse*8,usedSpace()/6);ctx.restore();}
function basket(x,y,fill=0){ctx.save();ctx.translate(x,y);if(fill>0){rect(-12,-16,12,9,'#b5bd8a');rect(0,-18,10,12,'#e8c2a0');rect(-4,-20,9,11,'#d9d9b5');}ctx.strokeStyle='#987044';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-10,13,Math.PI,0);ctx.stroke();poly([[-18,-11],[18,-11],[14,10],[-13,10]],'#b88b52');for(let i=-10;i<=12;i+=6)line(i,-8,i,8,'#d6b37a',2);line(-15,-3,16,-3,'#e0bd7f',2);line(-14,4,14,4,'#8f6c41',2);ctx.restore();}
// Décor en vue de dessus : sol continu, toit visible, ombres au sol.
function tree(x,y,size=1){ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.fillStyle='#52734835';ctx.beginPath();ctx.ellipse(9,6,37,16,0,0,Math.PI*2);ctx.fill();rect(-7,-32,15,38,'#92714c');rect(-2,-23,5,24,'#b18b5a');shrub(0,-29,1.35);shrub(-13,-46,.9);shrub(13,-55,.8);rect(-18,-62,9,5,'#aac27c');rect(15,-44,7,5,'#a7bc74');ctx.restore();}
function drawHouse()
{
    rect(64,71,223,149,'#53694325');
    rect(69,79,206,123,'#e7c797');
    rect(68,163,210,40,'#dfbb86');
    rect(78,188,190,14,'#cbaa78');
    rect(149,159,51,49,'#876e4b');
    rect(156,166,37,40,'#667750');
    rect(181,184,4,4,'#e6c982');
    if(state.depositAnim)
        {
            const a=Math.sin(Math.PI*state.depositAnim.time/state.depositAnim.duration);
            rect(156,166,37,40,'#514e39');rect(160,170,28,35,'#f0cd87');
            rect(156,166,Math.max(5,32*(1-a)),40,'#667750');
            ctx.globalAlpha=a*.3;poly([[156,205],[193,205],[214,247],[139,247]],'#ffe5a3');ctx.globalAlpha=1;}rect(140,207,71,11,'#d2c09a');rect(134,218,84,9,'#e0d0aa');
 poly([[52,90],[83,40],[259,40],[288,90],[288,155],[52,155]],'#b28058');
 rect(52,94,236,61,'#c89a65');
 rect(57,94,226,5,'#dfb578');
 for(let y=51;y<150;y+=13)
    {
        const left=y<90?80-(y-45)*.57:58,right=y<90?261+(y-45)*.57:280;
        line(left,y,right,y,'#deaf73',3);
        for(let x=left+15;x<right;x+=31)rect(x+(y%2)*10,y+3,3,7,'#ae8055');
    }
    rect(48,151,245,7,'#947047');
    rect(226,40,22,40,'#b19374');
    rect(222,36,30,8,'#d0b190');
    rect(227,39,19,3,'#806b56');
    rect(92,168,30,22,'#7b9a8b');
    rect(105,168,4,22,'#f5dfaf');
    rect(90,189,34,5,'#b08c62');
    rect(219,170,31,21,'#7b9a8b');
    rect(232,170,4,21,'#f5dfaf');
 rect(146,238,58,17,'#f5e5b7');
 label('↑ CASA',175,250,10,'#68764c');
}
function drawRope(r,index)
{
    for(const x of [r.x1,r.x2])
        {
            rect(x+2,r.y+3,18,5,'#59754a25');
            rect(x-3,r.y-57,7,60,'#9a8055');
            rect(x-6,r.y-58,13,5,'#bc9c65');
        }
        ctx.strokeStyle='#726c46';
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(r.x1,r.y-53);
        ctx.quadraticCurveTo((r.x1+r.x2)/2,r.y-45,r.x2,r.y-53);
        ctx.stroke();
        for(const p of state.items)
            if(p.status==='hanging'&&p.ropeId===index)drawGarment(p);
    }
function render()
{
    const s=state,w=CONFIG.width,h=CONFIG.height;ctx.clearRect(0,0,w,h);
    rect(0,0,w,h,'#b2c88c');
 // Grass texture and wide paths keep all three clotheslines connected.
 for(let i=0;i<470;i++)
    {
        const x=(i*137+19)%1000,y=(i*83+7)%640;
        rect(x,y,3,3,i%3?'#9fb97b':'#c5d697');
        if(i%5===0)rect(x+4,y-2,2,5,'#94af72');
    }
 rect(145,210,60,148,'#d4c79c');
 rect(145,300,695,60,'#d4c79c');
 rect(805,192,54,362,'#d4c79c');
 rect(230,450,600,54,'#d4c79c');
 rect(230,330,53,170,'#d4c79c');
 for(let i=0;i<75;i++)
    {
        const x=157+(i*97)%682,y=310+(i*31)%40;rect(x,y,5,2,'#c0b68c');
    }
    for(let i=0;i<5;i++){rect(157,238+i*22,35,12,'#e5d6ad');
        rect(161,250+i*22,29,2,'#baaf86');
    }
 // Low boundary fences and flower patches establish the overhead map.
 for(let x=25;x<1000;x+=24)
    {
        rect(x,24,6,23,'#b9a477');
        rect(x,615,6,18,'#b9a477');
    }
    rect(24,29,950,5,'#d1bb89');
    rect(24,620,950,4,'#d1bb89');
    for(let y=34;y<620;y+=24)
        {
            rect(24,y,6,14,'#b9a477');
            rect(970,y,6,14,'#b9a477');
        }
 for(let i=0;i<34;i++)
    {
        const x=310+(i*37)%600,y=68+(i*17)%44;
        rect(x,y,3,6,'#789654');rect(x-2,y-2,7,4,i%3?'#f0d494':'#e7b3a0');
        rect(x,y-2,2,2,'#bb995b');
    }
 rect(70,401,140,113,'#987951');
 rect(76,407,128,101,'#b08e5e');
 for(let row=0;row<3;row++)
    {
        rect(82,418+row*30,113,4,'#8c704c');
        for(let col=0;col<5;col++)
            {
                const x=91+col*22,y=419+row*30;rect(x-6,y-6,13,10,'#7e9a5a');
                rect(x-3,y-10,6,14,'#a0b66c');rect(x-1,y+3,4,3,'#d8a565');
            }
        }
 // Ground markers make the collection radius readable from either side.
 const target=s.mode==='playing'?nearest():null;
 if(target)
    {
        ctx.strokeStyle='#f7e9b8';
    ctx.lineWidth=3;ctx.setLineDash([5,4]);
    ctx.beginPath();
    ctx.ellipse(target.x,target.y,27,14,0,0,Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);
}
 const layers=[{y:210,draw:drawHouse},...ROPES.map((r,i)=>({y:r.y,draw:()=>drawRope(r,i)})),{y:s.player.y,draw:drawPlayer},...[{x:45,y:105,z:1},{x:933,y:88,z:1.1},{x:936,y:372,z:.85},{x:60,y:586,z:1.1},{x:318,y:593,z:.8}].map(t=>({y:t.y,draw:()=>tree(t.x,t.y,t.z)}))];layers.sort((a,b)=>a.y-b.y).forEach(l=>l.draw());
 if(target)
    {
    const x=target.x,y=target.y+27;
    rect(x-30,y,60,6,'#697956');
    rect(x-29,y+1,58*Math.min(1,s.progress/target.time),4,'#f2d48b');
    label(s.progress>0?'RECOGIENDO':'ESPACIO',x,y+20,9,'#3c513e');
}
 drawActionAnimations();
 for(const p of s.particles)
    {
        ctx.globalAlpha=p.life;
        rect(p.x,p.y,4,4,p.color);
    }
    ctx.globalAlpha=1;
 // Clouds are moving shadows seen on the ground, rather than a side-view sky.
 const dark=clamp(s.elapsed/(s.level.delay+14),0,1);
 ctx.fillStyle=`rgba(45,66,84,${dark*.32})`;
 ctx.fillRect(0,0,w,h);
 ctx.globalAlpha=.035+dark*.06;
 for(let i=0;i<4;i++)cloud(((i*330+clock*(7+s.level.wind))%1450)-250,90+(i%3)*175,2.4,'#435e68');
 ctx.globalAlpha=1;
 drawRain();
 if(s.flash>0)
    {
        ctx.fillStyle=`rgba(255,255,228,${s.flash})`;
        ctx.fillRect(0,0,w,h);
    }
}
function drawActionAnimations()
{
    const s=state;
    for(const f of s.flights)
        {
            const t=clamp(f.time/f.duration,0,1),e=t*t*(3-2*t),toX=s.player.x+(s.player.facingX<0?-20:20),toY=s.player.y-13;drawGarment(f.item,{x:f.x+(toX-f.x)*e,y:f.y+(toY-f.y)*e-Math.sin(t*Math.PI)*27,scale:.72*(1-t*.68),angle:t*.4});
        }
        const a=s.depositAnim;
        if(a)
            {
                for(let i=0;i<a.items.length;i++)
                    {
                        const t=clamp((a.time-i*.07)/.6,0,1);
                        if(t>=1)continue;
                        ctx.globalAlpha=1-t*.6;
                        drawGarment(a.items[i],{x:a.x+18+(174-a.x-18)*t,y:a.y-18+(179-a.y+18)*t-Math.sin(t*Math.PI)*19,scale:.4*(1-t*.7),angle:-t*.25});ctx.globalAlpha=1;
                    }
                    label('+'+a.points+' puntos',174,157-a.time*20,13,'#fcdf9b');
                }
            }
function drawRain()
{
    const s=state;if(!s.rainStarted)return;
    const intensity=s.rainIntensity,count=Math.floor(18+intensity*340),speed=240+intensity*390;
    ctx.strokeStyle=`rgba(204,221,224,${.3+intensity*.27})`;
    ctx.lineWidth=intensity>.7?1.4:1;
    ctx.beginPath();for(let i=0;i<count;i++)
        {
            const seedX=Math.sin(i*127.1+8)*43758.5453,seedY=Math.sin(i*311.7+3)*19642.349;
            const x=((seedX-Math.floor(seedX))*1040+clock*(10+intensity*42))%1040-20,y=((seedY-Math.floor(seedY))*680+clock*speed)%680-20;
            ctx.moveTo(x,y);
            ctx.lineTo(x-intensity*6,y+5+intensity*16);
        }
            ctx.stroke();
 // Ground impacts and puddles become visible as the storm settles in.
 for(let i=0;i<Math.floor(8+intensity*38);
 i++){
    const x=38+(i*173)%920,y=60+(i*113)%540,phase=(clock*2+i*.137)%1;
    if(y<212&&x<290)continue;
    ctx.strokeStyle=`rgba(205,221,215,${(1-phase)*intensity*.6})`;
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.ellipse(x,y,1+phase*5,1+phase*2,0,0,Math.PI*2);
    ctx.stroke();
}

if(intensity>.6)
    {
        ctx.globalAlpha=(intensity-.6)*.7;
        for(let i=0;i<9;i++)
            {
                const x=315+i*59,y=318+(i%3)*74;
                rect(x,y,23+(i%3)*9,4,'#9fb4b2');
                rect(x+5,y-2,14,7,'#a9bfc0');
            }
            ctx.globalAlpha=1;
        }
        }
// Keyboard and pointer controls share the same action state.
const keyMap={a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right',w:'up',ArrowUp:'up',s:'down',ArrowDown:'down',' ':'collect'};
window.addEventListener('keydown',e=>{const k=keyMap[e.key]||keyMap[e.key.toLowerCase()];
    if(k&&state.mode==='playing')
        {
            e.preventDefault();keys.add(k);
        }
    if((e.key==='Escape'||e.key==='p')&&!e.repeat)pause();
});window.addEventListener('keyup',e=>{const k=keyMap[e.key]||keyMap[e.key.toLowerCase()];
    if(k)keys.delete(k);
});
window.addEventListener('blur',()=>{keys.clear();
    if(state.mode==='playing')pause();
});
document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&state.mode==='playing')pause();
});
const touchHeld=new Map();
function refreshTouchKeys()
{
    for(const k of ['up','down','left','right','collect'])keys.delete(k);
    for(const directions of touchHeld.values())for(const k of directions)keys.add(k);
}
for(const b of document.querySelectorAll('[data-key]'))
    {
        b.addEventListener('pointerdown',e=>{e.preventDefault();
            AudioFX.init();
            if(state.mode!=='playing')return;
            b.setPointerCapture(e.pointerId);
            touchHeld.set(b,b.dataset.key.split(' '));
            refreshTouchKeys();b.classList.add('pressed');
        });
    for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{touchHeld.delete(b);
        refreshTouchKeys();b.classList.remove('pressed');
    });
}
$('sound').addEventListener('click',()=>{AudioFX.init();AudioFX.enabled=!AudioFX.enabled;
$('sound').innerHTML=`♫ <span>Sonido ${AudioFX.enabled?'activado':'apagado'}</span>`;
$('sound').setAttribute('aria-pressed',String(AudioFX.enabled));
$('sound').setAttribute('aria-label',AudioFX.enabled?'Desactivar sonido':'Activar sonido');
if(!AudioFX.enabled)AudioFX.stop();else AudioFX.tone(600);});
$('pause').addEventListener('click',pause);
$('help').addEventListener('click',help);
$('panel').addEventListener('click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;
    if(!a)return;AudioFX.init();
    if(a==='start')loadLevel(0);
    if(a==='retry')loadLevel(state.index,state.total);
    if(a==='next')loadLevel(state.index+1,state.total+state.points);
    if(a==='resume')resume();
    if(a==='menu')menu();
    if(a==='help')help();
    if(a==='closeHelp'){if(helpWasPlaying)resume();
        else if(state.mode==='menu')menu();
        else if(state.mode==='results')finish();
        else{state.mode='playing';pause();

        }}});
// Optional WebMCP read-back uses the very same in-game state; no gameplay automation.

if(document.modelContext?.registerTool){
    try{Promise.resolve(document.modelContext.registerTool(
        {
            name:'read_game_status',description:'Read the current level, saved points, basket and weather in Antes de la lluvia.',inputSchema:{
                type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input)
            {
        
        if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('Expected an empty object.');
        return {
            mode:state.mode,level:state.index+1,points:state.total+state.points,basket:usedSpace(),rainIntensity:state.rainIntensity,weather:state.stormAnnounced?'storm':state.rainStarted?'rain':'dry'};
        }
    }
)).catch(()=>{});
}catch{}
}
menu();

function frame(time)
{
    const dt=Math.min((time-lastTime)/1000||0,.05);
    lastTime=time;
    update(dt);
    render();
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
