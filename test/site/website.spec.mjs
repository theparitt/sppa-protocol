import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const root='/sppa-protocol/';
async function noOverflow(page){await page.waitForLoadState('load');const state=await page.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth).slice(0,8).map(e=>({tag:e.tagName,text:e.textContent.slice(0,100),parent:e.parentElement.className,display:getComputedStyle(e).display,whiteSpace:getComputedStyle(e).whiteSpace}))}));expect(state.scroll,JSON.stringify(state)).toBeLessThanOrEqual(state.width);}
test('Desktop reading layout, navigation and documentation search', async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(root);
 await expect(page.getByRole('heading',{level:1})).toHaveText('Software capabilitiesfor AI.');
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
test('Provider comparison filters hard requirements before ordering preferences',async({page})=>{
 await page.goto(root);
 const rows=page.locator('#decision-offers tr');
 await expect(rows.first().getByRole('rowheader')).toHaveText('B');
 await expect(rows.filter({hasText:'commercial unknown'})).toContainText('Excluded:');
 await page.getByLabel('Compare by',{exact:true}).selectOption('quality');
 await expect(rows.first().getByRole('rowheader')).toHaveText('A');
 await expect(page.locator('#decision-summary')).toContainText('main AI makes the final choice');
 await page.getByLabel('Maximum total cost (USD)').selectOption('0.05');
 await expect(rows.first().getByRole('rowheader')).toHaveText('B');
 await expect(rows.filter({hasText:'$0.18'})).toContainText('over budget');
 await page.getByLabel('Required privacy').selectOption('public');
 await expect(rows.filter({hasText:'commercial unknown'})).toContainText('Excluded: commercial rights unknown');
 await page.getByLabel('Maximum total cost (USD)').selectOption('0.02');
 await expect(page.locator('#decision-summary')).toContainText('No eligible offers');
});
test('Purpose precedes documents and the new architecture is separate from the proof',async({page})=>{
 await page.goto(root);
 await expect(page.locator('.agent-audience')).toContainText('AI agents to operate');
 await expect(page.locator('.hero-definition')).toContainText('machine-first semantic capability and decision standard');
 await expect(page.locator('.core-definition')).toHaveText('Semantic Capability + AI Decision Contract');
 await expect(page.locator('#architecture')).toContainText('MCP / HTTP / other transport');
 await expect(page.locator('.lifecycle-list h3')).toHaveText(['Discover','Select','Run','Monitor','Evaluate','Rate','Compose']);
 await page.getByRole('link',{name:'Read the documents',exact:false}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('SPPA Protocol Suite');
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Architecture',exact:true}).click();
 await expect(page.getByRole('heading',{level:1})).toContainText('the semantic decision layer');
 await expect(page.locator('main')).toContainText('They are not MCP bindings');
 await expect(page.locator('main')).toContainText('Neither MCP nor a public Hub is required');
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Concept',exact:true}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('SPPA Concept');
 await expect(page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Concept',exact:true})).toHaveAttribute('aria-current','page');
});
test('Every chapter renders without horizontal page overflow on narrow screens',async({page})=>{
 for (const width of [1024,1100]) {
  await page.setViewportSize({width,height:900});await page.goto(root);await noOverflow(page);
 }
 await page.setViewportSize({width:320,height:740});
 for(const path of ['', 'features/', 'documents/', 'design/concept/', 'design/architecture/', 'design/decision-contract/', 'design/runtime-status/', 'spec/decision-layers/0.1.0-draft.1/', 'spec/feature-groups/0.1.0-draft.1/']) {
  const response=await page.goto(root+path);expect(response.status()).toBe(200);await expect(page.getByRole('heading',{level:1})).toBeVisible();await noOverflow(page);
 }
 for(const chapter of ['overview','messages','discovery','policy','admission','jobs','artifacts','security','errors','quickstart','conformance','governance']){
  const response=await page.goto(`${root}spec/0.1.1/${chapter}/`);expect(response.status()).toBe(200);await expect(page.getByRole('heading',{level:1})).toBeVisible();await noOverflow(page);
 }
});

test('Featured capabilities open the complete catalog with honest implementation status',async({page})=>{
 await page.goto(root);
 await page.getByRole('link',{name:'Explore all features',exact:false}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('Protocol features.');
 await page.getByRole('navigation',{name:'Feature categories'}).getByRole('link',{name:'Payments & settlement',exact:false}).click();
 await expect(page.locator('#payment .feature-badge')).toHaveText(Array(6).fill('Planned'));
 await expect(page.locator('#execution')).toContainText('Atomic admission');
 await page.setViewportSize({width:390,height:844});await noOverflow(page);
 await page.getByRole('button',{name:'Search documentation'}).click();
 await page.getByRole('searchbox').fill('counteroffers');
 await expect(page.locator('#search-results')).toContainText('Protocol features');
});

test('Eight groups retain hard eligibility, caller decision and a feedback loop',async({page})=>{
 await page.goto(root);
 await expect(page.locator('#feature-groups .group-explanation dt')).toHaveText(Array.from({length:8},()=>['What it is','The problem before','Why it exists']).flat());
 await expect(page.locator('#feature-groups svg')).toHaveCount(0);
 const rows=await page.locator('.group-story').evaluateAll(items=>items.map(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom})));
 for(let i=1;i<rows.length;i++)expect(rows[i].top).toBeGreaterThanOrEqual(rows[i-1].bottom);
 for(const picture of await page.locator('.group-illustration img').all()){await picture.scrollIntoViewIfNeeded();await expect.poll(()=>picture.evaluate(e=>e.naturalWidth)).toBeGreaterThan(0);}
 await expect(page.locator('#feature-groups .group-number')).toHaveText(['G1','G2','G3','G4','G5','G6','G7','G8']);
 await expect(page.locator('#feature-groups .group-feedback')).toContainText('Experience feeds the next decision');
 await expect(page.locator('#feature-groups .group-decision')).toContainText('A good review cannot override');
 await page.getByRole('link',{name:'Read the eight-group specification',exact:false}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('SPPA Feature Groups');
 await expect(page.locator('main')).toContainText('not a new Core wire');
 await expect(page.locator('main')).toContainText('not preferences to average');
 await expect(page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Specification',exact:true})).toHaveAttribute('aria-current','page');
 await page.setViewportSize({width:390,height:844});await noOverflow(page);
});
