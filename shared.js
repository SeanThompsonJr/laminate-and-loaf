/* Laminate & Loaf: shared menu data, photo frames and cart storage. All sample data. */
(function(){
  var MENU=[
    {group:"Pies",id:"pies",note:"9 inch, serves 8",items:[
      {id:"pecan",name:"Brown butter pecan pie",desc:"Toasted pecans, brown butter and an all-butter crust.",price:38,tags:["nut"],art:"pecan",
        options:{label:"Add on",choices:[["none","Nothing extra",0],["cream","Whipped cream, 8 oz",4]]}},
      {id:"apple",name:"Apple lattice pie",desc:"Cinnamon apples under a laminated lattice.",price:34,tags:[],art:"lattice",
        options:{label:"Add on",choices:[["none","Nothing extra",0],["cream","Whipped cream, 8 oz",4]]}},
      {id:"sweetpot",name:"Sweet potato pie",desc:"Roasted sweet potato, nutmeg and toasted meringue.",price:32,tags:[],art:"meringue"}
    ]},
    {group:"Cakes",id:"cakes",note:"For the table",items:[
      {id:"buche",name:"Bûche de Noël",desc:"Chocolate roll, coffee buttercream, meringue mushrooms. Serves 10.",price:56,tags:[],art:"buche"},
      {id:"torte",name:"Flourless chocolate torte",desc:"Dark chocolate, cocoa, eggs and butter. 8 inch.",price:36,tags:["gf"],art:"torte"},
      {id:"custom",name:"Custom cake, 6 inch",desc:"Your flavor and message. We email you to confirm the details.",price:60,tags:["lead"],art:"cake",lead:7,
        options:{label:"Flavor",choices:[["vanilla","Vanilla bean",0],["choc","Chocolate",0],["lemon","Lemon raspberry",4]]},message:true}
    ]},
    {group:"Pastry boxes",id:"boxes",note:"For mornings",items:[
      {id:"xmasbox",name:"Christmas morning box",desc:"6 croissants, 3 pain au chocolat and 3 cardamom buns.",price:42,tags:[],art:"box"},
      {id:"kouign",name:"Kouign-amann, half dozen",desc:"Caramelized, crackly and very buttery.",price:27,tags:[],art:"kouign"}
    ]},
    {group:"Bake at home",id:"home",note:"Frozen, with instructions",items:[
      {id:"frozen",name:"Unbaked croissants, 6",desc:"Proof overnight, then bake for 18 minutes.",price:24,tags:[],art:"frozen"},
      {id:"dough",name:"Pie dough, two rounds",desc:"All butter, rolled and ready.",price:14,tags:[],art:"dough"}
    ]}
  ];
  var TAGTEXT={gf:"Gluten-free",nut:"Contains nuts",lead:"7 days' notice"};
  var byId={}; MENU.forEach(function(g){g.items.forEach(function(i){i.group=g.group;byId[i.id]=i;});});

  /* ---------- photos: free Unsplash photos (credits in img/CREDITS.md), each marked "Concept only" ---------- */
  var PHOTO={pecan:"pecan",lattice:"apple",meringue:"sweetpot",buche:"buche",torte:"torte",cake:"custom",box:"xmasbox",kouign:"kouign",frozen:"frozen",dough:"dough",banner:"banner"};
  function art(kind,eager){
    var f=PHOTO[kind]||"banner", wide=f==="banner";
    return '<img src="img/'+f+'.webp" alt="" width="'+(wide?1800:1200)+'" height="'+(wide?600:800)+'" decoding="async"'+(eager?'':' loading="lazy"')+'>';
  }
  function artFrame(kind,cls,label,eager){
    return '<span class="art photo '+(cls||"")+'" role="img" aria-label="'+(label||"Photo")+' (sample photo, concept only)">'+art(kind,eager)+'<span class="wm">Concept only</span></span>';
  }

  /* ---------- cart (this browser only) ---------- */
  var KEY="ll-cart-v1";
  function loadCart(){try{var c=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(c)?c:[];}catch(e){return [];}}
  function saveCart(c){try{localStorage.setItem(KEY,JSON.stringify(c));}catch(e){}}

  /* ---------- dates: holiday pickups Dec 2 to 24, closed Mondays ---------- */
  function windowYear(){var n=new Date();return (n.getMonth()===11&&n.getDate()>24)?n.getFullYear()+1:n.getFullYear();}
  function availableDays(lead){
    var d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+lead);
    var start=new Date(windowYear(),11,2), end=new Date(windowYear(),11,24); if(d<start)d=start;
    var out=[]; while(d<=end){if(d.getDay()!==1)out.push(new Date(d)); d.setDate(d.getDate()+1);} return out;
  }

  /* ---------- open / closed status in the header ---------- */
  function setStatus(){
    var st=document.getElementById("status"); if(!st)return;
    var n=new Date(), day=n.getDay(), h=n.getHours()+n.getMinutes()/60, label;
    if(day===1){st.classList.add("closed");label="Closed today, open Tue 7am";}
    else if(h<7){label="Opens at 7am";}
    else if(h>=14){st.classList.add("closed");label="Closed now, open "+(day===0?"Tue":"tomorrow")+" 7am";}
    else{label="Open now until 2pm";}
    st.querySelector("span").textContent=label;
  }

  window.LL={MENU:MENU,TAGTEXT:TAGTEXT,byId:byId,art:art,artFrame:artFrame,loadCart:loadCart,saveCart:saveCart,availableDays:availableDays,setStatus:setStatus};
})();
