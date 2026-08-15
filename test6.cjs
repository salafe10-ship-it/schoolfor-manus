const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  // Try to find the login form and submit
  try {
    // Fill user name if there's an input
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      if (inputs.length > 0) {
        inputs[0].value = 'user_001';
      }
      
      const forms = document.querySelectorAll('form');
      if (forms.length > 0) {
        const submitBtn = forms[0].querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    const rootHtml = await page.evaluate(() => {
      return document.getElementById('root').innerHTML;
    });
    console.log('ROOT HTML LENGTH AFTER SUBMIT:', rootHtml.length);
  } catch(e) {
    console.log('ERROR:', e.message);
  }
  
  await browser.close();
})();
