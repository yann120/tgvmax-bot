import Database from './src/utils/database'
import TravelEntity from './src/entities/travel.entity'
import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import TravelController from './src/controllers/travel.controller'
import NotifierController from './src/controllers/notifier.controller'
import BookerController from './src/controllers/booker.controller'
import fetch from 'node-fetch'

const db = new Database()
const app = express()
db.connect().then(async () => {
  await TravelEntity.deleteOld()
  const travels = await TravelEntity.find({ relations: ['notifier', 'booker'] })
  travels.forEach(travel => travel.init())
  console.log(`${travels.length} travels initiated.`)

  app.use(cors())
  app.use(bodyParser.json())
  const router = express.Router()
  router.use('/travels', TravelController.router)
  router.use('/notifiers', NotifierController.router)
  router.use('/bookers', BookerController.router)
  router.use('/stations/autocomplete', async (req: express.Request, res: express.Response) => {
    if (req.query.searchTerm.length < 2) {
      return res.send([])
    }
    // @ts-ignore
    const result = await fetch(`https://www.oui.sncf/booking/autocomplete-d2d?${req._parsedUrl.query}`)
    return res.send(await result.json())
  })
  app.use('/api', router)

  app.listen(8080, _ => console.log('App listen on 0.0.0.0:8080'))
  setInterval(_ => TravelEntity.deleteOld(), 60 * 60 * 1000)
})