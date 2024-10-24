import { chromium, ElementHandle } from 'playwright';
import fs from 'node:fs'
import https from 'https'

(async () => {
  // Setup
  const browser = await chromium.launch({headless: false});
  const page = await browser.newPage();

  const animeLink = process.argv[2] || 'https://animefire.plus/animes/summertime-render-dublado'
  await page.goto(animeLink);
  
  const [animeName, fromEp, isEpLink] = (() => {
    const splitedName = animeLink.split('/')
    const afterLastSlash = splitedName[splitedName.length - 1]
    const beforeLastSlash = splitedName[splitedName.length - 2]
    let animeName = ''
    let fromEp = 0
    let isEpLink = false

    if(!Number(afterLastSlash)){
      animeName = afterLastSlash
      fromEp = 1
      isEpLink = false
    } else {
      animeName = beforeLastSlash
      fromEp = Number(afterLastSlash)
      isEpLink = true
    }
    return [animeName, fromEp, isEpLink]
  })()

  
  let hasNextEp = true
  for(let i = 0; hasNextEp; i++){
    const ep = fromEp + i
    const reliablePath = `${animeName}-${ep}.mp4`
    const epLink = isEpLink? animeLink : animeLink + `/${ep}`
    
    const videoTag = await page.waitForSelector('#my-video_html5_api')
    const srcHandle = await videoTag.getProperty('src')
    const src: string = await srcHandle.jsonValue()
  
    const file = fs.createWriteStream(reliablePath);
    https.get(src, function(response) {
      response.pipe(file);
    });

    const nextButton = await page.$('.prox')
    if(!nextButton){
      hasNextEp = false
      break;
    }
    
    await nextButton.click()
    await page.waitForLoadState()
  }
})();