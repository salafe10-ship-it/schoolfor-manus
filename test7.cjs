const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    if (inputs.length >= 2) {
      // Simulate React input
      const setNativeValue = (element, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        if (valueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(element, value);
        } else {
          valueSetter.call(element, value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
      };
      
      setNativeValue(inputs[0], 'admin');
      setNativeValue(inputs[1], '123456');
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
  console.log('ROOT HTML LENGTH AFTER CORRECT SUBMIT:', rootHtml.length);
  console.log('PREVIEW:', rootHtml.substring(0, 300));
  
  await browser.close();
})();
