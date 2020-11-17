import Koa from 'koa'
import {extname, resolve} from 'path'
import {createReadStream, stat} from 'fs'
import {promisify} from 'util'
import jwt from 'koa-jwt'



const app = new Koa()

app.use(jwt({
    secret: 'secret',
     algorithm: ['HS256', 'HS512'],
    getToken: ({request}) => request.query.token,
    
    
     ))

// vérification du paramètre video dans url et sa validité

  app.use(async ({request, response}, next) => {

    if (
        !request.url.startsWith('/api/videos') || // doit commencer par ce lien
        !request.query.video  // doit avoir un param video
        
    ) 
    {
        return next()
    }


    const video =  resolve('videos', request.query.video) // montre ou se trouve la vidéo

    const range = request.header.range // récupération du range dans header ( pour streamer la vidéo et non la dl)
    if (!range) {
        response.type = extname(video) // on dit au nav qu'on envoie une video
        response.body = createReadStream(video) // on lit la vidéo
        return next();
    }
 

    const parts = range.replace('bytes=','').split('-')
    const start = parseInt(parts[0],10)
    const videoStat = await promisify(stat)(video)
    const end = parts[1] ? parseInt(parts[1],10) : videoStat.size - 1
    response.set('Content-Range', 'bytes ${start}-${end}/${videoStat.size}')
    response.set('Accept-Range', 'bytes ')
    response.set('Content-Length', end - start + 1)
    console.log(videoStat) 
    response.statusCode = 206
    response.body = createReadStream(video, {start,end})
    
     
 
    
    console.log(request.query.video)







  })

  


app.listen(3000)
