/* Original lightweight vector scenery; independent mobile composition, no scanned page. */
(() => {
 'use strict';
 const RH=window.RangerHub;
 RH.knowledgeMapScene=mobile=>{
  const id=mobile?'km':'kd',w=mobile?480:1200,h=mobile?1080:740;
  const defs=`<defs>
   <linearGradient id="${id}-paper" x2=".8" y2="1"><stop stop-color="#f4ead3"/><stop offset="1" stop-color="#e8d7b6"/></linearGradient>
   <linearGradient id="${id}-sea" x2="1" y2="1"><stop stop-color="#a9c2bd"/><stop offset="1" stop-color="#d7dfca"/></linearGradient>
   <linearGradient id="${id}-hill" x2="0" y2="1"><stop stop-color="#bac7a0"/><stop offset="1" stop-color="#758d68"/></linearGradient>
   <linearGradient id="${id}-mountain" x2="1" y2="1"><stop stop-color="#b0b3a4"/><stop offset="1" stop-color="#697d72"/></linearGradient>
   <pattern id="${id}-grain" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="3" cy="8" r=".7" fill="#887e5c" opacity=".14"/><circle cx="17" cy="19" r=".5" fill="#fff9e7" opacity=".5"/></pattern>
   <symbol id="${id}-pine" viewBox="0 0 38 65"><path d="M19 2 6 24h6L1 45h14v17h7V45h15L26 24h6z" fill="#48694e"/><path d="M19 2v43h18L26 24h6z" fill="#325841"/><path d="M18 47v14" stroke="#796b49" stroke-width="3"/></symbol>
   <symbol id="${id}-tent" viewBox="0 0 115 75"><path d="M4 65 50 5l60 60z" fill="#cb9954" stroke="#716b46" stroke-width="2"/><path d="m50 5-9 60h69z" fill="#f0ce87"/><path d="m50 25-9 40h29z" fill="#365344"/><path d="M0 70h115M12 49 4 70m95-20 11 20" stroke="#7e7858" fill="none" stroke-width="2"/></symbol>
   <symbol id="${id}-house" viewBox="0 0 110 100"><path d="M16 43h78v51H16z" fill="#cfb28a" stroke="#7c7456" stroke-width="2"/><path d="m3 45 52-36 54 36z" fill="#647d65"/><path d="M45 94V62h21v32M25 57h12v16H25m49-16h12v16H74" fill="#f5dfae" stroke="#7c7456"/><path d="M91 25V8H78v9" fill="#ac9274"/></symbol>
   <symbol id="${id}-boat" viewBox="0 0 100 65"><path d="M3 39q47 43 94 0z" fill="#a7744a"/><path d="M12 39q37-18 75 0" fill="#d0a978"/><path d="m18 10 67 49" stroke="#6b7054" stroke-width="3"/><path d="m77 50 13 10-6 4-13-10z" fill="#c0a069"/></symbol>
   <symbol id="${id}-fire" viewBox="0 0 40 50"><path d="m4 43 31-4M5 38l30 7" stroke="#786348" stroke-width="5"/><path d="M20 38C-1 32 15 17 13 9c11 5 9-6 13-9-1 14 24 29-6 38" fill="#c98642"/><path d="M19 35c-10-6 2-16 3-22 0 7 14 16-3 22" fill="#f4d47e"/></symbol>
   <symbol id="${id}-compass" viewBox="0 0 100 100"><circle cx="50" cy="50" r="39" fill="#efe3c4" stroke="#7d8465" stroke-width="2"/><circle cx="50" cy="50" r="31" fill="none" stroke="#a1a886"/><path d="m68 29-9 30-30 12 12-30z" fill="#476c57"/><path d="m68 29-18 21 9 9z" fill="#c2ae7a"/><circle cx="50" cy="50" r="4" fill="#f6eed8"/></symbol>
  </defs>`;
  const tree=(x,y,s=45)=>`<use href="#${id}-pine" x="${x}" y="${y}" width="${s}" height="${s*1.7}"/>`;
  const mountains=(x,y,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})"><path d="m0 165 82-130 46 62 59-97 105 165z" fill="url(#${id}-mountain)" stroke="#869581"/><path d="m146 66 41-66 48 76-35-16-14 14-13-25zM55 79l27-44 27 38-26-9-10 18z" fill="#f3edda"/><path d="m187 0 105 165H157l30-90z" fill="#66806f" opacity=".35"/></g>`;
  const scenery=mobile?`
   <path d="M480 0v1080H0V857c135 45 163-42 222-128s37-152 129-228S342 262 480 201z" fill="url(#${id}-sea)"/>
   <path d="M0 12q160-42 280 42t200 117v339q-87 105-142 128t-85 180q-37 105-130 158L0 1080z" fill="url(#${id}-paper)" stroke="#a5b292" stroke-width="4"/>
   <path d="M2 220q130-150 280-60t190 100M0 700q135-55 236 16" fill="none" stroke="#d1c49f" stroke-width="2"/>
   ${mountains(175,46,.9)}
   <path d="M355 224q-150 115-61 190t-20 214" fill="none" stroke="#90b0ad" stroke-width="23"/><path d="M355 224q-150 115-61 190t-20 214" fill="none" stroke="#d4ded0" stroke-width="3"/>
   <path d="M0 290q95-75 193-4l25 175q-138 36-218-38z" fill="url(#${id}-hill)" opacity=".8"/>
   ${[[10,220,55],[63,260,58],[9,341,57],[127,360,43],[70,421,38],[366,254,45],[405,302,47],[190,838,43],[16,746,38],[55,795,37]].map(a=>tree(...a)).join('')}
   <use href="#${id}-tent" x="140" y="282" width="102" height="70"/><use href="#${id}-fire" x="193" y="368" width="31" height="40"/>
   <g transform="translate(242 444) rotate(-15)"><path d="M0 0h85v25H0z" fill="#af9471"/><path d="M7-10v45m69-45v45M0 5h85M0 20h85" stroke="#768260" stroke-width="3"/></g>
   <use href="#${id}-boat" x="336" y="516" width="112" height="73"/><use href="#${id}-house" x="35" y="539" width="93" height="85"/>
   <path d="M44 574h22m-11-11v22" stroke="#f5e9c8" stroke-width="5"/>
   <use href="#${id}-house" x="282" y="706" width="96" height="88"/>
   <path d="m93 860 68-36 62 35v63H93z" fill="#d4bd91"/><path d="m80 860 81-47 76 47z" fill="#687d5b"/><path d="M152 870v-44m-11 14h22" stroke="#f5e7bd" stroke-width="4"/>
   <ellipse cx="361" cy="951" rx="76" ry="40" fill="#d5c091" stroke="#ac9d76"/><path d="m327 956 34-48 37 48z" fill="#a98d5c"/><path d="M361 907v-24l25 8-25 9" stroke="#536c4d" fill="#536c4d"/>
   <use href="#${id}-compass" x="24" y="30" width="80" height="80"/>
   <path d="M317 170q-160-13-142 160t-84 260q-30 122 225 180t-130 128q-22 55 176 39" class="kw-map-path"/>
  `:`
   <path d="M0 0h1200v740H0z" fill="url(#${id}-sea)"/>
   <path d="M-15 55Q147-16 308 49T626 28t395 45q190 72 148 231t-121 169q-112-23-164 90t-243 89q-90-34-175 34T-20 686z" fill="url(#${id}-paper)" stroke="#a4b094" stroke-width="4"/>
   <path d="M3 80Q145 7 308 71t313-19 387 39q180 66 140 205" fill="none" stroke="#e0d1ac" stroke-width="3"/>
   <path d="M0 187q109-117 243 10t173 105q25 127-192 143L0 385z" fill="url(#${id}-hill)" opacity=".85"/>
   ${mountains(465,50,1.1)}${mountains(722,80,.7)}
   <path d="M598 186q-115 99 24 186t-61 132q-71 38-2 156" fill="none" stroke="#8eafad" stroke-width="32"/><path d="M598 186q-115 99 24 186t-61 132q-71 38-2 156" fill="none" stroke="#d2ded0" stroke-width="4"/>
   ${[[14,154,59],[74,192,57],[12,276,65],[128,138,45],[144,315,48],[302,186,48],[349,289,53],[287,330,43],[750,280,42],[800,305,43],[843,258,37],[439,559,35],[160,535,37],[186,592,41],[28,532,37]].map(a=>tree(...a)).join('')}
   <use href="#${id}-tent" x="168" y="220" width="127" height="86"/><use href="#${id}-fire" x="244" y="320" width="35" height="44"/>
   <g transform="translate(531 425) rotate(-21)"><path d="M0 0h93v26H0z" fill="#b09876"/><path d="M8-10v45m78-45v45M0 5h93M0 21h93" stroke="#768260" stroke-width="3"/></g>
   <use href="#${id}-boat" x="638" y="480" width="122" height="80"/>
   <use href="#${id}-house" x="935" y="208" width="119" height="106"/><path d="M965 250h27m-13-13v27" stroke="#f5e9c8" stroke-width="6"/>
   <use href="#${id}-house" x="846" y="496" width="117" height="106"/><path d="m974 580 35-33m-26 6 19 20" stroke="#8e7b54" stroke-width="7" stroke-linecap="round"/>
   <path d="m290 533 67-44 69 44v69H290z" fill="#d1b88b"/><path d="m275 534 82-56 84 56z" fill="#5f7757"/><path d="M357 502v-45m-13 13h26" stroke="#f1e2b7" stroke-width="4"/>
   <ellipse cx="1048" cy="615" rx="75" ry="39" fill="#d4c396" stroke="#a89b77"/><path d="m1016 622 34-49 36 49z" fill="#a68c60"/><path d="M1050 573v-28l28 9-28 11" stroke="#516c50" fill="#516c50"/>
   <use href="#${id}-compass" x="1044" y="43" width="99" height="99"/>
   <path d="M234 288q114-140 349-75t389 75q131 113-68 227t-543 21q-66 138 143 105t547-25" class="kw-map-path"/>
   <g fill="none" stroke="#a7b8aa" stroke-width="2" opacity=".65"><path d="M1110 386q25-14 55 0m-60 17q25-14 55 0M73 698q25-14 55 0m-38 14q25-14 55 0M1045 707q25-14 55 0"/></g>
  `;
  return `<svg class="kw-scene kw-scene-${mobile?'mobile':'desktop'}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">${defs}<rect width="${w}" height="${h}" fill="url(#${id}-paper)"/>${scenery}<rect width="${w}" height="${h}" fill="url(#${id}-grain)" pointer-events="none"/></svg>`;
 };
})();
