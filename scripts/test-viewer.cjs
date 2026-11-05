const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function element() {
  const classes=new Set();
  return {classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,on){if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x);}},
    events:{},children:[],dataset:{},addEventListener(k,f){this.events[k]=f},setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]},appendChild(e){this.children.push(e)},removeChild(){},querySelectorAll(){return []},click(){this.events.click?.()}};
}
for (const width of [1280,390]) {
  const els={}; const body=element();
  const document={body,getElementById:id=>els[id]??=element(),createElement:element,querySelectorAll:()=>[],addEventListener(){}};
  const window={innerWidth:width,location:{search:''},addEventListener(){},open(url){this.opened=url}};
  const context=vm.createContext({document,window,URLSearchParams,console});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),context);
  vm.runInContext('init()',context);
  assert.equal(els.drawerWeeksList.children.length,12);
  for(let w=1;w<=12;w++){
    vm.runInContext(`selectWeek(${w})`,context);
    const pdf=`output/pdf/Business_Analytics_week_${w}_QP.pdf`;
    assert.equal(els.pdfFrame.src,`${pdf}#view=FitH&toolbar=1`);
    assert.ok(fs.existsSync(path.join(__dirname,'..',pdf)));
    assert.equal(els.currentWeekTitle.textContent,`Week-${w}`);
    assert.ok(body.classList.contains('pdf-active'));
    if(width===390)assert.ok(els.leftDrawer.classList.contains('collapsed'));
    els.btnNewTabPdf.click();assert.equal(window.opened,pdf);
    els.btnDownloadPdf.click();assert.equal(body.children.at(-1).download,pdf);
  }
  vm.runInContext('returnToCenter()',context);
  assert.equal(els.pdfFrame.src,undefined);
  assert.ok(!body.classList.contains('pdf-active'));
  window.location.search='?week=6';vm.runInContext('init()',context);
  assert.equal(els.currentWeekTitle.textContent,'Week-6');
}
console.log('PASS: desktop/mobile viewer state, all weeks, downloads, new-tab targets, home and deep links.');
