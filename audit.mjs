import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const pagesToTest = [
    '/',
    '/blogs',
    '/talks',
    '/resume',
    '/blog/writing-reliable-tests-in-ios-e87cdbe2a10c'
  ];
  let allViolations = [];
  
  for (const path of pagesToTest) {
    const page = await browser.newPage();
    await page.goto(`http://localhost:4173${path}`);
    const results = await new AxePuppeteer(page).analyze();
    if (results.violations.length > 0) {
        allViolations.push({ path, violations: results.violations });
    }
    await page.close();
  }
  console.log(JSON.stringify(allViolations, null, 2));
  await browser.close();
  process.exit(0);
})();
