const playwright = require('playwright');
const userAgents = require('top-user-agents')
const { devices } = require('playwright');


function pickRandomProperty(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
           result = prop;
    console.log(result)
    return result;
}

function execute(){
try {

(async () => {
  const browser = await playwright.chromium.launch({
      headless: false
  })
  context = await browser.newContext( {
    httpCredentials: { username: "elastic", password: "changeme"},
    ...devices[pickRandomProperty(devices)]
  } );
  const page = await context.newPage();
  await page.setViewportSize({ width: 1792, height: 978 })
  
  await page.goto('https://unified-ecom-1-ecom-basic.staging-3.eden.elastic.dev');
  page.mouse.click(1, 1, {clickCount: 20, delay: 20});
  console.log('waiting for nav')
  
    // check that an item that we expect to be there exists on the loaded page
    // await page.waitForSelector('#__next > div > main > div > div > div.jsx-2872966298.row > div:nth-child(1) > div > div > div > div > a > button')

  var item = Math.floor(Math.random() * 9) + 1;
  console.log(item)
  await page.waitForSelector('//*[@id="___gatsby"]/div/div[1]/main/div/div/div[6]/div/div[' + item + ']/a/div[1]/picture/img')
  console.log("click on item")
  await page.click('//*[@id="___gatsby"]/div/div[1]/main/div/div/div[6]/div/div[' + item + ']/a/div[1]/picture/img')
  console.log("wait 2s")
  await page.waitForTimeout(2000)
  console.log("wait for selector")
  await page.waitForSelector('//*[@id="___gatsby"]/div/div[1]/main/div/div[2]/div[2]/div[6]/button')
  
  console.log('two')
  await page.click('//*[@id="___gatsby"]/div/div[1]/main/div/div[2]/div[2]/div[6]/button')
  console.log('2.1')

  await page.waitForSelector('//*[@id="___gatsby"]/div/div[1]/main/div/div/div[3]/form/div[4]/div/button')
  console.log('three')

  await page.click('//*[@id="___gatsby"]/div/div[1]/main/div/div/div[3]/form/div[4]/div/button')
  await page.waitForTimeout(2000)
  console.log('final sleep')
  await page.waitForTimeout(2000)
  await browser.close();
})();

  } catch (error) {
    console.log('That did not go well.')
    throw error
  }

 }

execute()
