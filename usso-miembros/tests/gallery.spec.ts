import {test,expect,type Page} from '@playwright/test';
async function swipe(page:Page,dx:number,dy=0,touch=false){
 const b=await page.locator('.gallery-stage').boundingBox();if(!b)throw Error('Gallery missing');
 const x=b.x+b.width/2,y=b.y+b.height/2;
 if(touch){const c=await page.context().newCDPSession(page);await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=6;i++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/6,y:y+dy*i/6}]});await page.waitForTimeout(16)}await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach()}
 else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:8});await page.mouse.up()}
}
for(const width of [393,1100])for(const reducedMotion of ['reduce','no-preference'] as const){
 test(`loop both boundaries repeatedly, real touch and mouse ${width} ${reducedMotion}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion});await page.goto('/tests/gallery-fixture.html');const gallery=page.locator('.lot-gallery');
  let popups=0;page.on('popup',()=>popups++);
  for(const touch of [true,false]){
   for(let n=0;n<2;n++){
    await swipe(page,120,3,touch);await expect(gallery).toHaveAttribute('data-index','2');
    await swipe(page,-120,3,touch);await expect(gallery).toHaveAttribute('data-index','0');
   }
  }
  expect(popups).toBe(0);await expect(page.locator('.gallery-counter')).toContainText('1 / 3');
  const url=await page.locator('.gallery-slide:not([inert]) a').getAttribute('href');expect(await page.locator('.gallery-expand').getAttribute('href')).toBe(url);
  await page.locator('.gallery-stage').press('ArrowRight');await expect(gallery).toHaveAttribute('data-index','1');
  await page.setViewportSize({width:width===393?1100:393,height:850});await expect(gallery).toHaveAttribute('data-index','1');await swipe(page,-120,0,true);await expect(gallery).toHaveAttribute('data-index','2');
  await page.getByRole('button',{name:'Finalizada',exact:true}).click();await expect(gallery).toHaveAttribute('data-count','3');
 });
}
test('zero/one, asynchronous gallery and vertical touch scrolling',async({page})=>{
 await page.setViewportSize({width:393,height:852});await page.goto('/tests/gallery-fixture.html');
 await page.getByRole('button',{name:'Una imagen',exact:true}).click();await expect(page.locator('.lot-gallery')).toHaveAttribute('data-count','1');await expect(page.getByRole('button',{name:'Imagen o video siguiente',exact:true})).toHaveCount(0);await swipe(page,-120,0,true);await expect(page.locator('.lot-gallery')).toHaveAttribute('data-index','0');
 await page.getByRole('button',{name:'Vaciar',exact:true}).click();await expect(page.locator('.gallery-empty')).toBeVisible();await expect(page.locator('.gallery-stage')).toHaveCount(0);
 await page.getByRole('button',{name:'Cargar después',exact:true}).click();await expect(page.locator('.lot-gallery')).toHaveAttribute('data-count','3');await swipe(page,-120,0,true);await expect(page.locator('.lot-gallery')).toHaveAttribute('data-index','1');await expect(page.getByTestId('pointer')).toHaveText('touch');
 await swipe(page,2,-150,true);await expect.poll(()=>page.getByTestId('parent').evaluate(e=>e.scrollTop)).toBeGreaterThan(30);await expect(page.locator('.lot-gallery')).toHaveAttribute('data-index','1');
});

test('portrait, landscape and panoramic photos fit inside their slide at mobile and desktop sizes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/tests/gallery-fixture.html');
 for(const width of [393,1100]){
  await page.setViewportSize({width,height:900});
  for(let i=0;i<3;i++){
   const image=page.locator('.gallery-slide:not([inert]) img');await expect.poll(()=>image.evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);
   const bounds=await image.evaluate(e=>{const r=e.getBoundingClientRect(),s=e.closest('.gallery-slide')!.getBoundingClientRect();return {image:[r.x,r.y,r.right,r.bottom],slide:[s.x,s.y,s.right,s.bottom],fit:getComputedStyle(e).objectFit}});
   expect(bounds.fit).toBe('contain');expect(bounds.image[0]).toBeGreaterThanOrEqual(bounds.slide[0]-.5);expect(bounds.image[1]).toBeGreaterThanOrEqual(bounds.slide[1]-.5);expect(bounds.image[2]).toBeLessThanOrEqual(bounds.slide[2]+.5);expect(bounds.image[3]).toBeLessThanOrEqual(bounds.slide[3]+.5);
   await page.locator('.gallery-stage').press('ArrowRight');
  }
 }
});

test('slow mouse drag and horizontal trackpad swipe work without arrow clicks',async({page})=>{
 await page.goto('/tests/gallery-fixture.html');await page.emulateMedia({reducedMotion:'reduce'});
 const stage=page.locator('.gallery-stage'),gallery=page.locator('.lot-gallery');const b=await stage.boundingBox();if(!b)throw Error('Missing gallery');
 let popups=0;page.on('popup',()=>popups++);
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2-100,b.y+b.height/2,{steps:100});await page.mouse.up();await expect(gallery).toHaveAttribute('data-index','1');expect(popups).toBe(0);
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2);
 for(let i=0;i<8;i++){await page.mouse.wheel(18,0);await page.waitForTimeout(25)}
 await expect(gallery).toHaveAttribute('data-index','2');
 await page.waitForTimeout(260);await page.mouse.wheel(100,0);await expect(gallery).toHaveAttribute('data-index','0');
 await page.waitForTimeout(260);await page.mouse.wheel(-100,0);await expect(gallery).toHaveAttribute('data-index','2');
 await page.mouse.wheel(0,150);await expect.poll(()=>page.getByTestId('parent').evaluate(e=>e.scrollTop)).toBeGreaterThan(30);await expect(gallery).toHaveAttribute('data-index','2');
});
