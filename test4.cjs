const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  const rootHtml = await page.evaluate(() => {
    return document.getElementById('root').innerHTML;
  });
  
  console.log('ROOT HTML LENGTH:', rootHtml.length);
  console.log('ROOT HTML PREVIEW:', rootHtml.substring(0, 500));
  
  await browser.close();
})();
