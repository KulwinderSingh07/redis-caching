const express=require("express")
const app=express()
const cors=require("cors")
const redis=require("redis")
const { default: axios } = require("axios")
const redisClient=redis.createClient()
const DEFAULT_EXIPRATION=3600

app.use(express.json())
app.use(cors())
function getOrSetCache(key,cb){
    return new Promise((resolve,reject)=>{
            redisClient.get(key,async(error,data)=>{
                if(error) return reject(error);
                if(data!=null) return resolve(JSON.parse(data))
                const fetchdata=await cb()
                redisClient.setEx(key,DEFAULT_EXIPRATION,JSON.stringify(fetchdata))
                resolve(fetchdata)
        })
        })
}
app.get("/photos",async(req,res)=>{
    try{
    await redisClient.connect()
    const albumid=req.query.albumId
    // console.log(albumid)
  const photos= await redisClient.get(`photos?albumId=${albumid}`)
        // if(error) console.log(error)
        if(photos!=null){
            console.log("Cache hit")
            await redisClient.quit()
            return res.json(JSON.parse(photos))
        }else{
            console.log("Cache Miss")
              const {data}=await axios.get("https://jsonplaceholder.typicode.com/photos",{params:{albumid}})
            await redisClient.setEx(`photos?albumId=${albumid}`,DEFAULT_EXIPRATION,JSON.stringify(data))
            await redisClient.quit()
              res.json(data)
        }
}catch(err){
    res.json(err.message)
}
})

app.get("/photos/:id",async(req,res)=>{
    try{
        await redisClient.connect()
        const id=req.params.id
        // console.log(albumid)
      const photos= await redisClient.get(`photos/id=${id}`)
            // if(error) console.log(error)
            if(photos!=null){
                console.log("Cache hit")
                await redisClient.quit()
                return res.json(JSON.parse(photos))
            }else{
          const {data}=await axios.get(`https://jsonplaceholder.typicode.com/photos/${id}`)
          await redisClient.setEx(`photos/id=${id}`,DEFAULT_EXIPRATION,JSON.stringify(data))
          await redisClient.quit()
            res.json(data)
            }
        }catch(err){
            res.json(err.message)
        }
})


app.listen(3001,()=>{
    console.log("server running on port 3001")
})