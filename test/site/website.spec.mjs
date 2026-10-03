import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const root='/sppa-protocol/';
async function noOverflow(page){const state=await page.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth).slice(0,8).map(e=>({tag:e.tagName,text:e.textContent.slice(0,100),parent:e.parentElement.className,display:getComputedStyle(e).display,whiteSpace:getComputedStyle(e).whiteSpace}))}));expect(state.scroll,JSON.stringify(state)).toBeLessThanOrEqual(state.width);}
test('Desktop reading layout, navigation and documentation search', async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(root);
 await expect(page.getByRole('heading',{level:1})).toContainText('Specialized software.');
 await noOverflow(page);await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/home-desktop.png',fullPage:false,animations:'disabled'});
 await page.getByRole('button',{name:'Search documentation'}).click();
 await page.getByRole('searchbox').fill('receipt');
 await page.locator('#search-results').getByRole('link').filter({hasText:'Security & receipts'}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('Security and execution receipts');
 await noOverflow(page);await page.screenshot({path:'artifacts/spec-desktop.png',fullPage:false,animations:'disabled'});
 expect(errors).toEqual([]);
});
test('Mobile navigation, chapters and schema download layout', async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(root);await noOverflow(page);
 await page.screenshot({path:'artifacts/home-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Menu',exact:true}).click();
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Schemas',exact:true}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('Schemas & API');await noOverflow(page);
 const download=page.waitForEvent('download');await page.getByRole('link',{name:'Download schema bundle'}).click();
 expect((await download).suggestedFilename()).toBe('bundle.json');
 await page.screenshot({path:'artifacts/schemas-mobile.png',fullPage:true});
});
test('Keyboard search and escaped empty-result feedback',async({page})=>{
 await page.goto(root);await page.keyboard.press('/');await expect(page.locator('#search-dialog')).toBeVisible();
 await page.getByRole('searchbox').fill('<script>');await expect(page.locator('#search-results')).toContainText('No chapters match');
 await page.keyboard.press('Escape');await expect(page.locator('#search-dialog')).not.toBeVisible();
});
test('Every chapter renders without horizontal page overflow on narrow screens',async({page})=>{
 await page.setViewportSize({width:320,height:740});
 for(const chapter of ['overview','messages','discovery','policy','jobs','artifacts','security','errors','quickstart','conformance','governance']){
  const response=await page.goto(`${root}spec/0.1.0/${chapter}/`);expect(response.status()).toBe(200);await expect(page.getByRole('heading',{level:1})).toBeVisible();await noOverflow(page);
 }
});
