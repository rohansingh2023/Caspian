import express, {Request, Response} from 'express'
import cors from 'cors'
import {Logger} from 'log4u'
import SearchRoute from './routes'

const app = express()

const port = process.env.PORT ? process.env.PORT : 9001

const logger = new Logger({serviceName: "SearchEngineServer"})

app.use(express.json())
app.use(cors())

app.use("/api", SearchRoute)

app.get("/", (req: Request, res: Response)=>{
    res.json({"message": "Server initiated successfully"})
})

app.listen(port, ()=>{
    logger.log({message: `Server running on port ${port}`});
    console.log(`Server running on port ${port}`)
})